# APIs cần Backend hỗ trợ cho LIVE Course Learning

## 1. Class Management APIs

### GET /api/classes/{classId}/syllabus

**Mô tả**: Lấy lộ trình học của một lớp cụ thể
**Response**:

```json
{
  "id": "syllabus_id",
  "classId": "class_id",
  "className": "Lớp K1",
  "groupedItems": [
    {
      "day": 1,
      "items": [
        {
          "id": "item_id",
          "day": 1,
          "order": 1,
          "itemType": "LESSON", // hoặc "LIVE_SESSION"
          "classId": "class_id",
          "lessonId": "lesson_id", // nếu là LESSON
          "classSessionId": "session_id", // nếu là LIVE_SESSION
          "lesson": {
            "id": "lesson_id",
            "title": "Bài học 1",
            "type": "VIDEO",
            "estimatedDurationMinutes": 45,
            "isFreePreview": false,
            "isPublished": true
          },
          "classSession": {
            "id": "session_id",
            "topic": "Buổi học trực tuyến 1",
            "scheduledAt": "2025-09-15T19:00:00Z",
            "durationMinutes": 90,
            "meetingDetail": "Link Zoom sẽ được gửi trước 30 phút"
          }
        }
      ]
    }
  ],
  "totalDays": 5,
  "totalSessions": 3,
  "totalLessons": 7,
  "createdAt": "2025-09-01T00:00:00Z",
  "updatedAt": "2025-09-01T00:00:00Z"
}
```

### GET /api/classes/{classId}/progress/{userId}

**Mô tả**: Lấy tiến độ học tập của user trong lớp
**Response**:

```json
{
  "currentItem": {
    "id": "item_id",
    "day": 2,
    "order": 3,
    "itemType": "LESSON"
    // ... syllabus item details
  },
  "completedItems": ["item1_id", "item2_id"],
  "overallProgress": 40.5
}
```

### POST /api/classes/{classId}/progress/{userId}

**Mô tả**: Cập nhật tiến độ học tập của user
**Request Body**:

```json
{
  "currentItemId": "item_id",
  "isCompleted": true,
  "progressPercentage": 45.0
}
```

## 2. Enrollment APIs (có thể cần điều chỉnh)

### GET /api/enrollment/class/{classId}

**Mô tả**: Lấy thông tin enrollment của user trong class
**Response**:

```json
{
  "id": "enrollment_id",
  "studentId": "user_id",
  "classId": "class_id",
  "courseId": "course_id",
  "type": "STREAM", // hoặc "ONLINE"
  "progress": 45.0,
  "isCompleted": false,
  "enrolledAt": "2025-09-01T00:00:00Z"
}
```

## 3. Database Schema cần thiết

### Bảng `class_sessions`

```sql
CREATE TABLE class_sessions (
  id VARCHAR(255) PRIMARY KEY,
  class_id VARCHAR(255) NOT NULL,
  topic VARCHAR(500) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INT NOT NULL,
  meeting_detail TEXT,
  meeting_link VARCHAR(500),
  recording_url VARCHAR(500),
  status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);
```

### Bảng `syllabus_items` (có thể đã có)

```sql
CREATE TABLE syllabus_items (
  id VARCHAR(255) PRIMARY KEY,
  class_id VARCHAR(255) NOT NULL,
  day INT NOT NULL,
  order_index INT NOT NULL,
  item_type ENUM('LESSON', 'LIVE_SESSION') NOT NULL,
  lesson_id VARCHAR(255) NULL,
  class_session_id VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,

  INDEX idx_class_day_order (class_id, day, order_index)
);
```

### Bảng `user_class_progress`

```sql
CREATE TABLE user_class_progress (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  class_id VARCHAR(255) NOT NULL,
  current_item_id VARCHAR(255),
  completed_items JSON, -- Array of completed syllabus item IDs
  overall_progress DECIMAL(5,2) DEFAULT 0.00,
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (current_item_id) REFERENCES syllabus_items(id) ON DELETE SET NULL,

  UNIQUE KEY unique_user_class (user_id, class_id)
);
```

## 4. Luồng hoạt động

1. **User chọn class từ course detail** → Frontend điều hướng đến `/course/{courseId}/class/{classId}`
2. **Class learning page load** → Fetch syllabus và progress của user
3. **User chọn lesson/session** → Hiển thị content tương ứng
4. **User hoàn thành item** → Cập nhật progress và chuyển sang item tiếp theo
5. **Navigation** → Previous/Next dựa trên syllabus order

## 5. Tích hợp với hệ thống hiện tại

- **Lesson detail**: Khi user click "Bắt đầu bài học" từ class learning → Điều hướng đến lesson detail
- **Progress tracking**: Tích hợp với progress store hiện tại
- **Authentication**: Sử dụng enrollment check hiện tại

## Ưu tiên phát triển

1. **High Priority**: APIs để fetch syllabus và class info
2. **Medium Priority**: Progress tracking APIs
3. **Low Priority**: Advanced features như meeting integration
