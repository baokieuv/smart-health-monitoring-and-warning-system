#ifndef ALARM_MANAGER_H
#define ALARM_MANAGER_H

#include "sytem_config.h"
#include "esp_err.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"

/**
 * @brief Initialize alarm manager and buzzer GPIO
 * @return ESP_OK on success
 */
esp_err_t alarm_manager_init();

/**
 * @brief Check health data and trigger alarms if thresholds exceeded
 * @param heart_rate Heart rate in BPM
 * @param spo2 Blood oxygen saturation (%)
 * @param temperature Body temperature (°C)
 */
void alarm_check_health_data(int heart_rate, double spo2, float temperature);

/**
 * @brief Trigger SOS alarm (manual emergency button)
 */
void alarm_trigger_sos(void);

/**
 * @brief Trigger fall detection alarm
 */
void alarm_fall_detection(void);

/**
 * @brief Stop buzzer and clear all alarms (user acknowledgement)
 */
void alarm_stop_buzzer(void);

/**
 * @brief Check if any alarm is currently active
 * @return true if alarm active, false otherwise
 */
bool alarm_is_active(void);

/**
 * @brief Get current alarm type
 * @return Current alarm type
 */
alarm_type_t alarm_get_current_type(void);

/**
 * @brief Build alarm status string for MQTT telemetry
 * @param alarm_str Output buffer for alarm string
 * @note Buffer should be at least 128 bytes
 */
void alarm_get_string(char *alarm_str);
#endif