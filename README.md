# EduForge - Nền Tảng Học Tập Trực Tuyến Thông Minh

## Giới Thiệu

EduForge là một nền tảng học tập trực tuyến tiên tiến, được thiết kế và phát triển như một dự án môn học Kiến trúc và Thiết kế Phần mềm năm 2025. Với mục tiêu mang lại trải nghiệm học tập hiện đại, cá nhân hóa và hiệu quả, EduForge tích hợp các công nghệ tiên tiến và kiến trúc microservices để cung cấp một hệ sinh thái học tập trực tuyến toàn diện, thân thiện với người dùng và thông minh.

Dự án không chỉ tập trung vào việc cung cấp nội dung học tập chất lượng cao mà còn chú trọng đến trải nghiệm người dùng, tương tác cộng đồng, và tích hợp trí tuệ nhân tạo (AI) để hỗ trợ học viên đạt được kết quả học tập tối ưu. EduForge hướng tới việc trở thành một nền tảng học tập trực tuyến toàn diện, phù hợp cho cả học viên, giảng viên và quản trị viên.

## Thành Viên Nhóm

Dự án được thực hiện bởi nhóm sinh viên tài năng từ môn học Kiến trúc và Thiết kế Phần mềm:

- **Trần Đình Kiên**
- **Nguyễn Thanh Cảnh**
- **Lê Hoàng Khang**
- **Vũ Hải Nam**
- **Nguyễn Đức Thịnh**

#### Nhóm Phát Triển EduForge

![Nhóm phát triển EduForge](previewImg/group.jpg "Nhóm phát triển EduForge")

## Mục Tiêu Dự Án

EduForge được thiết kế để giải quyết các vấn đề phổ biến trong học tập trực tuyến, bao gồm:

- **Trải nghiệm người dùng**: Giao diện thân thiện, dễ sử dụng và trực quan.
- **Cá nhân hóa học tập**: Tích hợp AI để hỗ trợ học tập hiệu quả hơn, tối ưu cho cá nhân.
- **Khả năng mở rộng**: Sử dụng kiến trúc microservices để đảm bảo hệ thống linh hoạt và dễ dàng nâng cấp.
- **Tương tác cộng đồng**: Xây dựng môi trường học tập tương tác, nơi học viên và giảng viên có thể chia sẻ kiến thức và kinh nghiệm.
- **Bảo mật và hiệu suất**: Đảm bảo dữ liệu người dùng được bảo vệ và hệ thống hoạt động ổn định, hiệu quả.

## Kiến Trúc Hệ Thống

EduForge được xây dựng dựa trên kiến trúc microservices, sử dụng **Next.js 14** làm nền tảng chính cho frontend và tích hợp nhiều dịch vụ backend độc lập để đảm bảo tính mô-đun và khả năng mở rộng. Các thành phần chính của hệ thống bao gồm:

### Frontend

- **Next.js 14 (App Router)**: Framework mạnh mẽ cho giao diện người dùng và SSR/SSG.
- **Tailwind CSS**: Tùy chỉnh giao diện nhanh chóng và hiện đại.
- **Shadcn UI**: Bộ thư viện giao diện có tính tái sử dụng cao.
- **Zustand**: Quản lý trạng thái nhẹ và hiệu quả.

### Backend

- **NestJS**: Framework Node.js mạnh mẽ cho việc xây dựng các ứng dụng server-side hiệu quả và có khả năng mở rộng cao.
- **Kong API Gateway**: Quản lý và bảo mật các API endpoints, xử lý rate limiting và load balancing.
- **JWT Authentication**: Hệ thống xác thực an toàn sử dụng JSON Web Tokens cho việc quản lý phiên đăng nhập và phân quyền người dùng.

### Cơ Sở Dữ Liệu

- **PostgreSQL**: Lưu trữ dữ liệu chính với hiệu suất cao.
- **Redis**: Bộ nhớ đệm để tăng tốc độ truy xuất dữ liệu.
- **Supabase**: Lưu trữ dữ liệu file cho hệ thống

#### Sơ Đồ Kiến Trúc Hệ Thống

![Sơ đồ kiến trúc hệ thống](previewImg/kientruc.jpg "Sơ đồ kiến trúc hệ thống")

## Tính Năng Chính

EduForge cung cấp một loạt các tính năng mạnh mẽ để hỗ trợ quá trình học tập và quản lý khóa học:

### 1. Quản Lý Khóa Học

