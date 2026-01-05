# Mục lục

## Chương 1. Mở đầu

- 1.1 Lý do chọn đề tài
- 1.2 Mục tiêu đề tài
- 1.3 Đối tượng – phạm vi nghiên cứu
- 1.4 Phương pháp thực hiện
- 1.5 Bố cục báo cáo

## Chương 2. Cơ sở lý thuyết & công nghệ liên quan

- 2.1 Tổng quan IoT trong giám sát sức khỏe
- 2.2 Các chỉ số theo dõi (nhịp tim, nhiệt độ, vận động/ngã…) và ý nghĩa
- 2.3 ESP32 & ESP-IDF (FreeRTOS, Wi‑Fi, NVS, OTA)
- 2.4 Giao thức truyền thông: MQTT/HTTP/WebSocket (ưu/nhược, lý do chọn)
- 2.5 Nền tảng server/web: Node.js/Express, React
- 2.6 Nền tảng IoT/Cloud (ThingsBoard): telemetry, device token, rule engine
- 2.7 Bảo mật cơ bản: JWT, phân quyền, validate input, rate limiting

## Chương 3. Phân tích yêu cầu hệ thống

- 3.1 Mô hình hóa nghiệp vụ (tổng quan)
  - Các dịch vụ chính của hệ thống
  - Các quy trình nghiệp vụ chính của hệ thống
  - Quy trình bật thiết bị & kết nối ThingsBoard (mức nghiệp vụ)
- 3.2 Yêu cầu chức năng & phi chức năng
- 3.3 Mô hình hóa chức năng
  - Các tác nhân
  - Use case + mô tả use case chính (bảng)
  - Sơ đồ ca sử dụng tổng quan (Use case diagram)
- 3.4 Mô hình hóa cấu trúc
  - Xác định các đối tượng của hệ thống
  - Mô hình hóa lĩnh vực
- 3.5 Mô hình hóa hành vi
  - Sơ đồ máy trạng thái
  - Sơ đồ tuần tự mức tổng quan

## Chương 4. Thiết kế hệ thống

- 4.1 Thiết kế mức tương tác nghiệp vụ
- 4.2 Thiết kế tương tác mức thực tế
- 4.3 Thiết kế lưu trữ cố định
  - ERD, mô tả bảng/collection (User, Patient, Doctor, Device, Notification…)
- 4.4 Thiết kế kiến trúc tổng thể (ESP32 ↔ MQTT/HTTP ↔ Backend ↔ DB ↔ Web)
- 4.5 Thiết kế giao tiếp & dữ liệu truyền
  - MQTT topics, payload telemetry mẫu
  - API endpoints chính (bảng: method, path, request, response, quyền)
  - Socket events (realtime alerts) nếu có
- 4.6 Thiết kế phân quyền & bảo mật
- 4.7 Thiết kế UI/UX (wireframe hoặc ảnh chụp màn hình các trang)

## Chương 5. Thiết kế phần cứng & firmware (ESP32)

- 5.1 Danh sách linh kiện, sơ đồ kết nối (I2C/OneWire/GPIO…)
- 5.2 Thiết kế phần mềm nhúng (module hóa)
  - Wi‑Fi/provisioning, sensors, mqtt/http, display/alarm/button, storage (NVS), OTA
- 5.3 Lưu đồ thuật toán/flow firmware
  - Luồng kết nối ThingsBoard (chi tiết firmware)
- 5.4 Định dạng dữ liệu đo & tần suất gửi
- 5.5 Xử lý lỗi (mất Wi‑Fi, sensor fail, reconnect…)

## Chương 6. Xây dựng hệ thống

- 6.1 Backend
  - Cấu trúc thư mục, mô hình controller/service/repository, middleware, validate, error handling
- 6.2 Frontend
  - Cấu trúc, routing, các trang chính, gọi API, realtime socket
- 6.3 Firmware ESP32
  - Quy trình build/flash/monitor, cấu hình sdkconfig/menuconfig (nếu cần)
- 6.4 Tích hợp end-to-end (thiết bị → server → web)
- 6.5 Triển khai (local/cloud), cấu hình môi trường, docker-compose (nếu dùng)

## Chương 7. Kết luận & hướng phát triển

- 7.1 Kết luận
- 7.2 Hướng phát triển (app mobile, AI phát hiện bất thường, tối ưu pin, thêm sensor, HA server…)

## Tài liệu tham khảo

## Phụ lục

- Payload mẫu, topics, API sample
- Hình ảnh mạch/đấu nối
- Cấu hình & hướng dẫn chạy nhanh
