#include "alarm_manager.h"
#include "driver/gpio.h"
#include "esp_log.h"

static const char *TAG = "ALARM";
extern EventGroupHandle_t g_event_group;
static alarm_type_t s_current_alarm = ALARM_NONE;
static bool s_buzzer_enabled = false;
static bool alarm_on = false;

esp_err_t alarm_manager_init() {
    if (!g_event_group) {
        ESP_LOGE(TAG, "Invalid event group");
        return ESP_ERR_INVALID_ARG;
    }

    // Configure buzzer pin
    gpio_config_t buzzer_conf = {
        .intr_type = GPIO_INTR_DISABLE,
        .mode = GPIO_MODE_OUTPUT,
        .pin_bit_mask = (1ULL << BUZZER_PIN),
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .pull_up_en = GPIO_PULLUP_DISABLE,
    };
    
    esp_err_t err = gpio_config(&buzzer_conf);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to configure buzzer pin: %s", esp_err_to_name(err));
        return err;
    }

    s_buzzer_enabled = true;
    gpio_set_level(BUZZER_PIN, 0);
    ESP_LOGI(TAG, "Alarm manager initialized");
    return ESP_OK;
}

void alarm_check_health_data(int heart_rate, double spo2, float temperature) {
    alarm_type_t new_alarm = ALARM_NONE;

    if(heart_rate < HR_MIN_NORMAL){
        new_alarm = ALARM_HEART_RATE_LOW;
    }else if(heart_rate > HR_MAX_NORMAL){
        new_alarm = ALARM_HEART_RATE_HIGH;
    }else if(spo2 < SPO2_MIN_NORMAL){
        new_alarm = ALARM_SPO2_LOW;
    }else if(temperature > TEMP_MAX_NORMAL){
        new_alarm = ALARM_TEMP_HIGH;
    }

    if(new_alarm != ALARM_NONE && new_alarm != s_current_alarm){
        s_current_alarm = new_alarm;

        if(s_buzzer_enabled) {
            gpio_set_level(BUZZER_PIN, 1);
        }

        if(g_event_group){
            xEventGroupSetBits(g_event_group, ALARM_ACTIVE_BIT);
        }

        ESP_LOGW(TAG, "Health alarm triggered: %s", alarm_get_string());
    } else if(new_alarm == ALARM_NONE && s_current_alarm != ALARM_NONE && s_current_alarm != ALARM_SOS){
        s_current_alarm = ALARM_NONE;
        gpio_set_level(BUZZER_PIN, 0);

        if(g_event_group){
            xEventGroupClearBits(g_event_group, ALARM_ACTIVE_BIT);
        }
        ESP_LOGI(TAG, "Health parameters normalized");
    }
}

void alarm_trigger_sos(void) {
    s_current_alarm = ALARM_SOS;
    
    if (s_buzzer_enabled) {
        gpio_set_level(BUZZER_PIN, 1);
    }
    
    if (g_event_group) {
        xEventGroupSetBits(g_event_group, ALARM_ACTIVE_BIT);
    }
    
    ESP_LOGW(TAG, "SOS alarm triggered!");
}

void alarm_stop_buzzer(void) {
    gpio_set_level(BUZZER_PIN, 0);
    
    ESP_LOGI(TAG, "Buzzer stopped by user");
    
    alarm_on = false;
    s_current_alarm = ALARM_NONE;
    if (g_event_group) {
        xEventGroupClearBits(g_event_group, ALARM_ACTIVE_BIT);
    }
}

bool alarm_is_active(void) {
    return s_current_alarm != ALARM_NONE;
}

alarm_type_t alarm_get_current_type(void) {
    return s_current_alarm;
}

const char* alarm_get_string(void) {
    if(alarm_on) s_current_alarm = ALARM_SOS;

    switch (s_current_alarm) {
        case ALARM_HEART_RATE_HIGH:
            return "heart_rate_high";
        case ALARM_HEART_RATE_LOW:
            return "heart_rate_low";
        case ALARM_SPO2_LOW:
            return "spo2_low";
        case ALARM_TEMP_HIGH:
            return "temperature_high";
        case ALARM_SOS:
            return "sos";
        default:
            return "normal";
    }
}