- **Tạo và quản lý khóa học**: Giảng viên có thể dễ dàng tạo, chỉnh sửa và quản lý nội dung khóa học.
- **Phân loại khóa học**: Sắp xếp khóa học theo danh mục, giúp học viên dễ dàng tìm kiếm.
- **Chi tiết khóa học**: Hỗ trợ nội dung đa phương tiện (video và văn bản).
- **Quản lý bài học**: Cung cấp công cụ để tổ chức bài học một cách khoa học.

#### Trang Chủ EduForge

![Trang chủ EduForge](previewImg/home.jpg "Trang chủ EduForge")

#### Giao Diện Bài Học

![Giao diện học tập bài học](previewImg/lessondetail.jpg "Giao diện học tập bài học")

#### Giao Diện Bài Học

![Giao diện học tập nâng cao](previewImg/lessondetail2.jpg "Giao diện học tập nâng cao")

#### Phân Loại Khóa Học Theo Danh Mục

![Phân loại khoá học theo danh mục](previewImg/category.jpg "Phân loại khoá học theo danh mục")

#### Chi Tiết Khóa Học

![Chi tiết khóa học](previewImg/coursedetail.jpg "Chi tiết khóa học")

#### Thêm Khóa Học Mới

![Thêm khóa học mới](previewImg/addcourse.jpg "Thêm khóa học mới")

#### Chỉnh Sửa Thông Tin Khóa Học

![Chỉnh sửa thông tin khóa học](previewImg/editcourse.jpg "Chỉnh sửa thông tin khóa học")

### 2. Hệ Thống Đánh Giá

- **Bài kiểm tra và đánh giá**: Tích hợp các bài kiểm tra đa dạng (trắc nghiệm, tự luận).
- **Báo cáo kết quả học tập**: Theo dõi tiến độ và hiệu suất học tập của học viên.
- **Chứng chỉ hoàn thành**: Cấp chứng chỉ tự động khi hoàn thành khóa học.

#### Giao Diện Bài Tập

![Giao diện đánh giá](previewImg/assessment.jpg "Giao diện đánh giá")

#### Chi Tiết Bài Tập

![Chi tiết bài đánh giá](previewImg/assessment1.jpg "Chi tiết bài đánh giá")

#### Chứng Chỉ Hoàn Thành Khóa Học

![Chứng chỉ hoàn thành khóa học](previewImg/certui.jpg "Chứng chỉ hoàn thành khóa học")

### 3. Tương Tác và Cộng Đồng

- **Hệ thống bình luận và thảo luận**: Cho phép học viên và giảng viên tương tác trực tiếp.
- **Chia sẻ tài liệu và kinh nghiệm**: Cộng đồng học viên có thể chia sẻ tài liệu, bài viết và kinh nghiệm học tập.
- **Tương tác giữa học viên và giảng viên**: Tăng cường kết nối thông qua các bài viết và bình luận.

#### Hệ Thống Bình Luận

![Hệ thống bình luận](previewImg/comment.jpg "Hệ thống bình luận")

#### Bài Viết Cộng Đồng

![Bài viết cộng đồng](previewImg/post.jpg "Bài viết cộng đồng")

#### Quản Lý Bài Viết

![Quản lý bài viết](previewImg/post2.jpg "Quản lý bài viết")

#### Tạo Bài Viết Mới

![Tạo bài viết mới](previewImg/post4.jpg "Tạo bài viết mới")

### 4. Tích Hợp AI

- **Hỗ trợ học tập thông minh**: AI gợi ý nội dung học tập dựa trên sở thích và tiến độ.
- **Phân tích và đề xuất cá nhân hóa**: Đưa ra lộ trình học tập phù hợp với từng học viên.
- **Báo cáo AI**: Cung cấp báo cáo chi tiết về tiến độ và hiệu suất học tập.

#### Giao Diện AI Hỗ Trợ Học Tập

![Giao diện AI hỗ trợ học tập](previewImg/ai.jpg "Giao diện AI hỗ trợ học tập")

#### Báo Cáo Phân Tích AI

![Báo cáo phân tích AI](previewImg/aireport.jpg "Báo cáo phân tích AI")

### 5. Quản Lý Người Dùng

- **Đăng ký và đăng nhập**: Hệ thống xác thực an toàn và dễ sử dụng.
- **Quản lý hồ sơ người dùng**: Cho phép cập nhật thông tin cá nhân và theo dõi tiến độ học tập.
- **Phân quyền và bảo mật**: Đảm bảo dữ liệu người dùng được bảo vệ với các cơ chế phân quyền chặt chẽ.

#### Đăng Nhập Hệ Thống

