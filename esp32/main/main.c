#include <driver/gpio.h>
#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "esp_wifi.h"
#include "esp_event.h"
#include "esp_netif.h"
#include "esp_timer.h"
#include "mqtt_client.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_http_server.h"
#include "onewire_bus.h"
#include "ds18b20.h"
#include "cJSON.h"
#include "max30102/max30102_api.h"

#define TAG                 "IOT"
#define MAXIMUM_RETRY       5

#define MQTT_BROKER         "mqtt://demo.thingsboard.io:1883"
#define MQTT_USER_NAME      "lNfdsh6tgjbgfBUC8yjn"
#define TELEMETRY_TOPIC     "v1/devices/me/telemetry"

#define WIFI_CONNECTED_BIT  BIT0
#define WIFI_FAIL_BIT       BIT1
#define MQTT_CONNECTED_BIT  BIT2

#define NVS_NAMESPACE   "wifi_config"
#define NVS_KEY_SSID    "ssid"
#define NVS_KEY_PASS    "password"
#define NVS_KEY_CCCD    "cccd"

#define DS18B20_PIN         GPIO_NUM_18

#define MAX30102_I2C_PORT   I2C_NUM_0
#define MAX30102_SCL_PIN    GPIO_NUM_22
#define MAX30102_SDA_PIN    GPIO_NUM_21
#define BUFFER_SIZE         128

static EventGroupHandle_t event_group;
static int s_retry_num = 0;
static esp_mqtt_client_handle_t client = NULL;
static httpd_handle_t http_server = NULL;
static float temperature = 0.0f;
static int heart_rate = 0;
static double spo2 = 0.0;

extern const uint8_t index_html_start[] asm("_binary_index_html_start");
extern const uint8_t index_html_end[] asm("_binary_index_html_end");

void event_handler(void* arg, esp_event_base_t event_base, int32_t event_id, void* event_data)
{
    if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_START) {
        esp_wifi_connect();
    } else if (event_base == WIFI_EVENT && event_id == WIFI_EVENT_STA_DISCONNECTED) {
        if (s_retry_num < MAXIMUM_RETRY) {
            esp_wifi_connect();
            s_retry_num++;
            ESP_LOGI(TAG, "retry to connect to the AP");
        } else {
            xEventGroupSetBits(event_group, WIFI_FAIL_BIT);
            ESP_LOGI(TAG,"connect to the AP fail");   
        }
    } else if (event_base == IP_EVENT && event_id == IP_EVENT_STA_GOT_IP) {
        ip_event_got_ip_t* event = (ip_event_got_ip_t*) event_data;
        ESP_LOGI(TAG, "got ip:" IPSTR, IP2STR(&event->ip_info.ip));
        s_retry_num = 0;
        xEventGroupSetBits(event_group, WIFI_CONNECTED_BIT);
    }
}

void save_wifi_config(const char *ssid, const char *pass, const char *cccd) {
    nvs_handle_t nvs;
    nvs_open(NVS_NAMESPACE, NVS_READWRITE, &nvs);
    nvs_set_str(nvs, NVS_KEY_SSID, ssid);
    nvs_set_str(nvs, NVS_KEY_PASS, pass);
    nvs_set_str(nvs, NVS_KEY_CCCD, cccd);
    nvs_commit(nvs);
    nvs_close(nvs);
    ESP_LOGI(TAG, "WiFi config saved to NVS");
}
bool load_wifi_config(char *ssid, char *pass, char *cccd) {
    nvs_handle_t nvs;
    if (nvs_open(NVS_NAMESPACE, NVS_READONLY, &nvs) != ESP_OK) return false;

    size_t ssid_len = 32, pass_len = 64, cccd_len = 16;
    if (nvs_get_str(nvs, NVS_KEY_SSID, ssid, &ssid_len) != ESP_OK) return false;
    if (nvs_get_str(nvs, NVS_KEY_PASS, pass, &pass_len) != ESP_OK) return false;
    if (nvs_get_str(nvs, NVS_KEY_CCCD, cccd, &cccd_len) != ESP_OK) return false;

    nvs_close(nvs);
    return true;
}

