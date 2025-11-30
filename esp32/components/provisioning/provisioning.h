#ifndef PROVISIONING_H
#define PROVISIONING_H

#include "esp_err.h"

/**
 * @brief Send provisioning request to ThingsBoard server
 * @param doctorid Doctor ID for provisioning
 * @return ESP_OK on success
 */
esp_err_t provisioning_send_request(const char *doctorid);

#endif // PROVISIONING_H