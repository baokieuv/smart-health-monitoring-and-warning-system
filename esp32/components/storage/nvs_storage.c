#include "nvs_stoarge.h"
#include "nvs_flash.h"
#include "esp_log.h"
#include <string.h>

static const char *TAG = "NVS_STORAGE";

/**
 * @brief Save WiFi configuration to NVS
 * @param ssid WiFi SSID
 * @param pass WiFi password
 * @return ESP_OK on success
 */
esp_err_t nvs_save_wifi_config(const char *ssid, const char *pass) {
    if (!ssid || !pass) {
        ESP_LOGE(TAG, "Invalid parameters");
        return ESP_ERR_INVALID_ARG;
    }

    // Open NVS namespace
    nvs_handle_t nvs;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READWRITE, &nvs);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to open NVS: %s", esp_err_to_name(err));
        return err;
    }

    // Save SSID and password
    err = nvs_set_str(nvs, NVS_KEY_SSID, ssid);
    if (err == ESP_OK) {
        err = nvs_set_str(nvs, NVS_KEY_PASS, pass);
    }
    
    // Commit changes
    if (err == ESP_OK) {
        err = nvs_commit(nvs);
    }

    nvs_close(nvs);

    if (err == ESP_OK) {
        ESP_LOGI(TAG, "WiFi config saved successfully");
    } else {
        ESP_LOGE(TAG, "Failed to save WiFi config: %s", esp_err_to_name(err));
    }

    return err;
}

/**
 * @brief Save full configuration to NVS (WiFi + Patient + Doctor)
 * @param ssid WiFi SSID
 * @param pass WiFi password
 * @param patient Patient ID
 * @param doctor Doctor ID
 * @return ESP_OK on success
 */
esp_err_t nvs_save_full_config(const char *ssid, const char *pass, 
                               const char *patient, const char *doctor) {
    if (!ssid || !pass || !patient || !doctor) {
        ESP_LOGE(TAG, "Invalid parameters");
        return ESP_ERR_INVALID_ARG;
    }

    // Open NVS namespace
    nvs_handle_t nvs;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READWRITE, &nvs);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to open NVS: %s", esp_err_to_name(err));
        return err;
    }

    // Save all configuration parameters
    err = nvs_set_str(nvs, NVS_KEY_SSID, ssid);
    if (err == ESP_OK) {
        err = nvs_set_str(nvs, NVS_KEY_PASS, pass);
    }
    if (err == ESP_OK) {
        err = nvs_set_str(nvs, NVS_KEY_PATIENT, patient);
    }
    if (err == ESP_OK) {
        err = nvs_set_str(nvs, NVS_KEY_DOCTOR, doctor);
    }
    
    // Set flag to trigger provisioning after restart
    if (err == ESP_OK) {
        err = nvs_set_u8(nvs, NVS_KEY_NEED_PROVISION, 1);
    }
    
    // Commit changes
    if (err == ESP_OK) {
        err = nvs_commit(nvs);
    }

    nvs_close(nvs);

    if (err == ESP_OK) {
        ESP_LOGI(TAG, "Full config saved successfully");
    } else {
        ESP_LOGE(TAG, "Failed to save full config: %s", esp_err_to_name(err));
    }

    return err;
}

/**
 * @brief Save access token to NVS
 * @param token ThingsBoard access token
 * @return ESP_OK on success
 */
esp_err_t nvs_save_access_token(const char *token) {
    if (!token) {
        ESP_LOGE(TAG, "Invalid token");
        return ESP_ERR_INVALID_ARG;
    }

    // Open NVS namespace
    nvs_handle_t nvs;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READWRITE, &nvs);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to open NVS: %s", esp_err_to_name(err));
        return err;
    }

    // Save token and clear provisioning flag
    err = nvs_set_str(nvs, NVS_KEY_TOKEN, token);
    if (err == ESP_OK) {
        // Clear provisioning needed flag since we now have a token
        nvs_set_u8(nvs, NVS_KEY_NEED_PROVISION, 0);
        err = nvs_commit(nvs);
    }

    nvs_close(nvs);

    if (err == ESP_OK) {
        ESP_LOGI(TAG, "Access token saved successfully");
    } else {
        ESP_LOGE(TAG, "Failed to save token: %s", esp_err_to_name(err));
    }

    return err;
}

/**
 * @brief Load WiFi configuration from NVS
 * @param ssid Output buffer for SSID (SSID_MAX_LEN bytes)
 * @param pass Output buffer for password (PASSWORD_MAX_LEN bytes)
 * @return true if loaded successfully, false otherwise
 */
