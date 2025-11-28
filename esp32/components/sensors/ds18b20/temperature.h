#ifndef TEMPERATURE_H
#define TEMPERATURE_H

#include "esp_err.h"
#include "freertos/FreeRTOS.h"

/**
 * @brief Initialize temperature sensor
 */
esp_err_t temperature_sensor_init(void);

/**
 * @brief Read temperature value
 * @param temperature Pointer to store temperature value
 */
esp_err_t temperature_read(float *temperature);

/**
 * @brief Start temperature reading task
 * @param callback Function to call with temperature value
 */
esp_err_t temperature_start_task(void (*callback)(float temp));

/**
 * @brief Get latest temperature reading
 */
float temperature_get_latest(void);

#endif // TEMPERATURE_H