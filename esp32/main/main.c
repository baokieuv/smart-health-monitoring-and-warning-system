#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_netif.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/event_groups.h"
#include <string.h>
#include <math.h>

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
// static EventGroupHandle_t event_group = NULL;

// // Sensor data storage
// static struct {
//     char cccd[CCCD_MAX_LEN];
//     float temperature;
//     int heart_rate;
//     double spo2;
// } sensor_data = {0};

// /**
//  * @brief Callback for temperature sensor updates
//  */
// static void on_temperature_update(float temp) {
//     sensor_data.temperature = temp;
// }

// /**
//  * @brief Callback for heart rate sensor updates
//  */
// static void on_heart_rate_update(heart_rate_data_t data) {
//     sensor_data.heart_rate = data.heart_rate;
//     sensor_data.spo2 = data.spo2;
// }

// /**
//  * @brief MQTT telemetry sending task
//  */
// static void mqtt_send_task(void *param) {
//     ESP_LOGI(TAG, "MQTT send task started");

//     while (1) {
//         // Wait for MQTT connection
//         EventBits_t bits = xEventGroupWaitBits(event_group, MQTT_CONNECTED_BIT, pdFALSE, pdFALSE, pdMS_TO_TICKS(1000));

//         if (bits & MQTT_CONNECTED_BIT) {
//             // Send telemetry
//             esp_err_t err = mqtt_publish_telemetry(
//                 sensor_data.cccd,
//                 sensor_data.heart_rate,
//                 sensor_data.spo2,
//                 sensor_data.temperature
//             );

//             if (err != ESP_OK) {
//                 ESP_LOGW(TAG, "Failed to publish telemetry");
//             }
//         }

//         vTaskDelay(pdMS_TO_TICKS(MQTT_SEND_DELAY_MS));
//     }
// }

// /**
//  * @brief Button press callback - switches to AP mode
//  */
// static void on_button_pressed(void) {
//     ESP_LOGW(TAG, "Button pressed - Switching to AP mode");

//     // Stop current operations
//     mqtt_client_stop();
//     wifi_stop();
    
//     // Start AP mode for reconfiguration
//     wifi_start_ap_mode();
//     http_server_start();
    
//     ESP_LOGI(TAG, "Switched to configuration mode");
// }

// /**
//  * @brief Initialize system
//  */
// static esp_err_t system_init(void) {
//     // Initialize NVS
//     esp_err_t ret = nvs_flash_init();
//     if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
//         ESP_ERROR_CHECK(nvs_flash_erase());
//         ret = nvs_flash_init();
//     }
//     ESP_ERROR_CHECK(ret);

//     // Initialize networking
//     ESP_ERROR_CHECK(esp_netif_init());
//     ESP_ERROR_CHECK(esp_event_loop_create_default());

//     // Create event group
//     event_group = xEventGroupCreate();
//     if (!event_group) {
//         ESP_LOGE(TAG, "Failed to create event group");
//         return ESP_FAIL;
//     }

//     // Initialize GPIO and button handler
//     ESP_ERROR_CHECK(gpio_handler_init(on_button_pressed));

//     // Initialize WiFi manager
//     ESP_ERROR_CHECK(wifi_manager_init(event_group));

       // Initialize MPU650
       
//     ESP_LOGI(TAG, "System initialized successfully");
//     return ESP_OK;
// }

// /**
//  * @brief Start normal operation mode with WiFi and MQTT
//  */
// static esp_err_t start_normal_mode(const char *ssid, const char *pass, 
//                                    const char *token, const char *cccd) {
//     ESP_LOGI(TAG, "Starting normal operation mode...");

//     // Store CCCD for telemetry
//     strncpy(sensor_data.cccd, cccd, sizeof(sensor_data.cccd) - 1);

//     // Connect to WiFi
//     if (!wifi_start_station_mode(ssid, pass)) {
//         ESP_LOGW(TAG, "WiFi connection failed");
//         return ESP_FAIL;
//     }

//     // Stop HTTP server if running
//     http_server_stop();

//     // Initialize MQTT
//     esp_err_t err = mqtt_client_init(token, event_group);
//     if (err != ESP_OK) {
//         ESP_LOGE(TAG, "MQTT initialization failed");
//         return err;
//     }

