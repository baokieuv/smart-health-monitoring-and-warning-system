#ifndef NVS_STORAGE_H
#define NVS_STORAGE_H

#include <stdbool.h>
#include "esp_err.h"

/**
 * @brief Save WiFi configuration to NVS
 */
esp_err_t nvs_save_wifi_config(const char *ssid, const char *pass, const char *cccd);

/**
 * @brief Save access token to NVS
 */
esp_err_t nvs_save_access_token(const char *token);

/**
 * @brief Load WiFi configuration from NVS
 * @return true if successful, false otherwise
 */
bool nvs_load_wifi_config(char *ssid, char *pass, char *cccd, char *token);

/**
 * @brief Clear all stored configuration
 */
esp_err_t nvs_clear_config(void);

#endif // NVS_STORAGE_H