#ifndef OLED_DISPLAY_H
#define OLED_DISPLAY_H

#include "esp_err.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "u8g2.h"
#include "sytem_config.h"

// Cấu hình chân GPIO (Khớp với main.c của bạn)
#define OLED_SDA_PIN 21
#define OLED_SCL_PIN 22
#define OLED_I2C_ADDR 0x3C

// Struct dữ liệu hiển thị (Dùng chung cho cả Main và Display Task)
typedef struct
{
    int heart_rate;
    int spo2;
    float temperature;
} display_data_t;

/**
 * @brief Initialize OLED display
 * @param byte_cb I2C byte callback function
 * @param gpio_cb GPIO and delay callback function
 * @return ESP_OK on success
 */
esp_err_t oled_display_init(u8x8_msg_cb byte_cb, u8x8_msg_cb gpio_cb);

/**
 * @brief Update OLED display with health data
 * @details Layout:
 *   - Left side: Heart rate with icon
 *   - Top right: SpO2 with icon
 *   - Bottom right: Temperature with icon
 * 
 * @param heart_rate Heart rate in BPM
 * @param spo2 Blood oxygen saturation (%)
 * @param temperature Body temperature (°C)
 */
void oled_update_health_data(int heart_rate, int spo2, float temperature);

/**
 * @brief OLED display task - receives data from queue and updates display
 * @param param Queue handle for receiving display data
 */
void oled_display_task(void *param);

#endif // OLED_DISPLAY_H