# Tổng hợp những gì đã làm

## Mục tiêu

Làm trước phần đăng nhập/đăng ký theo kiểu tách lớp để sau này ghép backend database vào không phải viết lại logic auth.

## Đã làm

### 1. Tạo backend auth tối thiểu

- Thêm `server/index.ts` để chạy một Express API riêng cho auth.
- Thêm `server/auth.ts` chứa `AuthService`, `AuthError`, validate input, hash mật khẩu bằng `bcryptjs`, và tạo `JWT`.
- API hiện tại:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`

### 2. Tách lớp dữ liệu để thay DB sau

- Tạo interface `UserRepository` trong `server/auth.ts`.
- Ban đầu có repository in-memory để luồng auth chạy được ngay.
- Sau đó đổi sang repository MySQL trong `server/userRepository.ts` dùng `mysql2`.
- Nghĩa là sau này nếu đổi ORM hoặc đổi cấu trúc DB, chỉ cần thay adapter dữ liệu, không cần sửa lại auth service.

### 3. Nối frontend login/register với API thật

- Tạo `src/services/authApi.ts` để gọi API từ frontend.
- Sửa `src/pages/Login.tsx` để submit thật, hiện lỗi, và lưu session.
- Sửa `src/pages/Register.tsx` để submit thật, hiện lỗi, và lưu session.
- Session được lưu tạm trong `localStorage`.

### 4. Chỉ cho đăng nhập bằng email

- Ô đăng nhập đã đổi về kiểu `email`, không còn gợi ý nhập username.
- Backend login cũng chỉ tra cứu theo email.
- Mục tiêu là giảm nhầm lẫn khi test và thống nhất cách đăng nhập trong nhóm.

### 5. Cấu hình dev để frontend gọi backend

- Thêm proxy trong `vite.config.ts` để `/api` đi sang `http://localhost:4001`.
- Thêm script chạy backend vào `package.json`:
  - `api:dev`
  - `api:start`

### 6. Chuẩn bị môi trường và DB

- Cập nhật `.env.example` với:
  - `AUTH_JWT_SECRET`
  - `AUTH_JWT_EXPIRES_IN`
  - `AUTH_API_PORT`
  - `DATABASE_URL`
  - `VITE_API_BASE_URL`
- Thêm `docker-compose.yml` để chạy MySQL 8.4.
- Thêm `mysql/init.sql` tạo sẵn các bảng:
  - `users`
  - `tweets`
  - `follows`
  - `notifications`

## Kết quả kiểm tra

- `npm run build` chạy thành công.
- Auth API đã boot thành công ở `http://localhost:4001`.

## Tổng kết cuối

Hiện tại phần auth đã đi từ giao diện giả lập sang luồng đăng nhập/đăng ký thật, có tách lớp rõ ràng giữa UI, service, và repository dữ liệu. Backend đã có đường để ghép MySQL thật, còn frontend đã gọi API qua proxy dev. Riêng phần đăng nhập hiện chỉ chấp nhận email để nhất quán với yêu cầu mới nhất.

## Cách chạy

### Frontend

```bash
npm run dev
```

### Auth backend

```bash
npm run api:start
```

### MySQL

```bash
docker compose up -d
```

## Phần còn lại nên làm tiếp

1. Nối `server/userRepository.ts` với DB thật nếu nhóm chốt thông số cuối cùng.
2. Làm tiếp API cho `tweets`, `follows`, `feed`.
3. Tách websocket service riêng nếu cần realtime.
