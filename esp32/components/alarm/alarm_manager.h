#ifndef ALARM_MANAGER_H
#define ALARM_MANAGER_H

#include "config.h"
#include "esp_err.h"
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"

esp_err_t alarm_manager_init();

void alarm_check_health_data(int heart_rate, double spo2, float temperature);

void alarm_trigger_sos(void);

void alarm_stop_buzzer(void);

bool alarm_is_active(void);

alarm_type_t alarm_get_current_type(void);

void alarm_get_string(char *alarm_str);
#endif