#include "provisioning.h"
#include "nvs_stoarge.h"
#include "esp_http_client.h"
#include "esp_log.h"
#include "cJSON.h"
#include "esp_system.h"
#include "esp_wifi.h"
#include <string.h>

static const char *TAG = "PROVISION";

/**
 * @brief Send provisioning request to ThingsBoard server
 * @details Registers device with ThingsBoard and retrieves access token
 * @param device_key Provisioning device key
 * @param device_secret Provisioning device secret
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t provisioning_send_request(const char *device_key, const char *device_secret) {
    if (!device_key || !device_secret) {
        ESP_LOGE(TAG, "Invalid device credentials");
        return ESP_ERR_INVALID_ARG;
    }

    // Generate unique device name from MAC address
    uint8_t mac[6];
    esp_wifi_get_mac(WIFI_IF_STA, mac);

    char device_name[32];
    snprintf(device_name, sizeof(device_name), 
             "ESP_%02X%02X%02X%02X%02X%02X", 
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);  

    ESP_LOGI(TAG, "Starting provisioning for device: %s", device_name);

    // Build JSON request payload
    cJSON *root = cJSON_CreateObject();
    cJSON_AddStringToObject(root, "deviceName", device_name);
    cJSON_AddStringToObject(root, "provisionDeviceKey", device_key);
    cJSON_AddStringToObject(root, "provisionDeviceSecret", device_secret);
    
    char *payload = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);

    if (!payload) {
        ESP_LOGE(TAG, "Failed to create JSON payload");
        return ESP_ERR_NO_MEM;
    }

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

    // Set HTTP headers
    esp_http_client_set_header(client, "Content-Type", "application/json");

    // Open connection and send request
    if (esp_http_client_open(client, strlen(payload)) != ESP_OK) {
        ESP_LOGE(TAG, "Failed to open HTTP connection");
        goto cleanup;
    }

    // Write request payload
    if (esp_http_client_write(client, payload, strlen(payload)) <= 0) {
        ESP_LOGE(TAG, "Failed to write HTTP request");
        goto cleanup;
    }

    // Fetch response headers
    if (esp_http_client_fetch_headers(client) < 0) {
        ESP_LOGE(TAG, "Failed to fetch response headers");
        goto cleanup;
    }

    // Check HTTP status code
    int status_code = esp_http_client_get_status_code(client);
    ESP_LOGI(TAG, "HTTP Response Status: %d", status_code);

    if (status_code == 200) {
        // Allocate buffer for response
        char *buffer = malloc(4096);
        if (!buffer) {
            ESP_LOGE(TAG, "Failed to allocate response buffer");
            goto cleanup;
        }

        // Read response
        int read_len = esp_http_client_read_response(client, buffer, 4096);
        if (read_len > 0) {
            // Ensure null termination
            if (read_len < 4096) {
                buffer[read_len] = '\0';
            } else {
                buffer[4095] = '\0';
            }

            ESP_LOGI(TAG, "Provisioning response: %s", buffer);

            // Parse JSON response to extract access token
            cJSON *resp = cJSON_Parse(buffer);
            if (resp) {
                cJSON *token = cJSON_GetObjectItem(resp, "credentialsValue");
                if (token && cJSON_IsString(token)) {
                    ESP_LOGI(TAG, "Received access token: %s", token->valuestring);
                    
                    // Save token to NVS
                    result = nvs_save_access_token(token->valuestring);
                    if (result == ESP_OK) {
                        ESP_LOGI(TAG, "Access token saved successfully");
                    } else {
                        ESP_LOGE(TAG, "Failed to save access token");
                    }
                } else {
                    ESP_LOGE(TAG, "Token not found in response");
                }
                cJSON_Delete(resp);
            } else {
                ESP_LOGE(TAG, "Failed to parse JSON response");
            }

        } else {
            ESP_LOGE(TAG, "Failed to read response data");
        }
        
        free(buffer);
    } else {
        ESP_LOGE(TAG, "Provisioning failed with HTTP status: %d", status_code);
    }

cleanup:
    free(payload);
    esp_http_client_cleanup(client);

    return result;
}