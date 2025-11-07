#pragma once
#include "esp_err.h"
#include "driver/i2c.h"
#include "driver/gpio.h"
#include <stdbool.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    float ax, ay, az;   // gia tốc (g)
} mpu6050_accel_t;

typedef struct {
    float gx, gy, gz;   // vận tốc góc (deg/s)
} mpu6050_gyro_t;

typedef struct {
    float celsius;      // nhiệt độ (°C)
} mpu6050_temp_t;

typedef struct {
    float roll;         // (deg)
    float pitch;        // (deg)
} mpu6050_angle_t;

typedef struct {
    mpu6050_accel_t accel;
    mpu6050_gyro_t  gyro;
    mpu6050_temp_t  temp;
    mpu6050_angle_t angle; // tính bằng bộ lọc bù (complimentary)
} mpu6050_data_t;

typedef enum {
    MPU6050_ACCE_2G  = 0,
    MPU6050_ACCE_4G  = 1,
    MPU6050_ACCE_8G  = 2,
    MPU6050_ACCE_16G = 3,
} mpu6050_acce_fs_cfg_t;

typedef enum {
    MPU6050_GYRO_250DPS  = 0,
    MPU6050_GYRO_500DPS  = 1,
    MPU6050_GYRO_1000DPS = 2,
    MPU6050_GYRO_2000DPS = 3,
} mpu6050_gyro_fs_cfg_t;

/**
 * @brief Khởi tạo I2C + cảm biến MPU6050
 *
 * @param port      I2C port (ví dụ I2C_NUM_0)
 * @param sda       GPIO SDA
 * @param scl       GPIO SCL
 * @param clk_hz    Tần số I2C (ví dụ 400000)
 * @param i2c_addr  Địa chỉ I2C (0x68 hoặc 0x69)
 * @param acce_fs   Dải đo accel (2G/4G/8G/16G)
 * @param gyro_fs   Dải đo gyro (250/500/1000/2000 dps)
 */
esp_err_t mpu6050_init(i2c_port_t port,
                       gpio_num_t sda,
                       gpio_num_t scl,
                       uint32_t   clk_hz,
                       uint16_t   i2c_addr,
                       mpu6050_acce_fs_cfg_t acce_fs,
                       mpu6050_gyro_fs_cfg_t gyro_fs);

/**
 * @brief Đọc đủ Accel/Gyro/Temp + góc (complimentary filter)
 */
esp_err_t mpu6050_read_all(mpu6050_data_t *out);

/**
 * @brief Giải phóng/huỷ driver
 */
void mpu6050_deinit(void);

/**
 * @brief Tình trạng sẵn sàng
 */
bool mpu6050_is_ready(void);

#ifdef __cplusplus
}
#endif
