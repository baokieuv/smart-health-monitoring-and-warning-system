# Hệ thống giám sát sức khỏe và cấp cứu thông minh

## I. Hiện trạng

Hiện nay, việc theo dõi sức khỏe bệnh nhân chủ yếu do nhân viên y tế thực hiện **thủ công** hoặc thông qua **thiết bị cục bộ**.  
Hạn chế:
- Chưa có hệ thống tập trung để tự động **cảnh báo và giám sát nhiều bệnh nhân cùng lúc**  
- **Người nhà** khó tiếp cận và theo dõi tình trạng sức khỏe bệnh nhân theo thời gian thực  
- **Phản ứng chậm** trong các tình huống khẩn cấp (ngã, tụt nhịp tim, thiếu oxy, v.v.)

Vì vậy, cần xây dựng một **hệ thống giám sát sức khỏe thông minh** có khả năng:
- Theo dõi liên tục
- Cảnh báo tức thời
- Truy cập dữ liệu từ xa

---

## II. Giải pháp đề xuất

### Mục tiêu chính:
- Trang bị **thiết bị đeo IoT** cho bệnh nhân để thu thập các chỉ số: nhịp tim, SpO₂, nhiệt độ, và phát hiện ngã  
- **Tự động cảnh báo** khi phát hiện bất thường qua hệ thống MQTT/ThingsBoard  
- **Truyền dữ liệu theo thời gian thực** về **máy chủ trung tâm (Raspberry Pi hoặc cloud)**  
- **Giao diện giám sát** dành cho:
  - **Bác sĩ/y tá**: theo dõi toàn bộ bệnh nhân, nhận cảnh báo, can thiệp kịp thời  
  - **Người nhà**: xem thông tin bệnh nhân cụ thể thông qua CCCD  
  - **Dashboard** ThingsBoard hoặc web/app riêng  

---
## III. Chi tiết hệ thống
### 1. Thiết bị cho bệnh nhân

- Thu thập dữ liệu từ các cảm biến sinh học  
- Kết nối Wi-Fi và gửi dữ liệu định kỳ qua MQTT  
- Mã nguồn được phát triển trên **ESP-IDF**

**Ví dụ payload gửi lên ThingsBoard:**
```json
{
  "cccd": "1234567890987",
  "heartRate": 70.5,
  "O2": 40,
  "temperature": 37.5,
  "alarm": "normal"
}
```

### 2. Hệ thống cho bệnh viện

- Nhận dữ liệu qua giao thức MQTT
- Lưu trữ & hiển thị thông số sức khỏe trên dashboard
- Cấu hình cảnh báo (email, SMS, Telegram)
- Có thể triển khai trên:
  - Raspberry Pi
  - Cloud (AWS, Azure, Google Cloud)
  - Docker container

### 3. Web/app cho người dùng

- Bác sĩ/y tá: giám sát toàn bộ bệnh nhân
- Người nhà: xem dữ liệu bệnh nhân theo CCCD
- Cảnh báo thời gian thực
- Có thể tích hợp API từ ThingsBoard hoặc dùng dashboard sẵn có

## IV. Hướng dẫn sử dụng hệ thống
### 1. Thiết bị

#### Cài đặt môi trường
- Cài đặt **ESP-IDF**: [Hướng dẫn cài đặt ESP-IDF chính thức](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/get-started/)
- Cài đặt **Python 3.8+**
- Tạo tài khoản **ThingsBoard** và tạo **Device**: [Hướng dẫn sử dụng ThingsBoard](https://docs.google.com/document/d/1lUEHkdseESF9-TEnLqJxWDx3g02dIIZYxRGIfbPn5dw/edit?usp=sharing)
- Lấy **Access Token** của thiết bị

#### Clone dự án

```bash
git clone https://github.com/baokieuv/smart-health-monitoring-and-warning-system
cd esp32
```

#### Cấu hình thông số WiFi và MQTT

Mở file [main.c](https://github.com/baokieuv/smart-health-monitoring-and-warning-system/blob/main/esp32/main/main.c) và chỉnh sửa các thông số sau:
```c
#define WIFI_SSID       "Ten WiFi"
#define WIFI_PASS       "Mat khau WiFi"
#define MQTT_BROKER_URI "mqtt://<Dia chi ThingsBoard>:1883"
#define MQTT_USER_NAME  "<Access Token cua device>"
```

#### Build và Flash lên ESP32
```bash
idf.py set-target esp32
idf.py build
idf.py -p <COM port> flash monitor
```

---
### Clone web

Install dependencies
```bash
npm install
```

Run
```bash
npm start
```

Server is running at: `http://localhost:3000`

### Tài khoản demo

- **Admin**: 
  - Username: `admin`
  - Password: `1`
  
- **User**: 
  - Username: `user`
  - Password: `1`