esp_err_t send_handler(httpd_req_t* req){
    ESP_ERROR_CHECK(httpd_resp_set_type(req, "text/html"));
    ESP_ERROR_CHECK(httpd_resp_send(req, (char*)index_html_start, index_html_end - index_html_start));
    return ESP_OK;
}
esp_err_t receive_handler(httpd_req_t* req){
    char data[100] = { 0 };
    httpd_req_recv(req, data, req->content_len);

    cJSON *root = cJSON_Parse(data);
    if(!root){
        ESP_LOGE("JSON", "Failed to parse JSON");
        httpd_resp_send_500(req);
        return ESP_ERR_NOT_ALLOWED;
    }

    const cJSON *cccd = cJSON_GetObjectItem(root, "cccd");
    const cJSON *ssid = cJSON_GetObjectItem(root, "ssid");
    const cJSON *pass = cJSON_GetObjectItem(root, "pass");

    if (!cccd || !ssid || !pass || !cJSON_IsString(cccd) || !cJSON_IsString(ssid) || !cJSON_IsString(pass)) {
        ESP_LOGE(TAG, "Invalid JSON: missing or wrong type field(s)");
        cJSON_Delete(root);
        httpd_resp_send_err(req, HTTPD_400_BAD_REQUEST, "Invalid JSON");
        return ESP_FAIL;
    }

    ESP_LOGI(TAG, "CCCD: %s, SSID: %s, PASS: %s", cccd->valuestring, ssid->valuestring, pass->valuestring);

    save_wifi_config(ssid->valuestring, pass->valuestring, cccd->valuestring);
    cJSON_Delete(root);

    httpd_resp_sendstr(req, "<h3>Đã lưu cấu hình, ESP sẽ khởi động lại...</h3>");
    vTaskDelay(pdMS_TO_TICKS(1500));
    esp_restart();
    return ESP_OK;
}

esp_err_t start_http_server(void){
    httpd_uri_t uri_send = {
        .uri = "/",
        .method = HTTP_GET,
        .handler = send_handler,
        .user_ctx = NULL,
    };

    httpd_uri_t uri_receive = {
        .uri = "/save",
        .method = HTTP_POST,
        .handler = receive_handler,
        .user_ctx = NULL,
    };

    if(http_server != NULL) return ESP_OK;
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    

    if (httpd_start(&http_server, &config) == ESP_OK)
    {
        ESP_ERROR_CHECK(httpd_register_uri_handler(http_server, &uri_send));
        ESP_ERROR_CHECK(httpd_register_uri_handler(http_server, &uri_receive));
        ESP_LOGI(TAG, "HTTP server started");
    }
    return ESP_OK;
}
void stop_http_server(void) {
    if (http_server) {
        httpd_stop(http_server);
        http_server = NULL;
        ESP_LOGI(TAG, "HTTP server stopped");
    }
}

void start_ap_mode(void) {
    ESP_LOGI(TAG, "Starting AP mode...");
    esp_netif_create_default_wifi_ap();

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    esp_wifi_init(&cfg);
    wifi_config_t ap_config = {
        .ap = {
            .ssid = "ESP32_Config",
            .ssid_len = strlen("ESP32_Config"),
            .channel = 1,
            .max_connection = 3,
            .authmode = WIFI_AUTH_OPEN,
        },
    };
    esp_wifi_set_mode(WIFI_MODE_AP);
    esp_wifi_set_config(WIFI_IF_AP, &ap_config);
    esp_wifi_start();

    start_http_server();
    ESP_LOGI(TAG, "AP Mode started, SSID: ESP32_Config");
}
bool start_station_mode(const char *ssid, const char *pass)
{
    esp_netif_create_default_wifi_sta();

    ESP_ERROR_CHECK(esp_event_handler_instance_register(WIFI_EVENT, ESP_EVENT_ANY_ID, &event_handler, NULL, NULL));
    ESP_ERROR_CHECK(esp_event_handler_instance_register(IP_EVENT, IP_EVENT_STA_GOT_IP, &event_handler, NULL, NULL));

    wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
    ESP_ERROR_CHECK(esp_wifi_init(&cfg));

    wifi_config_t wifi_config = { 0 };
    strncpy((char*)wifi_config.sta.ssid, ssid, sizeof(wifi_config.sta.ssid));
    strncpy((char*)wifi_config.sta.password, pass, sizeof(wifi_config.sta.password));

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_STA) );
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_STA, &wifi_config) );
    ESP_ERROR_CHECK(esp_wifi_start());

    EventBits_t bits = xEventGroupWaitBits(event_group,
                                           WIFI_CONNECTED_BIT | WIFI_FAIL_BIT,
                                           pdFALSE, pdFALSE,
                                           pdMS_TO_TICKS(15000));

    if (bits & WIFI_CONNECTED_BIT) {
        ESP_LOGI(TAG, "Connected to WiFi successfully");
        return true;
    } else {
        ESP_LOGE(TAG, "WiFi connection failed!");
        return false;
    }
}

