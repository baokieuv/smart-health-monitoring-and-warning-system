#include "heart_rate.h"
#include "max30102_api.h"
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"

static const char *TAG = "HEART_RATE";
static int latest_heart_rate = 0;
static double latest_spo2 = 0.0;
static SemaphoreHandle_t data_mutex = NULL;

esp_err_t heart_rate_sensor_init(void) {
    ESP_LOGI(TAG, "Initializing MAX30102...");

    // Create mutex for thread-safe access
    if (!data_mutex) {
        data_mutex = xSemaphoreCreateMutex();
        if (!data_mutex) {
            ESP_LOGE(TAG, "Failed to create mutex");
            return ESP_ERR_NO_MEM;
        }
    }

    // Initialize I2C
    esp_err_t err = i2c_init(I2C_PORT, I2C_SCL_PIN, I2C_SDA_PIN);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "I2C initialization failed: %s", esp_err_to_name(err));
        return err;
    }

    vTaskDelay(pdMS_TO_TICKS(100));

    // Initialize time array for calculations
    init_time_array();

    // Configure MAX30102
    max_config max30102_configuration = {
        .INT_EN_1.A_FULL_EN         = 0,
        .INT_EN_1.PPG_RDY_EN        = 1,
        .INT_EN_1.ALC_OVF_EN        = 0,
        .INT_EN_1.PROX_INT_EN       = 0,

        .INT_EN_2.DIE_TEMP_RDY_EN   = 0,

        .FIFO_WRITE_PTR.FIFO_WR_PTR = 0,
        .OVEF_COUNTER.OVF_COUNTER   = 0,
        .FIFO_READ_PTR.FIFO_RD_PTR  = 0,

        .FIFO_CONF.SMP_AVE          = 0b001,  // Average 4 samples
        .FIFO_CONF.FIFO_ROLLOVER_EN = 1,
        .FIFO_CONF.FIFO_A_FULL      = 0,

        .MODE_CONF.SHDN             = 0,
        .MODE_CONF.RESET            = 0,
        .MODE_CONF.MODE             = 0b011,  // SpO2 mode

        .SPO2_CONF.SPO2_ADC_RGE     = 0b01,   // 16384 nA
        .SPO2_CONF.SPO2_SR          = 0b000,  // 200 samples per second
        .SPO2_CONF.LED_PW           = 0b11,   // 215 μs LED pulse

        .LED1_PULSE_AMP.LED1_PA     = 0x24,   // 25.4mA
        .LED2_PULSE_AMP.LED2_PA     = 0x24,   // 25.4mA

        .PROX_LED_PULS_AMP.PILOT_PA = 0,

        .MULTI_LED_CONTROL1.SLOT2   = 0,      // Disabled
        .MULTI_LED_CONTROL1.SLOT1   = 0,      // Disabled

        .MULTI_LED_CONTROL2.SLOT4   = 0,      // Disabled
        .MULTI_LED_CONTROL2.SLOT3   = 0,      // Disabled
    };

    err = max30102_init(I2C_PORT, &max30102_configuration);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "MAX30102 initialization failed: %s", esp_err_to_name(err));
        return err;
    }

    ESP_LOGI(TAG, "MAX30102 initialized successfully");
    return ESP_OK;
}

esp_err_t heart_rate_read(heart_rate_data_t *data) {
    if (!data) {
        ESP_LOGE(TAG, "Invalid parameter");
        return ESP_ERR_INVALID_ARG;
    }

    int32_t ir_buffer[MAX30102_BUFFER_SIZE];
    int32_t red_buffer[MAX30102_BUFFER_SIZE];
    uint64_t ir_mean, red_mean;
    double r0;
    double auto_corr_data[MAX30102_BUFFER_SIZE];

    ESP_LOGI(TAG, "Filling buffer (%d samples)...", MAX30102_BUFFER_SIZE);

    // Fill buffer
    for (int i = 0; i < MAX30102_BUFFER_SIZE; i++) {
        uint8_t int_status = 0;

        // Wait for PPG_RDY interrupt (bit 6 in REG_INTR_STATUS_1)
        while (!(int_status & 0x40)) {
            read_max30102_reg(I2C_PORT, REG_INTR_STATUS_1, &int_status, 1);
            vTaskDelay(pdMS_TO_TICKS(1));
        }

        // Read FIFO data
        read_max30102_fifo(I2C_PORT, &red_buffer[i], &ir_buffer[i]);
    }

    ESP_LOGI(TAG, "Buffer full. Processing...");

    // Process data
    remove_dc_part(ir_buffer, red_buffer, &ir_mean, &red_mean);
    remove_trend_line(ir_buffer);
    remove_trend_line(red_buffer);

    // Calculate heart rate
    data->heart_rate = calculate_heart_rate(ir_buffer, &r0, auto_corr_data);

    // Calculate SpO2
    data->spo2 = spo2_measurement(ir_buffer, red_buffer, ir_mean, red_mean);

    // Update latest values with mutex protection
    if (data_mutex) {
        xSemaphoreTake(data_mutex, portMAX_DELAY);
        latest_heart_rate = data->heart_rate;
        latest_spo2 = data->spo2;
        xSemaphoreGive(data_mutex);
    }

    ESP_LOGI(TAG, "Heart Rate: %d BPM, SpO2: %.2f%%", data->heart_rate, data->spo2);
    return ESP_OK;
}

static void heart_rate_task(void *param) {
    void (*callback)(heart_rate_data_t) = (void (*)(heart_rate_data_t))param;

    while (1) {
        heart_rate_data_t data;
        esp_err_t err = heart_rate_read(&data);

        if (err == ESP_OK && callback) {
            callback(data);
        }

        vTaskDelay(pdMS_TO_TICKS(HEART_READ_DELAY_MS));
    }
}

esp_err_t heart_rate_start_task(void (*callback)(heart_rate_data_t data)) {
    BaseType_t ret = xTaskCreate(
        heart_rate_task,
        "heart_rate_task",
        6144,
        (void*)callback,
        5,
        NULL
    );

    if (ret != pdPASS) {
        ESP_LOGE(TAG, "Failed to create heart rate task");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "Heart rate task started");
    return ESP_OK;
}

int heart_rate_get_latest(void) {
    int hr = 0;
    if (data_mutex) {
        xSemaphoreTake(data_mutex, portMAX_DELAY);
        hr = latest_heart_rate;
        xSemaphoreGive(data_mutex);
    }
    return hr;
}

double spo2_get_latest(void) {
    double spo2 = 0.0;
    if (data_mutex) {
        xSemaphoreTake(data_mutex, portMAX_DELAY);
        spo2 = latest_spo2;
        xSemaphoreGive(data_mutex);
    }
    return spo2;
}