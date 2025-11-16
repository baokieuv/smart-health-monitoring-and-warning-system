#include "oled_display.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

#define TAG "OLED"

// SSD1306 Commands
#define SSD1306_CMD_SET_CONTRAST 0x81
#define SSD1306_CMD_DISPLAY_RAM 0xA4
#define SSD1306_CMD_DISPLAY_ALLON 0xA5
#define SSD1306_CMD_DISPLAY_NORMAL 0xA6
#define SSD1306_CMD_DISPLAY_INVERTED 0xA7
#define SSD1306_CMD_DISPLAY_OFF 0xAE
#define SSD1306_CMD_DISPLAY_ON 0xAF
#define SSD1306_CMD_SET_MEMORY_ADDR_MODE 0x20
#define SSD1306_CMD_SET_COLUMN_RANGE 0x21
#define SSD1306_CMD_SET_PAGE_RANGE 0x22

static i2c_master_bus_handle_t i2c_bus_handle = NULL;
static i2c_master_dev_handle_t oled_dev_handle = NULL;

// Custom 16x16 bitmap icons (2 rows of 8 bytes each)
static const uint8_t icon_heart[32] = {
    // Row 1
    0x00, 0x00, 0x7C, 0xFE, 0xFE, 0xFE, 0xFC, 0xF8, 0xF8, 0xFC, 0xFE, 0xFE, 0xFE, 0x7C, 0x00, 0x00,
    // Row 2
    0x00, 0x00, 0x00, 0x01, 0x03, 0x07, 0x0F, 0x1F, 0x1F, 0x0F, 0x07, 0x03, 0x01, 0x00, 0x00, 0x00};

static const uint8_t icon_droplet[32] = {
    // Row 1
    0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0xF0, 0xFC, 0xF0, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    // Row 2
    0x00, 0x00, 0x00, 0x00, 0x0E, 0x1F, 0x3F, 0x3F, 0x3F, 0x1F, 0x0E, 0x00, 0x00, 0x00, 0x00, 0x00};

static const uint8_t icon_thermometer[32] = {
    // Row 1
    0x00, 0x00, 0x00, 0x00, 0x00, 0xF8, 0x04, 0x04, 0xF8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    // Row 2
    0x00, 0x00, 0x00, 0x0C, 0x1E, 0x3F, 0x2C, 0x2C, 0x3F, 0x1E, 0x0C, 0x00, 0x00, 0x00, 0x00, 0x00};

static const uint8_t font8x16_top[][8] = {
    {0x00, 0xE0, 0x10, 0x08, 0x08, 0x10, 0xE0, 0x00}, // 0
    {0x00, 0x00, 0x20, 0x20, 0xF8, 0x00, 0x00, 0x00}, // 1
    {0x00, 0x30, 0x08, 0x08, 0x08, 0x88, 0x70, 0x00}, // 2
    {0x00, 0x30, 0x08, 0x88, 0x88, 0x88, 0x70, 0x00}, // 3
    {0x00, 0x80, 0x40, 0x20, 0x10, 0xF8, 0x00, 0x00}, // 4
    {0x00, 0xF8, 0x88, 0x88, 0x88, 0x88, 0x08, 0x00}, // 5
    {0x00, 0xE0, 0x10, 0x88, 0x88, 0x88, 0x00, 0x00}, // 6
    {0x00, 0x08, 0x08, 0x08, 0x08, 0xC8, 0x38, 0x00}, // 7
    {0x00, 0x70, 0x88, 0x88, 0x88, 0x88, 0x70, 0x00}, // 8
    {0x00, 0xE0, 0x10, 0x08, 0x08, 0x10, 0xE0, 0x00}, // 9
    {0x00, 0xE0, 0x10, 0x08, 0x08, 0x08, 0x10, 0x00}, // C
};

