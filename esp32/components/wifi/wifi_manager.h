#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <stdbool.h>
#include "esp_err.h"
#include "esp_event.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"

/**
 * @brief Initialize WiFi manager
 */
esp_err_t wifi_manager_init(EventGroupHandle_t event_group);

/**
 * @brief Start WiFi in AP mode for configuration
 */
esp_err_t wifi_start_ap_mode(void);

/**
 * @brief Start WiFi in Station mode
 * @return true if connected successfully
 */
bool wifi_start_station_mode(const char *ssid, const char *pass);

/**
 * @brief Stop current WiFi mode
 */
esp_err_t wifi_stop(void);

/**
 * @brief Get WiFi connection status
 */
bool wifi_is_connected(void);

#endif // WIFI_MANAGER_H