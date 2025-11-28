# Hướng dẫn sử dụng hệ thống

Thư mục này chứa code triển khai cho Thiết bị

## 1. Chuẩn bị

### Thiết bị

- Chip Esp32
- Cảm biến gia tốc: MPU6050
- Cảm biến nhiệt độ:

### Môi trường

- [Cài đặt **ESP-IDF**](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/get-started/)
- Cài đặt **Python 3.8+**
- [Tạo tài khoản **ThingsBoard** và tạo **Device**](https://docs.google.com/document/d/1lUEHkdseESF9-TEnLqJxWDx3g02dIIZYxRGIfbPn5dw/edit?usp=sharing)
- Lấy **Access Token** của thiết bị

### Thư viện cần thiết

ESP-IDF Terminal

```bash
cd esp32
idf.py add-dependency "espressif/onewire_bus^1.0.4"
idf.py add-dependency "espressif/ds18b20^0.2.0"
idf.py add-dependency "espressif/mpu6050^1.2.0"
```

## 2 Sơ đồ mạch kết nối

## 3 Build và Flash lên ESP32

ESP-IDF Terminal

```bash
idf.py set-target esp32
idf.py build
idf.py -p <COM port> flash monitor
# Thay COM port thành COM kết nối với Esp32
```