static const uint8_t font8x16_bottom[][8] = {
    {0x00, 0x07, 0x08, 0x10, 0x10, 0x08, 0x07, 0x00}, // 0
    {0x00, 0x00, 0x00, 0x00, 0x1F, 0x00, 0x00, 0x00}, // 1
    {0x00, 0x1C, 0x12, 0x11, 0x10, 0x10, 0x10, 0x00}, // 2
    {0x00, 0x0C, 0x10, 0x10, 0x10, 0x10, 0x0F, 0x00}, // 3
    {0x00, 0x01, 0x01, 0x01, 0x01, 0x1F, 0x01, 0x00}, // 4
    {0x00, 0x0C, 0x10, 0x10, 0x10, 0x10, 0x0F, 0x00}, // 5
    {0x00, 0x0F, 0x10, 0x10, 0x10, 0x10, 0x0F, 0x00}, // 6
    {0x00, 0x00, 0x00, 0x00, 0x1F, 0x00, 0x00, 0x00}, // 7
    {0x00, 0x0F, 0x10, 0x10, 0x10, 0x10, 0x0F, 0x00}, // 8
    {0x00, 0x00, 0x11, 0x11, 0x11, 0x09, 0x07, 0x00}, // 9
    {0x00, 0x07, 0x08, 0x10, 0x10, 0x10, 0x08, 0x00}, // C
};

static esp_err_t ssd1306_write_command(uint8_t cmd)
{
    uint8_t data[2] = {0x00, cmd};
    return i2c_master_transmit(oled_dev_handle, data, 2, -1);
}

static esp_err_t ssd1306_write_data(uint8_t *data, size_t len)
{
    uint8_t *buffer = malloc(len + 1);
    if (!buffer)
        return ESP_ERR_NO_MEM;
    buffer[0] = 0x40;
    memcpy(buffer + 1, data, len);
    esp_err_t ret = i2c_master_transmit(oled_dev_handle, buffer, len + 1, -1);
    free(buffer);
    return ret;
}

static esp_err_t ssd1306_init(void)
{
    vTaskDelay(pdMS_TO_TICKS(100));

    ssd1306_write_command(SSD1306_CMD_DISPLAY_OFF);
    ssd1306_write_command(SSD1306_CMD_SET_MEMORY_ADDR_MODE);
    ssd1306_write_command(0x00); // Horizontal addressing mode
    ssd1306_write_command(SSD1306_CMD_SET_COLUMN_RANGE);
    ssd1306_write_command(0);
    ssd1306_write_command(127);
    ssd1306_write_command(SSD1306_CMD_SET_PAGE_RANGE);
    ssd1306_write_command(0);
    ssd1306_write_command(7);    // 8 pages for 64-pixel height
    ssd1306_write_command(0xA8); // Set multiplex ratio
    ssd1306_write_command(0x3F); // 64 rows for 128x64 OLED
    ssd1306_write_command(0xD3); // Set display offset
    ssd1306_write_command(0x00);
    ssd1306_write_command(0x40); // Set display start line
    ssd1306_write_command(0xA1); // Set segment re-map
    ssd1306_write_command(0xC8); // Set COM output scan direction
    ssd1306_write_command(0xDA); // Set COM pins hardware configuration
    ssd1306_write_command(0x12); // Alternate COM pin for 128x64
    ssd1306_write_command(SSD1306_CMD_SET_CONTRAST);
    ssd1306_write_command(0x7F);
    ssd1306_write_command(SSD1306_CMD_DISPLAY_RAM);
    ssd1306_write_command(SSD1306_CMD_DISPLAY_NORMAL);
    ssd1306_write_command(0xD5); // Set display clock divide ratio
    ssd1306_write_command(0x80);
    ssd1306_write_command(0x8D); // Enable charge pump
    ssd1306_write_command(0x14);
    ssd1306_write_command(SSD1306_CMD_DISPLAY_ON);

    vTaskDelay(pdMS_TO_TICKS(100));

    oled_clear_display();

    ESP_LOGI(TAG, "SSD1306 OLED initialized");
    return ESP_OK;
}

static esp_err_t i2c_master_init(void)
{
    i2c_master_bus_config_t i2c_bus_config = {
        .clk_source = I2C_CLK_SRC_DEFAULT,
        .i2c_port = I2C_NUM_0,
        .scl_io_num = OLED_I2C_SCL_PIN,
        .sda_io_num = OLED_I2C_SDA_PIN,
        .glitch_ignore_cnt = 7,
        .flags.enable_internal_pullup = true,
    };

    ESP_ERROR_CHECK(i2c_new_master_bus(&i2c_bus_config, &i2c_bus_handle));

    i2c_device_config_t oled_dev_config = {
        .dev_addr_length = I2C_ADDR_BIT_LEN_7,
        .device_address = OLED_I2C_ADDRESS,
        .scl_speed_hz = I2C_MASTER_FREQ_HZ,
    };

    ESP_ERROR_CHECK(i2c_master_bus_add_device(i2c_bus_handle, &oled_dev_config, &oled_dev_handle));

    ESP_LOGI(TAG, "I2C master initialized successfully");
    return ESP_OK;
}

