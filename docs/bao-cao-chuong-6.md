# Chương 6. Xây dựng hệ thống

Chương này mô tả cách triển khai (implementation) các thành phần của hệ thống theo đúng cấu trúc trong repository: backend (Node.js/Express), frontend (React), firmware ESP32 (ESP-IDF), cùng cách tích hợp end-to-end và triển khai môi trường.

## 6.1 Backend

### 6.1.1 Công nghệ và vai trò

- **Node.js + Express**: cung cấp REST API cho web.
- **MongoDB + Mongoose**: lưu trữ dữ liệu nghiệp vụ (User/Doctor/Patient/Device).
- **JWT (access/refresh)**: xác thực và phân quyền theo role.
- **Socket.IO**: đẩy cảnh báo realtime từ backend đến web.
- **Tích hợp ThingsBoard**: backend đăng nhập (tenant/sysadmin) để đọc telemetry/attributes và thao tác thiết bị.
- **Upload avatar**: xử lý upload và (tuỳ cấu hình) lưu trên AWS S3.

### 6.1.2 Cấu trúc thư mục backend

Mã nguồn backend nằm trong `web/src/backend/` với các nhóm chính:

- `app.js`: entrypoint khởi tạo Express + HTTP server + Socket.IO.
- `config/`: cấu hình database, socket, S3, constants.
- `routes/`: khai báo routes theo nhóm (auth/admin/doctor/family/user/thingsboard).
- `controllers/`: xử lý request/response, gọi service.
- `services/`: xử lý nghiệp vụ (auth, user/doctor/patient/device, email, thingsboard, notification).
- `repositories/`: thao tác dữ liệu MongoDB theo hướng repository.
- `models/`: schema Mongoose.
- `validators/`: validate request (express-validator).
- `middlewares/`: auth/validate/error handler, rate limit, request logger, upload.
- `errors/`: các lớp lỗi (BadRequest/Unauthorized/Forbidden/NotFound/Conflict/ServiceUnavailable/Validation...).
- `utils/`: helper dùng chung (logger, response wrapper, token util/store, async handler…).

### 6.1.3 Luồng khởi động server

File `web/src/backend/app.js` thực hiện:

1. Load biến môi trường (`dotenv`).
2. Tạo `express()` và HTTP server (`http.createServer(app)`).
3. Kết nối MongoDB (`connectDB()`).
4. Khởi tạo Socket.IO trên cùng HTTP server (`initSocket(server)`).
5. Cài đặt middleware bảo mật và tiện ích:
   - `helmet`, `cors`, `compression`
   - sanitize đầu vào chống NoSQL injection (`express-mongo-sanitize`)
   - request logging
   - rate limiting cho `/api`
6. Mount routes dưới base path `/api/v1`.
7. Cài đặt `notFoundHandler` và `errorHandler`.
8. Lắng nghe cổng `PORT` (mặc định 5000 nếu không set).

### 6.1.4 Biến môi trường chính

Backend lấy cấu hình từ file `.env` (đặt tại `web/src/backend/.env` theo README của dự án). Các biến thường dùng:

- `PORT`: cổng backend (implementation hiện tại dùng mặc định 5000).
- `MONGODB_URI`: chuỗi kết nối MongoDB.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: secret cho JWT.
- `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`: thời hạn token.
- `CORS_ORIGIN`: origin được phép (mặc định `*` hoặc `http://localhost:3000` tuỳ module).
- `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`: cấu hình S3 (tuỳ chọn).
- `THINGSBOARD_URL`: base URL ThingsBoard (mặc định `http://localhost:8080` trong constants).

### 6.1.5 Các nhóm API chính

- `GET /api/v1/health`: health check.
- `POST /api/v1/auth/*`: đăng nhập/refresh/logout.
- `GET/POST/PUT/DELETE /api/v1/admin/*`: quản trị bác sĩ, danh sách thiết bị.
- `GET/POST/PUT/DELETE /api/v1/doctor/*`: nghiệp vụ bác sĩ (CRUD bệnh nhân, allocate/recall device, health info).
- `GET /api/v1/family/*`: bệnh nhân/người nhà xem thông tin sức khỏe.
- `POST /api/v1/thingsboard/*`: ThingsBoard gọi webhook alarm.

(Chi tiết request/response và lỗi đã trình bày tại Chương 4.)

### 6.1.6 Chạy backend trong môi trường phát triển

Trong `web/package.json` có script backend dạng `nodemon src/backend/server.js`, tuy nhiên trong repository entrypoint backend đang là `src/backend/app.js`. Khi chạy, nên dùng entrypoint đúng theo file hiện có.

Các cách chạy (tùy vào cách bạn cấu hình script):

- Chạy thủ công (từ thư mục `web/`):
  - `node src/backend/app.js`
- Chạy với nodemon:
  - `npx nodemon src/backend/app.js`

Ngoài ra dự án có script tạo admin mặc định: `node src/backend/config/admin.js`.

---

## 6.2 Frontend

### 6.2.1 Công nghệ và vai trò

- **React**: giao diện người dùng.
- **react-router-dom**: điều hướng route theo role.
- **axios**: gọi API backend.
- **socket.io-client**: nhận cảnh báo realtime.
- **recharts**: biểu đồ hiển thị dữ liệu.

