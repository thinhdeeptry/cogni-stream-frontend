# Hệ thống Đăng ký và Xét duyệt Giảng viên

Hệ thống cho phép người dùng đăng ký trở thành giảng viên và admin xét duyệt các đơn đăng ký.

## Tính năng

### 1. Đăng ký làm giảng viên (User)

- **Đường dẫn**: `/instructor/apply`
- **Quyền truy cập**: User đã đăng nhập (role STUDENT)
- **Điều kiện**: User chưa có đơn đăng ký và chưa là giảng viên

#### Thông tin cần cung cấp:

- **Tiêu đề chuyên môn** (bắt buộc, tối thiểu 10 ký tự)
- **Giới thiệu bản thân** (bắt buộc, tối thiểu 50 ký tự)
- **Lĩnh vực chuyên môn** (bắt buộc, tối thiểu 5 ký tự)
- **Số năm kinh nghiệm** (tùy chọn)
- **Chứng chỉ & Bằng cấp** (tùy chọn, link URL)
- **Portfolio & Dự án** (tùy chọn, link URL)

#### Trạng thái đơn đăng ký:

- `PENDING`: Đang chờ duyệt
- `APPROVED`: Đã được chấp nhận
- `REJECTED`: Đã bị từ chối

### 2. Xét duyệt đơn đăng ký (Admin)

#### Danh sách đơn đăng ký

- **Đường dẫn**: `/registrations`
- **Quyền truy cập**: Admin
- **Tính năng**:
  - Hiển thị thống kê tổng quan
  - Tìm kiếm theo tên, email, tiêu đề
  - Lọc theo trạng thái
  - Xem thông tin chi tiết từng đơn

#### Chi tiết đơn đăng ký

- **Đường dẫn**: `/registrations/[id]`
- **Quyền truy cập**: Admin
- **Tính năng**:
  - Xem đầy đủ thông tin ứng viên
  - Xem chứng chỉ và portfolio (link ngoài)
  - Chấp nhận đơn đăng ký
  - Từ chối đơn đăng ký với lý do cụ thể

### 3. Trạng thái đăng ký trong Profile

- **Component**: `InstructorRegistrationCard`
- **Vị trí**: User profile page
- **Tính năng**:
  - Hiển thị trạng thái đơn đăng ký hiện tại
  - Khuyến khích đăng ký nếu chưa có đơn
  - Hiển thị thông tin về việc từ chối (nếu có)
  - Link đến trang đăng ký hoặc quản lý khóa học

## API Endpoints

### Frontend Actions

```typescript
// Lấy tất cả đơn đăng ký
getAllInstructorRegistrations(): Promise<InstructorRegistration[]>

// Lấy chi tiết một đơn đăng ký
getInstructorRegistrationById(id: string): Promise<InstructorRegistration>

// Tạo đơn đăng ký mới
createInstructorRegistration(data: CreateInstructorRegistrationData): Promise<ApiResponse>

// Cập nhật đơn đăng ký (xét duyệt)
updateInstructorRegistration(id: string, data: UpdateInstructorRegistrationData): Promise<ApiResponse>
```

### Backend Endpoints

```
GET    /instructor-registrations          # Lấy danh sách (có phân trang và tìm kiếm)
GET    /instructor-registrations/:id      # Lấy chi tiết
POST   /instructor-registrations          # Tạo đơn đăng ký
PATCH  /instructor-registrations/:id      # Cập nhật đơn đăng ký
PATCH  /instructor-registrations/:id/review  # Xét duyệt (approve/reject)
```

## Quy trình

### Quy trình đăng ký làm giảng viên:

1. User đăng nhập với role STUDENT
2. Truy cập `/instructor/apply`
3. Điền form thông tin chuyên môn
4. Gửi đơn đăng ký → Status: `PENDING`
5. Admin xem xét tại `/registrations`
6. Admin chấp nhận hoặc từ chối
7. User nhận thông báo về kết quả

### Sau khi được chấp nhận:

1. User role được cập nhật thành `INSTRUCTOR`
2. Tạo teacher profile trong database
3. User có thể tạo và quản lý khóa học

## Database Schema

### InstructorRegistration Model

```prisma
model InstructorRegistration {
  id               String             @id @default(uuid())
  status           RegistrationStatus @default(PENDING)
  headline         String?
  bio              String?
  specialization   String?
  rejectionReason  String?
  submittedAt      DateTime           @default(now())
  reviewedAt       DateTime?

  // Thông tin bổ sung
  qualifications   String[]           // URLs to certificates
  experience_years Int?
  portfolio_links  String[]           // URLs to portfolios
  agree_terms      Boolean            @default(false)

  // Relations
  user             User               @relation(fields: [userId], references: [id])
  userId           String             @unique
  reviewer         User?              @relation("Reviewer", fields: [reviewedBy], references: [id])
  reviewedBy       String?
}
```

## UI Components

### Trang đăng ký (`/instructor/apply`)

- Form validation với zod
- Dynamic fields cho chứng chỉ và portfolio
- UX thân thiện với progress indicators
- Responsive design

### Trang quản lý admin (`/registrations`)

- Table với sorting và filtering
- Search realtime
- Status badges với màu sắc phù hợp
- Statistics cards

### Trang chi tiết (`/registrations/[id]`)

- Layout card-based
- Preview links cho chứng chỉ và portfolio
- Dialog confirmation cho việc từ chối
- Audit trail (lịch sử xét duyệt)

### Component trong profile

- Dynamic status display
- Call-to-action phù hợp với từng trạng thái
- Integration với navigation flow

## Hooks

### `useInstructorRegistrationStatus`

```typescript
const {
  loading, // Đang tải dữ liệu
  registration, // Đơn đăng ký hiện tại (nếu có)
  canApply, // Có thể đăng ký hay không
  isInstructor, // Đã là giảng viên hay chưa
} = useInstructorRegistrationStatus();
```

## Validation Rules

### Frontend (Zod Schema)

- Headline: min 10 chars
- Bio: min 50 chars
- Specialization: min 5 chars
- URLs: valid URL format
- Experience years: >= 0

### Backend (Class Validator)

- All string fields: optional except userId
- Array fields: validated each element
- Email format validation
- Role checking for authorization

## Security

### Authorization

- Đăng ký: Chỉ user role STUDENT, chưa có đơn đăng ký
- Xét duyệt: Chỉ user role ADMIN
- View list: Admin only
- View detail: Admin only

### Data Protection

- Sensitive URLs được validate
- Input sanitization
- Rate limiting (tùy cấu hình)

## Notifications (Future Enhancement)

- Email thông báo khi có đơn đăng ký mới
- Email thông báo kết quả xét duyệt
- In-app notifications
- SMS notifications (optional)

## Analytics (Future Enhancement)

- Tracking conversion rate
- Time to review metrics
- Popular specializations
- Geographic distribution

## Testing

- Unit tests cho services
- Integration tests cho APIs
- E2E tests cho user flows
- Component tests cho React components
