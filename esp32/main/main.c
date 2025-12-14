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
#include "sytem_config.h"
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
} s_sensor_data = {0};

// FreeRTOS queues
static QueueHandle_t s_oled_queue = NULL;
static QueueHandle_t g_mpu_queue = NULL;

/**
 * @brief Temperature sensor update callback
 */
static void on_temperature_update(float temp) {
    s_sensor_data.temperature = temp;
}

/**
 * @brief Heart rate sensor update callback
 */
static void on_heart_rate_update(heart_rate_data_t data) {
    s_sensor_data.heart_rate = data.heart_rate;
    s_sensor_data.spo2 = data.spo2;
}

/**
 * @brief OLED display update task
 * @details Periodically sends sensor data to OLED display queue
 */
static void oled_update_task(void *param) {
    display_data_t display_data;

    while (1) {
        // Prepare display data
        display_data.heart_rate = s_sensor_data.heart_rate;
        display_data.spo2 = s_sensor_data.spo2;
        display_data.temperature = s_sensor_data.temperature;

        // Send to display queue (non-blocking)
        if (s_oled_queue) {
            xQueueSend(s_oled_queue, &display_data, 0);
        }

        vTaskDelay(pdMS_TO_TICKS(OLED_UPDATE_DELAY_MS));
    }
}

/**
 * @brief MQTT telemetry sending task
 * @details Checks health data, updates alarm status, and publishes to MQTT
 */