//     // Initialize sensors
//     err = temperature_sensor_init();
//     if (err != ESP_OK) {
//         ESP_LOGW(TAG, "Temperature sensor initialization failed");
//     } else {
//         temperature_start_task(on_temperature_update);
//     }

//     err = heart_rate_sensor_init();
//     if (err != ESP_OK) {
//         ESP_LOGW(TAG, "Heart rate sensor initialization failed");
//     } else {
//         heart_rate_start_task(on_heart_rate_update);
//     }

//     // Start MQTT telemetry task
//     xTaskCreate(mqtt_send_task, "mqtt_send", 4096, NULL, 5, NULL);

//     ESP_LOGI(TAG, "Normal mode started successfully");
//     return ESP_OK;
// }

// /**
//  * @brief Start configuration mode (AP mode)
//  */
// static void start_config_mode(void) {
//     ESP_LOGI(TAG, "Starting configuration mode...");
    
//     wifi_start_ap_mode();
//     http_server_start();
    
//     ESP_LOGI(TAG, "Configuration mode started - Connect to '%s' to configure", AP_SSID);
// }

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

// ====== Queue toàn cục ======
static QueueHandle_t g_mpu_queue = NULL;

// ====== Task đọc cảm biến (producer) ======
static void mpu6050_task(void *param) {
    ESP_LOGI(TAG, "MPU6050 task started");

    if (mpu6050_init(I2C_PORT, I2C_SDA, I2C_SCL, I2C_FREQ,
                     MPU_ADDR, MPU6050_ACCE_2G, MPU6050_GYRO_250DPS) != ESP_OK) {
        ESP_LOGE(TAG, "mpu6050_init failed");
        vTaskDelete(NULL);
        return;
    }

    TickType_t last = xTaskGetTickCount();

    while (1) {
        mpu6050_data_t d = {0};
        if (mpu6050_read_all(&d) == ESP_OK) {
            // Đưa vào hàng đợi (không chặn nếu đầy)
            if (xQueueSend(g_mpu_queue, &d, 0) != pdPASS) {
                // Queue full -> bỏ mẫu cũ nhất
                mpu6050_data_t trash;
                (void)xQueueReceive(g_mpu_queue, &trash, 0);   // pop oldest (non-blocking)

                // thử gửi lại mẫu mới
                if (xQueueSend(g_mpu_queue, &d, 0) != pdPASS) {
                    // Trường hợp cực đoan: vẫn không gửi được (race condition)
                    ESP_LOGW(TAG, "Queue full, dropped newest sample");
                } else {
                    ESP_LOGW(TAG, "Queue full, dropped oldest sample");
                }
            }
        } else {
            ESP_LOGW(TAG, "read_all failed");
        }

        vTaskDelayUntil(&last, pdMS_TO_TICKS(MPU_PERIOD_MS));
    }
}

// ==== Trợ giúp ====
static inline float vec3_norm(float x, float y, float z) {
    return sqrtf(x*x + y*y + z*z);
}

typedef enum {
    ST_IDLE = 0,
    ST_FREE_FALL,
    ST_IMPACT_WAIT,
    ST_POST_MONITOR
} fall_state_t;

