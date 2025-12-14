#include "wifi_manager.h"
#include "esp_wifi.h"
#include "esp_netif.h"
#include "esp_log.h"
#include <string.h>

static const char *TAG = "WIFI";

extern EventGroupHandle_t g_event_group;
static int s_retry_count = 0;
static esp_netif_t *s_sta_netif = NULL;
static esp_netif_t *s_ap_netif = NULL;

/**
 * @brief WiFi and IP event handler
 * @param arg User data (unused)
 * @param event_base Event base (WIFI_EVENT or IP_EVENT)
 * @param event_id Event ID
 * @param event_data Event data
 */
static void wifi_event_handler(void *arg, esp_event_base_t event_base,
                               int32_t event_id, void *event_data) {
    
    if (event_base == WIFI_EVENT) {
        switch (event_id) {
            case WIFI_EVENT_STA_START:
                ESP_LOGI(TAG, "WiFi station started, connecting...");
                esp_wifi_connect();
                break;

            case WIFI_EVENT_STA_DISCONNECTED:
                if (s_retry_count < MAXIMUM_RETRY) {
                    esp_wifi_connect();
                    s_retry_count++;
                    ESP_LOGI(TAG, "Retry to connect (attempt %d/%d)", 
                             s_retry_count, MAXIMUM_RETRY);
                } else {
                    xEventGroupSetBits(g_event_group, WIFI_FAIL_BIT);
                    ESP_LOGW(TAG, "Failed to connect to AP after %d attempts", 
                             MAXIMUM_RETRY);
                }
                break;

            default:
                break;
        }
    } 
    else if (event_base == IP_EVENT) {
        if (event_id == IP_EVENT_STA_GOT_IP) {
            ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;
            ESP_LOGI(TAG, "Got IP Address: " IPSTR, IP2STR(&event->ip_info.ip));
            
            // Reset retry counter and set connected bit
            s_retry_count = 0;
            xEventGroupSetBits(g_event_group, WIFI_CONNECTED_BIT);
        }
    }
}

/**
 * @brief Initialize WiFi manager and register event handlers
 * @return ESP_OK on success
 */
esp_err_t wifi_manager_init() {
    if (!g_event_group) {
        ESP_LOGE(TAG, "Invalid event group");
        return ESP_ERR_INVALID_ARG;
    }

    // Register WiFi event handler
    esp_err_t err = esp_event_handler_instance_register(
        WIFI_EVENT, 
        ESP_EVENT_ANY_ID, 
        &wifi_event_handler, 
        NULL, 
        NULL
    );
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to register WiFi event handler: %s", 
                 esp_err_to_name(err));
        return err;
    }

    // Register IP event handler
    err = esp_event_handler_instance_register(
        IP_EVENT, 
        IP_EVENT_STA_GOT_IP, 
        &wifi_event_handler, 
        NULL, 
        NULL
    );
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to register IP event handler: %s", 
                 esp_err_to_name(err));
        return err;
    }

    ESP_LOGI(TAG, "WiFi Manager initialized");
    return ESP_OK;
}

/**
 * @brief Start WiFi in Access Point mode
 * @return ESP_OK on success
 */
esp_err_t wifi_start_ap_mode(void) {
    // Clear connected bit when switching modes
    xEventGroupClearBits(g_event_group, WIFI_CONNECTED_BIT);
    
    ESP_LOGI(TAG, "Starting WiFi in AP mode...");

    // Create default AP network interface if not exists
    if (!s_ap_netif) {
        s_ap_netif = esp_netif_create_default_wifi_ap();
    }

    // Initialize WiFi with default configuration
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_err_t err = esp_wifi_init(&cfg);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "WiFi init failed: %s", esp_err_to_name(err));
        return err;
    }

    // Configure AP settings
    wifi_config_t ap_config = {
        .ap = {
            .ssid = AP_SSID,
            .ssid_len = strlen(AP_SSID),
            .channel = 1,
            .max_connection = AP_MAX_CONN,
            .authmode = WIFI_AUTH_OPEN,  // Open network (no password)
        },
    };

    // Set WiFi mode to AP
    err = esp_wifi_set_mode(WIFI_MODE_AP);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to set WiFi mode: %s", esp_err_to_name(err));
        return err;
    }

    // Set AP configuration
    err = esp_wifi_set_config(WIFI_IF_AP, &ap_config);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to set AP config: %s", esp_err_to_name(err));
        return err;
    }

    // Start WiFi
    err = esp_wifi_start();
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start WiFi: %s", esp_err_to_name(err));
        return err;
    }

    ESP_LOGI(TAG, "AP Mode started successfully, SSID: %s", AP_SSID);
    return ESP_OK;
}

