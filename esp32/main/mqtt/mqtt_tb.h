#ifndef MQTT_TB_H
#define MQTT_TB_H

#include "esp_err.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"

/**
 * @brief Initialize and start MQTT client
 * @param token Access token for authentication
 * @param event_group Event group for connection status
 */
esp_err_t mqtt_client_init(const char *token, EventGroupHandle_t event_group);

/**
 * @brief Publish telemetry data
 * @param cccd Patient ID
 * @param heart_rate Heart rate value
 * @param spo2 SpO2 value
 * @param temperature Temperature value
 */
esp_err_t mqtt_publish_telemetry(const char *cccd, int heart_rate, 
                                  double spo2, float temperature);

/**
 * @brief Stop MQTT client
 */
esp_err_t mqtt_client_stop(void);

/**
 * @brief Check if MQTT is connected
 */
uint8_t mqtt_is_connected(void);

#endif // MQTT_CLIENT_H