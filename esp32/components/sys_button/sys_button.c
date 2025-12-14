#include "sys_button.h"
#include "iot_button.h"
#include "esp_log.h"
#include "esp_event.h"
#include "freertos/FreeRTOS.h"

static const char *TAG = "BUTTON";

typedef struct {
    uint8_t button_id;
    const char* event_base;
} button_context_t;

// Button 1 context
static button_context_t s_btn1_context = {
    .button_id = 1,
    .event_base = BUTTON1_EVENT_BASE
};

// Button 2 context
static button_context_t s_btn2_context = {
    .button_id = 2,
    .event_base = BUTTON2_EVENT_BASE
};

/**
 * @brief Single click callback
 * @param arg Button handle (unused)
 * @param data Button context
 */
static void button_single_click_cb(void *arg, void *data) {
    button_context_t *ctx = (button_context_t *)data;
    ESP_LOGI(TAG, "Button %d: Single Click", ctx->button_id);
    
    // Post event to event loop
    esp_event_post(ctx->event_base, BTN_SINGLE_CLICK, 
                   NULL, 0, portMAX_DELAY);
}

/**
 * @brief Double click callback
 * @param arg Button handle (unused)
 * @param data Button context
 */
static void button_double_click_cb(void *arg, void *data) {
    button_context_t *ctx = (button_context_t *)data;
    ESP_LOGI(TAG, "Button %d: Double Click", ctx->button_id);
    
    // Post event to event loop
    esp_event_post(ctx->event_base, BTN_DOUBLE_CLICK, 
                   NULL, 0, portMAX_DELAY);
}

/**
 * @brief Long press callback
 * @param arg Button handle (unused)
 * @param data Button context
 */
static void button_long_press_start_cb(void *arg, void *data) {
    button_context_t *ctx = (button_context_t *)data;
    ESP_LOGI(TAG, "Button %d: Long Press", ctx->button_id);
    
    // Post event to event loop
    esp_event_post(ctx->event_base, BTN_LONG_PRESS, 
                   NULL, 0, portMAX_DELAY);
}

/**
 * @brief Initialize button with callbacks
 * @param pin_num GPIO pin number
 * @param context Button context
 * @param button_id Button ID for logging
 * @return ESP_OK on success
 */
static esp_err_t button_init(gpio_num_t pin_num, button_context_t *context, 
                             int button_id) {
    ESP_LOGI(TAG, "Initializing Button %d on GPIO %d", button_id, pin_num);
    
    // Configure button
    button_config_t gpio_btn_cfg = {
        .type = BUTTON_TYPE_GPIO,
        .long_press_time = 1500,  // Long press: 1.5 seconds
        .short_press_time = 150,  // Short press: 150ms
        .gpio_button_config = {
            .gpio_num = pin_num,
            .active_level = 0,         // Active LOW (button pressed = 0)
            .disable_pull = false,     // Use internal pull resistor
        },
    };

    // Create button handle
    button_handle_t gpio_btn_handle = iot_button_create(&gpio_btn_cfg);
    if (NULL == gpio_btn_handle) {
        ESP_LOGE(TAG, "Button %d create failed", button_id);
        return ESP_FAIL;
    }

    // Register button event callbacks
    iot_button_register_cb(gpio_btn_handle, BUTTON_SINGLE_CLICK, 
                           button_single_click_cb, (void *)context);
    
    iot_button_register_cb(gpio_btn_handle, BUTTON_DOUBLE_CLICK, 
                           button_double_click_cb, (void *)context);
    
    iot_button_register_cb(gpio_btn_handle, BUTTON_LONG_PRESS_START, 
                           button_long_press_start_cb, (void *)context);

    ESP_LOGI(TAG, "Button %d initialized successfully", button_id);
    return ESP_OK;
}

/**
 * @brief Initialize Button 1
 * @param pin_num GPIO pin number for button 1
 * @return ESP_OK on success
 */
esp_err_t button_manager_init_button1(gpio_num_t pin_num) {
    return button_init(pin_num, &s_btn1_context, 1);
}

/**
 * @brief Initialize Button 2
 * @param pin_num GPIO pin number for button 2
 * @return ESP_OK on success
 */
esp_err_t button_manager_init_button2(gpio_num_t pin_num) {
    return button_init(pin_num, &s_btn2_context, 2);
}