/**
 * @brief Start WiFi in Station mode and connect to AP
 * @param ssid WiFi SSID to connect to
 * @param pass WiFi password
 * @return true if connected successfully, false otherwise
 */
bool wifi_start_station_mode(const char *ssid, const char *pass)
{
    if (!ssid || !pass) {
        ESP_LOGE(TAG, "Invalid SSID or password");
        return false;
    }

    ESP_LOGI(TAG, "Starting WiFi in Station mode...");
    ESP_LOGI(TAG, "Connecting to SSID: %s", ssid);

    // Create default station network interface if not exists
    if (!s_sta_netif) {
        s_sta_netif = esp_netif_create_default_wifi_sta();
    }

    // Initialize WiFi with default configuration
    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_err_t err = esp_wifi_init(&cfg);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "WiFi init failed: %s", esp_err_to_name(err));
        return false;
    }

    // Configure station settings
    wifi_config_t wifi_config = {0};
    strncpy((char *)wifi_config.sta.ssid, ssid, sizeof(wifi_config.sta.ssid) - 1);
    strncpy((char *)wifi_config.sta.password, pass, sizeof(wifi_config.sta.password) - 1);

    // Set WiFi mode to station
    err = esp_wifi_set_mode(WIFI_MODE_STA);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to set WiFi mode: %s", esp_err_to_name(err));
        return false;
    }

    // Set station configuration
    err = esp_wifi_set_config(WIFI_IF_STA, &wifi_config);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to set station config: %s", esp_err_to_name(err));
        return false;
    }

    // Start WiFi
    err = esp_wifi_start();
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start WiFi: %s", esp_err_to_name(err));
        return false;
    }

    // Wait for connection or failure
    EventBits_t bits = xEventGroupWaitBits(
        g_event_group,
        WIFI_CONNECTED_BIT | WIFI_FAIL_BIT,
        pdFALSE,  // Don't clear bits on exit
        pdFALSE,  // Wait for either bit (not both)
        pdMS_TO_TICKS(WIFI_CONNECT_TIMEOUT_MS)
    );

    if (bits & WIFI_CONNECTED_BIT) {
        ESP_LOGI(TAG, "Connected to WiFi successfully");
        return true;
    } else {
        ESP_LOGE(TAG, "WiFi connection failed or timeout");
        return false;
    }
}

/**
 * @brief Stop WiFi and deinitialize driver
 * @return ESP_OK on success
 */
esp_err_t wifi_stop(void) {
    ESP_LOGI(TAG, "Stopping WiFi...");
    
    // Stop WiFi
    esp_err_t err = esp_wifi_stop();
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to stop WiFi: %s", esp_err_to_name(err));
        return err;
    }

    // Deinitialize WiFi driver
    err = esp_wifi_deinit();
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to deinit WiFi: %s", esp_err_to_name(err));
        return err;
    }

    // Clear connected bit
    xEventGroupClearBits(g_event_group, WIFI_CONNECTED_BIT);

    ESP_LOGI(TAG, "WiFi stopped");
    return ESP_OK;
}

/**
 * @brief Check if WiFi is connected
 * @return true if connected, false otherwise
 */
bool wifi_is_connected(void) {
    if (!g_event_group) {
        return false;
    }
    
    EventBits_t bits = xEventGroupGetBits(g_event_group);
    return (bits & WIFI_CONNECTED_BIT) != 0;
}