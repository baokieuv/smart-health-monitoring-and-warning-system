#ifndef NVS_STORAGE_H
#define NVS_STORAGE_H

#include <stdbool.h>
#include "esp_err.h"

/**
 * @brief Save WiFi configuration to NVS
 */
esp_err_t nvs_save_wifi_config(const char *ssid, const char *pass);

esp_err_t nvs_save_full_config(const char *ssid, const char *pass, 
                               const char *patient, const char *doctor);

/**
 * @brief Save access token to NVS
 */
esp_err_t nvs_save_access_token(const char *token);

/**
 * @brief Load WiFi configuration from NVS
 * @return true if successful, false otherwise
 */
bool nvs_load_wifi_config(char *ssid, char *pass);

bool nvs_load_access_token(char *token);

bool nvs_load_full_config(char *ssid, char *pass, char *patient, 
                          char *doctor, char *token);

bool nvs_check_need_provisioning(void);                          
/**
 * @brief Clear all stored configuration
 */
esp_err_t nvs_clear_config(void);

#endif // NVS_STORAGE_H