esp_err_t oled_display_init(void)
{
    ESP_LOGI(TAG, "Initializing I2C...");
    ESP_ERROR_CHECK(i2c_master_init());

    ESP_LOGI(TAG, "Initializing OLED display...");
    ESP_ERROR_CHECK(ssd1306_init());

    return ESP_OK;
}

// Clear the entire OLED display
void oled_clear_display(void)
{
    uint8_t clear[128] = {0};
    for (int page = 0; page < 8; page++) // 8 pages for 64-pixel height
    {
        ssd1306_write_command(0xB0 + page);
        ssd1306_write_command(0x00);
        ssd1306_write_command(0x10);
        ssd1306_write_data(clear, 128);
    }
}

// Draw 16x16 bitmap icon on OLED (2 pages)
void oled_draw_icon(uint8_t page, uint8_t col, const uint8_t *icon)
{
    // Draw first row (top 8 pixels)
    ssd1306_write_command(0xB0 + page);
    ssd1306_write_command(0x00 | (col & 0x0F));
    ssd1306_write_command(0x10 | ((col >> 4) & 0x0F));
    ssd1306_write_data((uint8_t *)icon, 16);

    // Draw second row (bottom 8 pixels)
    ssd1306_write_command(0xB0 + page + 1);
    ssd1306_write_command(0x00 | (col & 0x0F));
    ssd1306_write_command(0x10 | ((col >> 4) & 0x0F));
    ssd1306_write_data((uint8_t *)(icon + 16), 16);
}

// Draw number/letter using 8x16 font (2 pages)
void oled_draw_char(uint8_t page, uint8_t col, char ch)
{
    int index = -1;

    if (ch >= '0' && ch <= '9')
    {
        index = ch - '0';
    }
    else if (ch == 'C')
    {
        index = 10;
    }

    if (index >= 0)
    {
        // Draw top row (upper 8 pixels)
        ssd1306_write_command(0xB0 + page);
        ssd1306_write_command(0x00 | (col & 0x0F));
        ssd1306_write_command(0x10 | ((col >> 4) & 0x0F));
        ssd1306_write_data((uint8_t *)font8x16_top[index], 8);

        // Draw bottom row (lower 8 pixels)
        ssd1306_write_command(0xB0 + page + 1);
        ssd1306_write_command(0x00 | (col & 0x0F));
        ssd1306_write_command(0x10 | ((col >> 4) & 0x0F));
        ssd1306_write_data((uint8_t *)font8x16_bottom[index], 8);
    }
}

// Draw text string
void oled_draw_text(uint8_t page, uint8_t col, const char *text)
{
    while (*text)
    {
        oled_draw_char(page, col, *text);
        col += 10; // 8 pixels width + 2 pixels spacing
        text++;
    }
}

// Update display with health data
void oled_update_health_data(int heart_rate, int spo2, float temperature)
{
    oled_clear_display();

    // Display heart rate with 16x16 heart icon (pages 0-1)
    oled_draw_icon(0, 0, icon_heart);
    char hr_str[20];
    snprintf(hr_str, sizeof(hr_str), "%d", heart_rate);
    oled_draw_text(0, 24, hr_str);

    // Display SpO2 with 16x16 droplet icon (pages 2-3)
    oled_draw_icon(3, 0, icon_droplet);
    char spo2_str[20];
    snprintf(spo2_str, sizeof(spo2_str), "%d", spo2);
    oled_draw_text(3, 24, spo2_str);

    // Display temperature with 16x16 thermometer icon (pages 5-6)
    oled_draw_icon(6, 0, icon_thermometer);
    char temp_str[20];
    snprintf(temp_str, sizeof(temp_str), "%dC", (int)temperature);
    oled_draw_text(6, 24, temp_str);

    ESP_LOGI(TAG, "Display updated - HR:%d SpO2:%d Temp:%.1f", heart_rate, spo2, temperature);
}

// Display task that continuously updates fake data
void oled_display_task(void *param)
{
    int heart_rate = 70;
    int spo2 = 95;
    float temp = 36.0;
    int counter = 0;

    while (1)
    {
        heart_rate = 70 + (counter % 20);
        spo2 = 95 + (counter % 5);
        temp = 36.0 + (counter % 10) * 0.1;

        oled_update_health_data(heart_rate, spo2, temp);

        counter++;
        vTaskDelay(pdMS_TO_TICKS(2000));
    }
}
