#ifndef SYSTEM_CONFIG_H
#define SYSTEM_CONFIG_H

#include "sdkconfig.h"
#include "driver/gpio.h"

// WiFi Configuration
#define MAXIMUM_RETRY           5
#define WIFI_CONNECT_TIMEOUT_MS 15000

// MQTT Configuration
#define MQTT_BROKER             "mqtt://demo.thingsboard.io:1883"
#define TELEMETRY_TOPIC         "v1/devices/me/telemetry"
#define ATTRIBUTES_TOPIC        "v1/devices/me/attributes"
#define ATTR_REQUEST_TOPIC      "v1/devices/me/attributes/request/1"
#define ATTR_RESPONSE_TOPIC     "v1/devices/me/attributes/response/+"
#define MQTT_RECONNECT_DELAY_MS 5000

// NVS Storage Keys
#define NVS_NAMESPACE           "wifi_config"
#define NVS_KEY_SSID            "ssid"
#define NVS_KEY_PASS            "password"
#define NVS_KEY_PATIENT         "patient"
#define NVS_KEY_DOCTOR          "doctor"
#define NVS_KEY_TOKEN           "token"
#define NVS_KEY_NEED_PROVISION  "need_prov"

// Buffer Sizes
#define SSID_MAX_LEN            32
#define PASSWORD_MAX_LEN        64
#define CCCD_MAX_LEN            16
#define TOKEN_MAX_LEN           128

// GPIO Pins
#define DS18B20_PIN             GPIO_NUM_18
#define BTN1_PIN                GPIO_NUM_4
#define BTN2_PIN                GPIO_NUM_5
#define LED_PIN                 GPIO_NUM_2
#define BUZZER_PIN              GPIO_NUM_15

// I2C Configuration (OLED, MAX30102, MPU6050)
#define I2C_PORT                I2C_NUM_1
#define I2C_SDA_PIN             GPIO_NUM_21
#define I2C_SCL_PIN             GPIO_NUM_22
#define I2C_FREQ_HZ             100000
#define MAX30102_BUFFER_SIZE    128

// Provisioning Configuration
#define PROVISION_URL           "http://demo.thingsboard.io/api/v1/provision"
#define PROVISION_KEY           "tcwdf3lza9hg2qf04yuv"
#define PROVISION_SECRET        "c841x8r2a94fatb42jbp"

// AP Mode Configuration
#define AP_SSID                 "ESP32_Health_Config"
#define AP_MAX_CONN             3

// Task Delays (in milliseconds)
#define TEMP_READ_DELAY_MS      2000
#define HEART_READ_DELAY_MS     2000
#define MQTT_SEND_DELAY_MS      5000
#define OLED_UPDATE_DELAY_MS    500
#define OTA_CHECK_INTERVAL_MS   (60000 * 5)  // 5 minutes

// MPU6050 Fall Detection Configuration
#define MPU6050_ADDR            0x68
#define MPU_PERIOD_MS           200           // Sampling period
#define QUEUE_LEN               16            // Queue size for sensor data

// Fall detection thresholds (adjust based on testing)
#define FF_G_THRESH             0.35f         // Free-fall threshold (g)
#define FF_MIN_TIME_MS          120           // Minimum free-fall duration (ms)
#define FF_MAX_TIME_MS          1000          // Maximum free-fall before impact (ms)
#define IMPACT_G_THRESH         1.0f          // Impact threshold (g)
#define IMPACT_TIMEOUT_MS       300           // Time window to detect impact after FF
#define POST_INACT_DPS          10.0f         // Gyro inactivity threshold (dps)
#define POST_ANGLE_DEG          45.0f         // Posture angle threshold (degrees)
#define POST_WINDOW_MS          1500          // Post-impact monitoring window (ms)
#define REPORT_COOLDOWN_MS      3000          // Prevent duplicate reports

// Health Monitoring Thresholds
#define HR_MIN_NORMAL           60
#define HR_MAX_NORMAL           100
#define SPO2_MIN_NORMAL         90
#define TEMP_MIN_NORMAL         36.0f
#define TEMP_MAX_NORMAL         38.0f

// Event Group Bits
#define WIFI_CONNECTED_BIT      BIT0
#define WIFI_FAIL_BIT           BIT1
#define MQTT_CONNECTED_BIT      BIT2
#define DEVICE_ACTIVE_BIT       BIT3
#define ALARM_ACTIVE_BIT        BIT4

// Button Event Bases
#define BUTTON1_EVENT_BASE      "BUTTON1_EVENT"
#define BUTTON2_EVENT_BASE      "BUTTON2_EVENT"

// System operating modes
typedef enum {
    SYS_MODE_STATION,    // Normal WiFi station mode
    SYS_MODE_AP_SIMPLE,  // AP mode with simple WiFi config
    SYS_MODE_AP_FULL     // AP mode with full configuration
} system_mode_t;

// Alarm types
typedef enum {
    ALARM_NONE = 0,
    ALARM_HEART_RATE_HIGH,
    ALARM_HEART_RATE_LOW,
    ALARM_SPO2_LOW,
    ALARM_TEMP_HIGH,
    ALARM_FALL_DETECTION,
    ALARM_SOS
} alarm_type_t;

// Button events
typedef enum {
    BTN_SINGLE_CLICK = 0,
    BTN_DOUBLE_CLICK,
    BTN_LONG_PRESS
} button_event_id_t;

// Fall detection states
typedef enum {
    ST_IDLE,           // Normal state
    ST_FREE_FALL,      // Free-fall detected
    ST_IMPACT_WAIT,    // Waiting for impact
    ST_POST_MONITOR    // Monitoring post-impact posture
} fall_state_t;

#endif // CONFIG_H