### Clone web

- Tạo tài khoản MongoDB Cloud cho mục đích lưu trữ database -> copy link connect vào file .env
```bash
# copy link và đưa vào biến môi trường có dạng như ở dưới
MONGODB_URI=mongodb+srv://abc:abcdefghijk...@cluster0.j9ndmsn.mongodb.net/?appName=Cluster0
```
- Tạo tài khoản AWS S3 phục vụ lưu avatar cho user -> tạo tài khoản IAM (tạo credential -> copy AccessKey và SecretKey -> bật permission cho aws s3) -> tạo tài khoản AWS S3 -> copy AccessKey, SecretKey
```bash
  AWS_ACCESS_KEY=abcxyz
  AWS_SECRET_KEY=abcxyz
  AWS_REGION=ap-southeast-2
  AWS_BUCKET_NAME=smart-health-system
```

Install dependencies

```bash
npm install
```

Run tạo tài khoản admin mặc định
```bash
node web/src/backend/config/admin.js
```
Run hệ thống (Đảm bảo đã chạy ThingsBoard CE trước đó)

```bash
npm start
```

Server is running at: `http://localhost:3000`

### Tài khoản demo

- **Admin**:
  - Username: `admin`
  - Password: `admin`
