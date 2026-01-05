# Chương 2. Cơ sở lý thuyết & công nghệ liên quan

Chương này trình bày các khái niệm và công nghệ nền tảng phục vụ xây dựng hệ thống “giám sát sức khỏe và cảnh báo thông minh”. Nội dung tập trung vào IoT, các chỉ số sức khỏe cơ bản, nền tảng phần cứng–firmware ESP32/ESP‑IDF, giao thức truyền thông (MQTT/HTTP/WebSocket), nền tảng web (React/Express) và các vấn đề bảo mật thường gặp.

## 2.1 Tổng quan IoT trong giám sát sức khỏe

**IoT (Internet of Things)** là mô hình trong đó các thiết bị vật lý (cảm biến, bộ điều khiển, gateway…) được kết nối mạng để thu thập – trao đổi dữ liệu và cho phép giám sát/điều khiển từ xa.

Trong bài toán giám sát sức khỏe, IoT thường được triển khai theo kiến trúc nhiều lớp:

- **Lớp thiết bị (Device/Perception layer)**: cảm biến sinh học và cảm biến chuyển động đo dữ liệu (nhịp tim, SpO₂, nhiệt độ, gia tốc…).
- **Lớp kết nối (Network/Transport layer)**: Wi‑Fi/4G/LoRa… và các giao thức truyền dữ liệu (MQTT/HTTP).
- **Lớp nền tảng (Platform layer)**: máy chủ/IoT platform (ví dụ ThingsBoard) tiếp nhận telemetry, lưu trữ timeseries và kích hoạt rule/cảnh báo.
- **Lớp ứng dụng (Application layer)**: web/app cho bác sĩ, người nhà, quản trị viên để theo dõi và quản lý.

Đặc trưng của hệ thống giám sát sức khỏe:

- Dữ liệu cần **liên tục** và có **tính thời gian thực** (near real-time).
- Cần cơ chế **cảnh báo sớm** theo ngưỡng hoặc theo bất thường.
- Cần đảm bảo **an toàn dữ liệu** và **phân quyền truy cập**.

## 2.2 Các chỉ số theo dõi (nhịp tim, SpO₂, nhiệt độ, vận động/ngã…) và ý nghĩa

Hệ thống hướng tới các chỉ số phổ biến, dễ đo bằng cảm biến chi phí hợp lý và có ý nghĩa trong cảnh báo sớm.

### a) Nhịp tim (Heart Rate)

Nhịp tim phản ánh hoạt động của hệ tim mạch. Việc theo dõi nhịp tim giúp:

- Phát hiện nhịp tim cao/thấp bất thường.
- Hỗ trợ theo dõi trạng thái nghỉ/ngủ/vận động.

Trong hệ thống, nhịp tim được thu thập từ cảm biến quang học (PPG) và gửi lên nền tảng giám sát để hiển thị theo thời gian.

### b) SpO₂ (độ bão hòa oxy trong máu)

SpO₂ thể hiện tỷ lệ hemoglobin bão hòa oxy. Đây là chỉ số quan trọng để:

- Phát hiện thiếu oxy (đặc biệt trong các bệnh về hô hấp).
- Kết hợp với nhịp tim để tăng độ tin cậy của cảnh báo.

### c) Nhiệt độ cơ thể

Nhiệt độ cao/thấp bất thường có thể là dấu hiệu sốt, nhiễm trùng hoặc hạ thân nhiệt. Theo dõi nhiệt độ giúp:

- Cảnh báo khi nhiệt độ vượt ngưỡng cài đặt.
- Theo dõi biến thiên theo thời gian.

### d) Vận động / phát hiện ngã

Cảm biến gia tốc/gyro (IMU) có thể dùng để ước lượng trạng thái vận động và nhận biết sự kiện bất thường như ngã. Trong phạm vi đồ án, phát hiện ngã thường dựa trên:

- Ngưỡng gia tốc đột biến.
- Thay đổi tư thế đột ngột.
- Kết hợp điều kiện “imobile” sau sự kiện.

_Lưu ý_: Thuật toán phát hiện ngã phụ thuộc nhiều vào ngưỡng và cách đeo thiết bị, do đó kết quả cần hiệu chỉnh theo thực tế.

## 2.3 ESP32 & ESP-IDF (FreeRTOS, Wi‑Fi, NVS, OTA)

### a) ESP32

ESP32 là SoC phổ biến cho IoT, tích hợp Wi‑Fi/Bluetooth, hiệu năng tốt, cộng đồng lớn và phù hợp cho thiết bị đeo/thiết bị giám sát.

Lý do ESP32 phù hợp với đề tài:

