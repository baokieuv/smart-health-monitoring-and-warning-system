#ifndef SYS_BUTTON_H
#define SYS_BUTTON_H

#include "esp_err.h"
#include "driver/gpio.h"
#include "esp_event.h"

ESP_EVENT_DECLARE_BASE(APP_BUTTON_EVENT);

typedef enum
{
    BUTTON_EVENT_SINGLE_CLICK, // Bấm 1 lần (Chuyển AP <-> STA)
    BUTTON_EVENT_DOUBLE_CLICK, // Bấm 2 lần
    BUTTON_EVENT_LONG_PRESS    // Bấm giữ (Chuyển HTTP View)
} app_button_event_id_t;

esp_err_t sys_button_init(gpio_num_t pin_num);

#endif