void mqtt_event_handler(void *handler_args, esp_event_base_t base, int32_t event_id, void *event_data)
{
    ESP_LOGD(TAG, "Event dispatched from event loop base=%s, event_id=%ld", base, event_id);
    esp_mqtt_event_handle_t event = event_data;

    switch ((esp_mqtt_event_id_t)event_id)
    {
    case MQTT_EVENT_CONNECTED:
        ESP_LOGI(TAG, "MQTT_EVENT_CONNECTED");
        xEventGroupSetBits(event_group, MQTT_CONNECTED_BIT);
        break;
    case MQTT_EVENT_DISCONNECTED:
        ESP_LOGI(TAG, "MQTT_EVENT_DISCONNECTED");
        xEventGroupClearBits(event_group, MQTT_CONNECTED_BIT);
        break;
    case MQTT_EVENT_PUBLISHED:
        ESP_LOGI(TAG, "MQTT_EVENT_PUBLISHED, msg_id=%d", event->msg_id);
        break;
    case MQTT_EVENT_DATA:
        ESP_LOGI(TAG, "MQTT_EVENT_DATA: %s", event->topic);
        break;
    case MQTT_EVENT_SUBSCRIBED:
        ESP_LOGI(TAG, "MQTT_EVENT_SUBSCRIBED, msg_id=%d", event->msg_id);
        break;
    case MQTT_EVENT_ERROR:
        ESP_LOGI(TAG, "MQTT_EVENT_ERROR");
        break;
    default:
        ESP_LOGI(TAG, "Other event id:%d", event->event_id);
        break;
    }
}
void mqtt_init(void)
{
    ESP_LOGI(TAG, "STARTING MQTT");
    esp_mqtt_client_config_t mqttConfig = {
        .broker.address.uri = MQTT_BROKER,
        .credentials.username = MQTT_USER_NAME,
    };

    client = esp_mqtt_client_init(&mqttConfig);
    ESP_ERROR_CHECK(esp_mqtt_client_register_event(client, ESP_EVENT_ANY_ID, mqtt_event_handler, client));
    ESP_ERROR_CHECK(esp_mqtt_client_start(client));
}

void heart_rate_task(void *param){
    max_config max30102_configuration = {
		.INT_EN_1.A_FULL_EN         = 0,
		.INT_EN_1.PPG_RDY_EN        = 1,
		.INT_EN_1.ALC_OVF_EN        = 0,
		.INT_EN_1.PROX_INT_EN       = 0,

		.INT_EN_2.DIE_TEMP_RDY_EN   = 0,

		.FIFO_WRITE_PTR.FIFO_WR_PTR = 0,

		.OVEF_COUNTER.OVF_COUNTER   = 0,

		.FIFO_READ_PTR.FIFO_RD_PTR  = 0,

		.FIFO_CONF.SMP_AVE          = 0b001,  //média de 4 valores
		.FIFO_CONF.FIFO_ROLLOVER_EN = 1,      //fifo rollover enable
		.FIFO_CONF.FIFO_A_FULL      = 0,      //0

		.MODE_CONF.SHDN             = 0,
		.MODE_CONF.RESET            = 0,
		.MODE_CONF.MODE             = 0b011,  //SPO2 mode

		.SPO2_CONF.SPO2_ADC_RGE     = 0b01,   //16384 nA(Escala do DAC)
		.SPO2_CONF.SPO2_SR          = 0b000,  //200 samples per second
		.SPO2_CONF.LED_PW           = 0b11,   //pulso de 215 uS do led.

		.LED1_PULSE_AMP.LED1_PA     = 0x24,   //CORRENTE DO LED1 25.4mA
		.LED2_PULSE_AMP.LED2_PA     = 0x24,   //CORRENTE DO LED2 25.4mA

		.PROX_LED_PULS_AMP.PILOT_PA = 0,

		.MULTI_LED_CONTROL1.SLOT2   = 0,      //Desabilitado
		.MULTI_LED_CONTROL1.SLOT1   = 0,      //Desabilitado

		.MULTI_LED_CONTROL2.SLOT4   = 0,      //Desabilitado
		.MULTI_LED_CONTROL2.SLOT3   = 0,      //Desabilitado
    };    

    ESP_ERROR_CHECK(i2c_init(MAX30102_I2C_PORT, MAX30102_SCL_PIN, MAX30102_SDA_PIN));
	vTaskDelay(pdMS_TO_TICKS(100));
	init_time_array();
    max30102_init(MAX30102_I2C_PORT, &max30102_configuration);
    ESP_LOGI(TAG, "MAX30102 Initialized.");
    uint64_t ir_mean;
    uint64_t red_mean;
    double r0;
    double auto_correlationated_data[BUFFER_SIZE];

    int32_t ir_buffer[BUFFER_SIZE];
    int32_t red_buffer[BUFFER_SIZE];
    
    while(1){
        ESP_LOGI(TAG, "Filling buffer (%d samples)...", BUFFER_SIZE);
        // 1. Lấp đầy bộ đệm
        for (int i = 0; i < BUFFER_SIZE; i++)
        {
            uint8_t int_status = 0;

            // Đợi cờ ngắt PPG_RDY (bit 6) trong REG_INTR_STATUS_1 (0x00)
            while (!(int_status & 0x40)) {
                read_max30102_reg(MAX30102_I2C_PORT, REG_INTR_STATUS_1, &int_status, 1);
                vTaskDelay(pdMS_TO_TICKS(1)); 
            }

            // Đọc dữ liệu từ FIFO
            read_max30102_fifo(MAX30102_I2C_PORT, &red_buffer[i], &ir_buffer[i]);
        }

        ESP_LOGI(TAG, "Buffer full. Processing...");

        // 2. Xử lý dữ liệu
        remove_dc_part(ir_buffer, red_buffer, &ir_mean, &red_mean);

        // Loại bỏ xu hướng (trend line) khỏi cả hai tín hiệu
        remove_trend_line(ir_buffer);
        remove_trend_line(red_buffer);

        heart_rate = calculate_heart_rate(ir_buffer, &r0, auto_correlationated_data);

        // 4. Tính toán SpO2
        spo2 = spo2_measurement(ir_buffer, red_buffer, ir_mean, red_mean);

        // 5. In kết quả
        ESP_LOGI(TAG, "Heart Rate: %d BPM", heart_rate);
        ESP_LOGI(TAG, "SpO2:       %.2f %%", spo2);

        vTaskDelay(pdMS_TO_TICKS(2000));
    }

}
void read_temperature(void* param){
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
    ESP_ERROR_CHECK(onewire_new_bus_rmt(&bus_cfg, &rmt_cfg, &bus));
    ESP_LOGI(TAG, "1-Wire bus installed on GPIO%d", DS18B20_PIN);

    ds18b20_device_handle_t ds18b20;
    ds18b20_config_t ds_cfg = {};
    ESP_ERROR_CHECK(ds18b20_new_device_from_bus(bus, &ds_cfg, &ds18b20));

    while(1){
        ESP_ERROR_CHECK(ds18b20_trigger_temperature_conversion(ds18b20));
        ESP_ERROR_CHECK(ds18b20_get_temperature(ds18b20, &temperature));
        ESP_LOGI(TAG, "temperature read from DS18B20: %.2fC", temperature);
        vTaskDelay(pdMS_TO_TICKS(2000));
    }

}

