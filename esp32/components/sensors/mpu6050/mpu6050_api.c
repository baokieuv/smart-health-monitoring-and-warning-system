#include "mpu6050_api.h"

#include <math.h>
#include "esp_log.h"
#include "driver/i2c.h"

static const char *TAG = "APP_MPU6050";

#define MPU6050_I2C_ADDR     0x68

// Thanh ghi (theo datasheet)
#define MPU6050_REG_SMPLRT_DIV   0x19
#define MPU6050_REG_CONFIG       0x1A
#define MPU6050_REG_GYRO_CONFIG  0x1B
#define MPU6050_REG_ACCEL_CONFIG 0x1C
#define MPU6050_REG_PWR_MGMT_1   0x6B
#define MPU6050_REG_WHO_AM_I     0x75

#define MPU6050_REG_ACCEL_XOUT_H 0x3B  

static i2c_port_t s_port  = I2C_NUM_MAX;
static bool       s_ready = false;

// ==== I2C low-level helpers ====
static esp_err_t i2c_bus_init(i2c_port_t port,
                              gpio_num_t sda,
                              gpio_num_t scl,
                              uint32_t   clk_hz)
{
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = sda,
        .scl_io_num = scl,
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master.clk_speed = clk_hz,
        .clk_flags = 0,
    };
    esp_err_t err = i2c_param_config(port, &conf);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "i2c_param_config failed: %s", esp_err_to_name(err));
        return err;
    }

    err = i2c_driver_install(port, conf.mode, 0, 0, 0);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "i2c_driver_install failed: %s", esp_err_to_name(err));
        return err;
    }
    return ESP_OK;
}

static esp_err_t mpu_write_reg(uint8_t reg, uint8_t val)
{
    uint8_t buf[2] = { reg, val };
    return i2c_master_write_to_device(
        s_port,
        MPU6050_I2C_ADDR,
        buf, sizeof(buf),
        pdMS_TO_TICKS(100)
    );
}

static esp_err_t mpu_read_reg(uint8_t reg, uint8_t *val)
{
    return i2c_master_write_read_device(
        s_port,
        MPU6050_I2C_ADDR,
        &reg, 1,
        val, 1,
        pdMS_TO_TICKS(100)
    );
}

static esp_err_t mpu_read_multi(uint8_t reg, uint8_t *buf, size_t len)
{
    return i2c_master_write_read_device(
        s_port,
        MPU6050_I2C_ADDR,
        &reg, 1,
        buf, len,
        pdMS_TO_TICKS(100)
    );
}

static int16_t to_int16(uint8_t hi, uint8_t lo)
{
    return (int16_t)((hi << 8) | lo);
}

