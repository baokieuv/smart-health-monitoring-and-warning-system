#include "mqtt_tb.h"
#include "config.h"
#include "mqtt_client.h"
#include "esp_log.h"
#include "cJSON.h"
#include "esp_ota_ops.h"
#include "esp_http_client.h"
#include "esp_https_ota.h"
#include "esp_crt_bundle.h"
#include <stdio.h>

static const char *TAG = "MQTT_CLIENT";
static esp_mqtt_client_handle_t mqtt_client = NULL;
extern EventGroupHandle_t g_event_group;
static char _token[64] = { 0 };
static bool s_ota_in_progress = false;

static char *server_cert = 
"-----BEGIN CERTIFICATE-----\n"
"MIIFBjCCAu6gAwIBAgIRAIp9PhPWLzDvI4a9KQdrNPgwDQYJKoZIhvcNAQELBQAw\n"
"TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n"
"cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMjQwMzEzMDAwMDAw\n"
"WhcNMjcwMzEyMjM1OTU5WjAzMQswCQYDVQQGEwJVUzEWMBQGA1UEChMNTGV0J3Mg\n"
"RW5jcnlwdDEMMAoGA1UEAxMDUjExMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB\n"
"CgKCAQEAuoe8XBsAOcvKCs3UZxD5ATylTqVhyybKUvsVAbe5KPUoHu0nsyQYOWcJ\n"
"DAjs4DqwO3cOvfPlOVRBDE6uQdaZdN5R2+97/1i9qLcT9t4x1fJyyXJqC4N0lZxG\n"
"AGQUmfOx2SLZzaiSqhwmej/+71gFewiVgdtxD4774zEJuwm+UE1fj5F2PVqdnoPy\n"
"6cRms+EGZkNIGIBloDcYmpuEMpexsr3E+BUAnSeI++JjF5ZsmydnS8TbKF5pwnnw\n"
"SVzgJFDhxLyhBax7QG0AtMJBP6dYuC/FXJuluwme8f7rsIU5/agK70XEeOtlKsLP\n"
"Xzze41xNG/cLJyuqC0J3U095ah2H2QIDAQABo4H4MIH1MA4GA1UdDwEB/wQEAwIB\n"
"hjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwEgYDVR0TAQH/BAgwBgEB\n"
"/wIBADAdBgNVHQ4EFgQUxc9GpOr0w8B6bJXELbBeki8m47kwHwYDVR0jBBgwFoAU\n"
"ebRZ5nu25eQBc4AIiMgaWPbpm24wMgYIKwYBBQUHAQEEJjAkMCIGCCsGAQUFBzAC\n"
"hhZodHRwOi8veDEuaS5sZW5jci5vcmcvMBMGA1UdIAQMMAowCAYGZ4EMAQIBMCcG\n"
"A1UdHwQgMB4wHKAaoBiGFmh0dHA6Ly94MS5jLmxlbmNyLm9yZy8wDQYJKoZIhvcN\n"
"AQELBQADggIBAE7iiV0KAxyQOND1H/lxXPjDj7I3iHpvsCUf7b632IYGjukJhM1y\n"
"v4Hz/MrPU0jtvfZpQtSlET41yBOykh0FX+ou1Nj4ScOt9ZmWnO8m2OG0JAtIIE38\n"
"01S0qcYhyOE2G/93ZCkXufBL713qzXnQv5C/viOykNpKqUgxdKlEC+Hi9i2DcaR1\n"
"e9KUwQUZRhy5j/PEdEglKg3l9dtD4tuTm7kZtB8v32oOjzHTYw+7KdzdZiw/sBtn\n"
"UfhBPORNuay4pJxmY/WrhSMdzFO2q3Gu3MUBcdo27goYKjL9CTF8j/Zz55yctUoV\n"
"aneCWs/ajUX+HypkBTA+c8LGDLnWO2NKq0YD/pnARkAnYGPfUDoHR9gVSp/qRx+Z\n"
"WghiDLZsMwhN1zjtSC0uBWiugF3vTNzYIEFfaPG7Ws3jDrAMMYebQ95JQ+HIBD/R\n"
"PBuHRTBpqKlyDnkSHDHYPiNX3adPoPAcgdF3H2/W0rmoswMWgTlLn1Wu0mrks7/q\n"
"pdWfS6PJ1jty80r2VKsM/Dj3YIDfbjXKdaFU5C+8bhfJGqU3taKauuz0wHVGT3eo\n"
"6FlWkWYtbt4pgdamlwVeZEW+LM7qZEJEsMNPrfC03APKmZsJgpWCDWOKZvkZcvjV\n"
"uYkQ4omYCTX5ohy+knMjdOmdH9c7SpqEWBDC86fiNex+O0XOMEZSa8DA\n"
"-----END CERTIFICATE-----\n";