- Hỗ trợ Wi‑Fi ổn định cho truyền dữ liệu.
- Nhiều GPIO/I2C/OneWire để kết nối cảm biến.
- Có thể vận hành theo chu kỳ, hỗ trợ tiết kiệm năng lượng (deep sleep).

### b) ESP-IDF

**ESP-IDF** là bộ SDK chính thức của Espressif cho ESP32, hỗ trợ:

- **FreeRTOS**: hệ điều hành thời gian thực, giúp tách tác vụ (đọc cảm biến, gửi MQTT, hiển thị, xử lý nút bấm…).
- **Wi‑Fi stack**: quản lý kết nối, reconnect, cấu hình chế độ Station/AP.
- **NVS (Non-Volatile Storage)**: lưu cấu hình lâu dài như Wi‑Fi, patient/doctor ID, token thiết bị.
- **OTA (Over‑the‑Air update)**: cập nhật firmware từ xa giúp bảo trì thiết bị thuận tiện.

Trong hệ thống, firmware ESP32 đảm nhiệm các nhóm chức năng chính:

- Thu thập dữ liệu nhịp tim/SpO₂/nhiệt độ và các trạng thái khác.
- Kết nối Wi‑Fi và gửi telemetry lên ThingsBoard qua MQTT theo chu kỳ (ví dụ mỗi 5 giây).
- Hiển thị dữ liệu thời gian thực lên OLED và phát cảnh báo bằng buzzer khi cần.
- Hỗ trợ chế độ cấu hình nhanh (AP mode) và nút SOS.

## 2.4 Giao thức truyền thông: MQTT/HTTP/WebSocket (ưu/nhược, lý do chọn)

### a) MQTT

**MQTT** là giao thức publish/subscribe nhẹ, phù hợp IoT vì:

- Overhead nhỏ, chạy tốt trên thiết bị tài nguyên hạn chế.
- Mô hình pub/sub giúp mở rộng (nhiều thiết bị, nhiều subscriber).
- Hỗ trợ QoS (đảm bảo mức độ giao hàng tùy chọn).

Nhược điểm:

- Cần broker (ví dụ ThingsBoard/Mosquitto).
- Việc quản lý topic, quyền publish/subscribe cần thiết kế chặt chẽ.

Trong hệ thống, MQTT được dùng để:

- ESP32 gửi telemetry lên ThingsBoard.
- ThingsBoard kích hoạt rule chain để tạo cảnh báo và đẩy sang backend qua HTTP.

### b) HTTP/REST

**HTTP REST** phù hợp cho API quản trị vì:

- Dễ triển khai, dễ kiểm thử.
- Chuẩn hóa request/response cho frontend.

Nhược điểm:

- Không tối ưu cho truyền dữ liệu liên tục tần suất cao.

Trong hệ thống, HTTP thường dùng để:

- Frontend gọi API backend (đăng nhập, CRUD bác sĩ/bệnh nhân/thiết bị, xem cảnh báo).
- ThingsBoard gọi REST API backend khi phát sinh alarm.

### c) WebSocket

**WebSocket** hỗ trợ kết nối hai chiều, phù hợp cho cập nhật realtime:

- Push dữ liệu/cảnh báo tức thời lên UI.
- Giảm việc polling liên tục.

Nhược điểm:

- Cần quản lý session, auth trên kết nối socket.
- Tăng độ phức tạp vận hành.

Trong hệ thống web, Socket.IO (dựa trên WebSocket) có thể dùng để:

- Phát cảnh báo realtime tới dashboard.
- Đồng bộ thay đổi trạng thái/notification.

## 2.5 Nền tảng server/web: Node.js/Express, React

### a) Backend: Node.js + Express

**Node.js** phù hợp cho backend thời gian thực và I/O nhiều (API, database, socket) nhờ mô hình bất đồng bộ. **Express** là framework phổ biến để xây dựng REST API.

Các thành phần backend thường gặp trong hệ thống:

- **Controllers**: tiếp nhận request, điều phối luồng xử lý.
- **Services**: chứa nghiệp vụ (auth, device, patient, notification…).
- **Repositories**: trừu tượng hóa truy cập dữ liệu (MongoDB/Mongoose).
- **Middlewares**: xác thực, validate, rate limit, log request, xử lý lỗi.

Hệ thống sử dụng MongoDB (thông qua Mongoose) để lưu trữ dữ liệu nghiệp vụ như tài khoản người dùng, thông tin bác sĩ, bệnh nhân và thông tin liên kết/định danh thiết bị.

### b) Nền tảng lưu trữ dữ liệu cho hệ web

