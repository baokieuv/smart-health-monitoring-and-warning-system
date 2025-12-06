#include "mqtt_tb.h"
#include "config.h"
#include "mqtt_client.h"
#include "esp_log.h"
#include <stdio.h>

static const char *TAG = "MQTT_CLIENT";
static esp_mqtt_client_handle_t mqtt_client = NULL;
extern EventGroupHandle_t g_event_group;

static void mqtt_event_handler(void *handler_args, esp_event_base_t base,
                               int32_t event_id, void *event_data) {
    esp_mqtt_event_handle_t event = event_data;

    switch ((esp_mqtt_event_id_t)event_id) {
        case MQTT_EVENT_CONNECTED:
            ESP_LOGI(TAG, "MQTT Connected");
            if (g_event_group) {
                xEventGroupSetBits(g_event_group, MQTT_CONNECTED_BIT);
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

    mqtt_client = esp_mqtt_client_init(&mqtt_cfg);
    if (!mqtt_client) {
        ESP_LOGE(TAG, "Failed to initialize MQTT client");
        return ESP_FAIL;
    }

    esp_err_t err = esp_mqtt_client_register_event(mqtt_client, ESP_EVENT_ANY_ID,
                                                    mqtt_event_handler, NULL);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to register MQTT event handler");
        esp_mqtt_client_destroy(mqtt_client);
        mqtt_client = NULL;
        return err;
    }

    err = esp_mqtt_client_start(mqtt_client);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start MQTT client");
        esp_mqtt_client_destroy(mqtt_client);
        mqtt_client = NULL;
        return err;
    }

    ESP_LOGI(TAG, "MQTT client started successfully");
    return ESP_OK;
}

esp_err_t mqtt_publish_telemetry(int heart_rate, double spo2, float temperature, const char *alarm_status) {
    if (!mqtt_client) {
        ESP_LOGE(TAG, "MQTT client not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    // Check connection status
    if (!mqtt_is_connected()) {
        ESP_LOGW(TAG, "MQTT not connected, skipping publish");
        return ESP_ERR_INVALID_STATE;
    }

    // Build JSON payload
    char payload[256];
    int len = snprintf(payload, sizeof(payload),
        "{\"heartRate\":%d,\"SpO2\":%.2f,\"temperature\":%.2f,\"alarm\":\"%s\"}",
        heart_rate, spo2, temperature, alarm_status ? alarm_status : "normal");

    if (len < 0 || len >= sizeof(payload)) {
        ESP_LOGE(TAG, "Failed to build payload");
        return ESP_FAIL;
    }

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
    if (!mqtt_client) {
        ESP_LOGE(TAG, "MQTT client not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    if (!patient_id || !doctor_id) {
        ESP_LOGE(TAG, "Invalid patient or doctor ID");
        return ESP_ERR_INVALID_ARG;
    }

    if (!mqtt_is_connected()) {
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