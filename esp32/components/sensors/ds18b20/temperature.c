#include "temperature.h"
#include "onewire_bus.h"
#include "ds18b20.h"
#include "esp_log.h"
#include "alarm_manager.h"
#include "freertos/task.h"

static const char *TAG = "TEMPERATURE";
static ds18b20_device_handle_t ds18b20_handle = NULL;
static float latest_temperature = 0.0f;
static SemaphoreHandle_t temp_mutex = NULL;

esp_err_t temperature_sensor_init(void) {
    ESP_LOGI(TAG, "Initializing DS18B20 temperature sensor...");

    // Create mutex for thread-safe access
    if (!temp_mutex) {
        temp_mutex = xSemaphoreCreateMutex();
        if (!temp_mutex) {
            ESP_LOGE(TAG, "Failed to create mutex");
            return ESP_ERR_NO_MEM;
        }
    }

    // Configure 1-Wire bus
    onewire_bus_handle_t bus = NULL;
    onewire_bus_config_t bus_cfg = {
        .bus_gpio_num = DS18B20_PIN,
        .flags = {
            .en_pull_up = true,
        }
    };
    
    onewire_bus_rmt_config_t rmt_cfg = {
        .max_rx_bytes = 10,
    };

    esp_err_t err = onewire_new_bus_rmt(&bus_cfg, &rmt_cfg, &bus);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to create 1-Wire bus: %s", esp_err_to_name(err));
        return err;
    }

    ESP_LOGI(TAG, "1-Wire bus installed on GPIO%d", DS18B20_PIN);

    // Initialize DS18B20 device
    ds18b20_config_t ds_cfg = {};
    err = ds18b20_new_device_from_bus(bus, &ds_cfg, &ds18b20_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to initialize DS18B20: %s", esp_err_to_name(err));
        return err;
    }

    ESP_LOGI(TAG, "DS18B20 initialized successfully");
    return ESP_OK;
}

esp_err_t temperature_read(float *temperature) {
    if (!ds18b20_handle) {
        ESP_LOGE(TAG, "Sensor not initialized");
        return ESP_ERR_INVALID_STATE;
    }

    if (!temperature) {
        ESP_LOGE(TAG, "Invalid parameter");
        return ESP_ERR_INVALID_ARG;
    }

    // Trigger temperature conversion
    esp_err_t err = ds18b20_trigger_temperature_conversion(ds18b20_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to trigger conversion: %s", esp_err_to_name(err));
        return err;
    }

    // Read temperature
    err = ds18b20_get_temperature(ds18b20_handle, temperature);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to read temperature: %s", esp_err_to_name(err));
        return err;
    }

    // Update latest value with mutex protection
    if (temp_mutex) {
        xSemaphoreTake(temp_mutex, portMAX_DELAY);
        latest_temperature = *temperature;
        xSemaphoreGive(temp_mutex);
    }

    ESP_LOGI(TAG, "Temperature: %.2f°C", *temperature);
    return ESP_OK;
}

static void temperature_task(void *param) {
    void (*callback)(float) = (void (*)(float))param;

    while (1) {
        float temp;
        esp_err_t err = temperature_read(&temp);
        
        if (err == ESP_OK && callback) {
            callback(temp);
        }

        vTaskDelay(pdMS_TO_TICKS(TEMP_READ_DELAY_MS));
    }
}

esp_err_t temperature_start_task(void (*callback)(float temp)) {
    if (!ds18b20_handle) {
        ESP_LOGE(TAG, "Sensor not initialized. Call temperature_sensor_init() first");
        return ESP_ERR_INVALID_STATE;
    }

    BaseType_t ret = xTaskCreate(
        temperature_task,
        "temp_task",
        4096,
        (void*)callback,
        5,
        NULL
    );

    if (ret != pdPASS) {
        ESP_LOGE(TAG, "Failed to create temperature task");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Temperature task started");
    return ESP_OK;
}

float temperature_get_latest(void) {
    float temp = 0.0f;
    if (temp_mutex) {
        xSemaphoreTake(temp_mutex, portMAX_DELAY);
        temp = latest_temperature;
        xSemaphoreGive(temp_mutex);
    }
    return temp;
}