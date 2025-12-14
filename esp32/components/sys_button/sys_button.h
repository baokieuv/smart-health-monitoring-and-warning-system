#ifndef SYS_BUTTON_H
#define SYS_BUTTON_H

#include "esp_err.h"
#include "driver/gpio.h"
#include "sytem_config.h"

/**
 * @brief Initialize Button 1
 * @param pin_num GPIO pin number for button 1
 * @return ESP_OK on success
 */
esp_err_t button_manager_init_button1(gpio_num_t pin_num);

/**
 * @brief Initialize Button 2
 * @param pin_num GPIO pin number for button 2
 * @return ESP_OK on success
 */
esp_err_t button_manager_init_button2(gpio_num_t pin_num);
#endif