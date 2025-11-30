#include "oled_display.h"
#include "esp_log.h"
#include <stdio.h>
#include <string.h>

static const char *TAG = "OLED";
static u8g2_t u8g2;

esp_err_t oled_display_init(u8x8_msg_cb byte_cb, u8x8_msg_cb gpio_cb)
{
    ESP_LOGI(TAG, "Initializing u8g2 OLED...");

    // Setup Driver cho màn SSD1306 128x64
    // Rotation R0: Không xoay màn hình
    u8g2_Setup_ssd1306_i2c_128x64_noname_f(
        &u8g2,
        U8G2_R0,
        byte_cb,
        gpio_cb);

    // Khởi động màn hình
    u8g2_InitDisplay(&u8g2);     // Gửi lệnh init sequence
    u8g2_SetPowerSave(&u8g2, 0); // Wake up display
    u8g2_ClearBuffer(&u8g2);
    u8g2_SendBuffer(&u8g2);

    ESP_LOGI(TAG, "OLED Initialized Successfully");
    return ESP_OK;
}

void oled_update_health_data(int heart_rate, int spo2, float temperature)
{
    // Xóa bộ đệm trước khi vẽ khung hình mới
    u8g2_ClearBuffer(&u8g2);

    // ================= KHUNG GIAO DIỆN (GRID) =================
    // Kẻ dọc phân chia Trái/Phải (Tại X=63)
    u8g2_DrawVLine(&u8g2, 63, 0, 64);
    // Kẻ ngang phân chia Phải Trên/Dưới (Tại Y=31, bắt đầu từ X=64)
    u8g2_DrawHLine(&u8g2, 64, 31, 64);

    // ================= PHẦN TRÁI: NHỊP TIM (HR) =================
    // Vùng vẽ: X: 0-62, Y: 0-63

    // Icon Tim (Font Iconic size 4x -> 32x32 pixel)
    u8g2_SetFont(&u8g2, u8g2_font_open_iconic_human_4x_t);
    u8g2_DrawGlyph(&u8g2, 15, 32, 0x42);

    // Số Nhịp tim (Font số to Logisoso 24px)
    u8g2_SetFont(&u8g2, u8g2_font_logisoso24_tn);
    char hr_str[5];
    snprintf(hr_str, sizeof(hr_str), "%d", heart_rate);

    // Căn giữa số: Tính độ rộng chuỗi để xác định X
    int hr_width = u8g2_GetStrWidth(&u8g2, hr_str);
    int hr_x = 32 - (hr_width / 2);        // Tâm 32 trừ đi 1/2 độ rộng
    u8g2_DrawStr(&u8g2, hr_x, 63, hr_str); // Vẽ sát đáy Y=63

    // ================= PHẦN PHẢI TRÊN: SpO2 =================
    // Vùng vẽ: X: 64-127, Y: 0-30

    // Icon Giọt nước (Font Iconic Thing size 2x -> 16x16 pixel)
    u8g2_SetFont(&u8g2, u8g2_font_open_iconic_thing_2x_t);
    // Icon 'H' là giọt nước. Vẽ tại X=66, Y=24 (Căn chỉnh bằng mắt cho đẹp)
    u8g2_DrawGlyph(&u8g2, 66, 24, 0x0048);

    // Số SpO2 (Font số đậm 14px hoặc 18px)
    u8g2_SetFont(&u8g2, u8g2_font_helvB14_tr);
    char spo2_str[6];
    snprintf(spo2_str, sizeof(spo2_str), "%d", spo2);
    u8g2_DrawStr(&u8g2, 88, 24, spo2_str); // X=88 để tránh đè icon

    // Vẽ ký tự % nhỏ hơn (Optional)
    u8g2_SetFont(&u8g2, u8g2_font_u8glib_4_tf); // Font siêu nhỏ
    u8g2_DrawStr(&u8g2, 118, 24, "%");

    // ================= PHẦN PHẢI DƯỚI: NHIỆT ĐỘ =================
    // Vùng vẽ: X: 64-127, Y: 32-63

    // Icon Nhiệt kế (Font Iconic Weather size 2x -> 16x16 pixel)
    u8g2_SetFont(&u8g2, u8g2_font_open_iconic_weather_2x_t);
    // Icon 'E' là nhiệt kế. Vẽ tại X=66, Y=56
    u8g2_DrawGlyph(&u8g2, 66, 56, 0x0045);

    // Số Nhiệt độ
    u8g2_SetFont(&u8g2, u8g2_font_helvB14_tr);
    char temp_str[8];
    snprintf(temp_str, sizeof(temp_str), "%.1f", temperature);
    u8g2_DrawStr(&u8g2, 88, 56, temp_str);

    // Vẽ ký tự độ C nhỏ
    u8g2_SetFont(&u8g2, u8g2_font_u8glib_4_tf);
    u8g2_DrawStr(&u8g2, 122, 52, "o");

    // ================= GỬI DỮ LIỆU RA MÀN HÌNH =================
    u8g2_SendBuffer(&u8g2);
}

void oled_display_task(void *param)
{
    QueueHandle_t input_queue = (QueueHandle_t)param;
    display_data_t data;

    if (input_queue == NULL)
    {
        ESP_LOGE(TAG, "Input queue is NULL, deleting task");
        vTaskDelete(NULL);
    }

    ESP_LOGI(TAG, "OLED Task Started");

    while (1)
    {
        if (xQueueReceive(input_queue, &data, portMAX_DELAY) == pdPASS)
        {
            oled_update_health_data(data.heart_rate, data.spo2, data.temperature);
        }
    }
}