static void handle_mpu6050_data(void *param) {
    ESP_LOGI(TAG, "Fall detector started");

    fall_state_t state = ST_IDLE;
    TickType_t   t_state = 0;          // mốc thời gian vào state
    TickType_t   t_last_report = 0;    // chống spam cảnh báo

    // (tuỳ chọn) giữ mẫu trước để tính delta nếu muốn
    mpu6050_data_t d;

    while (1) {
        if (xQueueReceive(g_mpu_queue, &d, portMAX_DELAY) != pdPASS) continue;

        const float acc_norm  = vec3_norm(d.accel.ax, d.accel.ay, d.accel.az);   // g
        const float gyro_norm = vec3_norm(d.gyro.gx,  d.gyro.gy,  d.gyro.gz);    // dps
        const float abs_roll  = fabsf(d.angle.roll);
        const float abs_pitch = fabsf(d.angle.pitch);
        const TickType_t now  = xTaskGetTickCount();

        switch (state) {
        case ST_IDLE:
            // Free-fall bắt đầu khi acc rất thấp trong ≥ FF_MIN_TIME_MS
            if (acc_norm < FF_G_THRESH) {
                // vào FF và ghi mốc thời gian
                state = ST_FREE_FALL;
                t_state = now;
                // ESP_LOGI(TAG, "FF start");
            }
            break;

        case ST_FREE_FALL: {
            // Nếu vẫn dưới ngưỡng -> kiểm tra thời lượng
            TickType_t elapsed = now - t_state;
            if (acc_norm < FF_G_THRESH) {
                if (elapsed > pdMS_TO_TICKS(FF_MAX_TIME_MS)) {
                    // Free-fall quá dài nhưng không có impact, reset
                    state = ST_IDLE;
                }
                // vẫn trong free-fall, chờ impact
            } else {
                // acc thoát khỏi FF; chuyển sang chờ impact 1 khoảng ngắn
                state = ST_IMPACT_WAIT;
                t_state = now; // bắt đầu "đồng hồ" chờ impact
            }
            break;
        }

        case ST_IMPACT_WAIT: {
            TickType_t elapsed = now - t_state;
            // Tìm spike va đập
            if (acc_norm > IMPACT_G_THRESH) {
                state = ST_POST_MONITOR;
                t_state = now;  // bắt đầu quan sát sau impact
                ESP_LOGI(TAG, "Impact detected (|acc|=%.2fg)", acc_norm);
            } else if (elapsed > pdMS_TO_TICKS(IMPACT_TIMEOUT_MS)) {
                // Không thấy impact trong thời gian cho phép -> hủy
                state = ST_IDLE;
            }
            break;
        }

        case ST_POST_MONITOR: {
            TickType_t elapsed = now - t_state;
            // điều kiện "nằm bất động + tư thế bất thường"
            bool low_motion = (gyro_norm < POST_INACT_DPS);
            bool bad_pose   = (abs_roll > POST_ANGLE_DEG) || (abs_pitch > POST_ANGLE_DEG);

            if (low_motion && bad_pose) {
                // Chống spam: chỉ báo nếu quá cooldown
                if ((now - t_last_report) > pdMS_TO_TICKS(REPORT_COOLDOWN_MS)) {
                    t_last_report = now;
                    ESP_LOGW(TAG,
                        "[FALL DETECTED] |acc|=%.2fg, |gyro|=%.0fdps, roll=%.1f°, pitch=%.1f°",
                        acc_norm, gyro_norm, d.angle.roll, d.angle.pitch
                    );
                    // TODO: ở đây bạn có thể:
                    //  - publish MQTT/HTTP
                    //  - bật còi/đèn
                    //  - lưu sự kiện
                }
                // Sau khi báo, quay về IDLE để chờ lần sau
                state = ST_IDLE;
            } else if (elapsed > pdMS_TO_TICKS(POST_WINDOW_MS)) {
                // Hết cửa sổ quan sát mà không đạt điều kiện -> bỏ qua
                state = ST_IDLE;
            }
            break;
        }

        default:
            state = ST_IDLE;
            break;
        }

        // (tuỳ chọn) cũng có thể log thưa để theo dõi:
        ESP_LOGI(TAG, "state=%d |acc|=%.2f |gyro|=%.0f roll=%.1f pitch=%.1f",
                 state, acc_norm, gyro_norm, d.angle.roll, d.angle.pitch);
    }
}

void app_main(void)
{
    // Tạo hàng đợi trước khi tạo task
    g_mpu_queue = xQueueCreate(QUEUE_LEN, sizeof(mpu6050_data_t));
    if (!g_mpu_queue) {
        ESP_LOGE(TAG, "xQueueCreate failed");
        return;
    }

    // Tạo task producer (đọc cảm biến)
    BaseType_t ok = xTaskCreate(
        mpu6050_task,
        "mpu6050_task",
        4096,      // tăng nếu log nhiều
        NULL,
        5,
        NULL
    );
    if (ok != pdPASS) {
        ESP_LOGE(TAG, "xTaskCreate mpu6050_task failed");
        return;
    }

    // Tạo task consumer (xử lý trung bình)
    ok = xTaskCreate(
        handle_mpu6050_data,
        "mpu6050_handler",
        4096,
        NULL,
        4,         // priority thấp hơn producer một chút
        NULL
    );
    if (ok != pdPASS) {
        ESP_LOGE(TAG, "xTaskCreate handle_mpu6050_data failed");
        return;
    }
}