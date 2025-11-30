#include <driver/gpio.h>
#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "esp_timer.h"
#include "mqtt_client.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <string.h>
#include <stdio.h>
#include <math.h>
// Application modules
#include "config.h"
#include "nvs_stoarge.h"
#include "wifi_manager.h"
#include "http_server.h"
#include "mqtt_tb.h"
#include "temperature.h"
#include "heart_rate.h"
#include "mpu6050_api.h"
#include "gpio_handler.h"
#include "oled_display.h"
#include "u8g2.h"
#include "u8g2_esp32_hal.h"
#include "sys_button.h"

static const char *TAG = "MAIN";
static EventGroupHandle_t event_group = NULL;

// Sensor data storage
static struct
{
    char cccd[CCCD_MAX_LEN];
    float temperature;
    int heart_rate;
    double spo2;
} sensor_data = {0};

/**
 * @brief Callback for temperature sensor updates
 */
static void on_temperature_update(float temp)
{
    sensor_data.temperature = temp;
}

/**
 * @brief Callback for heart rate sensor updates
 */
static void on_heart_rate_update(heart_rate_data_t data)
{
    sensor_data.heart_rate = data.heart_rate;
    sensor_data.spo2 = data.spo2;
}

/**
 * @brief MQTT telemetry sending task
 */
static void mqtt_send_task(void *param)
{
    ESP_LOGI(TAG, "MQTT send task started");

    while (1)
    {
        // Wait for MQTT connection
        EventBits_t bits = xEventGroupWaitBits(event_group, MQTT_CONNECTED_BIT, pdFALSE, pdFALSE, pdMS_TO_TICKS(1000));

        if (bits & MQTT_CONNECTED_BIT)
        {
            // Send telemetry
            esp_err_t err = mqtt_publish_telemetry(
                sensor_data.cccd,
                sensor_data.heart_rate,
                sensor_data.spo2,
                sensor_data.temperature);

            if (err != ESP_OK)
            {
                ESP_LOGW(TAG, "Failed to publish telemetry");
            }
        }

        vTaskDelay(pdMS_TO_TICKS(MQTT_SEND_DELAY_MS));
    }
}

/**
 * @brief Button press callback - switches to AP mode
 */
