#include "alarm_manager.h"
#include "driver/gpio.h"
#include "esp_log.h"
#include <string.h>

static const char *TAG = "ALARM";

extern EventGroupHandle_t g_event_group;
static alarm_type_t s_current_alarm = ALARM_NONE;
static bool s_buzzer_enabled = false;
static uint16_t s_alarm_flags = 0;  // Bit flags for multiple concurrent alarms

/**
 * @brief Initialize alarm manager and buzzer GPIO
 * @return ESP_OK on success
 */
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

    // Initialize buzzer to OFF
    gpio_set_level(BUZZER_PIN, 0);
    s_buzzer_enabled = true;

    ESP_LOGI(TAG, "Alarm manager initialized");
    return ESP_OK;
}

/**
 * @brief Check health data and trigger alarms if thresholds exceeded
 * @param heart_rate Heart rate in BPM
 * @param spo2 Blood oxygen saturation (%)
 * @param temperature Body temperature (°C)
 */
void alarm_check_health_data(int heart_rate, double spo2, float temperature) {
    alarm_type_t new_alarm = ALARM_NONE;

    // Clear previous health-related alarm flags
    s_alarm_flags &= ~((1 << ALARM_HEART_RATE_HIGH) | 
                       (1 << ALARM_HEART_RATE_LOW) | 
                       (1 << ALARM_SPO2_LOW) | 
                       (1 << ALARM_TEMP_HIGH));

    // Check heart rate
    if (heart_rate < HR_MIN_NORMAL) {
        new_alarm = ALARM_HEART_RATE_LOW;
        s_alarm_flags |= (1 << ALARM_HEART_RATE_LOW);
    } 
    else if (heart_rate > HR_MAX_NORMAL) {
        new_alarm = ALARM_HEART_RATE_HIGH;
        s_alarm_flags |= (1 << ALARM_HEART_RATE_HIGH);
    }
    // Check SpO2
    else if (spo2 < SPO2_MIN_NORMAL) {
        new_alarm = ALARM_SPO2_LOW;
        s_alarm_flags |= (1 << ALARM_SPO2_LOW);
    }
    // Check temperature
    else if (temperature > TEMP_MAX_NORMAL) {
        new_alarm = ALARM_TEMP_HIGH;
        s_alarm_flags |= (1 << ALARM_TEMP_HIGH);
    }

    // Trigger alarm if new condition detected
    if (new_alarm != ALARM_NONE && new_alarm != s_current_alarm) {
        s_current_alarm = new_alarm;

        // Activate buzzer
        if (s_buzzer_enabled) {
            gpio_set_level(BUZZER_PIN, 1);
        }

        // Set alarm active bit
        if (g_event_group) {
            xEventGroupSetBits(g_event_group, ALARM_ACTIVE_BIT);
        }

        // Log alarm details
        char alarm_str[128] = {0};
        alarm_get_string(alarm_str);
        ESP_LOGW(TAG, "Health alarm triggered: %s", alarm_str);
    } 
    // Clear alarm if parameters normalized (but not SOS)
    else if(new_alarm == ALARM_NONE && s_current_alarm != ALARM_NONE && s_current_alarm != ALARM_SOS){
        s_current_alarm = ALARM_NONE;
        gpio_set_level(BUZZER_PIN, 0);

        if(g_event_group){
            xEventGroupClearBits(g_event_group, ALARM_ACTIVE_BIT);
        }
        ESP_LOGI(TAG, "Health parameters normalized");
    }
}

/**
 * @brief Trigger SOS alarm (manual emergency button)
 */
void alarm_trigger_sos(void) {
    s_current_alarm = ALARM_SOS;
    s_alarm_flags |= (1 << ALARM_SOS);
    
    // Activate buzzer
    if (s_buzzer_enabled) {
        gpio_set_level(BUZZER_PIN, 1);
    }
    
    // Set alarm active bit
    if (g_event_group) {
        xEventGroupSetBits(g_event_group, ALARM_ACTIVE_BIT);
    }
    
    ESP_LOGW(TAG, "SOS alarm triggered!");
}

/**
 * @brief Trigger fall detection alarm
 */
void alarm_fall_detection(void) {
    // Don't override SOS alarm
    if (s_current_alarm != ALARM_SOS) {
        s_current_alarm = ALARM_FALL_DETECTION;
    }
    
    s_alarm_flags |= (1 << ALARM_FALL_DETECTION);
    
    // Activate buzzer
    if (s_buzzer_enabled) {
        gpio_set_level(BUZZER_PIN, 1);
    }
    
    // Set alarm active bit
    if (g_event_group) {
        xEventGroupSetBits(g_event_group, ALARM_ACTIVE_BIT);
    }
    
    ESP_LOGW(TAG, "Fall detection alarm triggered!");
}

/**
 * @brief Stop buzzer and clear all alarms (user acknowledgement)
 */
void alarm_stop_buzzer(void) {
    gpio_set_level(BUZZER_PIN, 0);
    
    ESP_LOGI(TAG, "Buzzer stopped by user");
    
    // Clear all alarms
    s_current_alarm = ALARM_NONE;
    s_alarm_flags = 0;
    
    if (g_event_group) {
        xEventGroupClearBits(g_event_group, ALARM_ACTIVE_BIT);
    }
}

/**
 * @brief Check if any alarm is currently active
 * @return true if alarm active, false otherwise
 */
bool alarm_is_active(void) {
    return s_current_alarm != ALARM_NONE;
}

/**
 * @brief Get current alarm type
 * @return Current alarm type
 */
alarm_type_t alarm_get_current_type(void) {
    return s_current_alarm;
}

/**
 * @brief Build alarm status string for MQTT telemetry
 * @param alarm_str Output buffer for alarm string
 * @note Buffer should be at least 128 bytes
 */
void alarm_get_string(char *alarm_str) {
    if (!alarm_str) return;

    // No alarms
    if (s_current_alarm == ALARM_NONE) {
        strcpy(alarm_str, "normal");
        return;
    }

    // Build string from alarm flags
    alarm_str[0] = '\0';  // Clear buffer
    
    if (s_alarm_flags & (1 << ALARM_HEART_RATE_HIGH)) {
        strcat(alarm_str, "heart_rate_high ");
    }
    if (s_alarm_flags & (1 << ALARM_HEART_RATE_LOW)) {
        strcat(alarm_str, "heart_rate_low ");
    }
    if (s_alarm_flags & (1 << ALARM_SPO2_LOW)) {
        strcat(alarm_str, "spo2_low ");
    }
    if (s_alarm_flags & (1 << ALARM_TEMP_HIGH)) {
        strcat(alarm_str, "temperature_high ");
    }
    if (s_alarm_flags & (1 << ALARM_FALL_DETECTION)) {
        strcat(alarm_str, "fall_detection ");
    }
    if (s_alarm_flags & (1 << ALARM_SOS)) {
        strcat(alarm_str, "sos");
    }

    // Remove trailing space if present
    size_t len = strlen(alarm_str);
    if (len > 0 && alarm_str[len - 1] == ' ') {
        alarm_str[len - 1] = '\0';
    }
}