#include <driver/gpio.h>
#include "esp_log.h"
#include "esp_system.h"
#include "esp_sleep.h"
#include "nvs_flash.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include <string.h>
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
#include "oled_display.h"
#include "u8g2_esp32_hal.h"
#include "sys_button.h"
#include "alarm_manager.h"
#include "provisioning.h"

static const char *TAG = "MAIN";
EventGroupHandle_t g_event_group = NULL;
static system_mode_t s_system_mode = SYS_MODE_STATION;

// Sensor data storage
static struct {
    char patient[CCCD_MAX_LEN];
    char doctor[CCCD_MAX_LEN];
    float temperature;
    int heart_rate;
    double spo2;
} s_data = {0};

// Queue for OLED display
static QueueHandle_t s_oled_queue = NULL;

static QueueHandle_t g_mpu_queue = NULL;

/**
 * @brief Callback for temperature sensor updates
 */
static void on_temperature_update(float temp)
{
    s_data.temperature = temp;
}

/**
 * @brief Callback for heart rate sensor updates
 */
static void on_heart_rate_update(heart_rate_data_t data)
{
    s_data.heart_rate = data.heart_rate;
    s_data.spo2 = data.spo2;
}

/**
 * @brief OLED display update task
 */
static void oled_update_task(void *param){
    display_data_t display_data;

    while(1){
        display_data.heart_rate = s_data.heart_rate;
        display_data.spo2 = s_data.spo2;
        display_data.temperature = s_data.temperature;

        if(s_oled_queue){
            xQueueSend(s_oled_queue, &display_data, 0);
        }

        vTaskDelay(pdMS_TO_TICKS(OLED_UPDATE_DELAY_MS));
    }
}

/**
 * @brief MQTT telemetry sending task
 */
static void mqtt_send_task(void *param)
{
    ESP_LOGI(TAG, "MQTT send task started");

    while (1) {
        // Wait for MQTT connection
        EventBits_t bits = xEventGroupWaitBits(g_event_group, MQTT_CONNECTED_BIT, pdFALSE, pdFALSE, pdMS_TO_TICKS(1000));

        if (bits & MQTT_CONNECTED_BIT) {
            // Check health and update alarm status
            alarm_check_health_data(s_data.heart_rate, s_data.spo2, s_data.temperature);
            
            // Send telemetry with alarm status
            char alarm_str[128] = { 0 };
            alarm_get_string(alarm_str);
            // const char *alarm_str = alarm_get_string();

            // Send telemetry
            esp_err_t err = mqtt_publish_telemetry(
                s_data.heart_rate,
                s_data.spo2,
                s_data.temperature,
                alarm_str
            );

            if (err != ESP_OK) {
                ESP_LOGW(TAG, "Failed to publish telemetry");
            }
        }

        vTaskDelay(pdMS_TO_TICKS(MQTT_SEND_DELAY_MS));
    }
}


/**
 * @brief Enter deep sleep mode
 */
static void enter_deep_sleep(void){
    ESP_LOGI(TAG, "Entering deep sleep mode...");

    // Stop all services
    mqtt_client_stop();
    http_server_stop();
    wifi_stop();

    // Configure wakeup on button press
    esp_sleep_enable_ext0_wakeup(BTN1_PIN, 0); // Wake on LOW (button press)
    
    // Clear active bit
    xEventGroupClearBits(g_event_group, DEVICE_ACTIVE_BIT);

    vTaskDelay(pdMS_TO_TICKS(100));
    esp_deep_sleep_start();
}

static void button1_event_handler(void *args, esp_event_base_t base, int32_t id, void *event_data){
    ESP_LOGI(TAG, "Event: %s", (char*) base);    
    if (strcmp(base, BUTTON1_EVENT_BASE) != 0) return;

    switch (id) {
        case BUTTON_EVENT_SINGLE_CLICK:
            ESP_LOGI(TAG, "Button 1: Single click - Toggle sleep");
            EventBits_t bits = xEventGroupGetBits(g_event_group);
            if(bits & DEVICE_ACTIVE_BIT){
                enter_deep_sleep();
            }
            break;
        case BUTTON_EVENT_DOUBLE_CLICK:
            ESP_LOGI(TAG, "Button 1: Double click - Stop buzzer");
            alarm_stop_buzzer();
            break;
        case BUTTON_EVENT_LONG_PRESS:
            ESP_LOGI(TAG, "Button 1: Long press - Trigger SOS");
            alarm_trigger_sos();
        default:
            break;
    }
}

