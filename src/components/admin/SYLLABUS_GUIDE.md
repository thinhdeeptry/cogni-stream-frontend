# Hướng dẫn sử dụng Hệ thống quản lý Lộ trình học (Syllabus) cho Live Classes

## Tổng quan

Hệ thống Syllabus cho phép admin/instructor quản lý lộ trình học chi tiết cho các lớp học trực tuyến (LIVE courses). Điều này cho phép kết hợp linh hoạt giữa:

- **Bài học tự học** (LESSON) - Video/tài liệu học sinh tự học
- **Buổi học trực tiếp** (LIVE_SESSION) - Buổi học qua Meet/Zoom với giáo viên

## Cách truy cập

### 1. Từ trang quản lý khóa học

```
Admin Dashboard > Courses > [Chọn khóa học LIVE] > [Chọn lớp học] > Nút "Lộ trình"
```

### 2. URL trực tiếp

```
/admin/courses/[courseId]/classes/[classId]
```

## Tính năng chính

### 1. Quản lý lộ trình theo ngày

- Tổ chức lộ trình học theo từng ngày (Day 1, Day 2, ...)
- Mỗi ngày có thể có nhiều mục học tập
- Thứ tự có thể sắp xếp bằng drag & drop

### 2. Loại nội dung

- **LESSON**: Bài học từ khóa học (video, tài liệu)
- **LIVE_SESSION**: Buổi học trực tiếp (sẽ tích hợp với calendar)

### 3. Drag & Drop

- Kéo thả giữa các ngày
- Sắp xếp thứ tự trong cùng một ngày
- Tự động cập nhật vào database

## Ví dụ lộ trình học

### Khóa học: "React cơ bản - 4 tuần"

**Ngày 1: Khởi động**

1. [LESSON] Giới thiệu về React
2. [LESSON] Cài đặt môi trường
3. [LIVE_SESSION] Q&A và hướng dẫn setup

**Ngày 2: Components**

1. [LESSON] Components cơ bản
2. [LESSON] Props và State
3. [LESSON] Bài tập Components

**Ngày 3: Hooks**

1. [LESSON] useState Hook
2. [LESSON] useEffect Hook
3. [LIVE_SESSION] Workshop: Xây dựng app Todo

**Ngày 4: Thực hành**

1. [LESSON] Review kiến thức
2. [LIVE_SESSION] Final Project Presentation
3. [LESSON] Bài kiểm tra cuối khóa

## Lợi ích

### 1. Cho học viên

- Lộ trình học rõ ràng, có cấu trúc
- Kết hợp tự học và tương tác trực tiếp
- Tiến độ học có thể theo dõi

### 2. Cho giảng viên

- Quản lý nội dung một cách có hệ thống
- Linh hoạt điều chỉnh lộ trình
- Tối ưu thời gian live session

### 3. Cho hệ thống

- Tự động hóa việc mở khóa nội dung theo lộ trình
- Tích hợp với calendar và notification
- Tracking tiến độ học tập

## API Endpoints sử dụng

```typescript
// Lấy lộ trình học của lớp
GET /syllabus/class/{classId}

// Thêm mục lộ trình mới
POST /syllabus
{
  "day": 1,
  "order": 1,
  "itemType": "LESSON",
  "lessonId": "lesson-id",
  "classId": "class-id"
}

// Cập nhật mục lộ trình
PATCH /syllabus/{id}

// Xóa mục lộ trình
DELETE /syllabus/{id}
```

## Tích hợp với hệ thống hiện tại

### 1. Class Management

- Tích hợp trong trang chi tiết lớp học
- Liên kết với schedule của lớp
- Đồng bộ với enrollment system

### 2. Course Content

- Tự động load danh sách lessons từ course
- Phân chia theo chapters
- Check trạng thái published

### 3. Live Sessions

- Tích hợp với calendar system
- Tự động tạo meeting links
- Notification cho học viên

## Quy trình sử dụng

### 1. Instructor tạo lộ trình

1. Vào trang quản lý lớp học
2. Click "Lộ trình học tập"
3. Thêm các mục theo ngày
4. Drag & drop để sắp xếp

### 2. Hệ thống xử lý

1. Lưu vào database
2. Cập nhật progress tracking
3. Tạo notifications
4. Sync với calendar

### 3. Học viên truy cập

1. Thấy lộ trình trong course dashboard
2. Unlock content theo tiến độ
3. Nhận notification cho live sessions
4. Track progress tự động

## Kế hoạch phát triển

### Phase 1: ✅ Completed

- Basic syllabus management
- Drag & drop interface
- CRUD operations

### Phase 2: 🚧 In Progress

- Tích hợp với calendar
- Auto unlock content
- Student progress tracking

### Phase 3: 📋 Planned

- Advanced scheduling
- Conditional logic
- Analytics and reports