// ==== Public API ====
esp_err_t mpu6050_init(i2c_port_t port,
                       gpio_num_t sda,
                       gpio_num_t scl,
                       uint32_t   clk_hz)
{
    if (s_ready) {
        ESP_LOGW(TAG, "Already initialized");
        return ESP_OK;
    }

    s_port = port;

    ESP_LOGI(TAG, "Init I2C: port=%d SDA=%d SCL=%d freq=%lu addr=0x%02X",
             (int)port, (int)sda, (int)scl, (unsigned long)clk_hz, (unsigned)MPU6050_I2C_ADDR);

    esp_err_t err = i2c_bus_init(s_port, sda, scl, clk_hz);
    if (err != ESP_OK) {
        s_port = I2C_NUM_MAX;
        return err;
    }

    // Wake up: PWR_MGMT_1 = 0x00 (clear sleep bit, chọn internal clock)
    err = mpu_write_reg(MPU6050_REG_PWR_MGMT_1, 0x00);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Write PWR_MGMT_1 failed: %s", esp_err_to_name(err));
        return err;
    }

    // Set sample rate = 1kHz / (1 + SMPLRT_DIV)
    // Ví dụ chọn 100 Hz => div = 9
    err = mpu_write_reg(MPU6050_REG_SMPLRT_DIV, 9);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Write SMPLRT_DIV failed: %s", esp_err_to_name(err));
        return err;
    }

    // CONFIG: DLPF = 3 (0x03) – low-pass ~44Hz cho gyro
    err = mpu_write_reg(MPU6050_REG_CONFIG, 0x03);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Write CONFIG failed: %s", esp_err_to_name(err));
        return err;
    }

    // GYRO_CONFIG: chọn ±500 °/s → FS_SEL = 1 => (1 << 3) = 0x08
    err = mpu_write_reg(MPU6050_REG_GYRO_CONFIG, 0x08);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Write GYRO_CONFIG failed: %s", esp_err_to_name(err));
        return err;
    }

    // ACCEL_CONFIG: chọn ±2g → FS_SEL = 0 => 0x00
    // nếu muốn ±4g => 0x08, ±8g => 0x10, ±16g => 0x18
    err = mpu_write_reg(MPU6050_REG_ACCEL_CONFIG, 0x00);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Write ACCEL_CONFIG failed: %s", esp_err_to_name(err));
        return err;
    }

    // Đọc WHO_AM_I để confirm (không bắt buộc, chỉ log)
    uint8_t who = 0;
    err = mpu_read_reg(MPU6050_REG_WHO_AM_I, &who);
    if (err == ESP_OK) {
        ESP_LOGI(TAG, "WHO_AM_I = 0x%02X (expect 0x68)", who);
    } else {
        ESP_LOGW(TAG, "Read WHO_AM_I failed: %s", esp_err_to_name(err));
    }

    s_ready = true;
    ESP_LOGI(TAG, "MPU6050 init done");
    return ESP_OK;
}

static void compute_angles(const mpu6050_accel_t *acc, mpu6050_angle_t *ang)
{
    // Góc từ gia tốc (đơn giản): roll ~ atan2(ay, az), pitch ~ atan2(ax, az)
    const float rad2deg = 180.0f / (float)M_PI;

    ang->roll  = atan2f(acc->ay, acc->az) * rad2deg;
    ang->pitch = atan2f(acc->ax, acc->az) * rad2deg;
}

esp_err_t mpu6050_read_all(mpu6050_data_t *out)
{
    if (!s_ready || !out) {
        return ESP_ERR_INVALID_STATE;
    }

    uint8_t buf[14];
    esp_err_t err = mpu_read_multi(MPU6050_REG_ACCEL_XOUT_H, buf, sizeof(buf));
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "mpu_read_multi failed: %s", esp_err_to_name(err));
        return err;
    }

    int16_t raw_ax   = to_int16(buf[0],  buf[1]);
    int16_t raw_ay   = to_int16(buf[2],  buf[3]);
    int16_t raw_az   = to_int16(buf[4],  buf[5]);
    int16_t raw_temp = to_int16(buf[6],  buf[7]);
    int16_t raw_gx   = to_int16(buf[8],  buf[9]);
    int16_t raw_gy   = to_int16(buf[10], buf[11]);
    int16_t raw_gz   = to_int16(buf[12], buf[13]);

    // Scale:
    // ACCEL ±2g => 16384 LSB/g
    const float accel_scale = 1.0f / 16384.0f;
    // GYRO ±500 °/s => 65.5 LSB/(°/s)
    const float gyro_scale  = 1.0f / 65.5f;

    out->accel.ax = raw_ax * accel_scale;
    out->accel.ay = raw_ay * accel_scale;
    out->accel.az = raw_az * accel_scale;

    out->gyro.gx  = raw_gx * gyro_scale;
    out->gyro.gy  = raw_gy * gyro_scale;
    out->gyro.gz  = raw_gz * gyro_scale;

    // Temp: datasheet → Temp(°C) = raw / 340 + 36.53
    out->temp.celsius = (raw_temp / 340.0f) + 36.53f;

    compute_angles(&out->accel, &out->angle);

    return ESP_OK;
}


void mpu6050_deinit(void)
{
    if (!s_ready) return;

    if (s_port != I2C_NUM_MAX) {
        i2c_driver_delete(s_port);
        s_port = I2C_NUM_MAX;
    }
    s_ready = false;
    ESP_LOGI(TAG, "MPU6050 deinit");
}

bool mpu6050_is_ready(void)
{
    return s_ready;
}
