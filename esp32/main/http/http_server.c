#include "http/http_server.h"
#include "provisioning/provisioning.h"
#include "storage/nvs_stoarge.h"
#include "config.h"
#include "esp_http_server.h"
#include "esp_log.h"
#include "cJSON.h"
#include <string.h>

static const char *TAG = "HTTP_SERVER";
static httpd_handle_t server = NULL;

extern const uint8_t index_html_start[] asm("_binary_index_html_start");
extern const uint8_t index_html_end[] asm("_binary_index_html_end");

static esp_err_t root_handler(httpd_req_t* req) {
    esp_err_t err = httpd_resp_set_type(req, "text/html");
    if (err == ESP_OK) {
        err = httpd_resp_send(req, (char*)index_html_start, 
                             index_html_end - index_html_start);
    }
    return err;
}

static esp_err_t save_handler(httpd_req_t* req) {
    char *buffer = NULL;
    cJSON *root = NULL;
    esp_err_t ret = ESP_FAIL;

    // Allocate buffer for request data
    buffer = malloc(req->content_len + 1);
    if (!buffer) {
        ESP_LOGE(TAG, "Failed to allocate memory for request");
        httpd_resp_send_500(req);
        return ESP_ERR_NO_MEM;
    }

    // Receive request data
    int received = httpd_req_recv(req, buffer, req->content_len);
    if (received <= 0) {
        ESP_LOGE(TAG, "Failed to receive request data");
        httpd_resp_send_500(req);
        goto cleanup;
    }
    buffer[received] = '\0';

    // Parse JSON
    root = cJSON_Parse(buffer);
    if (!root) {
        ESP_LOGE(TAG, "Failed to parse JSON");
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid JSON");
        goto cleanup;
    }

    // Extract fields
    const cJSON *doctorID = cJSON_GetObjectItem(root, "doctorID");
    const cJSON *patientID = cJSON_GetObjectItem(root, "patientID");
    const cJSON *ssid = cJSON_GetObjectItem(root, "ssid");
    const cJSON *pass = cJSON_GetObjectItem(root, "pass");

    // Validate fields
    if (!doctorID || !patientID || !ssid || !pass ||
        !cJSON_IsString(doctorID) || !cJSON_IsString(patientID) ||
        !cJSON_IsString(ssid) || !cJSON_IsString(pass)) {
        ESP_LOGE(TAG, "Invalid or missing fields in JSON");
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing required fields");
        goto cleanup;
    }

    ESP_LOGI(TAG, "Received config - PatientID: %s, SSID: %s", 
             patientID->valuestring, ssid->valuestring);

    // Save WiFi configuration
    esp_err_t err = nvs_save_wifi_config(ssid->valuestring, pass->valuestring, 
                                          patientID->valuestring);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to save WiFi config");
        httpd_resp_send_500(req);
        goto cleanup;
    }

    // Send provisioning request
    err = provisioning_send_request(doctorID->valuestring);
    if (err == ESP_OK) {
        httpd_resp_sendstr(req, 
            "<h3>Configuration saved successfully. Device will restart...</h3>");
        ret = ESP_OK;
    } else {
        httpd_resp_sendstr(req, 
            "<h3>Config saved but provisioning failed. Device will restart...</h3>");
        ret = ESP_OK;  // Still restart even if provisioning failed
    }

    // Schedule restart
    vTaskDelay(pdMS_TO_TICKS(1500));
    esp_restart();

cleanup:
    if (buffer) free(buffer);
    if (root) cJSON_Delete(root);
    return ret;
}

esp_err_t http_server_start(void) {
    if (server != NULL) {
        ESP_LOGW(TAG, "HTTP server already running");
        return ESP_OK;
    }

    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.lru_purge_enable = true;

    ESP_LOGI(TAG, "Starting HTTP server...");
    esp_err_t err = httpd_start(&server, &config);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start HTTP server: %s", esp_err_to_name(err));
        return err;
    }

    // Register URI handlers
    httpd_uri_t uri_root = {
        .uri = "/",
        .method = HTTP_GET,
        .handler = root_handler,
        .user_ctx = NULL,
    };

    httpd_uri_t uri_save = {
        .uri = "/save",
        .method = HTTP_POST,
        .handler = save_handler,
        .user_ctx = NULL,
    };

    err = httpd_register_uri_handler(server, &uri_root);
    if (err == ESP_OK) {
        err = httpd_register_uri_handler(server, &uri_save);
    }

    if (err == ESP_OK) {
        ESP_LOGI(TAG, "HTTP server started successfully");
    } else {
        ESP_LOGE(TAG, "Failed to register URI handlers");
        httpd_stop(server);
        server = NULL;
    }

    return err;
}

esp_err_t http_server_stop(void) {
    if (server == NULL) {
        return ESP_OK;
    }

    ESP_LOGI(TAG, "Stopping HTTP server...");
    esp_err_t err = httpd_stop(server);
    server = NULL;

    if (err == ESP_OK) {
        ESP_LOGI(TAG, "HTTP server stopped");
    } else {
        ESP_LOGE(TAG, "Failed to stop HTTP server: %s", esp_err_to_name(err));
    }

    return err;
}

uint8_t http_server_is_running(void) {
    return server != NULL;
}