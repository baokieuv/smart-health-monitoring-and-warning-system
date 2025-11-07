#ifndef CONFIG_H
#define CONFIG_H

#include "driver/gpio.h"

// WiFi Configuration
#define MAXIMUM_RETRY       5
#define WIFI_CONNECT_TIMEOUT_MS  15000

// MQTT Configuration
#define MQTT_BROKER                 "mqtt://demo.thingsboard.io:1883"
#define TELEMETRY_TOPIC             "v1/devices/me/telemetry"
#define MQTT_RECONNECT_DELAY_MS     5000

// NVS Configuration
#define NVS_NAMESPACE       "wifi_config"
#define NVS_KEY_SSID        "ssid"
#define NVS_KEY_PASS        "password"
#define NVS_KEY_CCCD        "cccd"
#define NVS_KEY_TOKEN       "token"

// Buffer Sizes
#define SSID_MAX_LEN        32
#define PASSWORD_MAX_LEN    64
#define CCCD_MAX_LEN        16
#define TOKEN_MAX_LEN       128 

// GPIO Pins
#define DS18B20_PIN         GPIO_NUM_18
#define BTN_PIN             GPIO_NUM_4
#define LED_PIN             GPIO_NUM_2

// I2C Configuration for MAX30102
#define MAX30102_I2C_PORT   I2C_NUM_0
#define MAX30102_SCL_PIN    GPIO_NUM_22
#define MAX30102_SDA_PIN    GPIO_NUM_21
#define MAX30102_BUFFER_SIZE  128

// Provisioning
#define PROVISION_URL       "http://demo.thingsboard.io:1883/api/device/provisioning"
#define DEVICE_NAME         "ESP32_Device"

// AP Mode Configuration
#define AP_SSID             "ESP32_Config"
#define AP_MAX_CONN         3

// Task Delays (in milliseconds)
#define TEMP_READ_DELAY_MS      2000
#define HEART_READ_DELAY_MS     2000
#define MQTT_SEND_DELAY_MS      5000

// Event Group Bits
#define WIFI_CONNECTED_BIT  BIT0
#define WIFI_FAIL_BIT       BIT1
#define MQTT_CONNECTED_BIT  BIT2

#endif // CONFIG_H