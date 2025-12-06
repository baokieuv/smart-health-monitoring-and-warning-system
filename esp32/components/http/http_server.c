#include "http_server.h"
#include "provisioning.h"
#include "nvs_stoarge.h"
#include "config.h"
#include "esp_http_server.h"
#include "esp_log.h"
#include "cJSON.h"
#include <string.h>

static const char *TAG = "HTTP_SERVER";
static httpd_handle_t server = NULL;
static system_mode_t s_current_mode = SYS_MODE_AP_SIMPLE;

extern const uint8_t index_simple_html_start[] asm("_binary_index_simple_html_start");
extern const uint8_t index_simple_html_end[] asm("_binary_index_simple_html_end");

extern const uint8_t index_full_html_start[] asm("_binary_index_full_html_start");
extern const uint8_t index_full_html_end[] asm("_binary_index_full_html_end");

static esp_err_t root_handler(httpd_req_t *req)
{
    if (s_current_mode == SYS_MODE_AP_SIMPLE)
    {
        httpd_resp_set_type(req, "text/html");
        return httpd_resp_send(req, (const char *)index_simple_html_start,
                               index_simple_html_end - index_simple_html_start);
    }
    else
    {
        httpd_resp_set_type(req, "text/html");
        return httpd_resp_send(req, (const char *)index_full_html_start,
                               index_full_html_end - index_full_html_start);
    }
}

static esp_err_t save_simple_handler(httpd_req_t *req, cJSON *root){
    const cJSON *ssid = cJSON_GetObjectItem(root, "ssid");
    const cJSON *pass = cJSON_GetObjectItem(root, "pass");

    if (!ssid || !pass ||
        !cJSON_IsString(ssid) || !cJSON_IsString(pass))
    {
        ESP_LOGE(TAG, "Invalid or missing fields in JSON");
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing fields");
        return ESP_FAIL;
    }

    esp_err_t err = nvs_save_wifi_config(ssid->valuestring, pass->valuestring);
    if (err != ESP_OK) {
        httpd_resp_send_err(req, HTTPD_500_INTERNAL_SERVER_ERROR, "Failed to save");
        return err;
    }
    
    httpd_resp_sendstr(req, "<h3>Saved! Device will restart...</h3>");
    return ESP_OK;
}

static esp_err_t save_full_handler(httpd_req_t *req, cJSON *root){
    const cJSON *patient = cJSON_GetObjectItem(root, "patientID");
    const cJSON *doctor = cJSON_GetObjectItem(root, "doctorID");
    const cJSON *ssid = cJSON_GetObjectItem(root, "ssid");
    const cJSON *pass = cJSON_GetObjectItem(root, "pass");

    if (!patient || !doctor || !ssid || !pass ||
        !cJSON_IsString(patient) || !cJSON_IsString(doctor) ||
        !cJSON_IsString(ssid) || !cJSON_IsString(pass)) {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Missing fields");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Full config - Patient: %s, Doctor: %s", 
             patient->valuestring, doctor->valuestring);

    // Save full configuration
    esp_err_t err = nvs_save_full_config(
        ssid->valuestring, 
        pass->valuestring,
        patient->valuestring, 
        doctor->valuestring
    );

    if (err != ESP_OK) {
        httpd_resp_send_500(req);
        return err;
    }

    httpd_resp_sendstr(req, 
        "<html><body><h3>Configuration Saved!</h3>"
        "<p>Device will restart, connect to WiFi, and perform provisioning automatically...</p>"
        "</body></html>");

    return ESP_OK;
}

static esp_err_t save_handler(httpd_req_t *req)
{
    char *buffer = NULL;
    cJSON *root = NULL;
    esp_err_t ret = ESP_FAIL;

    ESP_LOGI(TAG, "Received data");

    // Allocate buffer for request data
    buffer = malloc(req->content_len + 1);
    if (!buffer)
    {
        ESP_LOGE(TAG, "Failed to allocate memory for request");
        httpd_resp_send_500(req);
        return ESP_ERR_NO_MEM;
    }

    // Receive request data
    int received = httpd_req_recv(req, buffer, req->content_len);
    if (received <= 0)
    {
        ESP_LOGE(TAG, "Failed to receive request data");
        httpd_resp_send_500(req);
        goto cleanup;
    }
    buffer[received] = '\0';

    root = cJSON_Parse(buffer);
    if (!root) {
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid JSON");
        goto cleanup;
    }

    if(s_current_mode == SYS_MODE_AP_SIMPLE){
        ret = save_simple_handler(req, root);
    }else if(s_current_mode == SYS_MODE_AP_FULL){
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

esp_err_t http_server_start(system_mode_t mode)
{
    if (server != NULL)
    {
        ESP_LOGW(TAG, "HTTP server already running");
        return ESP_OK;
    }

    s_current_mode = mode;

    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    config.lru_purge_enable = true;

    ESP_LOGI(TAG, "Starting HTTP server in %s mode...", 
             mode == SYS_MODE_AP_SIMPLE ? "Simple" : "Full");

    esp_err_t err = httpd_start(&server, &config);
    if (err != ESP_OK)
    {
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
    }
    else {
        ESP_LOGE(TAG, "Failed to register URI handlers");
        httpd_stop(server);
        server = NULL;
    }

    return err;
}

esp_err_t http_server_stop(void)
{
    if (server == NULL) {
        return ESP_OK;
    }

    ESP_LOGI(TAG, "Stopping HTTP server...");
    esp_err_t err = httpd_stop(server);
    server = NULL;

    if (err == ESP_OK) {
        ESP_LOGI(TAG, "HTTP server stopped");
    }
    else {
        ESP_LOGE(TAG, "Failed to stop HTTP server: %s", esp_err_to_name(err));
    }

    return err;
}

uint8_t http_server_is_running(void)
{
    return server != NULL;
}