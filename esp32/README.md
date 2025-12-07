# ESP32 IoT Health Monitor

Hệ thống giám sát sức khỏe thời gian thực sử dụng ESP32, hiển thị dữ liệu trên màn hình OLED và gửi về ThingsBoard qua MQTT.

## 📋 Mục Lục

- [Tính Năng](#-tính-năng)
- [Phần Cứng Cần Thiết](#-phần-cứng-cần-thiết)
- [Sơ Đồ Kết Nối](#-sơ-đồ-kết-nối)
- [Cài Đặt Môi Trường](#-cài-đặt-môi-trường)
- [Cài Đặt Project](#-cài-đặt-project)
- [Cấu Hình ThingsBoard](#-cấu-hình-thingsboard)
- [Build và Flash](#-build-và-flash)
- [Hướng Dẫn Sử Dụng](#-hướng-dẫn-sử-dụng)
- [API Reference](#-api-reference)

---

## 🚀 Tính Năng

### Chức Năng Chính
- ✅ **Đo dữ liệu sức khỏe**: Nhịp tim, SpO2, nhiệt độ cơ thể
- ✅ **Hiển thị real-time**: Màn hình OLED 128x64
- ✅ **Gửi dữ liệu IoT**: MQTT đến ThingsBoard (mỗi 5 giây)
- ✅ **Cảnh báo thông minh**: Tự động phát hiện bất thường + buzzer
- ✅ **Deep Sleep**: Tiết kiệm pin với chế độ ngủ sâu
- ✅ **Nút SOS**: Gửi cảnh báo khẩn cấp

### Chế Độ Hoạt Động
- **Station Mode**: Hoạt động bình thường, gửi dữ liệu qua WiFi
- **AP Simple Mode**: Cấu hình WiFi nhanh (chỉ SSID + Password)
- **AP Full Mode**: Cấu hình đầy đủ (Patient ID, Doctor ID, WiFi + Auto provisioning)

### Hệ Thống Nút Bấm
| Nút | Single Click | Double Click | Long Press |
|-----|--------------|--------------|------------|
| **Button 1** | Sleep/Wake | Tắt Buzzer | SOS |
| **Button 2** | - | Đổi Mode | Full Config |

---

## 🛠 Phần Cứng Cần Thiết

### Board và Module Chính
| Linh Kiện | Mô Tả | Số Lượng |
|-----------|-------|----------|
| **ESP32 DevKit** | ESP32-WROOM-32 hoặc tương đương | 1 |
| **OLED Display** | SSD1306 128x64, I2C | 1 |
| **MAX30102** | Cảm biến nhịp tim và SpO2 | 1 |
| **DS18B20** | Cảm biến nhiệt độ | 1 |
| **Buzzer** | Buzzer 5V hoặc 3.3V | 1 |
| **LED** | LED chỉ thị trạng thái | 1 |
| **Button** | Nút bấm tact switch | 2 |

### Linh Kiện Phụ
- Điện trở 4.7kΩ (pull-up cho DS18B20)
- Điện trở 330Ω (hạn dòng LED)
- Dây cắm breadboard
- Nguồn cấp 5V/2A (USB hoặc adapter)

### Yêu Cầu Hệ Thống
- **Phần Mềm**: ESP-IDF v5.3 trở lên
- **Python**: 3.6 trở lên
- **OS**: Windows/Linux/macOS
- **Tài Khoản ThingsBoard**: Free tier (demo.thingsboard.io)

---

## 🔌 Sơ Đồ Kết Nối

### Sơ Đồ Chân (Pinout)

```
ESP32 Pin      →    Thiết Bị
─────────────────────────────────────────
GPIO 21 (SDA)  →    OLED SDA, MAX30102 SDA
GPIO 22 (SCL)  →    OLED SCL, MAX30102 SCL
GPIO 18        →    DS18B20 Data
GPIO 4         →    Button 1 (+ 10kΩ pull-up)
GPIO 5         →    Button 2 (+ 10kΩ pull-up)
GPIO 2         →    LED (+ 330Ω resistor)
GPIO 15         →    Buzzer (+)
GND            →    Common Ground (tất cả GND)
3.3V           →    OLED VCC, MAX30102 VCC
5V             →    Buzzer (nếu dùng 5V)
```

### Sơ Đồ Kết Nối Chi Tiết

```

```

### Lưu Ý Kết Nối
1. **I2C Bus**: OLED và MAX30102 dùng chung bus I2C (SDA, SCL)
2. **DS18B20**: Cần điện trở pull-up 4.7kΩ từ Data pin lên 3.3V
3. **Button**: Nút bấm nối từ GPIO xuống GND (active LOW)
4. **Buzzer**: Kiểm tra điện áp hoạt động (3.3V hoặc 5V)
5. **Power**: Đảm bảo nguồn đủ mạnh (min 500mA)

---

## 💻 Cài Đặt Môi Trường

### Bước 1: Cài Đặt ESP-IDF

#### Windows
```bash
# Tải ESP-IDF Installer từ:
# https://dl.espressif.com/dl/esp-idf/

# Chạy installer và chọn ESP-IDF v4.4 hoặc mới hơn
# Installer sẽ tự động cài đặt Python, Git, và các tools cần thiết
```

### Bước 2: Thiết Lập VSCode (Tùy Chọn)

```bash
# Cài đặt VSCode
# Tải từ: https://code.visualstudio.com/

# Cài đặt extension ESP-IDF
# Trong VSCode: Ctrl+Shift+X → Tìm "ESP-IDF" → Install
```

### Bước 3: Kiểm Tra Cài Đặt

```bash
# Kiểm tra ESP-IDF
idf.py --version

# Kết quả mong đợi:
# ESP-IDF v4.4.6 hoặc cao hơn
```

---

## 📦 Cài Đặt Project

### Bước 1: Clone Repository

```bash
git clone https://github.com/baokieuv/smart-health-monitoring-and-warning-system.git
cd smart-health-monitoring-and-warning-system/esp32
```

### Bước 2: Cấu Trúc Thư Mục

```
esp32/
├── main/
│   ├── main.c                 # File chính
│   ├── config.h               # Cấu hình hệ thống
│   └── CMakeLists.txt
├── components/                
│   ├── alarm/                 # Quản lý cảnh báo
│   ├── display/               # Điều khiển OLED
│   ├── http/                  # Web server cấu hình
│   ├── mqtt/                  # MQTT client
│   ├── provisioning/          # ThingsBoard provisioning
│   ├── sensors/               # Quản lý các cảm biến
│   ├── storage/               # Lưu trữ NVS
│   ├── sys_button/            # Button library
│   └── wifi                   # Quản lý WiFi
├── managed_components/       # Thư viện bên thứ 3
│   ├── u8g2/                 # Driver OLED
│   ├── iot_button/           # Button library
│   └── ...
├── CMakeLists.txt
├── sdkconfig                 # Cấu hình SDK
└── README.md
```

### Bước 3: Cấu Hình Project

```bash
# Mở menu cấu hình
idf.py menuconfig

# Điều chỉnh các thông số:
# 1. Component config → ESP32-specific
#    - CPU frequency: 240MHz
#    - Flash size: 4MB (hoặc theo board của bạn)
#
# 2. Component config → FreeRTOS
#    - Tick rate: 1000 Hz
#
# 3. Partition Table
#    - Partition Table: Single factory app (large), no OTA
```

---

## 🌐 Cấu Hình ThingsBoard

### Bước 1: Tạo Tài Khoản

1. Truy cập https://demo.thingsboard.io
2. Click **"Sign Up"** → Tạo tài khoản miễn phí
3. Xác nhận email và đăng nhập

### Bước 2: Tạo Device Profile

```
1. Dashboard → Device profiles → (+) Add device profile
2. Name: "Health Monitor Profile"
3. Transport type: Default (MQTT)
4. Click "Add"
```

### Bước 3: Tạo Provisioning Profile

```
1. Dashboard → Device profiles → Health Monitor Profile → Provision
2. Provisioning strategy: "Allow to create new devices"
3. Device name: ESP32_Health_Monitor
4. Provision device key: provision-key
5. Provision device secret: provision-secret
6. Click "Save"
```

### Bước 4: Test Provisioning (Tùy Chọn)

```bash
# Test provisioning bằng curl
curl -X POST http://demo.thingsboard.io/api/v1/provision \
  -H "Content-Type: application/json" \
  -d '{
    "deviceName": "ESP32_Health_Monitor",
    "provisionDeviceKey": "provision-key",
    "provisionDeviceSecret": "provision-secret"
  }'

# Kết quả trả về sẽ có accessToken
```
### Bước 5: Cấu hình provisioning cho esp32

Thay đổi thông tin provision trong file ```main\config.h```
```c
// Provisioning
#define PROVISION_URL "http://demo.thingsboard.io/api/v1/provision"
#define DEVICE_NAME "ESP32_Device"
#define PROVISION_KEY   "provision-key"
#define PROVISION_SECRET    "provision-secret"
```

---

## 🔨 Build và Flash

### Bước 1: Build Project

```bash
# Đảm bảo đang ở thư mục project
cd ~/smart-health-monitoring-and-warning-system/esp32

# Build
idf.py build

# Kiểm tra kết quả:
# - Binary file: build/esp32-health-monitor.bin
# - Size: ~800KB - 1.5MB
```

### Bước 2: Kết Nối ESP32

```bash
# Cắm ESP32 vào USB

# Kiểm tra port (Linux/macOS)
ls /dev/ttyUSB* /dev/ttyACM*
# Hoặc (macOS)
ls /dev/cu.usbserial-*

# Windows: Kiểm tra Device Manager
# - Ports (COM & LPT) → Silicon Labs CP210x → COM3 (ví dụ)
```

### Bước 3: Flash Firmware

```bash
# Flash với baudrate mặc định
idf.py -p /dev/ttyUSB0 flash

# Hoặc flash với baudrate cao hơn (nhanh hơn)
idf.py -p /dev/ttyUSB0 -b 921600 flash

# Windows:
idf.py -p COM3 flash
```

### Bước 4: Monitor Serial Output

```bash
# Mở serial monitor
idf.py -p /dev/ttyUSB0 monitor

# Thoát monitor: Ctrl + ]
```

### Build, Flash và Monitor trong 1 lệnh

```bash
idf.py -p /dev/ttyUSB0 flash monitor
```

---

## 📱 Hướng Dẫn Sử Dụng

### Lần Đầu Khởi Động (Cấu Hình Simple)

1. **Power On ESP32**
   ```
   → ESP32 tự động vào AP Mode
   ```

2. **Kết Nối WiFi Config**
   ```
   - Smartphone/Laptop → WiFi Settings
   - Tìm và kết nối: "ESP32_Health_Config"
   - Không cần password
   ```

3. **Truy Cập Web Config**
   ```
   - Mở browser: http://192.168.4.1
   - Nhập thông tin:
     SSID: [Tên WiFi nhà bạn]
     Password: [Mật khẩu WiFi]
   - Click "Save & Connect"
   ```

4. **Chờ Kết Nối**
   ```
   → ESP32 restart
   → Kết nối WiFi
   → Màn hình hiển thị dữ liệu sensor
   ```

### Cấu Hình Đầy Đủ (Full Config với ThingsBoard)

1. **Vào Full Config Mode**
   ```
   Bấm GIỮ Button 2 trong 1.5 giây
   → ESP32 vào AP Mode với form đầy đủ
   ```

2. **Kết Nối và Cấu Hình**
   ```
   - Kết nối WiFi: "ESP32_Health_Config"
   - Browser: http://192.168.4.1
   - Nhập đầy đủ:
     Patient ID: P12345
     Doctor ID: DOC789
     WiFi SSID: YourWiFi
     WiFi Password: YourPassword
   - Click "Save & Restart"
   ```

3. **Provisioning Tự Động**
   ```
   → ESP32 restart
   → Kết nối WiFi
   → Tự động gửi provisioning request
   → Nhận access token
   → Gửi attributes (patient, doctor)
   → Bắt đầu gửi telemetry
   ```

4. **Kiểm Tra ThingsBoard**
   ```
   - Login: demo.thingsboard.io
   - Dashboard → Devices
   - Tìm device: ESP32_Health_Monitor
   - Click vào → Latest telemetry
   - Xem dữ liệu real-time
   ```

#### Chức Năng Button 1

**Single Click: Sleep/Wake**
```
Bấm 1 lần → Deep Sleep
- Tất cả LED tắt
- Màn hình tắt
- Tiết kiệm pin
Bấm lại 1 lần → Wake up
- Hệ thống khởi động lại
```

**Double Click: Tắt Buzzer**
```
Khi có cảnh báo (buzzer kêu):
Bấm 2 lần nhanh → Buzzer và cảnh báo tắt
- Buzzer im lặng
```

**Long Press: SOS**
```
Bấm giữ 1.5s → Kích hoạt SOS
- Buzzer kêu liên tục
- Gửi "alarm": "sos" qua MQTT
- Chỉ tắt khi double click
```

#### Chức Năng Button 2

**Double Click: Đổi Mode**
```
Ở Station Mode → Bấm 2 lần → AP Simple Mode
Ở AP Mode → Bấm 2 lần → Station Mode
```

**Long Press: Full Config**
```
Bấm giữ 1.5s → AP Full Config Mode
- Form đầy đủ (Patient, Doctor, WiFi)
- Dùng để provisioning lại
```

### Xử Lý Cảnh Báo

#### Cảnh Báo Tự Động

| Tình Huống | Ngưỡng | Hành Động |
|------------|--------|-----------|
| Nhịp tim thấp | < 60 bpm | Buzzer + MQTT "heart_rate_low" |
| Nhịp tim cao | > 100 bpm | Buzzer + MQTT "heart_rate_high" |
| SpO2 thấp | < 90% | Buzzer + MQTT "spo2_low" |
| Nhiệt độ cao | > 38°C | Buzzer + MQTT "temperature_high" |

#### Tắt Cảnh Báo
```
1. Nghe buzzer kêu
2. Kiểm tra màn hình OLED để xem giá trị bất thường
3. Bấm 2 lần Button 1 để tắt buzzer
4. Cảnh báo vẫn được gửi qua MQTT cho đến khi thông số trở lại bình thường
```

---

## 📚 API Reference

### Alarm API

```c
// Check các ngưỡng cảnh báo
void alarm_check_health_data(int heart_rate, double spo2, float temperature);

// Phát tín hiệu cảnh báo sos
void alarm_trigger_sos(void);

// Dừng buzzer và cảnh báo
void alarm_stop_buzzer(void);

// Kiểm tra cảnh báo có đang hoạt động
bool alarm_is_active(void);

// Get loại cảnh báo hiện tại
alarm_type_t alarm_get_current_type(void);

// Get string cảnh báo hiện tại
const char* alarm_get_string(void);
```

### Display API

```c
// Khởi tạo màn hình OLED sử dụng thư viện u8g2
esp_err_t oled_display_init(u8x8_msg_cb byte_cb, u8x8_msg_cb gpio_cb);

// Cập nhật màn hình với dữ liệu mới (Hàm nội bộ, nhưng có thể gọi trực tiếp nếu cần)
void oled_update_health_data(int heart_rate, int spo2, float temperature);

// Task FreeRTOS để nhận dữ liệu từ Queue và hiển thị
void oled_display_task(void *param);
```

### HTTP API

```c
// Start HTTP configuration server
esp_err_t http_server_start(system_mode_t sys_mode);

// Stop HTTP configuration server
esp_err_t http_server_stop(void);

// Check if HTTP server is running
uint8_t http_server_is_running(void);

```

### MQTT API

```c
// Initialize and start MQTT client
esp_err_t mqtt_client_init(const char *token);

// Publish telemetry data
esp_err_t mqtt_publish_telemetry(int heart_rate, double spo2, float temperature, const char *alarm_status); 

// Publish attribute data
esp_err_t mqtt_publish_attributes(const char *patient_id, const char *doctor_id);

// Stop MQTT client
esp_err_t mqtt_client_stop(void);

// Check if MQTT is connected
uint8_t mqtt_is_connected(void);
```

### PROVISIONING API

```c
// Send provisioning request to ThingsBoard server
esp_err_t provisioning_send_request(const char *device_key, const char *device_secret);
```

### NVS Storage API

```c
// Lưu cấu hình WiFi đơn giản
esp_err_t nvs_save_wifi_config(const char *ssid, const char *pass);

// Lưu cấu hình đầy đủ (+ set provisioning flag)
esp_err_t nvs_save_full_config(const char *ssid, const char *pass, 
                               const char *patient, const char *doctor);

// Lưu access token (+ clear provisioning flag)
esp_err_t nvs_save_access_token(const char *token);

// Đọc cấu hình WiFi
bool nvs_load_wifi_config(char *ssid, char *pass);

// Đọc access token
bool nvs_load_access_token(char *token);

// Đọc cấu hình đầy đủ
bool nvs_load_full_config(char *ssid, char *pass, char *patient, 
                          char *doctor, char *token);

// Kiểm tra cần provisioning
bool nvs_check_need_provisioning(void);

// Xóa toàn bộ cấu hình
esp_err_t nvs_clear_config(void);
```

### WiFi Manager API

```c
// Khởi tạo WiFi manager
esp_err_t wifi_manager_init(EventGroupHandle_t event_group);

// Bật AP mode
esp_err_t wifi_start_ap_mode(void);

// Bật Station mode và kết nối
bool wifi_start_station_mode(const char *ssid, const char *pass);

// Stop current WiFi mode
esp_err_t wifi_stop(void);

// Get WiFi connection status
bool wifi_is_connected(void);
```