static void button2_event_handler(void *args, esp_event_base_t base, 
                                  int32_t id, void *event_data) {
    
    ESP_LOGI(TAG, "Event: %s", (char*) base);                                
    if (strcmp(base, BUTTON2_EVENT_BASE) != 0) return;

    switch (id) {
        case BUTTON_EVENT_DOUBLE_CLICK:
            if(s_system_mode == SYS_MODE_STATION) {
                ESP_LOGI(TAG, "Switching to AP mode (simple)");
                mqtt_client_stop();
                wifi_stop();
                wifi_start_ap_mode();
                http_server_start(SYS_MODE_AP_SIMPLE);
                s_system_mode = SYS_MODE_AP_SIMPLE;
            } else {
                ESP_LOGI(TAG, "Switching to Station mode");
                ESP_LOGI(TAG, "Restart device");
                esp_restart();
                // http_server_stop();
                // wifi_stop();

                // char ssid[SSID_MAX_LEN], pass[PASSWORD_MAX_LEN], token[TOKEN_MAX_LEN];
                // if (nvs_load_wifi_config(ssid, pass) && nvs_load_access_token(token)) {
                //     if (wifi_start_station_mode(ssid, pass)) {
                //         s_system_mode = SYS_MODE_STATION;
                //         // Try to reconnect MQTT
                //         mqtt_client_init(token, g_event_group);
                //     }
                // }
            }
            break;
        case BUTTON_EVENT_LONG_PRESS:
            ESP_LOGI(TAG, "Button 2: Long press - Full config mode");
            mqtt_client_stop();
            wifi_stop();
            http_server_stop();
            wifi_start_ap_mode();
            http_server_start(SYS_MODE_AP_FULL);
            s_system_mode = SYS_MODE_AP_FULL;
            break;
        default:
            break;
    }
}

static esp_err_t do_provisioning_if_needed(void){
    if(!nvs_check_need_provisioning()){
        ESP_LOGI(TAG, "No provisioning needed");
        return ESP_OK;
    }

    ESP_LOGI(TAG, "Provisioning is required, performing now...");

    // Load patient and doctor info
    char ssid[SSID_MAX_LEN], pass[PASSWORD_MAX_LEN];
    char patient[CCCD_MAX_LEN], doctor[CCCD_MAX_LEN], token[TOKEN_MAX_LEN];
    
    // if (!nvs_load_full_config(ssid, pass, patient, doctor, token)) {
    //     ESP_LOGE(TAG, "Cannot load config for provisioning");
    //     return ESP_FAIL;
    // }
    // Wait for WiFi connection
    EventBits_t bits = xEventGroupWaitBits(g_event_group, 
        WIFI_CONNECTED_BIT, pdFALSE, pdFALSE, pdMS_TO_TICKS(15000));
    
    if (!(bits & WIFI_CONNECTED_BIT)) {
        ESP_LOGE(TAG, "WiFi not connected, cannot provision");
        return ESP_FAIL;
    }

    // Send provisioning request (using doctor ID as both key and secret)
    esp_err_t err = provisioning_send_request(PROVISION_KEY, PROVISION_SECRET);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Provisioning failed");
        return err;
    }

    ESP_LOGI(TAG, "Provisioning successful!");

    // Reload config to get the new token
    if (nvs_load_full_config(ssid, pass, patient, doctor, token)) {
        strncpy(s_data.patient, patient, sizeof(s_data.patient) - 1);
        strncpy(s_data.doctor, doctor, sizeof(s_data.doctor) - 1);
        
        // Initialize MQTT with new token
        err = mqtt_client_init(token);
        if (err == ESP_OK) {
            // Wait for MQTT connection
            bits = xEventGroupWaitBits(g_event_group, 
                MQTT_CONNECTED_BIT, pdFALSE, pdFALSE, pdMS_TO_TICKS(10000));
            
            if (bits & MQTT_CONNECTED_BIT) {
                // Send attributes
                mqtt_publish_attributes(patient, doctor);
                ESP_LOGI(TAG, "Attributes published successfully");
            }
        }
    }

    return ESP_OK;
}

