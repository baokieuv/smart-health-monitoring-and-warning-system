#ifndef HEART_RATE_H
#define HEART_RATE_H

#include "esp_err.h"
#include "sytem_config.h"

typedef struct {
    int heart_rate;
    double spo2;
} heart_rate_data_t;

/**
 * @brief Initialize heart rate sensor (MAX30102)
 */
esp_err_t heart_rate_sensor_init(void);

/**
 * @brief Read heart rate and SpO2
 * @param data Pointer to store heart rate data
 */
esp_err_t heart_rate_read(heart_rate_data_t *data);

/**
 * @brief Start heart rate reading task
 * @param callback Function to call with heart rate data
 */
esp_err_t heart_rate_start_task(void (*callback)(heart_rate_data_t data));

/**
 * @brief Get latest heart rate reading
 */
int heart_rate_get_latest(void);

/**
 * @brief Get latest SpO2 reading
 */
double spo2_get_latest(void);

#endif // HEART_RATE_H