static void mqtt_send_task(void *param) {
    ESP_LOGI(TAG, "MQTT send task started");

    while (1) {
        // Wait for MQTT connection
        EventBits_t bits = xEventGroupWaitBits(
            g_event_group, 
            MQTT_CONNECTED_BIT, 
            pdFALSE, pdFALSE, 
            pdMS_TO_TICKS(1000)
        );

        if (bits & MQTT_CONNECTED_BIT) {
            // Check health parameters and update alarm status
            alarm_check_health_data(
                s_sensor_data.heart_rate, 
                s_sensor_data.spo2, 
                s_sensor_data.temperature
            );
            
            // Get alarm status string
            char alarm_str[128] = {0};
            alarm_get_string(alarm_str);

            // Publish telemetry data
            esp_err_t err = mqtt_publish_telemetry(
                s_sensor_data.heart_rate,
                s_sensor_data.spo2,
                s_sensor_data.temperature,
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
 * @details Stops all services and enters low-power mode
 */
static void enter_deep_sleep(void) {
    ESP_LOGI(TAG, "Entering deep sleep mode...");

    // Stop all services gracefully
    mqtt_client_stop();
    http_server_stop();
    wifi_stop();

    // Configure wakeup on button press (BTN1)
    esp_sleep_enable_ext0_wakeup(BTN1_PIN, 0); // Wake on LOW (button pressed)
    
    // Clear active bit
    xEventGroupClearBits(g_event_group, DEVICE_ACTIVE_BIT);

    vTaskDelay(pdMS_TO_TICKS(100));
    esp_deep_sleep_start();
}

/**
 * @brief Button 1 event handler
 * @details Handles single click (sleep), double click (stop buzzer), long press (SOS)
 */
static void button1_event_handler(void *args, esp_event_base_t base, 
                                  int32_t id, void *event_data) {
    if (strcmp(base, BUTTON1_EVENT_BASE) != 0) return;

    switch (id) {
        case BTN_SINGLE_CLICK:
            ESP_LOGI(TAG, "BTN1: Single click - Toggle sleep");
            EventBits_t bits = xEventGroupGetBits(g_event_group);
            if (bits & DEVICE_ACTIVE_BIT) {
                enter_deep_sleep();
            }
            break;

        case BTN_DOUBLE_CLICK:
            ESP_LOGI(TAG, "BTN1: Double click - Stop buzzer");
            alarm_stop_buzzer();
            break;

        case BTN_LONG_PRESS:
            ESP_LOGI(TAG, "BTN1: Long press - Trigger SOS");
            alarm_trigger_sos();
            break;

        default:
            break;
    }
}

/**
 * @brief Button 2 event handler
 * @details Handles double click (mode switch), long press (full config mode)
 */
static void button2_event_handler(void *args, esp_event_base_t base, 
                                  int32_t id, void *event_data) {
    if (strcmp(base, BUTTON2_EVENT_BASE) != 0) return;

    switch (id) {
        case BTN_DOUBLE_CLICK:
            if (s_system_mode == SYS_MODE_STATION) {
                // Switch to AP mode
                ESP_LOGI(TAG, "Switching to AP mode (simple)");
                mqtt_client_stop();
                wifi_stop();
                wifi_start_ap_mode();
                http_server_start(SYS_MODE_AP_SIMPLE);
                s_system_mode = SYS_MODE_AP_SIMPLE;
            } else {
                // Restart to return to station mode
                ESP_LOGI(TAG, "Restarting to station mode...");
                esp_restart();
            }
            break;

        case BTN_LONG_PRESS:
            ESP_LOGI(TAG, "BTN2: Long press - Full config mode");
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

/**
 * @brief Perform device provisioning if needed
 * @return ESP_OK on success, ESP_FAIL on failure
 */
static esp_err_t do_provisioning_if_needed(void) {
    if (!nvs_check_need_provisioning()) {
        ESP_LOGI(TAG, "No provisioning needed");
        return ESP_OK;
    }

    ESP_LOGI(TAG, "Provisioning required, performing now...");

    // Wait for WiFi connection
    EventBits_t bits = xEventGroupWaitBits(
        g_event_group, 
        WIFI_CONNECTED_BIT, 
        pdFALSE, pdFALSE, 
        pdMS_TO_TICKS(15000)
    );
    
    if (!(bits & WIFI_CONNECTED_BIT)) {
        ESP_LOGE(TAG, "WiFi not connected, cannot provision");
        return ESP_FAIL;
    }

    // Send provisioning request
    esp_err_t err = provisioning_send_request(PROVISION_KEY, PROVISION_SECRET);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Provisioning failed");
        return err;
    }

    ESP_LOGI(TAG, "Provisioning successful!");

    // Reload configuration with new token
    char ssid[SSID_MAX_LEN], pass[PASSWORD_MAX_LEN];
    char patient[CCCD_MAX_LEN], doctor[CCCD_MAX_LEN], token[TOKEN_MAX_LEN];
    
    if (nvs_load_full_config(ssid, pass, patient, doctor, token)) {
        strncpy(s_sensor_data.patient, patient, sizeof(s_sensor_data.patient) - 1);
        strncpy(s_sensor_data.doctor, doctor, sizeof(s_sensor_data.doctor) - 1);
        
        // Initialize MQTT with new token
        err = mqtt_client_init(token);
        if (err == ESP_OK) {
            // Wait for MQTT connection
            bits = xEventGroupWaitBits(
                g_event_group, 
                MQTT_CONNECTED_BIT, 
                pdFALSE, pdFALSE, 
                pdMS_TO_TICKS(10000)
            );
            
            if (bits & MQTT_CONNECTED_BIT) {
                // Publish device attributes
                mqtt_publish_attributes(patient, doctor);
                ESP_LOGI(TAG, "Attributes published successfully");
            }
        }
    }

    return ESP_OK;
}

/**
 * @brief MPU6050 sensor reading task (Producer)
 * @details Periodically reads sensor data and pushes to queue
 */
static void mpu6050_task(void *param) {
    ESP_LOGI(TAG, "MPU6050 task started");

    while (1) {
        mpu6050_data_t data = {0};
        
        if (mpu6050_is_ready()) {
            esp_err_t err = mpu6050_read_all(&data);
            
            if (err == ESP_OK) {
                // Try to send to queue
                if (xQueueSend(g_mpu_queue, &data, 0) != pdPASS) {
                    // Queue full - drop oldest sample
                    mpu6050_data_t trash;
                    xQueueReceive(g_mpu_queue, &trash, 0);
                    
                    if (xQueueSend(g_mpu_queue, &data, 0) != pdPASS) {
                        ESP_LOGW(TAG, "Queue full, dropped newest sample");
                    }
                }
            } else {
                ESP_LOGW(TAG, "MPU6050 read failed: %s", esp_err_to_name(err));
            }
        } else {
            ESP_LOGW(TAG, "MPU6050 not ready");
        }
        
        vTaskDelay(pdMS_TO_TICKS(MPU_PERIOD_MS));
    }
}

/**
 * @brief Calculate vector norm (magnitude)
 */
static inline float vec3_norm(float x, float y, float z) {
    return sqrtf(x * x + y * y + z * z);
}


/**
 * @brief Convert fall state to string (for debugging)
 */
static const char *fall_state_to_str(fall_state_t s) {
    switch (s) {
        case ST_IDLE:         return "IDLE";
        case ST_FREE_FALL:    return "FREE_FALL";
        case ST_IMPACT_WAIT:  return "IMPACT_WAIT";
        case ST_POST_MONITOR: return "POST_MONITOR";
        default:              return "UNKNOWN";
    }
}

/**
 * @brief Fall detection task (Consumer)
 * @details Processes MPU6050 data and detects fall events
 */
static void handle_mpu6050_data(void *param) {
    ESP_LOGI(TAG, "Fall detector started");

    fall_state_t state = ST_IDLE;
    fall_state_t prev_state = state;
    TickType_t t_state = 0;
    TickType_t t_last_report = 0;

    mpu6050_data_t data;

    while (1) {
        // Wait for sensor data
        if (xQueueReceive(g_mpu_queue, &data, portMAX_DELAY) != pdPASS) {
            continue;
        }

        // Calculate magnitudes
        const float acc_norm = vec3_norm(data.accel.ax, data.accel.ay, data.accel.az);
        const float gyro_norm = vec3_norm(data.gyro.gx, data.gyro.gy, data.gyro.gz);
        const TickType_t now = xTaskGetTickCount();

        // Fall detection state machine
        switch (state) {
            case ST_IDLE:
                // Check for free-fall condition
                if (acc_norm < FF_G_THRESH) {
                    state = ST_FREE_FALL;
                    t_state = now;
                    ESP_LOGI(TAG, "Free-fall detected!");
                }
                break;

            case ST_FREE_FALL: {
                TickType_t elapsed = now - t_state;
                
                if (acc_norm < FF_G_THRESH) {
                    // Still in free-fall
                    if (elapsed > pdMS_TO_TICKS(FF_MAX_TIME_MS)) {
                        // Free-fall too long, reset
                        state = ST_IDLE;
                    }
                } else {
                    // Free-fall ended, wait for impact
                    state = ST_IMPACT_WAIT;
                    t_state = now;
                }
                break;
            }

            case ST_IMPACT_WAIT: {
                TickType_t elapsed = now - t_state;
                
                if (acc_norm > IMPACT_G_THRESH) {
                    // Impact detected!
                    state = ST_POST_MONITOR;
                    t_state = now;
                    ESP_LOGI(TAG, "Impact detected! |acc|=%.2fg", acc_norm);
                } else if (elapsed > pdMS_TO_TICKS(IMPACT_TIMEOUT_MS)) {
                    // No impact, reset
                    state = ST_IDLE;
                }
                break;
            }

            case ST_POST_MONITOR: {
                TickType_t elapsed = now - t_state;
                bool low_motion = (gyro_norm < POST_INACT_DPS);
                
                if (low_motion) {
                    // Person is inactive after impact - likely a fall!
                    if ((now - t_last_report) > pdMS_TO_TICKS(REPORT_COOLDOWN_MS)) {
                        t_last_report = now;
                        
                        ESP_LOGW(TAG, "[FALL DETECTED!] |acc|=%.2fg, |gyro|=%.0fdps, "
                                 "roll=%.1f°, pitch=%.1f°", 
                                 acc_norm, gyro_norm, 
                                 data.angle.roll, data.angle.pitch);
                        
                        // Trigger fall alarm
                        alarm_fall_detection();
                    }
                    state = ST_IDLE;
                } else if (elapsed > pdMS_TO_TICKS(POST_WINDOW_MS)) {
                    // Person moved after impact - probably not a fall
                    state = ST_IDLE;
                }
                break;
            }

        default:
            state = ST_IDLE;
            break;
        }

        // Log state changes
        if (state != prev_state) {
            ESP_LOGI(TAG, "State: %s -> %s",
                     fall_state_to_str(prev_state),
                     fall_state_to_str(state));
            prev_state = state;
        }
    }
}

/**
 * @brief Initialize system components
 * @return ESP_OK on success
 */
static esp_err_t system_init(void) {
    // Initialize NVS (Non-Volatile Storage)
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // Initialize networking
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    // Create event group for synchronization
    g_event_group = xEventGroupCreate();
    if (!g_event_group) {
        ESP_LOGE(TAG, "Failed to create event group");
        return ESP_FAIL;
    }
    xEventGroupSetBits(g_event_group, DEVICE_ACTIVE_BIT);

    // Initialize I2C for OLED and sensors
    u8g2_esp32_hal_t u8g2_hal = U8G2_ESP32_HAL_DEFAULT;
    u8g2_hal.bus.i2c.sda = I2C_SDA_PIN;
    u8g2_hal.bus.i2c.scl = I2C_SCL_PIN;
    u8g2_esp32_hal_init(u8g2_hal);
    
    // Initialize OLED display
    ESP_ERROR_CHECK(oled_display_init(u8g2_esp32_i2c_byte_cb, 
                                      u8g2_esp32_gpio_and_delay_cb));
    
    // Create FreeRTOS queues
    s_oled_queue = xQueueCreate(16, sizeof(display_data_t));
    g_mpu_queue = xQueueCreate(QUEUE_LEN, sizeof(mpu6050_data_t));

    // Initialize MPU6050 sensor
    ESP_ERROR_CHECK(mpu6050_init(I2C_PORT));

    // Initialize alarm manager
    ESP_ERROR_CHECK(alarm_manager_init());

    // Initialize WiFi manager
    ESP_ERROR_CHECK(wifi_manager_init());

    // Register button event handlers
    ESP_ERROR_CHECK(esp_event_handler_instance_register(
        BUTTON1_EVENT_BASE, ESP_EVENT_ANY_ID, 
        button1_event_handler, NULL, NULL
    ));
    
    ESP_ERROR_CHECK(esp_event_handler_instance_register(
        BUTTON2_EVENT_BASE, ESP_EVENT_ANY_ID, 
        button2_event_handler, NULL, NULL
    ));

    // Initialize buttons
    ESP_ERROR_CHECK(button_manager_init_button1(BTN1_PIN));
    ESP_ERROR_CHECK(button_manager_init_button2(BTN2_PIN));

    ESP_LOGI(TAG, "System initialized successfully");
    return ESP_OK;
}

/**
 * @brief Start all sensor tasks
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

    // Start display and MPU6050 tasks
    xTaskCreate(oled_display_task, "oled_task", 4096, (void *)s_oled_queue, 3, NULL);
    xTaskCreate(oled_update_task, "oled_update", 2048, NULL, 3, NULL);
    xTaskCreate(mpu6050_task, "mpu6050_task", 4096, NULL, 5, NULL);
    xTaskCreate(handle_mpu6050_data, "fall_detect", 4096, NULL, 4, NULL);
}

/**
 * @brief Start normal operation mode with WiFi and MQTT
 * @return ESP_OK on success
 */
static esp_err_t start_normal_mode(void) {
    ESP_LOGI(TAG, "Starting normal operation mode...");
    
    char ssid[SSID_MAX_LEN], pass[PASSWORD_MAX_LEN];
    char patient[CCCD_MAX_LEN], doctor[CCCD_MAX_LEN], token[TOKEN_MAX_LEN];
    
    // Load WiFi configuration
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

    // Check if provisioning is needed
    if (nvs_check_need_provisioning()) {
        ESP_LOGI(TAG, "Provisioning required");
        do_provisioning_if_needed();
    }

    // Load full configuration and start MQTT
    if (nvs_load_full_config(ssid, pass, patient, doctor, token)) {
        ESP_LOGI(TAG, "Full config found - Starting MQTT");
        
        // Save patient and doctor info
        strncpy(s_sensor_data.patient, patient, sizeof(s_sensor_data.patient) - 1);
        strncpy(s_sensor_data.doctor, doctor, sizeof(s_sensor_data.doctor) - 1);
        
        // Initialize MQTT
        esp_err_t err = mqtt_client_init(token);
        if (err == ESP_OK) {
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

    // Start sensor tasks
    start_sensor_tasks();

    // Try to start in normal mode
    if (start_normal_mode() != ESP_OK) {
        // No config found - start in AP mode
        ESP_LOGI(TAG, "Starting in AP mode (simple config)");
        wifi_start_ap_mode();
        http_server_start(SYS_MODE_AP_SIMPLE);
        s_system_mode = SYS_MODE_AP_SIMPLE;
    }

    ESP_LOGI(TAG, "=== Initialization Complete ===");
    ESP_LOGI(TAG, "System Mode: %d", s_system_mode);
    ESP_LOGI(TAG, "Button 1: Single=Sleep | Double=Stop Buzzer | Long=SOS");
    ESP_LOGI(TAG, "Button 2: Double=Switch Mode | Long=Full Config");
}