// ====== Task đọc cảm biến (producer) ======
static void mpu6050_task(void *param)
{
    ESP_LOGI(TAG, "MPU6050 task started");

    while (1) {
        mpu6050_data_t data = {0};
        if (mpu6050_is_ready()) {
            esp_err_t err = mpu6050_read_all(&data);
            if (err == ESP_OK) {
                if (xQueueSend(g_mpu_queue, &data, 0) != pdPASS) {
                    mpu6050_data_t trash;
                    (void)xQueueReceive(g_mpu_queue, &trash, 0); // pop oldest (non-blocking)

                    if (xQueueSend(g_mpu_queue, &data, 0) != pdPASS) {
                        ESP_LOGW(TAG, "Queue full, dropped newest sample");
                    }
                    else {
                        ESP_LOGW(TAG, "Queue full, dropped oldest sample");
                    }
                }
                else {
                    ESP_LOGW(TAG, "read_all failed");
                }
            }
            else {
                ESP_LOGW(TAG, "mpu6050_read_all failed: %s", esp_err_to_name(err));
            }
        }
        else {
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

static void handle_mpu6050_data(void *param)
{
    ESP_LOGI(TAG, "Fall detector started");

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
    }
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
    g_event_group = xEventGroupCreate();
    if (!g_event_group)
    {
        ESP_LOGE(TAG, "Failed to create event group");
        return ESP_FAIL;
    }

    xEventGroupSetBits(g_event_group, DEVICE_ACTIVE_BIT);

    // Initialize I2C for OLED and sensors
    // i2c_config_t i2c_conf = {
    //     .mode = I2C_MODE_MASTER,
    //     .sda_io_num = I2C_SDA,
    //     .scl_io_num = I2C_SCL,
    //     .sda_pullup_en = GPIO_PULLUP_ENABLE,
    //     .scl_pullup_en = GPIO_PULLUP_ENABLE,
    //     .master.clk_speed = I2C_FREQ,
    // };
    // ESP_ERROR_CHECK(i2c_param_config(I2C_PORT, &i2c_conf));
    // ESP_ERROR_CHECK(i2c_driver_install(I2C_PORT, i2c_conf.mode, 0, 0, 0));  

    // Initialize OLED display
    u8g2_esp32_hal_t u8g2_hal = U8G2_ESP32_HAL_DEFAULT;
    u8g2_hal.bus.i2c.sda = I2C_SDA;
    u8g2_hal.bus.i2c.scl = I2C_SCL;
    u8g2_esp32_hal_init(u8g2_hal);
    
    ESP_ERROR_CHECK(oled_display_init(u8g2_esp32_i2c_byte_cb, 
                                      u8g2_esp32_gpio_and_delay_cb));
    
    // Create OLED queue and task
    s_oled_queue = xQueueCreate(16, sizeof(display_data_t));
    g_mpu_queue = xQueueCreate(QUEUE_LEN, sizeof(mpu6050_data_t));

    // Initialize mpu6050
    ESP_ERROR_CHECK(mpu6050_init(I2C_PORT));

    // Initialize alarm manager
    ESP_ERROR_CHECK(alarm_manager_init(g_event_group));

    // Initialize WiFi manager
    ESP_ERROR_CHECK(wifi_manager_init(g_event_group));

    // Initialize buttons
    ESP_ERROR_CHECK(esp_event_handler_instance_register(
        BUTTON1_EVENT_BASE, ESP_EVENT_ANY_ID, 
        button1_event_handler, NULL, NULL));
    
    // Register button 2 handler
    ESP_ERROR_CHECK(esp_event_handler_instance_register(
        BUTTON2_EVENT_BASE, ESP_EVENT_ANY_ID, 
        button2_event_handler, NULL, NULL));

    ESP_ERROR_CHECK(button_manager_init_button1(BTN1_PIN));
    ESP_ERROR_CHECK(button_manager_init_button2(BTN2_PIN));
    // Initialize MPU650

    ESP_LOGI(TAG, "System initialized successfully");
    return ESP_OK;
}

/**
 * @brief Start sensor tasks
 */
static void start_sensor_tasks(void) {
    // Initialize and start temperature sensor
    if (temperature_sensor_init() == ESP_OK) {
        temperature_start_task(on_temperature_update);
    } else {
        ESP_LOGW(TAG, "Temperature sensor init failed");
    }

    // Initialize and start heart rate sensor
    if (heart_rate_sensor_init() == ESP_OK) {
        heart_rate_start_task(on_heart_rate_update);
    } else {
        ESP_LOGW(TAG, "Heart rate sensor init failed");
    }

    xTaskCreate(oled_display_task, "oled_task", 4096, (void *)s_oled_queue, 3, NULL);
    xTaskCreate(oled_update_task, "oled_update", 2048, NULL, 3, NULL);
    xTaskCreate(mpu6050_task, "mpu6050_task", 4096, NULL, 5, NULL);
    xTaskCreate(handle_mpu6050_data, "mpu6050_handler", 4096, NULL, 4, NULL);
}

/**
 * @brief Start normal operation mode with WiFi and MQTT
 */
static esp_err_t start_normal_mode(void)
{
    ESP_LOGI(TAG, "Starting normal operation mode...");
    char ssid[SSID_MAX_LEN], pass[PASSWORD_MAX_LEN];
    char patient[CCCD_MAX_LEN], doctor[CCCD_MAX_LEN], token[TOKEN_MAX_LEN];
    
    // Try to load WiFi config
    if (!nvs_load_wifi_config(ssid, pass)) {
        ESP_LOGW(TAG, "No WiFi config found");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "WiFi config found - Connecting...");

    // Connect to WiFi
    if (!wifi_start_station_mode(ssid, pass)) {
        ESP_LOGE(TAG, "WiFi connection failed");
        return ESP_FAIL;
    }
    
    ESP_LOGI(TAG, "WiFi connected successfully");

    // Check if provisioning is needed (after WiFi connection!)
    if (nvs_check_need_provisioning()) {
        ESP_LOGI(TAG, "Provisioning required, performing now...");
        do_provisioning_if_needed();
    }


   // Try to load full config
    if (nvs_load_full_config(ssid, pass, patient, doctor, token)) {
        ESP_LOGI(TAG, "Full config found - Starting MQTT");
        
        // Save patient and doctor info
        strncpy(s_data.patient, patient, sizeof(s_data.patient) - 1);
        strncpy(s_data.doctor, doctor, sizeof(s_data.doctor) - 1);
        
        // Initialize MQTT
        esp_err_t err = mqtt_client_init(token);
        if (err == ESP_OK) {
            // Start MQTT telemetry task
            xTaskCreate(mqtt_send_task, "mqtt_send", 4096, NULL, 5, NULL);
        
            mqtt_start_ota_scheduler();
        } else {
            ESP_LOGW(TAG, "MQTT init failed");
        }
    } else {
        ESP_LOGI(TAG, "No full config, WiFi only mode");
    }

    s_system_mode = SYS_MODE_STATION;
    return ESP_OK;
}

void app_main(void) {
    ESP_LOGI(TAG, "=== IoT Health Monitor Starting ===");

    // Check if waking from deep sleep
    esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
    if (wakeup_reason == ESP_SLEEP_WAKEUP_EXT0) {
        ESP_LOGI(TAG, "Woke up from deep sleep by button press");
    }

    // Initialize system
    ESP_ERROR_CHECK(system_init());

    start_sensor_tasks();

    // Try to start in normal mode
    if (start_normal_mode() != ESP_OK) {
        // No config found or connection failed - start in AP mode
        ESP_LOGI(TAG, "Starting in AP mode (simple config)");
        wifi_start_ap_mode();
        http_server_start(SYS_MODE_AP_SIMPLE);
        s_system_mode = SYS_MODE_AP_SIMPLE;
    }

    ESP_LOGI(TAG, "=== Initialization Complete ===");
    ESP_LOGI(TAG, "System Mode: %d", s_system_mode);
    ESP_LOGI(TAG, "Press Button 1: Single=Sleep, Double=Stop Buzzer, Long=SOS");
    ESP_LOGI(TAG, "Press Button 2: Double=Switch Mode, Long=Full Config");


    ESP_LOGI(TAG, "=== Initialization Complete ===");
}