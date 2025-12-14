#include "http_server.h"
#include "provisioning.h"
#include "nvs_stoarge.h"
#include "esp_http_server.h"
#include "esp_log.h"
#include "cJSON.h"
#include <string.h>

static const char *TAG = "HTTP_SERVER";

static httpd_handle_t s_server = NULL;
static system_mode_t s_current_mode = SYS_MODE_AP_SIMPLE;

extern const uint8_t index_simple_html_start[] asm("_binary_index_simple_html_start");
extern const uint8_t index_simple_html_end[] asm("_binary_index_simple_html_end");
extern const uint8_t index_full_html_start[] asm("_binary_index_full_html_start");
extern const uint8_t index_full_html_end[] asm("_binary_index_full_html_end");

/**
 * @brief Root handler - serves HTML configuration page
 * @param req HTTP request
 * @return ESP_OK on success
 */
static esp_err_t root_handler(httpd_req_t *req) {
    httpd_resp_set_type(req, "text/html");
    
    if (s_current_mode == SYS_MODE_AP_SIMPLE) {
        // Serve simple WiFi configuration page
        return httpd_resp_send(req, 
                              (const char *)index_simple_html_start,
                              index_simple_html_end - index_simple_html_start);
    } else {
        // Serve full configuration page (WiFi + Patient/Doctor info)
        return httpd_resp_send(req, 
                              (const char *)index_full_html_start,
                              index_full_html_end - index_full_html_start);
    }
}

/**
 * @brief Handle simple WiFi configuration save
 * @param req HTTP request
 * @param root Parsed JSON object
 * @return ESP_OK on success
 */
static esp_err_t save_simple_handler(httpd_req_t *req, cJSON *root) {
    // Extract SSID and password from JSON
    const cJSON *ssid = cJSON_GetObjectItem(root, "ssid");
    const cJSON *pass = cJSON_GetObjectItem(root, "pass");

    // Validate JSON fields
    if (!ssid || !pass ||
        !cJSON_IsString(ssid) || !cJSON_IsString(pass)) {
        ESP_LOGE(TAG, "Invalid or missing fields in JSON");
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing fields");
        return ESP_FAIL;
    }

    // Save WiFi configuration to NVS
    esp_err_t err = nvs_save_wifi_config(ssid->valuestring, pass->valuestring);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to save WiFi config");
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to save");
        return err;
    }
    
    // Send success response
    httpd_resp_sendstr(req, "<h3>Saved! Device will restart...</h3>");
    ESP_LOGI(TAG, "WiFi config saved successfully");
    
    return ESP_OK;
}

/**
 * @brief Handle full configuration save (WiFi + Patient/Doctor info)
 * @param req HTTP request
 * @param root Parsed JSON object
 * @return ESP_OK on success
 */
static esp_err_t save_full_handler(httpd_req_t *req, cJSON *root){
    // Extract all fields from JSON
    const cJSON *patient = cJSON_GetObjectItem(root, "patientID");
    const cJSON *doctor = cJSON_GetObjectItem(root, "doctorID");
    const cJSON *ssid = cJSON_GetObjectItem(root, "ssid");
    const cJSON *pass = cJSON_GetObjectItem(root, "pass");

    // Validate JSON fields
    if (!patient || !doctor || !ssid || !pass ||
        !cJSON_IsString(patient) || !cJSON_IsString(doctor) ||
        !cJSON_IsString(ssid) || !cJSON_IsString(pass)) {
        ESP_LOGE(TAG, "Invalid or missing fields in JSON");
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing fields");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Full config - Patient: %s, Doctor: %s", 
             patient->valuestring, doctor->valuestring);

    ESP_LOGI(TAG, "Full config - Patient: %s, Doctor: %s", 
             patient->valuestring, doctor->valuestring);

    // Save full configuration to NVS
    esp_err_t err = nvs_save_full_config(
        ssid->valuestring, 
        pass->valuestring,
        patient->valuestring, 
        doctor->valuestring
    );

    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to save full config");
        httpd_resp_send_500(req);
        return err;
    }

    // Send success response
    httpd_resp_sendstr(req, 
        "<html><body><h3>Configuration Saved!</h3>"
        "<p>Device will restart, connect to WiFi, and perform provisioning automatically...</p>"
        "</body></html>");
    
    ESP_LOGI(TAG, "Full config saved successfully");

    return ESP_OK;
}

/**
 * @brief Save configuration handler (routes to simple or full handler)
 * @param req HTTP request
 * @return ESP_OK on success
 */
static esp_err_t save_handler(httpd_req_t *req) {
    char *buffer = NULL;
    cJSON *root = NULL;
    esp_err_t ret = ESP_FAIL;

    ESP_LOGI(TAG, "Received configuration data");

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
        ESP_LOGE(TAG, "JSON parse error");
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid JSON");
        goto cleanup;
    }

    // Route to appropriate handler based on mode
    if (s_current_mode == SYS_MODE_AP_SIMPLE) {
        ret = save_simple_handler(req, root);
    } else if (s_current_mode == SYS_MODE_AP_FULL) {
        ret = save_full_handler(req, root);
    }

    // Schedule restart after successful save
    if (ret == ESP_OK) {
        vTaskDelay(pdMS_TO_TICKS(2000));
        esp_restart();
    }

cleanup:
    if (buffer) free(buffer);
    if (root) cJSON_Delete(root);
    
    return ret;
}

/**
 * @brief Start HTTP server
 * @param mode System mode (simple or full configuration)
 * @return ESP_OK on success
 */
esp_err_t http_server_start(system_mode_t mode)
{
    if (s_server != NULL) {
        ESP_LOGW(TAG, "HTTP server already running");
        return ESP_OK;
    }

    s_current_mode = mode;

    // Configure HTTP server
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.lru_purge_enable = true;

    ESP_LOGI(TAG, "Starting HTTP server in %s mode...", 
             mode == SYS_MODE_AP_SIMPLE ? "Simple" : "Full");

    // Start server
    esp_err_t err = httpd_start(&s_server, &config);
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

    // Register handlers
    err = httpd_register_uri_handler(s_server, &uri_root);
    if (err == ESP_OK) {
        err = httpd_register_uri_handler(s_server, &uri_save);
    }

    if (err == ESP_OK) {
        ESP_LOGI(TAG, "HTTP server started successfully");
    } else {
        ESP_LOGE(TAG, "Failed to register URI handlers");
        httpd_stop(s_server);
        s_server = NULL;
    }

    return err;
}

/**
 * @brief Stop HTTP server
 * @return ESP_OK on success
 */
esp_err_t http_server_stop(void) {
    if (s_server == NULL) {
        return ESP_OK;
    }

    ESP_LOGI(TAG, "Stopping HTTP server...");
    
    esp_err_t err = httpd_stop(s_server);
    s_server = NULL;

    if (err == ESP_OK) {
        ESP_LOGI(TAG, "HTTP server stopped");
    } else {
        ESP_LOGE(TAG, "Failed to stop HTTP server: %s", esp_err_to_name(err));
    }

    return err;
}

/**
 * @brief Check if HTTP server is running
 * @return true if running, false otherwise
 */
uint8_t http_server_is_running(void) {
    return s_server != NULL;
}