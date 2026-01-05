# Chương 1. Mở đầu

## 1.1 Lý do chọn đề tài

Trong bối cảnh nhu cầu chăm sóc sức khỏe ngày càng tăng, đặc biệt với người cao tuổi và các bệnh nhân cần theo dõi dài hạn, việc giám sát các chỉ số cơ bản (nhịp tim, nhiệt độ cơ thể, trạng thái vận động/ngã…) theo phương thức thủ công thường gặp nhiều hạn chế: tốn thời gian, phụ thuộc vào người chăm sóc, khó theo dõi liên tục và dễ bỏ lỡ các dấu hiệu bất thường.

Sự phát triển của Internet of Things (IoT) và các vi điều khiển có kết nối không dây (ví dụ ESP32) cho phép xây dựng các thiết bị nhỏ gọn, chi phí hợp lý, có thể thu thập dữ liệu cảm biến theo thời gian thực và truyền về hệ thống trung tâm. Kết hợp với nền tảng web và các cơ chế cảnh báo, hệ thống có thể hỗ trợ:

- Theo dõi liên tục và trực quan hóa dữ liệu theo thời gian.
- Phát hiện và cảnh báo sớm khi chỉ số vượt ngưỡng.
- Hỗ trợ bác sĩ/người nhà truy cập từ xa để nắm bắt tình trạng.
- Quản lý thiết bị và cập nhật firmware (OTA) nhằm giảm chi phí vận hành.

Vì vậy, đề tài “Hệ thống giám sát và cảnh báo sức khỏe thông minh” được lựa chọn nhằm ứng dụng IoT và kỹ thuật phần mềm để xây dựng một hệ thống hoàn chỉnh từ thiết bị đo đến nền tảng quản trị/giám sát.

## 1.2 Mục tiêu đề tài

Mục tiêu tổng quát của đề tài là xây dựng một hệ thống end-to-end phục vụ giám sát và cảnh báo sức khỏe, bao gồm thiết bị nhúng, dịch vụ backend và giao diện web.

Các mục tiêu cụ thể:

- Xây dựng thiết bị dựa trên ESP32 có khả năng:
  - Thu thập dữ liệu từ các cảm biến sức khỏe và chuyển động (ví dụ: nhịp tim, nhiệt độ, gia tốc).
  - Kết nối Wi‑Fi, gửi dữ liệu định kỳ/real-time về hệ thống.
  - Hỗ trợ cảnh báo tại chỗ (còi/buzzer, hiển thị) khi cần.
  - Hỗ trợ cập nhật firmware từ xa qua OTA.
- Xây dựng backend cung cấp:
  - API phục vụ xác thực, phân quyền và quản lý người dùng.
  - API quản lý bệnh nhân/thiết bị và tiếp nhận dữ liệu đo.
  - Cơ chế cảnh báo/thông báo và hỗ trợ realtime (khi có sự kiện).
  - Lưu trữ dữ liệu, log và xử lý lỗi theo chuẩn.
- Xây dựng giao diện web:
  - Cho phép đăng nhập theo vai trò (admin/bác sĩ/người nhà… tùy mô hình).
  - Theo dõi danh sách bệnh nhân/thiết bị, xem chi tiết và cảnh báo.
  - Hiển thị dữ liệu cập nhật theo thời gian thực (nếu có cấu phần socket).

## 1.3 Đối tượng – phạm vi nghiên cứu

**Đối tượng nghiên cứu**

- Thiết bị nhúng (ESP32) và các cảm biến liên quan đến đo chỉ số sức khỏe/vận động.
- Hệ thống truyền thông dữ liệu (MQTT/HTTP/WebSocket tùy kiến trúc triển khai).
- Hệ thống phần mềm gồm backend và web frontend phục vụ quản lý, hiển thị và cảnh báo.

**Phạm vi thực hiện**

- Hệ thống được xây dựng theo hướng mô phỏng/ứng dụng thực nghiệm (prototype), ưu tiên tính đầy đủ chu trình: đo → truyền → lưu/hiển thị → cảnh báo → quản trị.
- Tập trung vào các chỉ số và kịch bản theo dõi phổ biến; không nhằm thay thế thiết bị y tế chuyên dụng.
- Việc đánh giá tập trung vào tính đúng đắn chức năng, độ ổn định kết nối, và khả năng vận hành cơ bản (triển khai, cập nhật, mở rộng).

**Giới hạn của đề tài**

- Chưa đánh giá lâm sàng hoặc chứng nhận y tế; ngưỡng cảnh báo mang tính tham khảo và có thể cần hiệu chỉnh theo từng đối tượng.
- Hiệu năng và độ chính xác phụ thuộc phần cứng cảm biến, điều kiện đo và môi trường mạng.

## 1.4 Phương pháp thực hiện

Đề tài được triển khai theo quy trình kỹ thuật phần mềm kết hợp phát triển hệ thống nhúng:

1. **Khảo sát và phân tích yêu cầu**: xác định tác nhân, use case, nhóm chức năng (thiết bị – backend – web) và các ràng buộc vận hành.
2. **Thiết kế hệ thống**:
   - Thiết kế kiến trúc tổng thể, luồng dữ liệu và phân chia module.
   - Thiết kế mô hình dữ liệu và đặc tả API.
   - Thiết kế cơ chế xác thực, phân quyền và bảo mật cơ bản.
3. **Xây dựng và tích hợp**:
   - Firmware ESP32 theo hướng module hóa (Wi‑Fi/provisioning, sensors, mqtt/http, storage, OTA…).
   - Backend theo mô hình phân lớp (controller/service/repository), bổ sung middleware validate, error handling.
   - Frontend React triển khai các trang quản trị/giám sát, tích hợp API và realtime (nếu có).
4. **Kiểm thử và đánh giá**:
   - Kiểm thử theo kịch bản chức năng và kiểm thử tích hợp end-to-end.
   - Ghi nhận kết quả, phân tích hạn chế và đề xuất hướng phát triển.

## 1.5 Bố cục báo cáo

Nội dung báo cáo được trình bày theo các chương sau:

- **Chương 1 – Mở đầu**: Trình bày lý do chọn đề tài, mục tiêu, phạm vi, phương pháp và bố cục.
- **Chương 2 – Cơ sở lý thuyết & công nghệ liên quan**: Tổng quan IoT, cảm biến/chỉ số sức khỏe, ESP32/ESP‑IDF, giao thức truyền thông và công nghệ web.
- **Chương 3 – Phân tích yêu cầu hệ thống**: Xác định tác nhân, yêu cầu chức năng/phi chức năng và các use case chính.
- **Chương 4 – Thiết kế hệ thống**: Kiến trúc tổng thể, thiết kế dữ liệu, thiết kế API/giao tiếp và định hướng UI/UX.
- **Chương 5 – Thiết kế phần cứng & firmware (ESP32)**: Linh kiện, kết nối, thiết kế module firmware, luồng hoạt động và xử lý lỗi.
- **Chương 6 – Xây dựng hệ thống**: Trình bày quá trình hiện thực backend, frontend và firmware, cùng tích hợp end-to-end.
- **Chương 7 – Kết luận & hướng phát triển**: Tổng kết và định hướng mở rộng trong tương lai.
