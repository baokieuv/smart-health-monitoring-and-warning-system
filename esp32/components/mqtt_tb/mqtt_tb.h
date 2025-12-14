#ifndef MQTT_TB_H
#define MQTT_TB_H

#include "esp_err.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "sytem_config.h"

/**
 * @brief Initialize MQTT client with access token
 * @param token ThingsBoard access token
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t mqtt_client_init(const char *token);

/**
 * @brief Publish telemetry data to ThingsBoard
 * @param heart_rate Heart rate in BPM
 * @param spo2 Blood oxygen saturation (%)
 * @param temperature Body temperature (°C)
 * @param alarm_status Alarm status string
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t mqtt_publish_telemetry(int heart_rate, double spo2, float temperature, const char *alarm_status); 

/**
 * @brief Publish device attributes to ThingsBoard
 * @param patient_id Patient ID
 * @param doctor_id Doctor ID
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t mqtt_publish_attributes(const char *patient_id, const char *doctor_id);

/**
 * @brief Stop MQTT client
 * @return ESP_OK on success, error code otherwise
 */
esp_err_t mqtt_client_stop(void);

/**
 * @brief Check if MQTT is connected
 * @return true if connected, false otherwise
 */
uint8_t mqtt_is_connected(void);

/**
 * @brief Start OTA scheduler task
 */
void mqtt_start_ota_scheduler(void);

#endif // MQTT_CLIENT_H