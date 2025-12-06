# Smart Health Monitoring System - Web Application

Hệ thống web quản lý bệnh nhân và theo dõi sức khỏe từ xa với React frontend và Express backend.

---

## 📋 Yêu cầu hệ thống

- **Node.js**: >= 16.x (khuyến nghị 18.x hoặc 20.x)
- **npm**: >= 8.x
- **MongoDB**: Atlas Cloud hoặc local instance
- **AWS S3**: Tài khoản AWS để lưu trữ avatar (tùy chọn)
- **ThingsBoard CE**: Server để nhận dữ liệu từ thiết bị IoT

---

## 🚀 Hướng dẫn cài đặt

### Bước 1: Clone repository và di chuyển vào thư mục web

```bash
git clone https://github.com/baokieuv/smart-health-monitoring-and-warning-system.git
cd smart-health-monitoring-and-warning-system/web
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

Lệnh này sẽ cài đặt tất cả các package cần thiết cho cả frontend (React) và backend (Express), bao gồm:

**Backend dependencies:**

- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - Cross-Origin Resource Sharing
- `helmet` - Security headers
- `express-validator` - Request validation
- `dotenv` - Environment variables
- `multer` & `@aws-sdk/client-s3` - File upload và AWS S3
- `nodemon` - Auto-restart server khi development

**Frontend dependencies:**

- `react` & `react-dom` - React framework
- `react-router-dom` - Client-side routing
- `axios` - HTTP client
- `recharts` - Data visualization
- `sass` - CSS preprocessor

---

## ⚙️ Cấu hình môi trường

### Bước 1: Tạo file `.env` trong thư mục `web/src/backend`

```bash
# Tạo file .env cho backend
cd src/backend
touch .env  # Windows: type nul > .env
```

### Bước 2: Cấu hình các biến môi trường

Mở file `.env` và thêm các biến sau:

```env
# Server Configuration
PORT=4000

# JWT Secrets (QUAN TRỌNG: Đổi thành secret key mạnh của bạn)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/smart-health?retryWrites=true&w=majority

# AWS S3 Configuration (Tùy chọn - dùng để lưu avatar)
AWS_ACCESS_KEY=your-aws-access-key
AWS_SECRET_KEY=your-aws-secret-key
AWS_REGION=ap-southeast-2
AWS_BUCKET_NAME=smart-health-system

# ThingsBoard Configuration (nếu cần)
THINGSBOARD_URL=http://localhost:8080
```

### Bước 3: Thiết lập MongoDB

#### Option 1: Sử dụng MongoDB Atlas (Cloud - Khuyến nghị)

1. Truy cập [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Tạo tài khoản và cluster miễn phí
3. Vào **Database Access** → Tạo user với username/password
4. Vào **Network Access** → Thêm IP address (0.0.0.0/0 cho development)
5. Vào **Databases** → **Connect** → **Connect your application**
6. Copy connection string và thay thế `<username>`, `<password>`, `<database>`
7. Paste vào biến `MONGODB_URI` trong file `.env`

#### Option 2: Sử dụng MongoDB Local

```bash
# Cài đặt MongoDB Community Edition
# Windows: Download từ https://www.mongodb.com/try/download/community
# macOS: brew install mongodb-community
# Linux: sudo apt-get install mongodb

# Chạy MongoDB service
mongod --dbpath /path/to/data/db

# Trong .env, sử dụng:
MONGODB_URI=mongodb://localhost:27017/smart-health
```

### Bước 4: Thiết lập AWS S3 (Tùy chọn)

Nếu muốn lưu avatar user trên S3:

1. Đăng nhập [AWS Console](https://aws.amazon.com/console/)
2. Vào **IAM** → **Users** → **Add user**
3. Chọn **Access key - Programmatic access**
4. Gắn policy: `AmazonS3FullAccess`
5. Copy **Access Key ID** và **Secret Access Key**
6. Vào **S3** → **Create bucket** → Nhập tên bucket (vd: `smart-health-system`)
7. Cập nhật các giá trị AWS vào file `.env`

---

## 🏃 Chạy ứng dụng

### Option 1: Chạy cả Frontend và Backend cùng lúc (Khuyến nghị cho development)

```bash
npm run dev
```

- **Frontend** chạy tại: `http://localhost:3000`
- **Backend** chạy tại: `http://localhost:4000`

### Option 2: Chạy riêng từng service

#### Chạy Backend:

```bash
npm run start:backend
```

Backend API sẽ chạy tại `http://localhost:4000` (hoặc `PORT` trong `.env`)

#### Chạy Frontend:

```bash
npm run start:frontend
```

hoặc

```bash
npm start
```

Frontend sẽ chạy tại `http://localhost:3000`

---

## 👤 Tạo tài khoản Admin mặc định

Trước khi sử dụng hệ thống lần đầu, cần tạo tài khoản admin:

```bash
# Từ thư mục web/
node src/backend/config/admin.js
```

Tài khoản admin mặc định:

- **Username**: `admin`
- **Password**: `admin`

> ⚠️ **Lưu ý bảo mật**: Đổi mật khẩu admin ngay sau khi đăng nhập lần đầu!

---

## 🔐 API Authentication

Hệ thống sử dụng JWT (JSON Web Token) với cơ chế access token và refresh token:

### Đăng nhập

```bash
POST http://localhost:4000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin"
}
```

Response:

```json
{
  "status": "success",
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "role": "admin"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Sử dụng Access Token

Thêm header `Authorization` vào các request:

```bash
GET http://localhost:4000/api/v1/admin/doctors
Authorization: Bearer <access_token>
```

### Refresh Token khi hết hạn

```bash
POST http://localhost:4000/api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "<refresh_token>"
}
```

---

---

## 🐳 Chạy với Docker (nếu có docker-compose.yml)

```bash
docker compose up -d
```

---

## 📚 API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Đăng xuất

### Admin - Doctor Management (Role: admin)

- `POST /api/v1/admin/doctors` - Tạo bác sĩ
- `GET /api/v1/admin/doctors` - Danh sách bác sĩ
- `GET /api/v1/admin/doctors/:id` - Chi tiết bác sĩ
- `PUT /api/v1/admin/doctors/:id` - Cập nhật bác sĩ
- `DELETE /api/v1/admin/doctors/:id` - Xóa bác sĩ

### Doctor - Patient Management (Role: doctor, admin)

- `POST /api/v1/doctor/patients` - Tạo bệnh nhân
- `GET /api/v1/doctor/patients` - Danh sách bệnh nhân
- `GET /api/v1/doctor/patients/:id` - Chi tiết bệnh nhân
- `PUT /api/v1/doctor/patients/:id` - Cập nhật bệnh nhân
- `GET /api/v1/doctor/patients/:id/health` - Thông tin sức khỏe
- `DELETE /api/v1/doctor/patients/:id` - Xóa bệnh nhân

---
