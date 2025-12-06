#ifndef OLED_DISPLAY_H
#define OLED_DISPLAY_H

#include "esp_err.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "u8g2.h"

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
 * @brief Khởi tạo màn hình OLED sử dụng thư viện u8g2
 * @return ESP_OK nếu thành công
 */
esp_err_t oled_display_init(u8x8_msg_cb byte_cb, u8x8_msg_cb gpio_cb);

/**
 * @brief Cập nhật màn hình với dữ liệu mới (Hàm nội bộ, nhưng có thể gọi trực tiếp nếu cần)
 * * @param heart_rate Nhịp tim
 * @param spo2 Nồng độ oxy
 * @param temperature Nhiệt độ
 */
void oled_update_health_data(int heart_rate, int spo2, float temperature);

/**
 * @brief Task FreeRTOS để nhận dữ liệu từ Queue và hiển thị
 * @param param Handle của Queue (QueueHandle_t)
 */
void oled_display_task(void *param);

#endif // OLED_DISPLAY_H