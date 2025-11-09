#include "wifi/wifi_manager.h"
#include "config.h"
#include "esp_wifi.h"
#include "esp_netif.h"
#include "esp_log.h"
#include <string.h>

static const char *TAG = "WIFI_MGR";
static EventGroupHandle_t s_event_group = NULL;
static int s_retry_num = 0;
static esp_netif_t *s_sta_netif = NULL;
static esp_netif_t *s_ap_netif = NULL;

static void wifi_event_handler(void* arg, esp_event_base_t event_base, 
                               int32_t event_id, void* event_data) {
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        if (s_retry_num < MAXIMUM_RETRY) {
            esp_wifi_connect();
            s_retry_num++;
            ESP_LOGI(TAG, "Retry to connect (attempt %d/%d)", s_retry_num, MAXIMUM_RETRY);
        } else {
            xEventGroupSetBits(s_event_group, WIFI_FAIL_BIT);
            ESP_LOGW(TAG, "Failed to connect to AP");
        }
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        ESP_LOGI(TAG, "Got IP: " IPSTR, IP2STR(&event->ip_info.ip));
        s_retry_num = 0;
        xEventGroupSetBits(s_event_group, WIFI_CONNECTED_BIT);
    }
}

esp_err_t wifi_manager_init(EventGroupHandle_t event_group) {
    if (!event_group) {
        ESP_LOGE(TAG, "Invalid event group");
        return ESP_ERR_INVALID_ARG;
    }

    s_event_group = event_group;

    esp_err_t err = esp_event_handler_instance_register(
        WIFI_EVENT, ESP_EVENT_ANY_ID, &wifi_event_handler, NULL, NULL);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to register WiFi event handler");
        return err;
    }

    err = esp_event_handler_instance_register(
        IP_EVENT, IP_EVENT_STA_GOT_IP, &wifi_event_handler, NULL, NULL);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to register IP event handler");
        return err;
    }

    ESP_LOGI(TAG, "WiFi Manager initialized");
    return ESP_OK;
}

esp_err_t wifi_start_ap_mode(void) {
    ESP_LOGI(TAG, "Starting AP mode...");

    if (!s_ap_netif) {
        s_ap_netif = esp_netif_create_default_wifi_ap();
    }

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_err_t err = esp_wifi_init(&cfg);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "WiFi init failed: %s", esp_err_to_name(err));
        return err;
    }

    wifi_config_t ap_config = {
        .ap = {
            .ssid = AP_SSID,
            .ssid_len = strlen(AP_SSID),
            .channel = 1,
            .max_connection = AP_MAX_CONN,
            .authmode = WIFI_AUTH_OPEN,
        },
    };

    err = esp_wifi_set_mode(WIFI_MODE_AP);
    if (err == ESP_OK) {
        err = esp_wifi_set_config(WIFI_IF_AP, &ap_config);
    }
    if (err == ESP_OK) {
        err = esp_wifi_start();
    }

    if (err == ESP_OK) {
        ESP_LOGI(TAG, "AP Mode started, SSID: %s", AP_SSID);
    } else {
        ESP_LOGE(TAG, "Failed to start AP mode: %s", esp_err_to_name(err));
    }

    return err;
}

bool wifi_start_station_mode(const char *ssid, const char *pass) {
    if (!ssid || !pass) {
        ESP_LOGE(TAG, "Invalid SSID or password");
        return false;
    }

    ESP_LOGI(TAG, "Starting Station mode...");

    if (!s_sta_netif) {
        s_sta_netif = esp_netif_create_default_wifi_sta();
    }

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_err_t err = esp_wifi_init(&cfg);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "WiFi init failed: %s", esp_err_to_name(err));
        return false;
    }

    wifi_config_t wifi_config = {0};
    strncpy((char*)wifi_config.sta.ssid, ssid, sizeof(wifi_config.sta.ssid) - 1);
    strncpy((char*)wifi_config.sta.password, pass, sizeof(wifi_config.sta.password) - 1);

    err = esp_wifi_set_mode(WIFI_MODE_STA);
    if (err == ESP_OK) {
        err = esp_wifi_set_config(WIFI_IF_STA, &wifi_config);
    }
    if (err == ESP_OK) {
        err = esp_wifi_start();
    }

    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to start WiFi: %s", esp_err_to_name(err));
        return false;
    }

    // Wait for connection or failure
    EventBits_t bits = xEventGroupWaitBits(
        s_event_group,
        WIFI_CONNECTED_BIT | WIFI_FAIL_BIT,
        pdTRUE,  // Clear bits after reading
        pdFALSE, // Wait for either bit
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

esp_err_t wifi_stop(void) {
    ESP_LOGI(TAG, "Stopping WiFi...");
    esp_err_t err = esp_wifi_stop();
    if (err == ESP_OK) {
        err = esp_wifi_deinit();
    }
    
    if (err == ESP_OK) {
        ESP_LOGI(TAG, "WiFi stopped");
    } else {
        ESP_LOGE(TAG, "Failed to stop WiFi: %s", esp_err_to_name(err));
    }
    
    return err;
}

bool wifi_is_connected(void) {
    if (!s_event_group) return false;
    EventBits_t bits = xEventGroupGetBits(s_event_group);
    return (bits & WIFI_CONNECTED_BIT) != 0;
}