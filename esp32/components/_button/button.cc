#include "button.h"
#include <esp_log.h>

#define TAG "Button"

Button::Button(button_handle_t button_handle) : button_handle_(button_handle)
{
}

Button::~Button()
{
    if (button_handle_ != nullptr)
    {
        iot_button_delete(button_handle_);
    }
}

void Button::OnSingleClick(std::function<void()> callback)
{
    if (button_handle_ == nullptr)
        return;
    on_single_click_ = callback;
    iot_button_register_cb(button_handle_, BUTTON_SINGLE_CLICK, [](void *handle, void *user_data)
                           {
        Button* button = static_cast<Button*>(user_data);
        if (button->on_single_click_) {
            button->on_single_click_();
        } }, this);
}

void Button::OnDoubleClick(std::function<void()> callback)
{
    if (button_handle_ == nullptr)
        return;
    on_double_click_ = callback;
    iot_button_register_cb(button_handle_, BUTTON_DOUBLE_CLICK, [](void *handle, void *user_data)
                           {
        Button* button = static_cast<Button*>(user_data);
        if (button->on_double_click_) {
            button->on_double_click_();
        } }, this);
}

void Button::OnLongPress(std::function<void()> callback)
{
    if (button_handle_ == nullptr)
        return;
    on_long_press_ = callback;
    iot_button_register_cb(button_handle_, BUTTON_LONG_PRESS_START, [](void *handle, void *user_data)
                           {
        Button* button = static_cast<Button*>(user_data);
        if (button->on_long_press_) {
            button->on_long_press_();
        } }, this);
}
