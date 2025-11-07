#include "mpu6050_api.h"

#include "esp_log.h"
#include "esp_check.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "driver/i2c.h"

// ---- include vendor header (espressif__mpu6050) ----
#include <mpu6050.h>   // đến từ managed_components/espressif__mpu6050/include/

static const char *TAG = "APP_MPU6050";

static i2c_port_t        s_port     = I2C_NUM_MAX;
static mpu6050_handle_t  s_handle   = NULL;
static bool              s_ready    = false;
static uint16_t          s_addr     = MPU6050_I2C_ADDRESS;

static esp_err_t i2c_bus_init(i2c_port_t port, gpio_num_t sda, gpio_num_t scl, uint32_t clk_hz)
{
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = sda,
        .scl_io_num = scl,
        .sda_pullup_en = GPIO_PULLUP_DISABLE, 
        .scl_pullup_en = GPIO_PULLUP_DISABLE,
        .master.clk_speed = clk_hz,
        .clk_flags = 0,
    };
    ESP_RETURN_ON_ERROR(i2c_param_config(port, &conf), TAG, "i2c_param_config failed");
    ESP_RETURN_ON_ERROR(i2c_driver_install(port, conf.mode, 0, 0, 0), TAG, "i2c_driver_install failed");
    return ESP_OK;
}

esp_err_t mpu6050_init(i2c_port_t port,
                       gpio_num_t sda,
                       gpio_num_t scl,
                       uint32_t   clk_hz,
                       uint16_t   i2c_addr,
                       mpu6050_acce_fs_cfg_t acce_fs,
                       mpu6050_gyro_fs_cfg_t gyro_fs)
{
    if (s_ready) {
        ESP_LOGW(TAG, "Already initialized");
        return ESP_OK;
    }

    s_port = port;
    s_addr = (i2c_addr == MPU6050_I2C_ADDRESS_1) ? MPU6050_I2C_ADDRESS_1 : MPU6050_I2C_ADDRESS;

    // 1) I2C
    ESP_RETURN_ON_ERROR(i2c_bus_init(s_port, sda, scl, clk_hz), TAG, "I2C init failed");

    // 2) Create handle
    s_handle = mpu6050_create(s_port, s_addr);
    ESP_RETURN_ON_FALSE(s_handle != NULL, ESP_FAIL, TAG, "mpu6050_create failed");

    // 3) Kiểm tra WHO_AM_I
    uint8_t who = 0;
    ESP_RETURN_ON_ERROR(mpu6050_get_deviceid(s_handle, &who), TAG, "get_deviceid failed");
    if (who != MPU6050_WHO_AM_I_VAL) {
        ESP_LOGE(TAG, "WHO_AM_I mismatch: 0x%02X (expect 0x%02X)", who, MPU6050_WHO_AM_I_VAL);
        mpu6050_delete(s_handle);
        s_handle = NULL;
        i2c_driver_delete(s_port);
        return ESP_FAIL;
    }

    // 4) Wake + cấu hình dải đo
    ESP_RETURN_ON_ERROR(mpu6050_wake_up(s_handle), TAG, "wake_up failed");
    ESP_RETURN_ON_ERROR(
        mpu6050_config(s_handle,
                       (mpu6050_acce_fs_t)acce_fs,
                       (mpu6050_gyro_fs_t)gyro_fs),
        TAG, "mpu6050_config failed");

    s_ready = true;
    ESP_LOGI(TAG, "MPU6050 ready at 0x%02X", s_addr);
    return ESP_OK;
}

esp_err_t mpu6050_read_all(mpu6050_data_t *out)
{
    if (!s_ready || !out) return ESP_ERR_INVALID_STATE;

    mpu6050_acce_value_t v_acc;
    mpu6050_gyro_value_t v_gyro;
    mpu6050_temp_value_t v_tmp;
    complimentary_angle_t v_ang;

    esp_err_t err;

    err = mpu6050_get_acce(s_handle, &v_acc);
    if (err != ESP_OK) return err;

    err = mpu6050_get_gyro(s_handle, &v_gyro);
    if (err != ESP_OK) return err;

    err = mpu6050_get_temp(s_handle, &v_tmp);
    if (err != ESP_OK) return err;

    // Tính góc roll/pitch bằng complimentary filter của vendor
    err = mpu6050_complimentory_filter(s_handle, &v_acc, &v_gyro, &v_ang);
    if (err != ESP_OK) return err;

    // map sang struct public
    out->accel.ax = v_acc.acce_x;
    out->accel.ay = v_acc.acce_y;
    out->accel.az = v_acc.acce_z;

    out->gyro.gx = v_gyro.gyro_x;
    out->gyro.gy = v_gyro.gyro_y;
    out->gyro.gz = v_gyro.gyro_z;

    out->temp.celsius = v_tmp.temp;

    out->angle.roll  = v_ang.roll;
    out->angle.pitch = v_ang.pitch;

    return ESP_OK;
}

void mpu6050_deinit(void)
{
    if (!s_ready) return;

    if (s_handle) {
        (void) mpu6050_sleep(s_handle);
        mpu6050_delete(s_handle);
        s_handle = NULL;
    }
    (void) i2c_driver_delete(s_port);
    s_port  = I2C_NUM_MAX;
    s_ready = false;
}

bool mpu6050_is_ready(void)
{
    return s_ready;
}
