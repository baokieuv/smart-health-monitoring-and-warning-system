#ifndef GPIO_HANDLER_H
#define GPIO_HANDLER_H

#include "esp_err.h"

/**
 * @brief Callback function type for button press events
 */
typedef void (*button_callback_t)(void);

/**
 * @brief Initialize GPIO pins and button handler
 * @param callback Function to call when button is pressed
 */
esp_err_t gpio_handler_init(button_callback_t callback);

/**
 * @brief Set LED state
 * @param state true for ON, false for OFF
 */
esp_err_t gpio_set_led(uint8_t state);

#endif // GPIO_HANDLER_H