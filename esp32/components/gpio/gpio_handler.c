#include "gpio_handler.h"
#include "config.h"
#include "driver/gpio.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"

static const char *TAG = "GPIO";
static QueueHandle_t btn_evt_queue = NULL;
static button_callback_t button_callback = NULL;

static void IRAM_ATTR button_isr_handler(void* arg) {
    uint32_t gpio_num = BTN_PIN;
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    
    if (btn_evt_queue) {
        xQueueSendFromISR(btn_evt_queue, &gpio_num, &xHigherPriorityTaskWoken);
    }
    
    if (xHigherPriorityTaskWoken) {
        portYIELD_FROM_ISR();
    }
}

static void button_task(void *arg) {
    uint32_t gpio_num;
    
    while (1) {
        if (xQueueReceive(btn_evt_queue, &gpio_num, portMAX_DELAY) == pdTRUE) {
            if (gpio_num == BTN_PIN) {
                ESP_LOGI(TAG, "Button pressed event received");
                
                // Debounce delay
                vTaskDelay(pdMS_TO_TICKS(50));
                
                // Check if button is still pressed
                if (gpio_get_level(BTN_PIN) == 0) {
                    if (button_callback) {
                        button_callback();
                    }
                }
            }
        }
    }
}

esp_err_t gpio_handler_init(button_callback_t callback) {
    ESP_LOGI(TAG, "Initializing GPIO...");

    button_callback = callback;

    // Configure LED pin
    gpio_config_t led_conf = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_OUTPUT,
        .pin_bit_mask = (1ULL << LED_PIN),
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .pull_up_en = GPIO_PULLUP_DISABLE,
    };
    
    esp_err_t err = gpio_config(&led_conf);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to configure LED pin: %s", esp_err_to_name(err));
        return err;
    }

    // Turn on LED
    gpio_set_level(LED_PIN, 1);

    // Configure button pin
    gpio_config_t btn_conf = {
        .intr_type = GPIO_INTR_NEGEDGE,
        .mode = GPIO_MODE_INPUT,
        .pin_bit_mask = (1ULL << BTN_PIN),
        .pull_up_en = GPIO_PULLUP_ENABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
    };
    
    err = gpio_config(&btn_conf);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to configure button pin: %s", esp_err_to_name(err));
        return err;
    }

    // Create event queue for button
    btn_evt_queue = xQueueCreate(10, sizeof(uint32_t));
    if (!btn_evt_queue) {
        ESP_LOGE(TAG, "Failed to create button queue");
        return ESP_ERR_NO_MEM;
    }

    // Install GPIO ISR service
    err = gpio_install_isr_service(0);
    if (err != ESP_OK && err != ESP_ERR_INVALID_STATE) {
        ESP_LOGE(TAG, "Failed to install ISR service: %s", esp_err_to_name(err));
        return err;
    }

    // Add ISR handler for button
    err = gpio_isr_handler_add(BTN_PIN, button_isr_handler, NULL);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to add ISR handler: %s", esp_err_to_name(err));
        return err;
    }

    // Create button task
    BaseType_t ret = xTaskCreate(button_task, "button_task", 2048, NULL, 5, NULL);
    if (ret != pdPASS) {
        ESP_LOGE(TAG, "Failed to create button task");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "GPIO initialized successfully");
    return ESP_OK;
}

esp_err_t gpio_set_led(uint8_t state) {
    gpio_set_level(LED_PIN, state ? 1 : 0);
    ESP_LOGD(TAG, "LED set to %s", state ? "ON" : "OFF");
    return ESP_OK;
}