### 6.2.2 Cấu trúc thư mục frontend

Frontend nằm trong `web/src/` và nhóm code UI theo `web/src/frontend/`:

- `App.js`: cấu hình routing và layout.
- `frontend/pages/`: các màn hình (admin/doctor/family...).
- `frontend/layouts/`: header/footer/login/master layout...
- `frontend/components/`: component dùng chung (Sidebar, ProtectedRoute, Pagination...).
- `frontend/contexts/`: context (ví dụ SocketContext).
- `frontend/utils/`: tiện ích (routers, enum, api).

### 6.2.3 Routing và phân quyền

`web/src/App.js` định nghĩa:

- Route public: trang login, trang family access.
- Route protected theo role thông qua `ProtectedRoute`:
  - **Doctor**: danh sách bệnh nhân, chi tiết, phòng, cảnh báo, ghi chú, profile...
  - **Admin**: trang quản trị (info, CRUD doctors, rooms, devices...).
- Cơ chế redirect theo token và role (`HomeRedirect`).

### 6.2.4 Gọi API và quản lý token

- File `web/src/frontend/utils/api.js` tạo axios instance.
- Token được lưu ở `localStorage` (access token, refresh token, user_info).
- Interceptor gắn `Authorization: Bearer <access_token>` cho mọi request.
- Base URL mặc định lấy từ `REACT_APP_API_BASE_URL` (nếu không có thì default `http://localhost:5000`).

### 6.2.5 Realtime cảnh báo

- Frontend khởi tạo `SocketProvider` (context) để thiết lập kết nối Socket.IO.
- Backend yêu cầu socket authentication bằng access token (`socket.handshake.auth.token`).
- Khi có alarm, backend phát sự kiện `alarm-notification` về room theo user doctor.

---

## 6.3 Firmware ESP32

### 6.3.1 Môi trường và công cụ

- ESP-IDF (khuyến nghị theo README: v5.3+).
- Build/flash/monitor bằng `idf.py`.

### 6.3.2 Build, flash và monitor

Theo `esp32/README.md`:

- Build: `idf.py build`
- Flash (Windows ví dụ): `idf.py -p COM3 flash`
- Monitor: `idf.py -p COM3 monitor`
- Flash + monitor: `idf.py -p COM3 flash monitor`

### 6.3.3 Cấu trúc module firmware

Firmware được module hóa theo `esp32/components/` (Wi‑Fi, HTTP config portal, NVS storage, provisioning, MQTT ThingsBoard, sensors, display, alarm, button…).

Luồng kết nối ThingsBoard và các tham số kỹ thuật chi tiết đã trình bày tại Chương 5.

---

## 6.4 Tích hợp end-to-end (thiết bị → server → web)

### 6.4.1 Luồng dữ liệu tổng quát

1. ESP32 đo dữ liệu và publish telemetry lên ThingsBoard qua MQTT.
2. ThingsBoard lưu time-series và rule engine phát hiện bất thường.
3. Khi có bất thường, ThingsBoard gọi webhook alarm về backend.
4. Backend xử lý nghiệp vụ cảnh báo:
   - Phát Socket.IO realtime tới doctor.
   - Gửi email (nếu cấu hình SMTP).
5. Web gọi backend để xem danh sách bệnh nhân/health info; backend truy vấn telemetry từ ThingsBoard và trả về.

### 6.4.2 Cổng dịch vụ và endpoint liên quan

- ThingsBoard CE:
  - HTTP UI/API: 8080
  - MQTT: 1883
- Backend:
  - HTTP API: theo `PORT` (mặc định 5000 theo code).
  - Socket.IO: dùng chung cổng backend, path `/socket.io`.
- Frontend:
  - Dev server: 3000

Lưu ý: các giá trị port trong README và code có thể khác nhau; khi triển khai thực tế cần thống nhất `PORT` backend và `REACT_APP_API_BASE_URL`.

---

## 6.5 Triển khai (local/cloud), cấu hình môi trường

### 6.5.1 ThingsBoard CE bằng Docker Compose

Repository có `docker-compose.yml` để chạy ThingsBoard CE + Postgres:

- Start: `docker-compose up -d`
- Truy cập ThingsBoard: `http://localhost:8080`
- MQTT broker: `localhost:1883`

### 6.5.2 MongoDB

Dự án sử dụng MongoDB (local). Backend cần `MONGODB_URI` hợp lệ.

### 6.5.3 Cấu hình môi trường và chạy hệ thống

- Frontend:
  - Set `REACT_APP_API_BASE_URL` trỏ về backend.
  - `npm start`.
- Backend:
  - Tạo `web/src/backend/.env`.
  - Chạy `node src/backend/app.js` (hoặc nodemon).
- Firmware:
  - Build/flash theo 6.3.

### 6.5.4 Ghi chú triển khai

- Cần thống nhất key telemetry/attributes giữa firmware và backend/ThingsBoard rule chain để dữ liệu hiển thị đúng.
- Với môi trường production: thay đổi JWT secrets, ThingsBoard credentials, CORS origin; bảo vệ webhook alarm (secret header hoặc allowlist) theo yêu cầu bảo mật.
