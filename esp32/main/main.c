#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_netif.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include <string.h>

// Application modules
#include "config.h"
#include "storage/nvs_stoarge.h"
#include "wifi/wifi_manager.h"
#include "http/http_server.h"
#include "mqtt/mqtt_tb.h"
#include "sensors/ds18b20/temperature.h"
#include "sensors/max30102/heart_rate.h"
#include "sensors/mpu6050/mpu6050_api.h"
#include "gpio/gpio_handler.h"

static const char *TAG = "MAIN";
static EventGroupHandle_t event_group = NULL;

// Sensor data storage
static struct {
    char cccd[CCCD_MAX_LEN];
    float temperature;
    int heart_rate;
    double spo2;
} sensor_data = {0};

/**
 * @brief Callback for temperature sensor updates
 */
static void on_temperature_update(float temp) {
    sensor_data.temperature = temp;
}

/**
 * @brief Callback for heart rate sensor updates
 */
static void on_heart_rate_update(heart_rate_data_t data) {
    sensor_data.heart_rate = data.heart_rate;
    sensor_data.spo2 = data.spo2;
}

/**
 * @brief MQTT telemetry sending task
 */
static void mqtt_send_task(void *param) {
    ESP_LOGI(TAG, "MQTT send task started");

    while (1) {
        // Wait for MQTT connection
        EventBits_t bits = xEventGroupWaitBits(event_group, MQTT_CONNECTED_BIT, pdFALSE, pdFALSE, pdMS_TO_TICKS(1000));

        if (bits & MQTT_CONNECTED_BIT) {
            // Send telemetry
            esp_err_t err = mqtt_publish_telemetry(
                sensor_data.cccd,
                sensor_data.heart_rate,
                sensor_data.spo2,
                sensor_data.temperature
            );

            if (err != ESP_OK) {
                ESP_LOGW(TAG, "Failed to publish telemetry");
            }
        }

        vTaskDelay(pdMS_TO_TICKS(MQTT_SEND_DELAY_MS));
    }
}
/**
 * @brief Button press callback - switches to AP mode
 */
static void mpu6050_task(void *param) {
    ESP_LOGI(TAG, "MPU6050 send task started");

    while (1) {
        mpu6050_data_t d = {0};
        if (mpu6050_read_all(&d) == ESP_OK) {
            ESP_LOGI(TAG, "ACC[g]=[%.3f, %.3f, %.3f]  GYRO[dps]=[%.2f, %.2f, %.2f]  TEMP=%.2fC  ANG[roll=%.2f, pitch=%.2f]",
                     d.accel.ax, d.accel.ay, d.accel.az,
                     d.gyro.gx, d.gyro.gy, d.gyro.gz,
                     d.temp.celsius, d.angle.roll, d.angle.pitch);
        }
        vTaskDelay(pdMS_TO_TICKS(200));
    }
}
/**
 * @brief Button press callback - switches to AP mode
 */
static void on_button_pressed(void) {
    ESP_LOGW(TAG, "Button pressed - Switching to AP mode");

    // Stop current operations
    mqtt_client_stop();
    wifi_stop();
    
    // Start AP mode for reconfiguration
    wifi_start_ap_mode();
    http_server_start();
    
    ESP_LOGI(TAG, "Switched to configuration mode");
}

/**
 * @brief Initialize system
 */
static esp_err_t system_init(void) {
    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // Initialize networking
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    // Create event group
    event_group = xEventGroupCreate();
    if (!event_group) {
        ESP_LOGE(TAG, "Failed to create event group");
        return ESP_FAIL;
    }

    // Initialize GPIO and button handler
    ESP_ERROR_CHECK(gpio_handler_init(on_button_pressed));

    // Initialize WiFi manager
    ESP_ERROR_CHECK(wifi_manager_init(event_group));

    // Initialize MPU650
    ESP_ERROR_CHECK(mpu6050_init(I2C_PORT, I2C_SDA, I2C_SCL, I2C_FREQ, 
                                 MPU_ADDR, MPU6050_ACCE_2G, MPU6050_GYRO_250DPS));

    ESP_LOGI(TAG, "System initialized successfully");
    return ESP_OK;
}

/**
 * @brief Start normal operation mode with WiFi and MQTT
 */
static esp_err_t start_normal_mode(const char *ssid, const char *pass, 
                                   const char *token, const char *cccd) {
    ESP_LOGI(TAG, "Starting normal operation mode...");

    // Store CCCD for telemetry
    strncpy(sensor_data.cccd, cccd, sizeof(sensor_data.cccd) - 1);

    // Connect to WiFi
    if (!wifi_start_station_mode(ssid, pass)) {
        ESP_LOGW(TAG, "WiFi connection failed");
        return ESP_FAIL;
    }

    // Stop HTTP server if running
    http_server_stop();

    // Initialize MQTT
    esp_err_t err = mqtt_client_init(token, event_group);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "MQTT initialization failed");
        return err;
    }

    // Initialize sensors
    err = temperature_sensor_init();
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "Temperature sensor initialization failed");
    } else {
        temperature_start_task(on_temperature_update);
    }

    err = heart_rate_sensor_init();
    if (err != ESP_OK) {
        ESP_LOGW(TAG, "Heart rate sensor initialization failed");
    } else {
        heart_rate_start_task(on_heart_rate_update);
    }

    // Start MQTT telemetry task
    BaseType_t rc = xTaskCreate(mqtt_send_task, "mqtt_send", 4096, NULL, 5, NULL);
    if (rc != pdPASS) {
        ESP_LOGE(TAG, "xTaskCreate failed: mqtt_send");
    }

    // Start MPU6050 task
    rc = xTaskCreate(mpu6050_task, "mpu6050_task", 2048, NULL, 5, NULL);
    if (rc != pdPASS) {
        ESP_LOGE(TAG, "xTaskCreate failed: mpu6050_task");
    }

    ESP_LOGI(TAG, "Normal mode started successfully");
    return ESP_OK;
}

/**
 * @brief Start configuration mode (AP mode)
 */
static void start_config_mode(void) {
    ESP_LOGI(TAG, "Starting configuration mode...");
    
    wifi_start_ap_mode();
    http_server_start();
    
    ESP_LOGI(TAG, "Configuration mode started - Connect to '%s' to configure", AP_SSID);
}

void app_main(void) {
    ESP_LOGI(TAG, "=== IoT Health Monitor Starting ===");

    // Initialize system
    ESP_ERROR_CHECK(system_init());

    // Try to load saved configuration
    char ssid[SSID_MAX_LEN] = {0};
    char pass[PASSWORD_MAX_LEN] = {0};
    char cccd[CCCD_MAX_LEN] = {0};
    char token[TOKEN_MAX_LEN] = {0};

    if (nvs_load_wifi_config(ssid, pass, cccd, token)) {
        ESP_LOGI(TAG, "Configuration found - Starting normal mode");
        
        // Try to start normal operation
        if (start_normal_mode(ssid, pass, token, cccd) != ESP_OK) {
            ESP_LOGW(TAG, "Failed to start normal mode - Switching to config mode");
            wifi_stop();
            start_config_mode();
        }
    } else {
        ESP_LOGI(TAG, "No configuration found - Starting config mode");
        start_config_mode();
    }

    ESP_LOGI(TAG, "=== Initialization Complete ===");
}