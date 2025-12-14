#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <stdbool.h>
#include "esp_err.h"
#include "esp_event.h"
#include "sytem_config.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"

/**
 * @brief Initialize WiFi manager and register event handlers
 * @return ESP_OK on success
 */
esp_err_t wifi_manager_init();

/**
 * @brief Start WiFi in Access Point mode
 * @return ESP_OK on success
 */
esp_err_t wifi_start_ap_mode(void);

/**
 * @brief Start WiFi in Station mode and connect to AP
 * @param ssid WiFi SSID to connect to
 * @param pass WiFi password
 * @return true if connected successfully, false otherwise
 */
bool wifi_start_station_mode(const char *ssid, const char *pass);

/**
 * @brief Stop WiFi and deinitialize driver
 * @return ESP_OK on success
 */
esp_err_t wifi_stop(void);

/**
 * @brief Check if WiFi is connected
 * @return true if connected, false otherwise
 */
bool wifi_is_connected(void);

#endif // WIFI_MANAGER_H