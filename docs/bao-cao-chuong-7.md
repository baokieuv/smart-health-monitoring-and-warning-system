# Chương 7. Kết luận & hướng phát triển

Chương này tổng kết kết quả đạt được của đề tài “Smart Health Monitoring and Warning System”, đồng thời đề xuất các hướng phát triển phù hợp với kiến trúc hiện tại (thiết bị ESP32, nền tảng ThingsBoard, hệ thống máy chủ xử lý nghiệp vụ, và giao diện web).

## 7.1 Kết luận

### 7.1.1 Kết quả đạt được

Dựa trên phạm vi triển khai hiện có trong repository, đề tài đã xây dựng được một hệ thống giám sát và cảnh báo sức khỏe theo hướng Internet vạn vật, gồm các thành phần chính:

- **Thiết bị đo (ESP32)**: thu thập dữ liệu cảm biến (nhịp tim, nồng độ oxy trong máu, nhiệt độ, và các sự kiện cảnh báo như ngã hoặc khẩn cấp tùy theo cấu hình), sau đó gửi dữ liệu lên nền tảng ThingsBoard thông qua giao thức truyền thông phù hợp.
- **Nền tảng ThingsBoard**: tiếp nhận dữ liệu theo thời gian (time-series), hỗ trợ quản lý thiết bị, và cung cấp cơ chế chuỗi luật (rule chain) để phát hiện bất thường. Khi phát hiện bất thường, ThingsBoard gọi webhook về hệ thống máy chủ để kích hoạt luồng cảnh báo.
- **Hệ thống máy chủ xử lý nghiệp vụ (Node.js/Express)**:
  - Cung cấp giao diện lập trình ứng dụng theo kiểu REST để phục vụ giao diện web.
  - Quản lý dữ liệu nghiệp vụ trong MongoDB (tài khoản, bác sĩ, bệnh nhân, thiết bị và liên kết giữa các thực thể).
  - Tích hợp với ThingsBoard để lấy dữ liệu đo mới nhất nhằm hiển thị cho người dùng.
  - Xử lý webhook cảnh báo từ ThingsBoard và phát cảnh báo theo thời gian thực qua Socket.IO, đồng thời gửi thư điện tử cảnh báo.
- **Giao diện web (React)**:
  - Hỗ trợ các vai trò người dùng (quản trị viên, bác sĩ, bệnh nhân/người nhà) theo cơ chế mã thông báo JSON Web Token.
  - Cho phép bác sĩ quản lý danh sách bệnh nhân, xem chi tiết, theo dõi chỉ số gần thời gian thực, và nhận cảnh báo.

Về mặt luồng dữ liệu tổng thể, hệ thống đã đáp ứng được chuỗi xử lý cơ bản:

1. Thiết bị đo gửi dữ liệu đo (telemetry) lên ThingsBoard.
2. ThingsBoard phát hiện bất thường theo ngưỡng hoặc quy tắc đã cấu hình.
3. ThingsBoard gọi webhook cảnh báo về hệ thống máy chủ.
4. Hệ thống máy chủ xác định bệnh nhân, bác sĩ phụ trách và phát cảnh báo (Socket.IO) và gửi thư điện tử.
5. Giao diện web hiển thị cảnh báo gần thời gian thực cho bác sĩ.

### 7.1.2 Ý nghĩa và đóng góp

- **Tính thực tiễn**: mô hình triển khai phản ánh một kiến trúc điển hình của hệ thống Internet vạn vật trong lĩnh vực giám sát sức khỏe, tách rõ lớp thiết bị, lớp nền tảng Internet vạn vật, lớp nghiệp vụ và lớp giao diện.
- **Khả năng mở rộng**: việc sử dụng ThingsBoard làm nền tảng trung gian giúp dễ mở rộng số lượng thiết bị, thay đổi quy tắc cảnh báo, và tăng khả năng giám sát theo thời gian.
- **Khả năng cảnh báo kịp thời**: luồng webhook và thông báo theo thời gian thực giúp giảm độ trễ từ khi phát hiện bất thường đến khi bác sĩ nhận cảnh báo.

### 7.1.3 Hạn chế của triển khai hiện tại

Trong phạm vi đồ án và tình trạng triển khai hiện tại, hệ thống còn một số hạn chế cần cải thiện khi triển khai thực tế:

- **Chưa lưu lịch sử cảnh báo**: backend hiện tập trung vào phát cảnh báo theo thời gian thực và gửi thư điện tử; chưa có collection lưu lịch sử cảnh báo trong MongoDB, nên khó truy vết và thống kê theo thời gian.
- **Webhook cảnh báo chưa có cơ chế xác thực mạnh**: endpoint nhận cảnh báo từ ThingsBoard đang theo hướng công khai (public). Khi triển khai thực tế, cần bổ sung cơ chế xác thực và giới hạn nguồn gọi.
- **Tính nhất quán khóa dữ liệu đo và thuộc tính**: có lưu ý về khả năng lệch chuẩn tên khóa (ví dụ dạng snake_case và camelCase) giữa firmware, cấu hình ThingsBoard và backend. Cần thống nhất quy ước để đảm bảo dữ liệu end-to-end luôn nhất quán.
- **Quản lý mã thông báo làm mới theo bộ nhớ**: nếu sử dụng lưu trữ trong bộ nhớ (in-memory), trạng thái có thể mất khi khởi động lại dịch vụ và khó mở rộng theo mô hình nhiều máy chủ.

