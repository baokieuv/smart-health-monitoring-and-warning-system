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

- Thu thập dữ liệu sức khỏe từ các cảm biến sinh học
- Kết nối Wi-Fi và gửi dữ liệu định kỳ lên **ThingsBoard** qua giao thức MQTT
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

### Clone dự án

```bash
git clone https://github.com/baokieuv/smart-health-monitoring-and-warning-system
```

## Cài đặt

> Chi tiết hướng dẫn cài đặt sẽ được trình bày trong các thư mục con


Test Mail Alarm 
```
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/thingsboard/test-alarm" -Method Post -ContentType "application/json" -Body '{"deviceId":"c4e9c580-db65-11f0-bfe9-11b3637c80b4","alarmType":"HIGH_HEART_RATE","severity":"CRITICAL","data":{"heart_rate":150,"SpO2":85,"temperature":39.5}}'
```

curl patientid, doctorid on thingsboard
```
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/JNRHJ97c94fEYaamxA8v/attributes" -Method Post -ContentType "application/json" -Body '{"patient":"038492379481","doctor":"000000000000"}'
```

curl heart_rate, spO2, temperature on thingboards
```
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/JNRHJ97c94fEYaamxA8v/telemetry" -Method Post -ContentType "application/json" -Body '{"heart_rate": 80,"SpO2": 98,"temperature": 37.2,"alarm_status": null}'
```

## Cấu hình ThingsBoard Rule Chain để gửi Alarm

### Bước 1: Tạo Rule Chain mới (hoặc chỉnh sửa Root Rule Chain)

1. Vào ThingsBoard UI → **Rule chains** (menu bên trái)
2. Click vào **Root Rule Chain** để chỉnh sửa

### Bước 2: Thêm Script Node để phát hiện Alarm

1. Kéo node **Script** từ sidebar vào canvas
2. Cấu hình Script node:
   - **Name**: `Check Health Alarm`
   - **Script**:
   ```javascript
   // Lấy giá trị telemetry
   var heartRate = msg.heart_rate;
   var SpO2 = msg.SpO2;
   var temperature = msg.temperature;
   
   // Kiểm tra điều kiện alarm
   var alarmType = null;
   var severity = "INFO";
   
   if (heartRate > 100 || heartRate < 60) {
       alarmType = "ABNORMAL_HEART_RATE";
       severity = heartRate > 120 || heartRate < 50 ? "CRITICAL" : "WARNING";
   } else if (SpO2 < 90) {
       alarmType = "LOW_SPO2";
       severity = SpO2 < 85 ? "CRITICAL" : "WARNING";
   } else if (temperature > 38.5 || temperature < 36) {
       alarmType = "ABNORMAL_TEMPERATURE";
       severity = temperature > 39.5 || temperature < 35.5 ? "CRITICAL" : "WARNING";
   }
   
   // Nếu có alarm, thêm vào metadata
   if (alarmType) {
       metadata.alarmType = alarmType;
       metadata.severity = severity;
       return {msg: msg, metadata: metadata, msgType: "ALARM"};
   }
   
   return {msg: msg, metadata: metadata, msgType: "POST_TELEMETRY_REQUEST"};
   ```

3. Kết nối **Message Type Switch** → **Post telemetry** với **Check Health Alarm**

### Bước 3: Thêm REST API Call Node

1. Kéo node **REST API Call** từ sidebar
2. Cấu hình:
   - **Name**: `Send Alarm to Backend`
   - **Endpoint URL pattern**: `http://localhost:5000/api/v1/thingsboard/alarm`
   - **Request method**: `POST`
   - **Headers**:
     ```
     Content-Type: application/json
     ```
   - **Request body** (sử dụng template):
     ```json
     {
       "deviceId": "${deviceId}",
       "alarmType": "${alarmType}",
       "severity": "${severity}",
       "data": {
         "heart_rate": ${heart_rate},
         "SpO2": ${SpO2},
         "temperature": ${temperature}
       }
     }
     ```

### Bước 4: Kết nối các nodes

1. Kết nối **Check Health Alarm** → **ALARM** (relation type) → **Send Alarm to Backend**
2. Kết nối **Check Health Alarm** → **POST_TELEMETRY_REQUEST** → **Save Timeseries**

### Bước 5: Test Rule Chain

# Test với heart rate cao (có alarm)
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/JNRHJ97c94fEYaamxA8v/telemetry" -Method Post -ContentType "application/json" -Body '{"heart_rate": 125,"SpO2": 98,"temperature": 37.2}'

# Test với SpO2 thấp (có alarm)
Invoke-RestMethod -Uri "http://localhost:8080/api/v1/JNRHJ97c94fEYaamxA8v/telemetry" -Method Post -ContentType "application/json" -Body '{"heart_rate": 75,"SpO2": 82,"temperature": 37.2}'
```