void mqtt_send_task(void *param){
    char cccd[16];
    nvs_handle_t nvs;
    nvs_open(NVS_NAMESPACE, NVS_READONLY, &nvs);
    size_t len = sizeof(cccd);
    nvs_get_str(nvs, NVS_KEY_CCCD, cccd, &len);
    nvs_close(nvs);

    char payload[256];
    while(1) {
        EventBits_t bits = xEventGroupGetBits(event_group);
        if (bits & MQTT_CONNECTED_BIT) {
            snprintf(payload, sizeof(payload),
                "{\"cccd\":\"%s\",\"heartRate\":%d,\"O2\":%lf,\"temperature\":%f,\"alarm\":\"normal\"}",
                cccd, heart_rate, spo2, temperature);
            esp_mqtt_client_publish(client, TELEMETRY_TOPIC, payload, 0, 1, 0);
            ESP_LOGI(TAG, "Telemetry sent: %s", payload);
        }
        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}

void app_main(void){
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
      ESP_ERROR_CHECK(nvs_flash_erase());
      ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    gpio_set_direction(GPIO_NUM_2, GPIO_MODE_OUTPUT);
    gpio_set_level(GPIO_NUM_2, 1);

    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());

    event_group = xEventGroupCreate();

    char ssid[32] = {0}, pass[64] = {0}, cccd[16] = {0};

    if (load_wifi_config(ssid, pass, cccd)) {
        ESP_LOGI(TAG, "Loaded WiFi config: SSID=%s", ssid);
        bool ok = start_station_mode(ssid, pass);
        if (ok) {
            stop_http_server();  
            mqtt_init();
            xTaskCreate(mqtt_send_task, "mqtt_send_task", 4096, NULL, 5, NULL);
        } else {
            ESP_LOGW(TAG, "WiFi failed -> Switching to AP mode");
            esp_wifi_stop();
            esp_wifi_deinit();
            start_ap_mode();
        }
    } else {
        ESP_LOGW(TAG, "No WiFi config -> Starting AP mode");
        start_ap_mode();
    }
    xTaskCreate(read_temperature, "read temp", 4086, NULL, 5, NULL);
    xTaskCreate(heart_rate_task, "read max30102", 4086, NULL, 5, NULL);
}