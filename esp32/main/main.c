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
#include "cJSON.h"

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

static EventGroupHandle_t event_group;
static int s_retry_num = 0;
static esp_mqtt_client_handle_t client = NULL;
static httpd_handle_t http_server = NULL;

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
    const cJSON *ssid  = cJSON_GetObjectItem(root, "ssid");
    const cJSON *pass  = cJSON_GetObjectItem(root, "password");

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

bool wifi_init_sta(const char *ssid, const char *pass)
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
                "{\"cccd\":\"%s\",\"heartRate\":70.5,\"O2\":97,\"temperature\":37.1,\"alarm\":\"normal\"}",
                cccd);
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
        bool ok = wifi_init_sta(ssid, pass);
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
}