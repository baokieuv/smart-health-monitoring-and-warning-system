#ifndef OLED_DISPLAY_H
#define OLED_DISPLAY_H

#include <driver/i2c_master.h>
#include "esp_err.h"

#define OLED_I2C_SCL_PIN 42
#define OLED_I2C_SDA_PIN 41
#define I2C_MASTER_FREQ_HZ 100000
#define OLED_I2C_ADDRESS 0x3C

esp_err_t oled_display_init(void);

void oled_draw_icon(uint8_t page, uint8_t col, const uint8_t *icon);

void oled_draw_char(uint8_t page, uint8_t col, char ch);

void oled_draw_text(uint8_t page, uint8_t col, const char *text);

void oled_clear_display(void);

void oled_update_health_data(int heart_rate, int spo2, float temperature);

void oled_display_task(void *param);

#endif // OLED_DISPLAY_H