Trong hệ thống web, dữ liệu thường được phân loại thành 2 nhóm chính: (1) dữ liệu nghiệp vụ có cấu trúc và (2) dữ liệu tệp (ảnh đại diện, file đính kèm…). Vì vậy, kiến trúc lưu trữ thường kết hợp database và object storage.

- **MongoDB (CSDL tài liệu – document database)**:

  - Phù hợp lưu dữ liệu nghiệp vụ thay đổi linh hoạt như thông tin người dùng, bác sĩ, bệnh nhân, thiết bị.
  - Hỗ trợ truy vấn theo điều kiện, phân trang, và mở rộng theo cụm (cluster) khi triển khai cloud.
  - Trong dự án, MongoDB được truy cập thông qua **Mongoose** để định nghĩa schema/model và thao tác CRUD.

- **Lưu trữ time-series (telemetry)**:

  - Trong dự án, dữ liệu đo theo thời gian được lưu và truy vấn chủ yếu từ **ThingsBoard** (timeseries), backend gọi API của ThingsBoard để lấy telemetry mới nhất phục vụ hiển thị.
  - Cách tách này giúp backend tập trung vào nghiệp vụ (quản lý tài khoản, phân quyền, điều phối cảnh báo) và tránh lưu telemetry tần suất cao vào MongoDB.

- **Lưu trữ file/ảnh (AWS S3)**:
  - Dự án triển khai upload ảnh đại diện bằng `multer` (memory storage) và xử lý ảnh bằng `sharp`, sau đó upload lên **AWS S3**.
  - Backend lưu **đường dẫn ảnh** vào MongoDB (trường `imageUrl` của user) để frontend truy xuất.

### c) Frontend: React

**React** là thư viện xây dựng UI theo mô hình component.

Trong hệ thống giám sát sức khỏe, React phù hợp vì:

- Dễ xây dựng dashboard/biểu đồ theo thời gian.
- Dễ quản lý routing theo vai trò người dùng.
- Tích hợp API (Axios) và realtime (Socket.IO client).

## 2.6 Nền tảng IoT/Cloud (ThingsBoard): telemetry, device token, rule engine

**ThingsBoard** là nền tảng IoT hỗ trợ:

- Tiếp nhận dữ liệu telemetry từ thiết bị (MQTT/HTTP).
- Lưu trữ dữ liệu time-series và hiển thị dashboard.
- Xây dựng **Rule Chain** để xử lý dữ liệu, phát hiện bất thường, tạo alarm.

Trong hệ thống, quy trình cảnh báo thường có dạng:

1. ESP32 gửi telemetry (heart_rate, SpO₂, temperature…).
2. ThingsBoard Rule Chain kiểm tra điều kiện vượt ngưỡng.
3. Nếu thỏa điều kiện, ThingsBoard tạo alarm và gọi REST API sang backend.
4. Backend xử lý alarm và phát thông báo realtime (Socket.IO) đồng thời gửi email; phiên bản hiện tại không lưu alarm thành một bảng/collection riêng trong MongoDB.

Cách tiếp cận này tách phần xử lý rule/cảnh báo (IoT platform) và phần nghiệp vụ ứng dụng (backend), giúp mở rộng và thay đổi rule linh hoạt.

## 2.7 Bảo mật cơ bản: JWT, phân quyền, validate input, rate limiting

Hệ thống liên quan dữ liệu sức khỏe nên cần đảm bảo các yêu cầu bảo mật cơ bản.

### a) Xác thực JWT

**JWT (JSON Web Token)** thường dùng cho API stateless:

- Người dùng đăng nhập nhận access token (và refresh token nếu có).
- Client gửi token trong header `Authorization: Bearer <token>` khi gọi API.

### b) Phân quyền theo vai trò (Role-based Access Control)

Hệ thống thường có các vai trò như:

- **Admin**: quản trị hệ thống, tạo tài khoản bác sĩ.
- **Doctor**: theo dõi danh sách bệnh nhân, xem cảnh báo.
- **Family**: theo dõi bệnh nhân liên quan.

Phân quyền giúp đảm bảo đúng người – đúng dữ liệu.

### c) Validate input và chống tấn công phổ biến

- **Request validation**: kiểm tra dữ liệu đầu vào (định dạng email, độ dài, required fields…).
- **Sanitize**: hạn chế NoSQL injection (mongo sanitize), chống XSS (xss-clean), lọc payload.
- **Security headers**: dùng helmet để thiết lập HTTP headers an toàn.

### d) Rate limiting và logging

- **Rate limit**: hạn chế số lượng request trong thời gian nhất định để giảm nguy cơ brute force/DDoS nhẹ.
- **Logging**: ghi log request và lỗi (morgan/winston) phục vụ truy vết, vận hành.