bool nvs_load_wifi_config(char *ssid, char *pass) {
    if (!ssid || !pass) {
        ESP_LOGE(TAG, "Invalid parameters");
        return false;
    }

    // Open NVS namespace (read-only)
    nvs_handle_t nvs;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READONLY, &nvs);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "NVS not found or cannot open");
        return false;
    }

    // Get string sizes
    size_t ssid_len = SSID_MAX_LEN;
    size_t pass_len = PASSWORD_MAX_LEN;

    // Load SSID and password
    bool success = true;
    if (nvs_get_str(nvs, NVS_KEY_SSID, ssid, &ssid_len) != ESP_OK) {
        success = false;
    }
    if (success && nvs_get_str(nvs, NVS_KEY_PASS, pass, &pass_len) != ESP_OK) {
        success = false;
    }

    nvs_close(nvs);

    if (success) {
        ESP_LOGI(TAG, "WiFi config loaded: SSID=%s", ssid);
    } else {
        ESP_LOGW(TAG, "Failed to load WiFi configuration");
    }

    return success;
}

/**
 * @brief Load access token from NVS
 * @param token Output buffer for token (TOKEN_MAX_LEN bytes)
 * @return true if loaded successfully, false otherwise
 */
bool nvs_load_access_token(char *token) {
    if (!token) {
        ESP_LOGE(TAG, "Invalid parameters");
        return false;
    }

    // Open NVS namespace (read-only)
    nvs_handle_t nvs;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READONLY, &nvs);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "NVS not found or cannot open");
        return false;
    }

    // Load token
    size_t token_len = TOKEN_MAX_LEN;
    bool success = (nvs_get_str(nvs, NVS_KEY_TOKEN, token, &token_len) == ESP_OK);

    nvs_close(nvs);

    if (success) {
        ESP_LOGI(TAG, "Access token loaded successfully");
    } else {
        ESP_LOGW(TAG, "Failed to load access token");
    }

    return success;
}

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
                          char *doctor, char *token) {
    if (!ssid || !pass || !patient || !doctor || !token) {
        ESP_LOGE(TAG, "Invalid parameters");
        return false;
    }

    // Open NVS namespace (read-only)
    nvs_handle_t nvs;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READONLY, &nvs);
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "NVS not found or cannot open");
        return false;
    }

    // Get string sizes
    size_t ssid_len = SSID_MAX_LEN;
    size_t pass_len = PASSWORD_MAX_LEN;
    size_t patient_len = CCCD_MAX_LEN;
    size_t doctor_len = CCCD_MAX_LEN;
    size_t token_len = TOKEN_MAX_LEN;

    // Load all configuration parameters
    bool success = true;
    
    if (nvs_get_str(nvs, NVS_KEY_SSID, ssid, &ssid_len) != ESP_OK) {
        success = false;
    }
    if (success && nvs_get_str(nvs, NVS_KEY_PASS, pass, &pass_len) != ESP_OK) {
        success = false;
    }
    if (success && nvs_get_str(nvs, NVS_KEY_PATIENT, patient, &patient_len) != ESP_OK) {
        success = false;
    }
    if (success && nvs_get_str(nvs, NVS_KEY_DOCTOR, doctor, &doctor_len) != ESP_OK) {
        success = false;
    }
    if (success && nvs_get_str(nvs, NVS_KEY_TOKEN, token, &token_len) != ESP_OK) {
        success = false;
    }

    nvs_close(nvs);

    if (success) {
        ESP_LOGI(TAG, "Full config loaded: Patient=%s, Doctor=%s", patient, doctor);
    } else {
        ESP_LOGW(TAG, "Failed to load complete configuration");
    }

    return success;
}

/**
 * @brief Check if device provisioning is needed
 * @return true if provisioning needed, false otherwise
 */
bool nvs_check_need_provisioning(void) {
    // Open NVS namespace (read-only)
    nvs_handle_t nvs;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READONLY, &nvs);
    if (err != ESP_OK) {
        return false;
    }

    // Check provisioning flag
    uint8_t need_prov = 0;
    err = nvs_get_u8(nvs, NVS_KEY_NEED_PROVISION, &need_prov);
    nvs_close(nvs);

    if (err == ESP_OK && need_prov == 1) {
        ESP_LOGI(TAG, "Provisioning is needed");
        return true;
    }

    return false;
}

/**
 * @brief Clear all configuration from NVS
 * @return ESP_OK on success
 */
esp_err_t nvs_clear_config(void) {
    // Open NVS namespace
    nvs_handle_t nvs;
    esp_err_t err = nvs_open(NVS_NAMESPACE, NVS_READWRITE, &nvs);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to open NVS: %s", esp_err_to_name(err));
        return err;
    }

    // Erase all keys in namespace
    err = nvs_erase_all(nvs);
    if (err == ESP_OK) {
        err = nvs_commit(nvs);
    }

    nvs_close(nvs);

    if (err == ESP_OK) {
        ESP_LOGI(TAG, "Configuration cleared");
    } else {
        ESP_LOGE(TAG, "Failed to clear configuration: %s", esp_err_to_name(err));
    }

    return err;
}