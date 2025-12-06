#include "sys_button.h"
#include "iot_button.h"
#include "esp_log.h"
#include "esp_event.h"
#include "freertos/FreeRTOS.h"

static const char *TAG = "SYS_BUTTON";

typedef struct {
    uint8_t button_id;
    const char* event_base;
} button_context_t;

button_context_t btn1_context = {
    .button_id = 1,
    .event_base = "BUTTON1_EVENT"
};

button_context_t btn2_context = {
    .button_id = 2,
    .event_base = "BUTTON2_EVENT"
};

static void button_single_click_cb(void *arg, void *data)
{
    button_context_t *ctx = (button_context_t *)data;
    ESP_LOGI(TAG, "(%d) (%s) Single Click Detected -> Posting Event", ctx->button_id, ctx->event_base);
    esp_event_post(ctx->event_base, BUTTON_EVENT_SINGLE_CLICK, NULL, 0, portMAX_DELAY);
}

static void button_double_click_cb(void *arg, void *data)
{
    button_context_t *ctx = (button_context_t *)data;
    ESP_LOGI(TAG, "(%d) (%s) Double Click Detected -> Posting Event", ctx->button_id, ctx->event_base);
    esp_event_post(ctx->event_base, BUTTON_EVENT_DOUBLE_CLICK, NULL, 0, portMAX_DELAY);
}

static void button_long_press_start_cb(void *arg, void *data)
{
    button_context_t *ctx = (button_context_t *)data;
    ESP_LOGI(TAG, "(%d) (%s) Long Press Detected -> Posting Event", ctx->button_id, ctx->event_base);
    esp_event_post(ctx->event_base, BUTTON_EVENT_LONG_PRESS, NULL, 0, portMAX_DELAY);
}

esp_err_t button_manager_init_button1(gpio_num_t pin_num){
    ESP_LOGI(TAG, "Initializing Button 1 on GPIO %d", pin_num);
    
    button_config_t gpio_btn_cfg = {
        .type = BUTTON_TYPE_GPIO,
        .long_press_time = 1500, // Bấm giữ 1.5s
        .short_press_time = 150, // Bấm ngắn 150ms
        .gpio_button_config = {
            .gpio_num = pin_num,
            .active_level = 0,     // 0 nối GND, 1 nối VCC
            .disable_pull = false, // Cho sử dụng điện trở kéo lên/xuống nội
        },
    };

    button_handle_t gpio_btn_handle = iot_button_create(&gpio_btn_cfg);
    if (NULL == gpio_btn_handle)
    {
        ESP_LOGE(TAG, "Button create failed");
        return ESP_FAIL;
    }

    iot_button_register_cb(gpio_btn_handle, BUTTON_SINGLE_CLICK, button_single_click_cb, (void *)&btn1_context);
    iot_button_register_cb(gpio_btn_handle, BUTTON_DOUBLE_CLICK, button_double_click_cb, (void *)&btn1_context);
    iot_button_register_cb(gpio_btn_handle, BUTTON_LONG_PRESS_START, button_long_press_start_cb, (void *)&btn1_context);

    return ESP_OK;    
}

esp_err_t button_manager_init_button2(gpio_num_t pin_num){
    ESP_LOGI(TAG, "Initializing Button 2 on GPIO %d", pin_num);
    
    button_config_t gpio_btn_cfg = {
        .type = BUTTON_TYPE_GPIO,
        .long_press_time = 1500, // Bấm giữ 1.5s
        .short_press_time = 150, // Bấm ngắn 150ms
        .gpio_button_config = {
            .gpio_num = pin_num,
            .active_level = 0,     // 0 nối GND, 1 nối VCC
            .disable_pull = false, // Cho sử dụng điện trở kéo lên/xuống nội
        },
    };

    button_handle_t gpio_btn_handle = iot_button_create(&gpio_btn_cfg);
    if (NULL == gpio_btn_handle)
    {
        ESP_LOGE(TAG, "Button create failed");
        return ESP_FAIL;
    }

    iot_button_register_cb(gpio_btn_handle, BUTTON_SINGLE_CLICK, button_single_click_cb, (void *)&btn2_context);
    iot_button_register_cb(gpio_btn_handle, BUTTON_DOUBLE_CLICK, button_double_click_cb, (void *)&btn2_context);
    iot_button_register_cb(gpio_btn_handle, BUTTON_LONG_PRESS_START, button_long_press_start_cb, (void *)&btn2_context);

    return ESP_OK;    
}

// esp_err_t sys_button_init(gpio_num_t pin_num)
// {
//     button_config_t gpio_btn_cfg = {
//         .type = BUTTON_TYPE_GPIO,
//         .long_press_time = 1500, // Bấm giữ 1.5s
//         .short_press_time = 150, // Bấm ngắn 150ms
//         .gpio_button_config = {
//             .gpio_num = pin_num,
//             .active_level = 0,     // 0 nối GND, 1 nối VCC
//             .disable_pull = false, // Cho sử dụng điện trở kéo lên/xuống nội
//         },
//     };

//     button_handle_t gpio_btn_handle = iot_button_create(&gpio_btn_cfg);
//     if (NULL == gpio_btn_handle)
//     {
//         ESP_LOGE(TAG, "Button create failed");
//         return ESP_FAIL;
//     }

//     iot_button_register_cb(gpio_btn_handle, BUTTON_SINGLE_CLICK, button_single_click_cb, NULL);
//     iot_button_register_cb(gpio_btn_handle, BUTTON_DOUBLE_CLICK, button_double_click_cb, NULL);
//     iot_button_register_cb(gpio_btn_handle, BUTTON_LONG_PRESS_START, button_long_press_start_cb, NULL);

//     return ESP_OK;
// }