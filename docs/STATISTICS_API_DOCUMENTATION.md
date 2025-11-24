# Statistics API Documentation 📊

Hệ thống API thống kê toàn diện cho admin dashboard, cung cấp báo cáo chi tiết về doanh thu, học viên, giảng viên và khóa học.

## Mục lục

- [Tổng quan](#tổng-quan)
- [API Endpoints](#api-endpoints)
- [Dữ liệu thống kê](#dữ-liệu-thống-kê)
- [Ví dụ sử dụng](#ví-dụ-sử-dụng)
- [Performance & Caching](#performance--caching)

## Tổng quan

### Quyền truy cập

- **Chỉ Admin** có thể truy cập các API statistics
- Sử dụng JWT Bearer token
- Role required: `ADMIN`

### Tính năng chính

- ✅ Thống kê tổng quan (doanh thu, học viên, giảng viên, khóa học)
- ✅ Charts data cho dashboard (doanh thu theo thời gian, phân bố theo danh mục)
- ✅ Top courses và top instructors
- ✅ Growth tracking (so sánh với kỳ trước)
- ✅ Filter theo khoảng thời gian tùy chỉnh
- ✅ Multiple time periods (day/week/month/quarter/year)

## API Endpoints

### 1. Dashboard Statistics (Main API)

```
GET /statistics/dashboard
```

**Query Parameters:**

- `startDate` (optional): Ngày bắt đầu (YYYY-MM-DD). Default: đầu năm hiện tại
- `endDate` (optional): Ngày kết thúc (YYYY-MM-DD). Default: hôm nay
- `period` (optional): Khoảng thời gian nhóm dữ liệu. Enum: `day|week|month|quarter|year`. Default: `month`

**Response Structure:**

```typescript
{
  overview: {
    totalRevenue: number;        // Tổng doanh thu (VND)
    totalStudents: number;       // Tổng học viên mới đăng ký
    totalInstructors: number;    // Tổng giảng viên active
    totalCourses: number;        // Tổng khóa học được tạo
    totalEnrollments: number;    // Tổng enrollments
    totalTransactions: number;   // Tổng transactions thành công
    avgCourseRating: number;     // Điểm đánh giá trung bình
    completionRate: number;      // Tỷ lệ hoàn thành khóa học (%)
  },
  charts: {
    revenueByMonth: [             // Doanh thu theo thời gian
      {
        month: string;            // "2024-01" | "2024-Q1" | "2024"
        year: number;             // 2024
        revenue: number;          // Doanh thu
        transactionCount: number; // Số giao dịch
      }
    ],
    revenueByCourseLevel: [       // Phân bố theo cấp độ
      {
        level: string;            // "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
        revenue: number;          // Doanh thu
        courseCount: number;      // Số khóa học
        percentage: number;       // % tổng doanh thu
      }
    ],
    revenueByCategory: [          // Top 10 danh mục
      {
        categoryId: string;
        categoryName: string;
        revenue: number;
        courseCount: number;
        percentage: number;
      }
    ]
  },
  highlights: {
    topCourses: [                 // Top 10 khóa học
      {
        id: string;
        title: string;
        revenue: number;
        studentCount: number;
        avgRating: number;
        instructor: {
          id: string;
          name: string;
          email: string;
        },
        category?: {
          id: string;
          name: string;
        }
      }
    ],
    topInstructors: [             // Top 10 giảng viên
      {
        id: string;
        name: string;
        email: string;
        image?: string;
        totalRevenue: number;
        totalCourses: number;
        totalStudents: number;
        avgRating: number;
        completionRate: number;
      }
    ],
    recentGrowth: {               // Tăng trưởng so với kỳ trước
      revenueGrowth: number;      // % tăng trưởng doanh thu
      studentGrowth: number;      // % tăng trưởng học viên
      courseGrowth: number;       // % tăng trưởng khóa học
    }
  },
  period: {
    startDate: string;            // "2024-01-01"
    endDate: string;              // "2024-12-31"
    totalDays: number;            // 365
  }
}
```

### 2. Revenue Summary

```
GET /statistics/revenue-summary
```

**Response:** Rút gọn chỉ trả về thông tin doanh thu và các chỉ số liên quan.

### 3. Instructors Summary

```
GET /statistics/instructors-summary
```

**Response:** Rút gọn chỉ trả về thông tin giảng viên và hoạt động.

### 4. Students Summary

```
GET /statistics/students-summary
```

**Response:** Rút gọn chỉ trả về thông tin học viên và enrollments.

## Dữ liệu thống kê

### 📊 Overview Statistics

#### Tổng doanh thu (totalRevenue)

- Tính từ tất cả `transactions` với status = `COMPLETED`
- Trong khoảng thời gian được filter
- Bao gồm cả khóa học ONLINE và LIVE (qua classes)

#### Tổng học viên (totalStudents)

- Đếm `users` với role = `STUDENT`
- Được tạo trong khoảng thời gian filter
- Chỉ tính học viên mới đăng ký

#### Tổng giảng viên (totalInstructors)

- Đếm `teacher_profiles` với status = `ACTIVE`
- Được tạo trong khoảng thời gian filter

#### Tổng khóa học (totalCourses)

- Đếm `courses` với status = `APPROVED` hoặc `PUBLISHED`
- Được tạo trong khoảng thời gian filter

### 📈 Charts Data

#### Doanh thu theo thời gian (revenueByMonth)

- Group by theo `period` parameter
- Hỗ trợ: day, week, month, quarter, year
- Bao gồm số lượng transactions

#### Phân bố theo cấp độ (revenueByCourseLevel)

- Group theo `course.level`
- Tính % so với tổng doanh thu
- Bao gồm số lượng khóa học

#### Phân bố theo danh mục (revenueByCategory)

- Top 10 categories theo doanh thu
- Tính % so với tổng doanh thu
- Handle trường hợp "Uncategorized"

### 🏆 Highlights Data

#### Top Courses

- Top 10 theo doanh thu + số học viên
- Bao gồm thông tin instructor và category
- Chỉ tính courses đã APPROVED/PUBLISHED

#### Top Instructors

- Top 10 theo doanh thu + số học viên
- Bao gồm completion rate và avg rating
- Chỉ tính instructors ACTIVE với ít nhất 1 course

#### Recent Growth

- So sánh với cùng kỳ trước đó
- Tính % tăng trưởng cho revenue, students, courses
- Handle edge case khi previous period = 0

## Ví dụ sử dụng

### Lấy thống kê toàn bộ năm 2024

```bash
GET /statistics/dashboard?startDate=2024-01-01&endDate=2024-12-31&period=month
```

### Lấy thống kê quý hiện tại

```bash
GET /statistics/dashboard?startDate=2024-10-01&endDate=2024-12-31&period=week
```

### Lấy thống kê 30 ngày gần nhất

```bash
GET /statistics/dashboard?startDate=2024-11-01&endDate=2024-11-30&period=day
```

### Chỉ lấy tóm tắt doanh thu

```bash
GET /statistics/revenue-summary?startDate=2024-01-01&endDate=2024-12-31
```

## Response Examples

### Dashboard Statistics Response

```json
{
  "overview": {
    "totalRevenue": 125000000,
    "totalStudents": 1250,
    "totalInstructors": 85,
    "totalCourses": 342,
    "totalEnrollments": 3456,
    "totalTransactions": 2890,
    "avgCourseRating": 4.2,
    "completionRate": 68.5
  },
  "charts": {
    "revenueByMonth": [
      {
        "month": "2024-01",
        "year": 2024,
        "revenue": 8500000,
        "transactionCount": 245
      },
      {
        "month": "2024-02",
        "year": 2024,
        "revenue": 12300000,
        "transactionCount": 298
      }
    ],
    "revenueByCourseLevel": [
      {
        "level": "BEGINNER",
        "revenue": 65000000,
        "courseCount": 180,
        "percentage": 52.0
      },
      {
        "level": "INTERMEDIATE",
        "revenue": 42000000,
        "courseCount": 120,
        "percentage": 33.6
      },
      {
        "level": "ADVANCED",
        "revenue": 18000000,
        "courseCount": 42,
        "percentage": 14.4
      }
    ],
    "revenueByCategory": [
      {
        "categoryId": "cat-1",
        "categoryName": "Lập trình Web",
        "revenue": 45000000,
        "courseCount": 120,
        "percentage": 36.0
      },
      {
        "categoryId": "cat-2",
        "categoryName": "Data Science",
        "revenue": 32000000,
        "courseCount": 85,
        "percentage": 25.6
      }
    ]
  },
  "highlights": {
    "topCourses": [
      {
        "id": "course-1",
        "title": "Full-stack JavaScript Development",
        "revenue": 15000000,
        "studentCount": 450,
        "avgRating": 4.8,
        "instructor": {
          "id": "instructor-1",
          "name": "Nguyễn Văn A",
          "email": "instructor@example.com"
        },
        "category": {
          "id": "cat-1",
          "name": "Lập trình Web"
        }
      }
    ],
    "topInstructors": [
      {
        "id": "instructor-1",
        "name": "Nguyễn Văn A",
        "email": "instructor@example.com",
        "image": "https://example.com/avatar.jpg",
        "totalRevenue": 25000000,
        "totalCourses": 8,
        "totalStudents": 890,
        "avgRating": 4.6,
        "completionRate": 78.5
      }
    ],
    "recentGrowth": {
      "revenueGrowth": 15.8,
      "studentGrowth": 23.4,
      "courseGrowth": 12.1
    }
  },
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "totalDays": 366
  }
}
```

### Revenue Summary Response

```json
{
  "totalRevenue": 125000000,
  "totalTransactions": 2890,
  "revenueByMonth": [
    {
      "month": "2024-01",
      "year": 2024,
      "revenue": 8500000,
      "transactionCount": 245
    }
  ],
  "revenueByCategory": [
    {
      "categoryId": "cat-1",
      "categoryName": "Lập trình Web",
      "revenue": 45000000,
      "courseCount": 120,
      "percentage": 36.0
    }
  ],
  "topCoursesByRevenue": [
    {
      "id": "course-1",
      "title": "Full-stack JavaScript Development",
      "revenue": 15000000,
      "studentCount": 450,
      "avgRating": 4.8
    }
  ],
  "recentGrowth": {
    "revenueGrowth": 15.8,
    "studentGrowth": 23.4,
    "courseGrowth": 12.1
  },
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "totalDays": 366
  }
}
```

## Performance & Caching

### Database Optimization

- ✅ Sử dụng raw SQL queries cho complex aggregations
- ✅ Parallel execution với Promise.all()
- ✅ Indexes được tối ưu cho các trường filter (createdAt, status)
- ✅ Efficient JOINs và subqueries

### Caching Strategy (Khuyến nghị)

```typescript
// Cache key pattern
const cacheKey = `stats:${startDate}:${endDate}:${period}`;

// Cache TTL
- Real-time data: 5 minutes
- Daily reports: 1 hour
- Monthly reports: 6 hours
```

### Response Time Targets

- Dashboard API: < 2 seconds
- Summary APIs: < 1 second
- Charts data: < 1.5 seconds

## Error Handling

### Common Errors

```json
// 403 Forbidden - Không phải Admin
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}

// 400 Bad Request - Invalid date format
{
  "statusCode": 400,
  "message": ["startDate must be a valid ISO 8601 date string"],
  "error": "Bad Request"
}
```

### Validation Rules

- startDate và endDate phải là format YYYY-MM-DD
- endDate không được nhỏ hơn startDate
- Khoảng thời gian tối đa: 2 năm
- period phải là một trong: day|week|month|quarter|year

## Security Notes

### Access Control

- ⚠️ **Chỉ Admin** có thể truy cập
- ✅ JWT token validation
- ✅ Role-based authorization

### Data Privacy

- ✅ Không expose sensitive user data
- ✅ Revenue data chỉ hiển thị aggregated
- ✅ Personal information được filter

### Rate Limiting (Khuyến nghị)

```typescript
// Thiết lập rate limiting
- Admin: 100 requests/minute
- Dashboard API: 20 requests/minute
- Summary APIs: 60 requests/minute
```

---

## Kết luận

Statistics API cung cấp dashboard analytics toàn diện cho admin với:

- **Performance cao** thông qua SQL optimization
- **Flexibility** với multiple time periods và filters
- **Comprehensive data** từ overview đến detailed charts
- **Security** với proper authentication và authorization
- **Scalability** ready cho caching và rate limiting

Để biết thêm chi tiết về implementation, tham khảo source code tại `src/modules/statistics/`.
