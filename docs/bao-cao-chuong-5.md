# Chương 5. Thiết kế phần cứng & firmware (ESP32)

Chương này trình bày phần thiết kế phần cứng và firmware cho thiết bị đo – giám sát sức khỏe dựa trên ESP32. Nội dung tập trung vào cấu trúc module, luồng kết nối ThingsBoard (chi tiết theo firmware), định dạng dữ liệu và các nhánh xử lý lỗi.

## 5.1 Danh sách linh kiện, sơ đồ kết nối (I2C/OneWire/GPIO…)

### 5.1.1 Danh sách phần cứng chính

- Vi điều khiển: ESP32.
- Cảm biến nhịp tim & SpO₂: MAX30102 (giao tiếp I2C).
- Cảm biến nhiệt độ: DS18B20 (OneWire).
- Cảm biến gia tốc/gyro (phát hiện ngã): MPU6050 (I2C).
- Màn hình hiển thị: OLED (I2C).
- Cảnh báo tại chỗ: buzzer.
- Nút nhấn: BTN1, BTN2 (phục vụ SOS/chuyển chế độ theo thiết kế firmware).
- LED trạng thái.

### 5.1.2 Ánh xạ chân và bus giao tiếp (theo cấu hình firmware)

- I2C (OLED, MAX30102, MPU6050)
  - SDA: GPIO 21
  - SCL: GPIO 22
  - I2C port: I2C_NUM_1
  - Tần số: 100 kHz
- DS18B20: GPIO 18
- BTN1: GPIO 4
- BTN2: GPIO 5
- LED: GPIO 2
- BUZZER: GPIO 15

## 5.2 Thiết kế phần mềm nhúng (module hóa)

Firmware được tổ chức theo hướng module hóa để dễ bảo trì và mở rộng. Các module chính (đối chiếu theo thư mục component) gồm:

- `wifi/` (Wi‑Fi STA/AP, retry, timeout, event bits).
- `http/` (HTTP server cấu hình ở AP mode).
- `storage/` (lưu cấu hình vào NVS).
- `provisioning/` (đăng ký thiết bị với ThingsBoard để lấy access token).
- `mqtt_tb/` (MQTT client kết nối ThingsBoard, publish telemetry/attributes, OTA scheduler).
- `sensors/` (MAX30102, DS18B20, MPU6050).
- `display/`, `alarm/`, `sys_button/` (hiển thị, còi/chuông, xử lý nút).

Các hằng số cấu hình hệ thống (broker/topic/timeouts/pins/thresholds) được gom trong `components/common/sytem_config.h`.

## 5.3 Lưu đồ thuật toán/flow firmware

Mục này mô tả chi tiết luồng hoạt động “bật thiết bị → cấu hình → kết nối ThingsBoard → gửi dữ liệu → OTA” theo đúng logic firmware.

### 5.3.1 Trạng thái và tham số cấu hình chính

- Chế độ hệ thống:
  - `SYS_MODE_STATION`: chạy bình thường (kết nối Wi‑Fi STA).
  - `SYS_MODE_AP_SIMPLE`: AP cấu hình Wi‑Fi cơ bản (dùng trong trường hợp mất mạng)
  - `SYS_MODE_AP_FULL`: AP cấu hình đầy đủ (Wi‑Fi + định danh patient/doctor).
- Wi‑Fi:
  - Retry tối đa: 5 lần.
  - Timeout kết nối: 15000 ms.
- ThingsBoard:
  - MQTT broker: `mqtt://demo.thingsboard.io:1883`.
  - Provisioning URL: `http://demo.thingsboard.io/api/v1/provision`.
  - MQTT topics:
    - Telemetry: `v1/devices/me/telemetry`
    - Attributes: `v1/devices/me/attributes`
    - Request shared attributes: `v1/devices/me/attributes/request/1`
    - Response shared attributes (OTA): `v1/devices/me/attributes/response/+`
- AP cấu hình:
  - SSID: `ESP32_Health_Config`
  - Max connection: 3

### 5.3.2 Luồng cấu hình AP mode (HTTP config portal)

1. **Điều kiện vào AP mode**

   - Không đọc được cấu hình Wi‑Fi từ NVS, hoặc kết nối Wi‑Fi thất bại/timeout.

2. **Thiết bị phát AP và chạy HTTP server**

   - Thiết bị phát Wi‑Fi AP với SSID `ESP32_Health_Config`.
   - HTTP server chạy 2 endpoint chính:
     - `GET /`: trả trang HTML cấu hình.
     - `POST /save`: nhận cấu hình JSON và lưu xuống NVS.

3. **Tải trang cấu hình**

   - Nếu mode là `SYS_MODE_AP_SIMPLE` → trả trang simple.
   - Nếu mode là `SYS_MODE_AP_FULL` → trả trang full.

4. **Gửi cấu hình (POST /save)**

   4.1. Simple config

   - JSON bắt buộc: `ssid`, `pass`.
   - Lưu xuống NVS: `ssid`, `password`.

     4.2. Full config

   - JSON bắt buộc: `patientID`, `doctorID`, `ssid`, `pass`.
   - Lưu xuống NVS: `ssid`, `password`, `patient`, `doctor`.
   - Đồng thời set cờ `need_prov=1` để sau khi restart sẽ provisioning.

5. **Phản hồi và restart**
   - Nếu JSON sai/thiếu field: trả lỗi HTTP 400.
   - Nếu lỗi lưu NVS: trả lỗi HTTP 500.
   - Nếu lưu thành công: trả HTML thông báo và tự restart sau ~2 giây.

### 5.3.3 Luồng Station mode (kết nối Wi‑Fi)