## 7.2 Hướng phát triển

Dựa trên kiến trúc hiện có, các hướng phát triển dưới đây giúp hệ thống phù hợp hơn với yêu cầu vận hành thực tế và nâng cao chất lượng giám sát.

### 7.2.1 Hoàn thiện chức năng nghiệp vụ và trải nghiệm người dùng

- **Lưu trữ và quản lý lịch sử cảnh báo**: bổ sung collection “Cảnh báo” trong MongoDB để lưu lại thời gian, loại cảnh báo, mức độ nghiêm trọng, dữ liệu đo liên quan, trạng thái đã đọc/đã xác nhận, và ghi chú xử lý.
- **Màn hình tổng hợp cảnh báo**: bổ sung bảng tổng hợp cảnh báo theo thời gian, trạng thái, mức độ; hỗ trợ truy vết theo bệnh nhân và theo bác sĩ.
- **Cơ chế xác nhận xử lý cảnh báo**: ngoài sự kiện Socket.IO “acknowledge-alarm”, có thể thêm API ghi nhận trạng thái xử lý để phục vụ thống kê và phân công.

### 7.2.2 Tăng cường bảo mật và độ tin cậy

- **Bảo vệ webhook từ ThingsBoard**: áp dụng một hoặc nhiều biện pháp:
  - ký chữ ký HMAC bằng khóa bí mật chia sẻ trong header;
  - giới hạn địa chỉ IP của ThingsBoard (whitelist) nếu môi trường cho phép;
  - đặt webhook sau cổng bảo vệ (reverse proxy) có xác thực.
- **Bổ sung cơ chế chống tấn công và kiểm soát lưu lượng**: chuẩn hóa kiểm tra dữ liệu đầu vào cho webhook, tăng cường giới hạn tần suất gọi, và ghi log theo cấu trúc để phục vụ giám sát.
- **Lưu trữ mã thông báo làm mới trong hệ thống lưu trữ bền vững**: chuyển từ lưu trong bộ nhớ sang Redis hoặc cơ sở dữ liệu để hỗ trợ mở rộng nhiều phiên bản máy chủ và tránh mất trạng thái khi khởi động lại.

### 7.2.3 Phát triển thuật toán phát hiện bất thường nâng cao

- **Cá nhân hóa ngưỡng cảnh báo**: thay vì ngưỡng cố định, lưu cấu hình ngưỡng theo từng bệnh nhân (tuổi, bệnh nền, chỉ định bác sĩ) và cho phép điều chỉnh qua giao diện.
- **Ứng dụng học máy trong phát hiện bất thường**: xây dựng mô hình dự báo hoặc phát hiện bất thường từ chuỗi thời gian (nhịp tim, nồng độ oxy trong máu, nhiệt độ) nhằm giảm cảnh báo giả và nhận diện sớm xu hướng xấu.
- **Kết hợp nhiều tín hiệu**: không chỉ dựa trên một chỉ số, mà kết hợp nhiều chỉ số và trạng thái vận động để đánh giá mức độ nguy cơ.

### 7.2.4 Mở rộng nền tảng giao diện và kênh thông báo

- **Ứng dụng di động**: phát triển ứng dụng di động cho bác sĩ để nhận thông báo đẩy (push notification) và theo dõi nhanh bệnh nhân.
- **Đa kênh thông báo**: ngoài thư điện tử và Socket.IO, có thể tích hợp tin nhắn (ví dụ SMS hoặc nền tảng nhắn tin) tùy theo điều kiện triển khai.

### 7.2.5 Tối ưu thiết bị và vận hành hệ thống Internet vạn vật

- **Tối ưu tiêu thụ năng lượng**: tối ưu chu kỳ gửi dữ liệu và chế độ tiết kiệm năng lượng (tùy thiết kế nguồn) để kéo dài thời gian vận hành.
- **Bổ sung cảm biến**: mở rộng thêm cảm biến (ví dụ cảm biến huyết áp, điện tâm đồ, gia tốc kế chất lượng cao) tùy theo mục tiêu và chi phí.
- **Giám sát sức khỏe thiết bị**: ghi nhận trạng thái pin (nếu có), cường độ tín hiệu mạng, tần suất mất kết nối; từ đó cảnh báo lỗi thiết bị và hỗ trợ bảo trì.

---

Kết luận lại, hệ thống hiện tại đã hoàn thành các thành phần cốt lõi của một giải pháp giám sát và cảnh báo sức khỏe theo hướng Internet vạn vật. Các hướng phát triển đề xuất tập trung vào việc nâng cao độ tin cậy, bảo mật, khả năng mở rộng và giảm cảnh báo giả, nhằm tiến tới triển khai trong môi trường thực tế.
