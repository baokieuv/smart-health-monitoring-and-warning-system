#ifndef CONFIG_H
#define CONFIG_H

#include "driver/gpio.h"

// WiFi Configuration
#define MAXIMUM_RETRY 5
#define WIFI_CONNECT_TIMEOUT_MS 15000

// MQTT Configuration
#define MQTT_BROKER "mqtt://demo.thingsboard.io:1883"
#define TELEMETRY_TOPIC "v1/devices/me/telemetry"
#define MQTT_RECONNECT_DELAY_MS 5000

// NVS Configuration
#define NVS_NAMESPACE "wifi_config"
#define NVS_KEY_SSID "ssid"
#define NVS_KEY_PASS "password"
#define NVS_KEY_CCCD "cccd"
#define NVS_KEY_TOKEN "token"

// Buffer Sizes
#define SSID_MAX_LEN 32
#define PASSWORD_MAX_LEN 64
#define CCCD_MAX_LEN 16
#define TOKEN_MAX_LEN 128

// GPIO Pins
#define DS18B20_PIN GPIO_NUM_18
#define BTN_PIN GPIO_NUM_4
#define LED_PIN GPIO_NUM_2

// I2C Configuration for MAX30102
#define MAX30102_I2C_PORT I2C_NUM_0
#define MAX30102_SCL_PIN GPIO_NUM_42
#define MAX30102_SDA_PIN GPIO_NUM_21
#define MAX30102_BUFFER_SIZE 128

// Provisioning
#define PROVISION_URL "http://demo.thingsboard.io:1883/api/device/provisioning"
#define DEVICE_NAME "ESP32_Device"

// AP Mode Configuration
#define AP_SSID "ESP32_Config"
#define AP_MAX_CONN 3

// Task Delays (in milliseconds)
#define TEMP_READ_DELAY_MS 2000
#define HEART_READ_DELAY_MS 2000
#define MQTT_SEND_DELAY_MS 5000

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> oled_buton
// MPU6050 Configuration
#define I2C_PORT I2C_NUM_0
#define I2C_SDA GPIO_NUM_41
#define I2C_SCL GPIO_NUM_42
#define I2C_FREQ 100000
#define MPU_ADDR 0x68
#define MPU_PERIOD_MS 200 // chu kỳ đọc cảm biến
#define QUEUE_LEN 16      // số phần tử tối đa trong hàng đợi

// ==== Tham số phát hiện (tinh chỉnh theo thực nghiệm) ====
#define FF_G_THRESH 0.35f       // ngưỡng free-fall (g)
#define FF_MIN_TIME_MS 120      // free-fall tối thiểu (ms)
#define FF_MAX_TIME_MS 1000     // free-fall tối đa trước impact (ms)
#define IMPACT_G_THRESH 1.0f    // ngưỡng va đập (g)
#define IMPACT_TIMEOUT_MS 300   // phải có impact sau FF trong khoảng này
#define POST_INACT_DPS 10.0f    // gyro rất nhỏ (dps)
#define POST_ANGLE_DEG 45.0f    // tư thế sau ngã (deg)
#define POST_WINDOW_MS 1500     // thời gian quan sát sau impact (ms)
#define REPORT_COOLDOWN_MS 3000 // tránh báo lặp
<<<<<<< HEAD
=======
//MPU6050 Configuration
#define I2C_PORT       I2C_NUM_0
#define I2C_SDA        GPIO_NUM_21
#define I2C_SCL        GPIO_NUM_22
#define I2C_FREQ       100000
#define MPU_ADDR       0x68
#define MPU_PERIOD_MS  200               // chu kỳ đọc cảm biến
#define QUEUE_LEN      16                // số phần tử tối đa trong hàng đợi

// ==== Tham số phát hiện (tinh chỉnh theo thực nghiệm) ====
#define FF_G_THRESH          0.35f               // ngưỡng free-fall (g)
#define FF_MIN_TIME_MS       120                 // free-fall tối thiểu (ms)
#define FF_MAX_TIME_MS       1000                // free-fall tối đa trước impact (ms)
#define IMPACT_G_THRESH      1.0f                // ngưỡng va đập (g)
#define IMPACT_TIMEOUT_MS    300                 // phải có impact sau FF trong khoảng này
#define POST_INACT_DPS       10.0f               // gyro rất nhỏ (dps)
#define POST_ANGLE_DEG       45.0f               // tư thế sau ngã (deg)
#define POST_WINDOW_MS       1500                // thời gian quan sát sau impact (ms)
#define REPORT_COOLDOWN_MS   3000                // tránh báo lặp
>>>>>>> 9e22eb5a47498d0d1aed1b8b0f3740aa59249700
=======
>>>>>>> oled_buton

// Event Group Bits
#define WIFI_CONNECTED_BIT BIT0
#define WIFI_FAIL_BIT BIT1
#define MQTT_CONNECTED_BIT BIT2

#endif // CONFIG_H