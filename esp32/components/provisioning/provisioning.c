#include "provisioning.h"
#include "nvs_stoarge.h"
#include "config.h"
#include "esp_http_client.h"
#include "esp_log.h"
#include "cJSON.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include <string.h>

static const char *TAG = "PROVISION";

esp_err_t provisioning_send_request(const char *device_key, const char *device_secret) {
    if (!device_key || !device_secret) {
        ESP_LOGE(TAG, "Invalid device credentials");
        return ESP_ERR_INVALID_ARG;
    }

    uint8_t mac[6];
    esp_wifi_get_mac(WIFI_IF_STA, mac);
    char device_name[32] = { 0 };
    sprintf(device_name, "ESP_%02X%02X%02X%02X%02X%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);  

    ESP_LOGI(TAG, "Starting provisioning... %s", device_name);

    cJSON *root = cJSON_CreateObject();
    cJSON_AddStringToObject(root, "deviceName", device_name);
    cJSON_AddStringToObject(root, "provisionDeviceKey", device_key);
    cJSON_AddStringToObject(root, "provisionDeviceSecret", device_secret);
    char *payload = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);

    if (!payload) return ESP_ERR_NO_MEM;

    // Initialize HTTP client
    esp_http_client_config_t config = {
        .url = PROVISION_URL,
        .method = HTTP_METHOD_POST,
        .timeout_ms = 10000,
    };
    
    esp_http_client_handle_t client = esp_http_client_init(&config);
    if (!client) {
        ESP_LOGE(TAG, "Failed to initialize HTTP client");
        free(payload);
        return ESP_FAIL;
    }

    esp_err_t result = ESP_FAIL;
    // Set headers and payload
    esp_http_client_set_header(client, "Content-Type", "application/json");

    if (esp_http_client_open(client, strlen(payload)) != ESP_OK){
        ESP_LOGW(TAG, "Cannot open client");
        free(payload);
        return ESP_FAIL;
    }

    if (esp_http_client_write(client, payload, strlen(payload)) > 0){
        if (esp_http_client_fetch_headers(client) >= 0) {
                int status_code = esp_http_client_get_status_code(client);
                ESP_LOGI(TAG, "HTTP Status: %d", status_code);
        
            if(status_code == 200){
                char *buffer = malloc(4096);
                if (buffer) {
                    int read_len = esp_http_client_read_response(client, buffer, 4096);
                    if (read_len > 0) {
                        if (read_len < 4096) buffer[read_len] = '\0';
                        else buffer[4095] = '\0'; // Safety termination

                        ESP_LOGI(TAG, "Response: %s", buffer);
                        
                        // Parse JSON để lấy Token
                        cJSON *resp = cJSON_Parse(buffer);
                        if (resp) {
                            cJSON *token = cJSON_GetObjectItem(resp, "credentialsValue");
                            if (token && cJSON_IsString(token)) {
                                ESP_LOGI(TAG, "Got Token: %s", token->valuestring);
                                result = nvs_save_access_token(token->valuestring);
                            }
                            cJSON_Delete(resp);
                        }
                    }
                    free(buffer);
                }
            }
        }
    } else {
        ESP_LOGE(TAG, "Failed to open connection");
    }

    free(payload);
    esp_http_client_cleanup(client);

    return result;
}