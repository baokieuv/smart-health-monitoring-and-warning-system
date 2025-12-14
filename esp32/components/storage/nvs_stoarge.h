#ifndef NVS_STORAGE_H
#define NVS_STORAGE_H

#include <stdbool.h>
#include "esp_err.h"
#include "sytem_config.h"

/**
 * @brief Save WiFi configuration to NVS
 * @param ssid WiFi SSID
 * @param pass WiFi password
 * @return ESP_OK on success
 */
esp_err_t nvs_save_wifi_config(const char *ssid, const char *pass);

/**
 * @brief Save full configuration to NVS (WiFi + Patient + Doctor)
 * @param ssid WiFi SSID
 * @param pass WiFi password
 * @param patient Patient ID
 * @param doctor Doctor ID
 * @return ESP_OK on success
 */
esp_err_t nvs_save_full_config(const char *ssid, const char *pass, 
                               const char *patient, const char *doctor);

/**
 * @brief Save access token to NVS
 * @param token ThingsBoard access token
 * @return ESP_OK on success
 */
esp_err_t nvs_save_access_token(const char *token);

/**
 * @brief Load WiFi configuration from NVS
 * @param ssid Output buffer for SSID (SSID_MAX_LEN bytes)
 * @param pass Output buffer for password (PASSWORD_MAX_LEN bytes)
 * @return true if loaded successfully, false otherwise
 */
bool nvs_load_wifi_config(char *ssid, char *pass);

/**
 * @brief Load access token from NVS
 * @param token Output buffer for token (TOKEN_MAX_LEN bytes)
 * @return true if loaded successfully, false otherwise
 */
bool nvs_load_access_token(char *token);

/**
 * @brief Load full configuration from NVS
 * @param ssid Output buffer for SSID
 * @param pass Output buffer for password
 * @param patient Output buffer for patient ID
 * @param doctor Output buffer for doctor ID
 * @param token Output buffer for access token
 * @return true if loaded successfully, false otherwise
 */
bool nvs_load_full_config(char *ssid, char *pass, char *patient, 
                          char *doctor, char *token);

/**
 * @brief Check if device provisioning is needed
 * @return true if provisioning needed, false otherwise
 */
bool nvs_check_need_provisioning(void);                          

/**
 * @brief Clear all configuration from NVS
 * @return ESP_OK on success
 */
esp_err_t nvs_clear_config(void);

#endif // NVS_STORAGE_H