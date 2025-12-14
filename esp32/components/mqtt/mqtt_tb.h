#ifndef MQTT_TB_H
#define MQTT_TB_H

#include "esp_err.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"

#define OTA_URL_SIZE 256
#define FIRMWARE_TITLE      "iot_project"
#define VERION              "1.0"

/**
 * @brief Initialize and start MQTT client
 * @param token Access token for authentication
 * @param event_group Event group for connection status
 */
esp_err_t mqtt_client_init(const char *token);

/**
 * @brief Publish telemetry data
 * @param cccd Patient ID
 * @param heart_rate Heart rate value
 * @param spo2 SpO2 value
 * @param temperature Temperature value
 */
esp_err_t mqtt_publish_telemetry(int heart_rate, double spo2, float temperature, const char *alarm_status); 

esp_err_t mqtt_publish_attributes(const char *patient_id, const char *doctor_id);

/**
 * @brief Stop MQTT client
 */
esp_err_t mqtt_client_stop(void);

/**
 * @brief Check if MQTT is connected
 */
uint8_t mqtt_is_connected(void);

void mqtt_start_ota_scheduler(void);

#endif // MQTT_CLIENT_H