1. **Đọc cấu hình Wi‑Fi từ NVS**

   - Nếu có `ssid/password` → bắt đầu kết nối STA.

2. **Kết nối Wi‑Fi và chờ trạng thái**

   - Firmware retry tối đa 5 lần.
   - Chờ kết nối hoặc timeout 15000 ms.

3. **Nhánh lỗi**
   - Nếu thất bại/timeout → quay lại AP mode để cấu hình lại.

### 5.3.4 Provisioning (lấy access token ThingsBoard)

1. **Điều kiện**

   - Chỉ chạy provisioning khi đang có Wi‑Fi và cờ `need_prov=1`.

2. **Tạo deviceName**

   - Firmware lấy MAC của Wi‑Fi STA và tạo tên dạng: `ESP_<MAC>` (ví dụ `ESP_A1B2C3D4E5F6`).

3. **Gửi HTTP POST provisioning**

   - URL: `http://demo.thingsboard.io/api/v1/provision`.
   - Header: `Content-Type: application/json`.
   - Payload JSON:
     - `deviceName`
     - `provisionDeviceKey`
     - `provisionDeviceSecret`

4. **Nhận phản hồi và lưu token**
   - Khi HTTP status 200, firmware parse JSON và lấy `credentialsValue`.
   - Lưu xuống NVS key `token`.
   - Đồng thời clear cờ `need_prov` về 0.

### 5.3.5 MQTT kết nối ThingsBoard và gửi dữ liệu

1. **Khởi tạo MQTT client**

   - Broker: `mqtt://demo.thingsboard.io:1883`.
   - Xác thực: access token được set vào `credentials.username` của MQTT client.

2. **Sự kiện MQTT connected/disconnected**

   - Khi connected: set `MQTT_CONNECTED_BIT` và subscribe `v1/devices/me/attributes/response/+` để nhận response attributes cho OTA.
   - Khi disconnected: clear `MQTT_CONNECTED_BIT`.

3. **Gửi attributes (định danh nghiệp vụ)**

   - Topic: `v1/devices/me/attributes`.
   - Payload JSON mẫu:
     - `{ "patientID": "<id>", "doctorID": "<id>" }`

4. **Gửi telemetry (dữ liệu đo)**
   - Topic: `v1/devices/me/telemetry`.
   - Payload JSON mẫu:
     - `{ "heartRate": 75, "SpO2": 98.50, "temperature": 36.70, "alarm": "normal" }`
   - Chu kỳ gửi mặc định: 5000 ms.

### 5.3.6 OTA qua ThingsBoard (shared attributes + HTTPS OTA)

1. **Lịch kiểm tra OTA**

   - OTA scheduler chạy theo chu kỳ (mặc định 5 phút) và request shared attributes: `fw_title,fw_version`.

2. **Nhận response attributes và quyết định update**

   - Khi nhận message trên topic `v1/devices/me/attributes/response/...`, firmware parse JSON.
   - Firmware so sánh `fw_version` trên cloud với version hiện tại (`esp_app_get_description()->version`).
   - Nếu giống nhau: bỏ qua.

3. **Tải firmware bằng HTTPS và cập nhật**
   - Firmware dựng URL tải firmware:
     - `https://demo.thingsboard.io/api/v1/<token>/firmware?title=<fw_title>&version=<fw_version>`
   - Thông báo trạng thái OTA bằng telemetry `fw_state` (UPDATING/UPDATED/FAILED).
   - Nếu OTA thành công: reboot.

## 5.4 Định dạng dữ liệu đo & tần suất gửi

### 5.4.1 Telemetry

- Topic: `v1/devices/me/telemetry`
- Chu kỳ gửi mặc định: 5 giây/lần.
- Payload JSON (theo firmware):
  - `heartRate` (int)
  - `SpO2` (float, 2 chữ số thập phân)
  - `temperature` (float, 2 chữ số thập phân)
  - `alarm` (string: ví dụ `normal`, hoặc trạng thái cảnh báo)

### 5.4.2 Attributes

- Topic: `v1/devices/me/attributes`
- Payload JSON (theo firmware):
  - `patientID` (string)
  - `doctorID` (string)

## 5.5 Xử lý lỗi (mất Wi‑Fi, sensor fail, reconnect…)

### 5.5.1 Mất Wi‑Fi / không kết nối được Wi‑Fi

- Retry kết nối Wi‑Fi tối đa 5 lần.
- Nếu timeout (15 giây) hoặc fail → fallback về AP mode để cấu hình lại.

### 5.5.2 Lỗi cấu hình qua HTTP

- `POST /save` trả HTTP 400 khi JSON không hợp lệ hoặc thiếu field.
- Trả HTTP 500 khi không lưu được NVS.
- Sau khi lưu thành công, thiết bị restart để áp dụng cấu hình.

### 5.5.3 Lỗi provisioning

- Nếu provisioning không trả HTTP 200, hoặc không parse được `credentialsValue`, thiết bị không có token để MQTT lên ThingsBoard.
- Hướng xử lý: kiểm tra lại Wi‑Fi/internet, Provisioning key/secret, và thực hiện cấu hình lại (full config) để provisioning lại.

### 5.5.4 Mất MQTT / reconnect

- Khi mất MQTT, firmware clear `MQTT_CONNECTED_BIT` và tạm ngừng publish.
- Firmware có cơ chế reconnect (delay 5000 ms theo cấu hình) và chỉ publish khi đã connected.

### 5.5.5 Lỗi OTA

- Khi OTA thất bại, firmware publish `fw_state=FAILED` và dừng trạng thái OTA.
- Hướng xử lý: kiểm tra kết nối internet/HTTPS, chứng chỉ, và thông tin firmware trên ThingsBoard.
