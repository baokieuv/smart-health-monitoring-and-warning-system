#ifndef BUTTON_H
#define BUTTON_H

#include <driver/gpio.h>
#include "iot_button.h"
#include <button_gpio.h>
#include <functional>

class Button
{
public:
    Button(button_handle_t button_handle);
    ~Button();

    void OnSingleClick(std::function<void()> callback);
    void OnDoubleClick(std::function<void()> callback);
    void OnLongPress(std::function<void()> callback);

protected:
    gpio_num_t gpio_num_;
    button_handle_t button_handle_ = nullptr;

    std::function<void()> on_single_click_;
    std::function<void()> on_double_click_;
    std::function<void()> on_long_press_;
};
#endif // BUTTON_H