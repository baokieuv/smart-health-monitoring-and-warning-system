#pragma once

#include <stdbool.h>
#include <stdint.h>
#include "esp_err.h"
#include "driver/i2c.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    float ax;
    float ay;
    float az;
} mpu6050_accel_t;

typedef struct {
    float gx;
    float gy;
    float gz;
} mpu6050_gyro_t;

typedef struct {
    float celsius;
} mpu6050_temp_t;

typedef struct {
    float roll;   // độ
    float pitch;  // độ
} mpu6050_angle_t;

typedef struct {
    mpu6050_accel_t accel;
    mpu6050_gyro_t  gyro;
    mpu6050_temp_t  temp;
    mpu6050_angle_t angle;
} mpu6050_data_t;

/**
 * @brief Khởi tạo I2C + MPU6050
 *
 * @param port      I2C port
 * @param sda       GPIO SDA
 * @param scl       GPIO SCL
 * @param clk_hz    Tốc độ I2C
 */
esp_err_t mpu6050_init(i2c_port_t port,
                       gpio_num_t sda,
                       gpio_num_t scl,
                       uint32_t   clk_hz);

/**
 * @brief Đọc đầy đủ accel + gyro + temp + góc roll/pitch
 */
esp_err_t mpu6050_read_all(mpu6050_data_t *out);

/**
 * @brief Giải phóng driver I2C
 */
void mpu6050_deinit(void);

/**
 * @brief Đã init thành công chưa
 */
bool mpu6050_is_ready(void);

#ifdef __cplusplus
}
#endif