static void on_button_pressed(void)
{
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
static esp_err_t system_init(void)
{
    // Initialize NVS
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND)
    {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // Initialize networking
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    // Create event group
    event_group = xEventGroupCreate();
    if (!event_group)
    {
        ESP_LOGE(TAG, "Failed to create event group");
        return ESP_FAIL;
    }

    // Initialize GPIO and button handler
    ESP_ERROR_CHECK(gpio_handler_init(on_button_pressed));

    // Initialize WiFi manager
    ESP_ERROR_CHECK(wifi_manager_init(event_group));

    //    Initialize MPU650

    ESP_LOGI(TAG, "System initialized successfully");
    return ESP_OK;
}

/**
 * @brief Start normal operation mode with WiFi and MQTT
 */
static esp_err_t start_normal_mode(const char *ssid, const char *pass,
                                   const char *token, const char *cccd)
{
    ESP_LOGI(TAG, "Starting normal operation mode...");

    // Store CCCD for telemetry
    strncpy(sensor_data.cccd, cccd, sizeof(sensor_data.cccd) - 1);

    // Connect to WiFi
    if (!wifi_start_station_mode(ssid, pass))
    {
        ESP_LOGW(TAG, "WiFi connection failed");
        return ESP_FAIL;
    }

    // Stop HTTP server if running
    http_server_stop();

    // Initialize MQTT
    esp_err_t err = mqtt_client_init(token, event_group);
    if (err != ESP_OK)
    {
        ESP_LOGE(TAG, "MQTT initialization failed");
        return err;
    }

    // Initialize sensors
    err = temperature_sensor_init();
    if (err != ESP_OK)
    {
        ESP_LOGW(TAG, "Temperature sensor initialization failed");
    }
    else
    {
        temperature_start_task(on_temperature_update);
    }

    err = heart_rate_sensor_init();
    if (err != ESP_OK)
    {
        ESP_LOGW(TAG, "Heart rate sensor initialization failed");
    }
    else
    {
        heart_rate_start_task(on_heart_rate_update);
    }

    // Start MQTT telemetry task
    xTaskCreate(mqtt_send_task, "mqtt_send", 4096, NULL, 5, NULL);

    ESP_LOGI(TAG, "Normal mode started successfully");
    return ESP_OK;
}

/**
 * @brief Start configuration mode (AP mode)
 */
static void start_config_mode(void)
{
    ESP_LOGI(TAG, "Starting configuration mode...");

    wifi_start_ap_mode();
    http_server_start();

    ESP_LOGI(TAG, "Configuration mode started - Connect to '%s' to configure", AP_SSID);
}

// ====== Queue toàn cục ======
static QueueHandle_t g_mpu_queue = NULL;

// ====== Task đọc cảm biến (producer) ======
static void mpu6050_task(void *param)
{
    ESP_LOGI(TAG, "MPU6050 task started");

    TickType_t last = xTaskGetTickCount();
    while (1)
    {
        mpu6050_data_t data = {0};
        if (mpu6050_is_ready())
        {
            esp_err_t err = mpu6050_read_all(&data);
            if (err == ESP_OK)
            {
                if (xQueueSend(g_mpu_queue, &data, 0) != pdPASS)
                {
                    mpu6050_data_t trash;
                    (void)xQueueReceive(g_mpu_queue, &trash, 0); // pop oldest (non-blocking)

                    if (xQueueSend(g_mpu_queue, &data, 0) != pdPASS)
                    {
                        ESP_LOGW(TAG, "Queue full, dropped newest sample");
                    }
                    else
                    {
                        ESP_LOGW(TAG, "Queue full, dropped oldest sample");
                    }
                }
                else
                {
                    ESP_LOGW(TAG, "read_all failed");
                }
            }
            else
            {
                ESP_LOGW(TAG, "mpu6050_read_all failed: %s", esp_err_to_name(err));
            }
        }
        else
        {
            ESP_LOGW(TAG, "MPU6050 not ready");
        }
        vTaskDelay(pdMS_TO_TICKS(MPU_PERIOD_MS));
    }
}

// ==== Trợ giúp ====
static inline float vec3_norm(float x, float y, float z)
{
    return sqrtf(x * x + y * y + z * z);
}

typedef enum
{
    ST_IDLE,
    ST_FREE_FALL,
    ST_IMPACT_WAIT,
    ST_POST_MONITOR
} fall_state_t;

/// Test
#define FALL_LED_GPIO GPIO_NUM_4

static const char *fall_state_to_str(fall_state_t s)
{
    switch (s)
    {
    case ST_IDLE:
        return "IDLE";
    case ST_FREE_FALL:
        return "FREE_FALL";
    case ST_IMPACT_WAIT:
        return "IMPACT_WAIT";
    case ST_POST_MONITOR:
        return "POST_MONITOR";
    default:
        return "UNKNOWN";
    }
}
///
static void handle_mpu6050_data(void *param)
{
    ESP_LOGI(TAG, "Fall detector started");
    // Demo: init LED ngay trong handler
    static bool s_led_inited = false;
    if (!s_led_inited)
    {
        gpio_config_t io_conf = {
            .pin_bit_mask = 1ULL << FALL_LED_GPIO,
            .mode = GPIO_MODE_OUTPUT,
            .pull_up_en = GPIO_PULLUP_DISABLE,
            .pull_down_en = GPIO_PULLDOWN_DISABLE,
            .intr_type = GPIO_INTR_DISABLE,
        };
        gpio_config(&io_conf);
        gpio_set_level(FALL_LED_GPIO, 0);
        s_led_inited = true;
    }
    /////

    fall_state_t state = ST_FREE_FALL;
    fall_state_t prev_state = state;
    TickType_t t_state = 0;
    TickType_t t_last_report = 0;

    mpu6050_data_t data;

    while (1)
    {
        if (xQueueReceive(g_mpu_queue, &data, portMAX_DELAY) != pdPASS)
            continue;

        const float acc_norm = vec3_norm(data.accel.ax, data.accel.ay, data.accel.az); // g
        const float gyro_norm = vec3_norm(data.gyro.gx, data.gyro.gy, data.gyro.gz);   // dps
        const float abs_roll = fabsf(data.angle.roll);
        const float abs_pitch = fabsf(data.angle.pitch);
        const TickType_t now = xTaskGetTickCount();

        switch (state)
        {
        case ST_IDLE:
            if (acc_norm < FF_G_THRESH)
            {
                state = ST_FREE_FALL;
                t_state = now;
                ESP_LOGI(TAG, "FF start");
            }
            break;

        case ST_FREE_FALL:
        {
            TickType_t elapsed = now - t_state;
            ESP_LOGI(TAG, "ST_FREE_FALL (|acc|=%.2fg)", acc_norm);
            if (acc_norm < FF_G_THRESH)
            {
                if (elapsed > pdMS_TO_TICKS(FF_MAX_TIME_MS))
                {
                    state = ST_IDLE;
                }
            }
            else
            {
                state = ST_IMPACT_WAIT;
                t_state = now;
            }
            break;
        }

        case ST_IMPACT_WAIT:
        {
            TickType_t elapsed = now - t_state;
            ESP_LOGI(TAG, "ST_IMPACT_WAIT (|acc|=%.2fg)", acc_norm);
            if (acc_norm > IMPACT_G_THRESH)
            {
                state = ST_POST_MONITOR;
                t_state = now;
                ESP_LOGI(TAG, "Impact detected (|acc|=%.2fg)", acc_norm);
            }
            else if (elapsed > pdMS_TO_TICKS(IMPACT_TIMEOUT_MS))
            {
                state = ST_IDLE;
            }
            break;
        }

        case ST_POST_MONITOR:
        {
            TickType_t elapsed = now - t_state;
            bool low_motion = (gyro_norm < POST_INACT_DPS);
            // bool bad_pose   = (abs_roll > POST_ANGLE_DEG) || (abs_pitch > POST_ANGLE_DEG);
            if (low_motion)
            {
                if ((now - t_last_report) > pdMS_TO_TICKS(REPORT_COOLDOWN_MS))
                {
                    t_last_report = now;
                    ESP_LOGW(TAG, "[FALL DETECTED] |acc|=%.2fg, |gyro|=%.0fdps, roll=%.1f°, pitch=%.1f°", acc_norm, gyro_norm, data.angle.roll, data.angle.pitch);
                    // ================= DEMO BÁO ĐÈN NGAY TẠI TODO =================
                    for (int i = 0; i < 3; ++i)
                    {
                        gpio_set_level(FALL_LED_GPIO, 1);
                        vTaskDelay(pdMS_TO_TICKS(200));
                        gpio_set_level(FALL_LED_GPIO, 0);
                        vTaskDelay(pdMS_TO_TICKS(200));
                    }
                    // ==============================================================
                }
                state = ST_IDLE;
            }
            else if (elapsed > pdMS_TO_TICKS(POST_WINDOW_MS))
            {
                state = ST_IDLE;
            }
            break;
        }

        default:
            state = ST_IDLE;
            break;
        }

        if (state != prev_state)
        {
            ESP_LOGI(TAG, "Fall state changed: %s -> %s",
                     fall_state_to_str(prev_state),
                     fall_state_to_str(state));
            prev_state = state;
        }

        ESP_LOGI(TAG,
                 "ACC: ax=%6.3f ay=%6.3f az=%6.3f | "
                 "GYR: gx=%7.3f gy=%7.3f gz=%7.3f | "
                 "TMP: %5.2f C | "
                 "ANG: roll=%6.2f pitch=%6.2f",
                 data.accel.ax, data.accel.ay, data.accel.az,
                 data.gyro.gx, data.gyro.gy, data.gyro.gz,
                 data.temp.celsius,
                 data.angle.roll, data.angle.pitch);
    }
}

#define BUTTON_GPIO_NUM GPIO_NUM_0

typedef enum
{
    APP_MODE_STA,
    APP_MODE_AP
} app_mode_t;

static app_mode_t g_app_mode = APP_MODE_AP;

static void switch_to_ap_mode(void)
{
    ESP_LOGI(TAG, "Switching to AP Mode...");

    wifi_stop();
    wifi_start_ap_mode();
    http_server_start();

    g_app_mode = APP_MODE_AP;
}

static void switch_to_sta_mode(void)
{
    ESP_LOGI(TAG, "Switching to STA Mode...");

    http_server_stop();
    wifi_stop();

    char ssid[32], pass[64];
    if (nvs_load_wifi_config(ssid, pass, 0, 0) == ESP_OK)
    {
        wifi_start_station_mode(ssid, pass);
    }
    else
    {
        wifi_start_station_mode("Duy Anh", "12345689");
    }

    g_app_mode = APP_MODE_STA;
}

static void app_button_event_handler(void *handler_args, esp_event_base_t base, int32_t id, void *event_data)
{
    if (base != APP_BUTTON_EVENT)
        return;
    switch (id)
    {
    case BUTTON_EVENT_SINGLE_CLICK:
        ESP_LOGI(TAG, "Single click detected");
        if (g_app_mode == APP_MODE_STA)
        {
            switch_to_ap_mode();
        }
        else
        {
            switch_to_sta_mode();
        }
        break;

    case BUTTON_EVENT_DOUBLE_CLICK:
        ESP_LOGI(TAG, "Double click detected");

    case BUTTON_EVENT_LONG_PRESS:
        ESP_LOGI(TAG, "Long press detected");
        if (g_app_mode == APP_MODE_AP)
        {
            http_server_toggle_view_mode();
        }
        else
        {
            ESP_LOGI(TAG, "Only available in AP mode");
        }

    default:
        break;
    }
}

void fake_sensor_task(void *param)
{
    QueueHandle_t queue = (QueueHandle_t)param;
    display_data_t fake_data;
    int count = 0;

    while (1)
    {
        fake_data.heart_rate = 60 + (count % 40);            // 60-100
        fake_data.spo2 = 90 + (count % 10);                  // 90-99
        fake_data.temperature = 36.5 + ((count % 20) * 0.1); // 36.5 - 38.5

        xQueueSend(queue, &fake_data, 0);

        count++;
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

void app_main(void)
{
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND)
    {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = 41,
        .scl_io_num = 42,
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master.clk_speed = 100000,
    };
    ESP_ERROR_CHECK(i2c_param_config(I2C_NUM_0, &conf));
    ESP_ERROR_CHECK(i2c_driver_install(I2C_NUM_0, conf.mode, 0, 0, 0));

    esp_err_t err;

    // g_mpu_queue = xQueueCreate(QUEUE_LEN, sizeof(mpu6050_data_t));
    // if (!g_mpu_queue)
    // {
    //     ESP_LOGE(TAG, "xQueueCreate failed");
    //     return;
    // }

    // err = mpu6050_init(I2C_PORT);

    // if (err != ESP_OK)
    // {
    //     ESP_LOGE(TAG, "mpu6050_init failed: %s", esp_err_to_name(err));
    //     return;
    // }
    // ESP_LOGI(TAG, "MPU6050 init OK, starting task...");

    // // Tạo task producer (đọc cảm biến)
    // if (xTaskCreate(mpu6050_task, "mpu6050_task", 4096, NULL, 5, NULL) != pdPASS)
    // {
    //     ESP_LOGE(TAG, "xTaskCreate mpu6050_task failed");
    //     return;
    // }

    // // Tạo task consumer (xử lý ngã)
    // if (xTaskCreate(handle_mpu6050_data, "mpu6050_handler", 4096, NULL, 4, NULL) != pdPASS)
    // {
    //     ESP_LOGE(TAG, "xTaskCreate handle_mpu6050_data failed");
    //     return;
    // }

    u8g2_esp32_hal_t u8g2_esp32_hal = U8G2_ESP32_HAL_DEFAULT;
    u8g2_esp32_hal.bus.i2c.sda = 41;
    u8g2_esp32_hal.bus.i2c.scl = 42;
    u8g2_esp32_hal_init(u8g2_esp32_hal);

    err = oled_display_init(u8g2_esp32_i2c_byte_cb, u8g2_esp32_gpio_and_delay_cb);
    if (err != ESP_OK)
    {
        ESP_LOGE(TAG, "oled_display_init failed: %s", esp_err_to_name(err));
        return;
    }
    ESP_LOGI(TAG, "OLED display init OK");

    // test OLED
    QueueHandle_t g_oled_queue = xQueueCreate(QUEUE_LEN, sizeof(display_data_t));

    xTaskCreate(oled_display_task, "oled_display_task", 4096, (void *)g_oled_queue, 3, NULL);
    xTaskCreate(fake_sensor_task, "fake_sensor_task", 2048, (void *)g_oled_queue, 3, NULL);

    // test switch wifi mode
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    event_group = xEventGroupCreate();
    wifi_manager_init(event_group);

    ESP_ERROR_CHECK(esp_event_handler_instance_register(APP_BUTTON_EVENT,
                                                        ESP_EVENT_ANY_ID,
                                                        app_button_event_handler,
                                                        NULL, NULL));

    sys_button_init(BUTTON_GPIO_NUM);
    switch_to_sta_mode();
}

// void app_main(void) {
//     ESP_LOGI(TAG, "=== IoT Health Monitor Starting ===");

//     // Initialize system
//     ESP_ERROR_CHECK(system_init());

//     // Try to load saved configuration
//     char ssid[SSID_MAX_LEN] = {0};
//     char pass[PASSWORD_MAX_LEN] = {0};
//     char cccd[CCCD_MAX_LEN] = {0};
//     char token[TOKEN_MAX_LEN] = {0};

//     if (nvs_load_wifi_config(ssid, pass, cccd, token)) {
//         ESP_LOGI(TAG, "Configuration found - Starting normal mode");

//         // Try to start normal operation
//         if (start_normal_mode(ssid, pass, token, cccd) != ESP_OK) {
//             ESP_LOGW(TAG, "Failed to start normal mode - Switching to config mode");
//             wifi_stop();
//             start_config_mode();
//         }
//     } else {
//         ESP_LOGI(TAG, "No configuration found - Starting config mode");
//         start_config_mode();
//     }

//     ESP_LOGI(TAG, "=== Initialization Complete ===");
// }
