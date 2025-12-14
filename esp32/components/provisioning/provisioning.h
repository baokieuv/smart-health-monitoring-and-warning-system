#ifndef PROVISIONING_H
#define PROVISIONING_H

#include "esp_err.h"
#include "sytem_config.h"

/**
 * @brief Send provisioning request to ThingsBoard server
 * @details Registers device with ThingsBoard and retrieves access token
 * @param device_key Provisioning device key
 * @param device_secret Provisioning device secret
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t provisioning_send_request(const char *device_key, const char *device_secret);

#endif // PROVISIONING_H