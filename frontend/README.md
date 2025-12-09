# HR Pro (Mock Frontend)

Skeleton project structure for the HR management demo per specification.

## Nhận diện khuôn mặt

Frontend hiện sử dụng `face-api.js` (TensorFlow.js) để chụp một khung hình từ camera, phát hiện khuôn mặt và chuyển thành vector đặc trưng (`Float32Array`). Vector này được gửi lên backend để:

- Lưu embedding khi nhân viên đăng ký khuôn mặt (POST `/api/enroll-face`).
- Chấm công bằng check-in/check-out (POST `/api/checkin`).

### Chuẩn bị môi trường

1. **Cài thư viện**

   ```bash
   npm install face-api.js @tensorflow/tfjs @types/face-api.js
   ```

2. **Model face-api.js**

   Mặc định ứng dụng đang tải model trực tiếp từ CDN:

   ```
   https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/
   ```

   Nếu muốn lưu model cục bộ (để chạy offline), tải 6 file weights tại repo face-api.js và đặt vào `public/face-models`, sau đó cấu hình biến môi trường:

   ```
   VITE_FACE_MODEL_URL=/face-models
   ```

3. **Cấu hình backend**

   - `POST /api/enroll-face`  
     Body: `{ "employeeId": string, "embedding": number[], "snapshot": string }`  
     Lưu vào bảng `face_embeddings`.
   - `POST /api/checkin`  
     Body: `{ "embedding": number[], "type": "checkin" | "checkout", "threshold": number }`  
     Backend so khớp vector với bảng `face_embeddings`, tính khoảng cách (Euclid/cosine). Nếu nhỏ hơn ngưỡng thì ghi bản ghi vào bảng `attendances` và trả `{ employeeId, timestamp, distance }`.
   - `GET /api/employees/:employeeId/face`  
     Trả `{ registered: boolean }` để xác định nhân viên đã có embedding hay chưa.

Frontend tự động fallback sang `localStorage` để lưu embedding và mô phỏng so khớp nếu backend chưa sẵn sàng, giúp quy trình đăng ký/chấm công vẫn hoạt động trong môi trường demo.

## Đồng bộ dữ liệu với backend

Các bảng chính trong database (phòng ban/chức vụ/nhân viên) đều có thêm metadata như mã định danh, lương cơ bản, ngày vào công ty, mốc tạo/cập nhật. Frontend đã được chuẩn hoá để lưu trữ đầy đủ các trường này nhằm sẵn sàng gửi sang API thực tế:

- **Phòng ban & chức vụ**: lưu `id`, `code` (`maPhong`/`maChucVu`), trạng thái và giữ cả `createdAt`/`updatedAt` (khi backend trả về).
- **Nhân viên**: mỗi bản ghi trong `employeesData` hiện có `departmentId`, `positionId`, `baseSalary`, `joinedAt`, `createdAt`, `updatedAt`, cùng `account/password` (đồng bộ với `taiKhoan/matKhau`). Bộ phát sinh mã nhân viên dùng lại `departmentId`/`positionId` nên khi backend trả danh sách mới sẽ ghép được chính xác.
- Bộ modal thêm/sửa nhân viên hiển thị thêm trường "Ngày vào công ty" và lưu song song cả tên phòng ban/chức vụ lẫn ID để tương thích API FastAPI (`department_id`, `position_id`).

> **Lưu ý:** Nếu dữ liệu cũ trong `localStorage` chưa có các trường mới, ứng dụng sẽ tự bổ sung khi khởi chạy (dựa vào phòng ban/chức vụ hiện có). Bạn chỉ cần cấu hình `VITE_API_BASE_URL` để kết nối tới backend FastAPI.

## Kết nối Supabase

Phiên bản hiện tại đã tích hợp Supabase làm database chính cho các bảng `departments`, `positions`, `employees`.

1. **Biến môi trường**

   Tạo file `.env` (hoặc `.env.local`) trong thư mục `frontend/` dựa trên `.env.example`:

   ```bash
   cp .env.example .env
   ```

   Cập nhật hai biến:

   ```ini
   VITE_SUPABASE_URL=https://rbtcxqsuwpcpcqmbzdef.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   Đồng thời thêm hai biến này vào phần Environment Variables trên Netlify để build production.

2. **Phân quyền Supabase**

   - Bật Row Level Security cho các bảng.
   - Tạo policy cho role `anon`/`authenticated` (tuỳ cơ chế đăng nhập) cho các thao tác `SELECT/INSERT/UPDATE/DELETE`.

3. **Seed dữ liệu**

   Ứng dụng sẽ đồng bộ Supabase với `localStorage`. Nếu bảng trống, bạn có thể import dữ liệu mẫu bằng SQL hoặc CSV trước khi chạy frontend lần đầu.

Sau khi cấu hình xong, `departmentsService`, `positionsService` và `employeesService` sẽ tự đọc/ghi từ Supabase, đồng thời vẫn lưu snapshot vào `localStorage` để dùng offline.