static void ota_scheduler_task(void *param) {
    ESP_LOGI(TAG, "OTA Scheduler started. Interval: %d ms", OTA_CHECK_INTERVAL_MS);
    
    vTaskDelay(pdMS_TO_TICKS(10000)); 

    while (1) {
        if (mqtt_is_connected() && !s_ota_in_progress) {
            ESP_LOGI(TAG, "Checking for new firmware...");
            // Request shared attributes: fw_title và fw_version
            const char *req = "{\"sharedKeys\":\"fw_title,fw_version\"}";
            esp_mqtt_client_publish(mqtt_client, ATTR_REQUEST_TOPIC, req, 0, 1, 0);
        } else {
            if(s_ota_in_progress) ESP_LOGI(TAG, "OTA in progress, skipping check");
        }
        vTaskDelay(pdMS_TO_TICKS(OTA_CHECK_INTERVAL_MS));
    }
}

void ota_execution_task(void *param){
    char *json = (char*)param;
    ESP_LOGI(TAG, "Processing attributes: %s", json);

    cJSON *root = cJSON_Parse(json);
    if(!root){
        ESP_LOGE(TAG, "JSON Parse Error");
        free(json);
        vTaskDelete(NULL);
        return;
    }
    cJSON *shared = cJSON_GetObjectItemCaseSensitive(root, "shared");
    cJSON *target_node = shared ? shared : root;

    cJSON *fw_title = cJSON_GetObjectItemCaseSensitive(target_node, "fw_title");
    cJSON *fw_version = cJSON_GetObjectItemCaseSensitive(target_node, "fw_version");

    if (!cJSON_IsString(fw_title) || !cJSON_IsString(fw_version)) {
        ESP_LOGW(TAG, "No firmware info in attributes");
        cJSON_Delete(root);
        free(json);
        vTaskDelete(NULL);
        return;
    }
    const esp_app_desc_t* desc = esp_app_get_description();
    ESP_LOGI(TAG, "Current FW: %s | Cloud FW: %s", desc->version, fw_version->valuestring);

    if (strcmp(desc->version, fw_version->valuestring) == 0) {
        ESP_LOGI(TAG, "Firmware is up to date");
        cJSON_Delete(root);
        free(json);
        vTaskDelete(NULL);
        return;
    }

    s_ota_in_progress = true;

    char msg[128];
    sprintf(msg, "{\"fw_state\": \"UPDATING\", \"target_fw\": \"%s\"}", fw_version->valuestring);
    esp_mqtt_client_publish(mqtt_client, TELEMETRY_TOPIC, msg, 0, 1, 0);

    char url[512];
    // Format URL API của ThingsBoard
    snprintf(url, sizeof(url), "%s/api/v1/%s/firmware?title=%s&version=%s", 
             "https://demo.thingsboard.io", _token, fw_title->valuestring, fw_version->valuestring);

    ESP_LOGI(TAG, "Downloading FW from: %s", url);

    cJSON_Delete(root);
    free(json); 

    // Cấu hình HTTPS OTA
    esp_http_client_config_t config = {
        .url = url,
        .cert_pem = server_cert,
        .timeout_ms = 10000,
        .keep_alive_enable = true,
        .buffer_size = 1024 * 4, // Tăng buffer
        .buffer_size_tx = 1024,
    };

    esp_https_ota_config_t ota_config = {
        .http_config = &config,
    };

    esp_err_t ret = esp_https_ota(&ota_config);

    if (ret == ESP_OK) {
        ESP_LOGI(TAG, "OTA Success! Rebooting...");
        sprintf(msg, "{\"fw_state\": \"UPDATED\", \"current_fw\": \"%s\"}", fw_version->valuestring);
        esp_mqtt_client_publish(mqtt_client, TELEMETRY_TOPIC, msg, 0, 1, 0);
        vTaskDelay(pdMS_TO_TICKS(2000));
        esp_restart();
    } else {
        ESP_LOGE(TAG, "OTA Failed: %s", esp_err_to_name(ret));
        sprintf(msg, "{\"fw_state\": \"FAILED\"}");
        esp_mqtt_client_publish(mqtt_client, TELEMETRY_TOPIC, msg, 0, 1, 0);
        s_ota_in_progress = false; // Unlock để lần sau check tiếp
    }

    vTaskDelete(NULL);
}


static void mqtt_event_handler(void *handler_args, esp_event_base_t base,
                               int32_t event_id, void *event_data) {
    esp_mqtt_event_handle_t event = event_data;

    switch ((esp_mqtt_event_id_t)event_id) {
        case MQTT_EVENT_CONNECTED:
            ESP_LOGI(TAG, "MQTT Connected");
            if (g_event_group) {
                xEventGroupSetBits(g_event_group, MQTT_CONNECTED_BIT);
                esp_mqtt_client_subscribe(mqtt_client, ATTR_RESPONSE_TOPIC, 1);
            }
            break;

        case MQTT_EVENT_DISCONNECTED:
            ESP_LOGW(TAG, "MQTT Disconnected");
            if (g_event_group) {
                xEventGroupClearBits(g_event_group, MQTT_CONNECTED_BIT);
            }
            break;

        case MQTT_EVENT_PUBLISHED:
            ESP_LOGD(TAG, "Message published, msg_id=%d", event->msg_id);
            break;

        case MQTT_EVENT_DATA:
            ESP_LOGI(TAG, "MQTT Data received on topic: %.*s", 
                     event->topic_len, event->topic);
            if(strncmp(event->topic, "v1/devices/me/attributes/response", 33) == 0) {
                char *json = (char*) malloc(sizeof(char)*event->data_len + 1);
                if(json){
                    memcpy(json, event->data, event->data_len);
                    json[event->data_len] = '\0';
                    if (!s_ota_in_progress) {
                        xTaskCreate(ota_execution_task, "ota_exec", 8192, (void*)json, 5, NULL);
                    } else {
                        free(json);
                    }
                }
            }
            break;

        case MQTT_EVENT_ERROR:
            ESP_LOGE(TAG, "MQTT Error occurred");
            break;

        default:
            ESP_LOGD(TAG, "MQTT event: %ld", event_id);
            break;
    }
}

