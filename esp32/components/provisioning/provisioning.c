#include "provisioning.h"
#include "nvs_stoarge.h"
#include "config.h"
#include "esp_http_client.h"
#include "esp_log.h"
#include "cJSON.h"
#include <string.h>

static const char *TAG = "PROVISION";

esp_err_t provisioning_send_request(const char *doctorid) {
    if (!doctorid) {
        ESP_LOGE(TAG, "Invalid doctor ID");
        return ESP_ERR_INVALID_ARG;
    }

    ESP_LOGI(TAG, "Starting provisioning for doctor: %s", doctorid);

    // Initialize HTTP client
    esp_http_client_config_t config = {
        .url = PROVISION_URL,
        .method = HTTP_METHOD_POST,
        .timeout_ms = 10000,
    };
    
    esp_http_client_handle_t client = esp_http_client_init(&config);
    if (!client) {
        ESP_LOGE(TAG, "Failed to initialize HTTP client");
        return ESP_FAIL;
    }

    // Build JSON payload
    cJSON *root = cJSON_CreateObject();
    if (!root) {
        ESP_LOGE(TAG, "Failed to create JSON object");
        esp_http_client_cleanup(client);
        return ESP_ERR_NO_MEM;
    }

    cJSON_AddStringToObject(root, "deviceName", DEVICE_NAME);
    cJSON_AddStringToObject(root, "provisionDeviceKey", doctorid);
    cJSON_AddStringToObject(root, "provisionDeviceSecret", doctorid);
    
    char *payload = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);

    if (!payload) {
        ESP_LOGE(TAG, "Failed to create JSON payload");
        esp_http_client_cleanup(client);
        return ESP_ERR_NO_MEM;
    }

    // Set headers and payload
    esp_http_client_set_header(client, "Content-Type", "application/json");
    esp_http_client_set_post_field(client, payload, strlen(payload));

    // Perform HTTP request
    esp_err_t err = esp_http_client_perform(client);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "HTTP POST failed: %s", esp_err_to_name(err));
        free(payload);
        esp_http_client_cleanup(client);
        return err;
    }

    int status = esp_http_client_get_status_code(client);
    int content_len = esp_http_client_get_content_length(client);
    ESP_LOGI(TAG, "HTTP Status: %d, Content-Length: %d", status, content_len);

    // Read response
    int buf_size = (content_len > 0 && content_len < 4096) ? content_len + 1 : 2048;
    char *buffer = malloc(buf_size);
    if (!buffer) {
        ESP_LOGE(TAG, "Failed to allocate response buffer");
        free(payload);
        esp_http_client_cleanup(client);
        return ESP_ERR_NO_MEM;
    }
    memset(buffer, 0, buf_size);

    int read_len = esp_http_client_read(client, buffer, buf_size - 1);
    
    esp_err_t result = ESP_FAIL;
    
    if (read_len > 0) {
        buffer[read_len] = '\0';
        ESP_LOGI(TAG, "Response: %s", buffer);

        // Parse response
        cJSON *resp = cJSON_Parse(buffer);
        if (resp) {
            cJSON *token = cJSON_GetObjectItem(resp, "accessToken");
            if (token && cJSON_IsString(token)) {
                ESP_LOGI(TAG, "Access token received");
                result = nvs_save_access_token(token->valuestring);
            } else {
                ESP_LOGW(TAG, "accessToken not found in response");
            }
            cJSON_Delete(resp);
        } else {
            ESP_LOGW(TAG, "Failed to parse JSON response");
        }
    } else {
        ESP_LOGW(TAG, "No response body received");
    }

    // Cleanup
    free(buffer);
    free(payload);
    esp_http_client_cleanup(client);

    return result;
}