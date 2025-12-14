#include "oled_display.h"
#include "esp_log.h"
#include <stdio.h>
#include <string.h>

static const char *TAG = "OLED";

static u8g2_t s_u8g2;

/**
 * @brief Initialize OLED display
 * @param byte_cb I2C byte callback function
 * @param gpio_cb GPIO and delay callback function
 * @return ESP_OK on success
 */
esp_err_t oled_display_init(u8x8_msg_cb byte_cb, u8x8_msg_cb gpio_cb)
{
    ESP_LOGI(TAG, "Initializing u8g2 OLED...");

    // Setup driver for SSD1306 128x64 display
    // R0 = no rotation
    u8g2_Setup_ssd1306_i2c_128x64_noname_f(
        &s_u8g2,
        U8G2_R0,      // No rotation
        byte_cb,      // I2C byte callback
        gpio_cb       // GPIO and delay callback
    );

    // Initialize display hardware
    u8g2_InitDisplay(&s_u8g2);

    // Wake up display (disable power save mode)
    u8g2_SetPowerSave(&s_u8g2, 0);

    // Clear display buffer and send to screen
    u8g2_ClearBuffer(&s_u8g2);
    u8g2_SendBuffer(&s_u8g2);

    ESP_LOGI(TAG, "OLED Initialized Successfully");
    return ESP_OK;
}

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
void oled_update_health_data(int heart_rate, int spo2, float temperature)
{
    // Clear buffer before drawing new frame
    u8g2_ClearBuffer(&s_u8g2);

    /* ========================================================================
     * DRAW LAYOUT GRID
     * ======================================================================== */
    // Vertical line dividing left/right (at X=63)
    u8g2_DrawVLine(&s_u8g2, 63, 0, 64);
    
    // Horizontal line dividing right top/bottom (at Y=31, from X=64)
    u8g2_DrawHLine(&s_u8g2, 64, 31, 64);

    /* ========================================================================
     * LEFT SECTION: HEART RATE
     * Area: X: 0-62, Y: 0-63
     * ======================================================================== */
    
    // Draw heart icon (32x32 pixels)
    u8g2_SetFont(&s_u8g2, u8g2_font_open_iconic_human_4x_t);
    u8g2_DrawGlyph(&s_u8g2, 15, 32, 0x42);  // Heart icon

    // Draw heart rate number (large font, 24px)
    u8g2_SetFont(&s_u8g2, u8g2_font_logisoso24_tn);
    char hr_str[5];
    snprintf(hr_str, sizeof(hr_str), "%d", heart_rate);

    // Center the number horizontally
    int hr_width = u8g2_GetStrWidth(&s_u8g2, hr_str);
    int hr_x = 32 - (hr_width / 2);  // Center at X=32
    u8g2_DrawStr(&s_u8g2, hr_x, 63, hr_str);

    /* ========================================================================
     * TOP RIGHT SECTION: SpO2
     * Area: X: 64-127, Y: 0-30
     * ======================================================================== */
    
    // Draw water drop icon (16x16 pixels)
    u8g2_SetFont(&s_u8g2, u8g2_font_open_iconic_thing_2x_t);
    u8g2_DrawGlyph(&s_u8g2, 66, 24, 0x0048);  // Water drop icon

    // Draw SpO2 number (bold 14px font)
    u8g2_SetFont(&s_u8g2, u8g2_font_helvB14_tr);
    char spo2_str[6];
    snprintf(spo2_str, sizeof(spo2_str), "%d", spo2);
    u8g2_DrawStr(&s_u8g2, 88, 24, spo2_str);

    // Draw percent symbol (small font)
    u8g2_SetFont(&s_u8g2, u8g2_font_u8glib_4_tf);
    u8g2_DrawStr(&s_u8g2, 118, 24, "%");

    /* ========================================================================
     * BOTTOM RIGHT SECTION: TEMPERATURE
     * Area: X: 64-127, Y: 32-63
     * ======================================================================== */

    // Draw thermometer icon (16x16 pixels)
    u8g2_SetFont(&s_u8g2, u8g2_font_open_iconic_weather_2x_t);
    u8g2_DrawGlyph(&s_u8g2, 66, 56, 0x0045);  // Thermometer icon

    // Draw temperature number (bold 14px font)
    u8g2_SetFont(&s_u8g2, u8g2_font_helvB14_tr);
    char temp_str[8];
    snprintf(temp_str, sizeof(temp_str), "%.1f", temperature);
    u8g2_DrawStr(&s_u8g2, 88, 56, temp_str);

    // Draw degree symbol (small font)
    u8g2_SetFont(&s_u8g2, u8g2_font_u8glib_4_tf);
    u8g2_DrawStr(&s_u8g2, 122, 52, "o");

    /* ========================================================================
     * SEND BUFFER TO DISPLAY
     * ======================================================================== */
    u8g2_SendBuffer(&s_u8g2);
}

/**
 * @brief OLED display task - receives data from queue and updates display
 * @param param Queue handle for receiving display data
 */
void oled_display_task(void *param)
{
    QueueHandle_t input_queue = (QueueHandle_t)param;
    display_data_t data;

    if (input_queue == NULL) {
        ESP_LOGE(TAG, "Input queue is NULL, deleting task");
        vTaskDelete(NULL);
        return;
    }

    ESP_LOGI(TAG, "OLED display task started");

    while (1) {
        // Wait for data from queue
        if (xQueueReceive(input_queue, &data, portMAX_DELAY) == pdPASS) {
            // Update display with received data
            oled_update_health_data(data.heart_rate, data.spo2, data.temperature);
        }
    }
}