![Đăng nhập hệ thống](previewImg/login.jpg "Đăng nhập hệ thống")

#### Đăng Ký Tài Khoản

![Đăng ký tài khoản](previewImg/signup.jpg "Đăng ký tài khoản")

#### Khôi Phục Mật Khẩu

![Khôi phục mật khẩu](previewImg/forgotpw.jpg "Khôi phục mật khẩu")

#### Quản Lý Thông Tin Người Dùng

![Quản lý thông tin người dùng](previewImg/user.jpg "Quản lý thông tin người dùng")

### 6. Thanh Toán và Báo Cáo

- **Hệ thống thanh toán tích hợp**: Hỗ trợ thanh toán an toàn qua các cổng thanh toán phổ biến.
- **Báo cáo doanh thu và thống kê**: Cung cấp dữ liệu chi tiết về doanh thu và hiệu suất khóa học.
- **Quản lý đăng ký khóa học**: Theo dõi và quản lý các đăng ký khóa học của học viên.

#### Giao Diện Thanh Toán

![Giao diện thanh toán](previewImg/paymentui.jpg "Giao diện thanh toán")

#### Báo Cáo Doanh Thu

![Báo cáo doanh thu](previewImg/report2.jpg "Báo cáo doanh thu")

### 7. Lộ Trình Học Tập

- **Hệ thống đề xuất lộ trình học tập**: Xây dựng lộ trình học tập cá nhân hóa dựa trên mục tiêu của học viên.
- **Tổng quan và chi tiết lộ trình**: Cung cấp cái nhìn tổng thể và chi tiết về tiến độ học tập.

#### Tổng Quan Lộ Trình Học Tập

![Tổng quan lộ trình học tập](previewImg/roadmapui.jpg "Tổng quan lộ trình học tập")

#### Chi Tiết Lộ Trình Học Tập

![Chi tiết lộ trình học tập](previewImg/roadmapdetailui1.jpg "Chi tiết lộ trình học tập")

## Cài Đặt và Chạy Dự Án

### Yêu Cầu Hệ Thống

- **Node.js**: Phiên bản 18.x trở lên
- **npm hoặc Yarn**: Công cụ quản lý gói
- **Docker**: Để chạy môi trường development
- **PostgreSQL**: Cơ sở dữ liệu chính
- **Redis**: Bộ nhớ đệm
- **Kong API Gateway**: Quản lý API

### Hướng Dẫn Cài Đặt

```bash
# Clone repository
git clone [repository-url]

# Cài đặt dependencies
npm install

# Thiết lập biến môi trường
cp .env.example .env
# Cập nhật các giá trị trong .env (database, API keys, v.v.)

# Chạy development server
npm run dev
```

### Môi Trường

- **Development**: http://localhost:3000
- **Production**: http://eduforge.io.vn (hiện đã đóng)

### Lưu Ý

- Đảm bảo đã cài đặt và cấu hình PostgreSQL và Redis trước khi chạy dự án.
- Sử dụng Docker để triển khai các dịch vụ microservices một cách dễ dàng.

## Công Nghệ Sử Dụng

EduForge sử dụng một bộ công nghệ hiện đại để đảm bảo hiệu suất và khả năng mở rộng:

- **Next.js 14**: Framework React cho giao diện và hiệu suất cao.
- **TypeScript**: Đảm bảo mã nguồn đáng tin cậy và dễ bảo trì.
- **Tailwind CSS**: Thiết kế giao diện nhanh chóng và linh hoạt.
- **Shadcn UI**: Bộ giao diện người dùng có tính tái sử dụng cao.
- **Zustand**: Quản lý trạng thái hiệu quả.
- **React Query**: Tối ưu hóa việc lấy dữ liệu từ API.
- **Docker**: Container hóa các dịch vụ.
- **Kong API Gateway**: Quản lý và bảo mật API.
- **PostgreSQL**: Cơ sở dữ liệu quan hệ mạnh mẽ.
- **Redis**: Tăng tốc độ truy xuất dữ liệu.

## Giấy Phép

Dự án EduForge được phát triển cho mục đích học tập và nghiên cứu trong khuôn khổ môn học Kiến trúc và Thiết kế Phần mềm năm 2025. Mã nguồn và tài liệu chỉ được sử dụng cho các mục đích phi thương mại và học thuật.

## Liên Hệ

Nếu bạn có bất kỳ câu hỏi hoặc cần hỗ trợ về dự án, vui lòng liên hệ nhóm phát triển qua email: **thanhcanh.dev@gmail.com** hoặc **kientran0705@gmail.com**

---