esp_err_t mqtt_client_init(const char *token) {
    if (!token || !g_event_group) {
        ESP_LOGE(TAG, "Invalid parameters");
        return ESP_ERR_INVALID_ARG;
    }

    if (mqtt_client != NULL) {
        ESP_LOGW(TAG, "MQTT client already initialized");
        return ESP_OK;
    }

    ESP_LOGI(TAG, "Initializing MQTT client...");
    
    esp_mqtt_client_config_t mqtt_cfg = {
        .broker.address.uri = MQTT_BROKER,
        .credentials.username = token,
    };

    strcpy(_token, token);

    mqtt_client = esp_mqtt_client_init(&mqtt_cfg);
    if (!mqtt_client) {
        ESP_LOGE(TAG, "Failed to initialize MQTT client");
        return ESP_FAIL;
    }

    esp_mqtt_client_register_event(mqtt_client, ESP_EVENT_ANY_ID,
                                                    mqtt_event_handler, NULL);
    esp_mqtt_client_start(mqtt_client);

    ESP_LOGI(TAG, "MQTT client started successfully");
    return ESP_OK;
}

esp_err_t mqtt_publish_telemetry(int heart_rate, double spo2, float temperature, const char *alarm_status) {
    // Check connection status
    if (!mqtt_client || !mqtt_is_connected()) {
        ESP_LOGW(TAG, "MQTT not connected, skipping publish");
        return ESP_ERR_INVALID_STATE;
    }

    // Build JSON payload
    char payload[256] = { 0 };
    snprintf(payload, sizeof(payload),
        "{\"heartRate\":%d,\"SpO2\":%.2f,\"temperature\":%.2f,\"alarm\":\"%s\"}",
        heart_rate, spo2, temperature, alarm_status ? alarm_status : "normal");

    // Publish message
    int msg_id = esp_mqtt_client_publish(mqtt_client, TELEMETRY_TOPIC, 
                                         payload, 0, 1, 0);
    if (msg_id < 0) {
        ESP_LOGE(TAG, "Failed to publish message");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Telemetry published: %s", payload);
    return ESP_OK;
}

esp_err_t mqtt_publish_attributes(const char *patient_id, const char *doctor_id){
    if (!patient_id || !doctor_id) {
        ESP_LOGE(TAG, "Invalid patient or doctor ID");
        return ESP_ERR_INVALID_ARG;
    }

    if (!mqtt_client || !mqtt_is_connected()) {
        ESP_LOGW(TAG, "MQTT not connected, skipping publish");
        return ESP_ERR_INVALID_STATE;
    }

    // Build attributes JSON payload
    char payload[256];
    int len = snprintf(payload, sizeof(payload),
        "{\"patientID\":\"%s\",\"doctorID\":\"%s\"}",
        patient_id, doctor_id);

    if (len < 0 || len >= sizeof(payload)) {
        ESP_LOGE(TAG, "Failed to build attributes payload");
        return ESP_FAIL;
    }

    int msg_id = esp_mqtt_client_publish(mqtt_client, ATTRIBUTES_TOPIC, 
                                         payload, 0, 1, 0);
    if (msg_id < 0) {
        ESP_LOGE(TAG, "Failed to publish attributes");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Attributes published: %s", payload);
    return ESP_OK;
}

esp_err_t mqtt_client_stop(void) {
    if (!mqtt_client) {
        return ESP_OK;
    }

    ESP_LOGI(TAG, "Stopping MQTT client...");
    esp_err_t err = esp_mqtt_client_stop(mqtt_client);
    if (err == ESP_OK) {
        esp_mqtt_client_destroy(mqtt_client);
        mqtt_client = NULL;
        ESP_LOGI(TAG, "MQTT client stopped");
    } else {
        ESP_LOGE(TAG, "Failed to stop MQTT client");
    }

    return err;
}

uint8_t mqtt_is_connected(void) {
    if (!g_event_group) return false;
    EventBits_t bits = xEventGroupGetBits(g_event_group);
    return (bits & MQTT_CONNECTED_BIT) != 0;
}

void mqtt_start_ota_scheduler(void) {
    xTaskCreate(ota_scheduler_task, "ota_sched", 4096, NULL, 5, NULL);
}