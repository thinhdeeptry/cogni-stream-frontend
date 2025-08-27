# Questions API Documentation

## Tổng quan

Module Questions cung cấp các API để quản lý câu hỏi (Question) trong hệ thống quiz. Hỗ trợ đầy đủ các thao tác CRUD, quản lý đáp án, và các tính năng nâng cao.

## Danh sách API

### 1. Tạo câu hỏi mới

**POST** `/questions`

**Headers:**

- Authorization: Bearer {token}
- Content-Type: application/json

**Phân quyền:** ADMIN, INSTRUCTOR (của khóa học chứa bài học)

**Body:**

```json
{
  "text": "React Hook nào dùng để quản lý state?",
  "type": "SINGLE_CHOICE",
  "lessonId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "answers": [
    {
      "text": "useState",
      "isCorrect": true
    },
    {
      "text": "useEffect",
      "isCorrect": false
    },
    {
      "text": "useContext",
      "isCorrect": false
    }
  ],
  "order": 1
}
```

**Response:**

```json
{
  "id": "question-uuid",
  "text": "React Hook nào dùng để quản lý state?",
  "type": "SINGLE_CHOICE",
  "order": 1,
  "lessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "answers": [
    {
      "id": "answer-uuid-1",
      "text": "useState",
      "isCorrect": true,
      "questionId": "question-uuid"
    },
    {
      "id": "answer-uuid-2",
      "text": "useEffect",
      "isCorrect": false,
      "questionId": "question-uuid"
    }
  ],
  "lession": {
    "id": "lesson-uuid",
    "title": "Giới thiệu React Hooks",
    "type": "QUIZ"
  }
}
```

### 2. Lấy danh sách câu hỏi (với filter và pagination)

**GET** `/questions`

**Query Parameters:**

- `lessonId` (optional): UUID - Filter theo bài học
- `chapterId` (optional): UUID - Filter theo chương
- `courseId` (optional): UUID - Filter theo khóa học
- `type` (optional): QuestionType - Filter theo loại câu hỏi
- `page` (optional): number - Trang hiện tại (default: 1)
- `limit` (optional): number - Số lượng mỗi trang (default: 20, max: 100)

**Examples:**

```
GET /questions?courseId=course-uuid&type=SINGLE_CHOICE&page=1&limit=10
GET /questions?lessonId=lesson-uuid
GET /questions?chapterId=chapter-uuid&page=2
```

**Response:**

```json
{
  "data": [
    {
      "id": "question-uuid",
      "text": "React Hook nào dùng để quản lý state?",
      "type": "SINGLE_CHOICE",
      "order": 1,
      "answers": [
        {
          "id": "answer-uuid",
          "text": "useState",
          "isCorrect": true
        }
      ],
      "lession": {
        "id": "lesson-uuid",
        "title": "React Hooks",
        "chapter": {
          "id": "chapter-uuid",
          "title": "React Cơ bản",
          "course": {
            "id": "course-uuid",
            "title": "Khóa học React"
          }
        }
      }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasPermissionToSeeAnswers": true
  }
}
```

### 3. Lấy chi tiết câu hỏi

**GET** `/questions/:id`

**Response:**

```json
{
  "id": "question-uuid",
  "text": "React Hook nào dùng để quản lý state?",
  "type": "SINGLE_CHOICE",
  "order": 1,
  "answers": [
    {
      "id": "answer-uuid-1",
      "text": "useState",
      "isCorrect": true
    },
    {
      "id": "answer-uuid-2",
      "text": "useEffect",
      "isCorrect": false
    }
  ],
  "lession": {
    "id": "lesson-uuid",
    "title": "React Hooks",
    "chapter": {
      "course": {
        "id": "course-uuid",
        "title": "Khóa học React",
        "instructorId": "instructor-uuid"
      }
    }
  }
}
```

### 4. Cập nhật câu hỏi

**PATCH** `/questions/:id`

**Headers:**

- Authorization: Bearer {token}

**Phân quyền:** ADMIN, INSTRUCTOR (của khóa học)

**Body:**

```json
{
  "text": "React Hook nào được dùng để quản lý state trong component?",
  "type": "MULTIPLE_CHOICE",
  "answers": [
    {
      "id": "existing-answer-uuid",
      "text": "useState (updated)",
      "isCorrect": true
    },
    {
      "text": "useReducer",
      "isCorrect": true
    }
  ],
  "order": 2
}
```

### 5. Xóa câu hỏi

**DELETE** `/questions/:id`

**Headers:**

- Authorization: Bearer {token}

**Phân quyền:** ADMIN, INSTRUCTOR (của khóa học)

**Response:**

```json
{
  "message": "Đã xóa câu hỏi thành công"
}
```

### 6. Thêm đáp án cho câu hỏi

**POST** `/questions/:id/answers`

**Headers:**

- Authorization: Bearer {token}

**Phân quyền:** ADMIN, INSTRUCTOR (của khóa học)

**Body:**

```json
{
  "text": "useMemo",
  "isCorrect": false
}
```

**Response:**

```json
{
  "id": "new-answer-uuid",
  "text": "useMemo",
  "isCorrect": false,
  "questionId": "question-uuid"
}
```

### 7. Cập nhật đáp án

**PATCH** `/questions/:questionId/answers/:answerId`

**Headers:**

- Authorization: Bearer {token}

**Phân quyền:** ADMIN, INSTRUCTOR (của khóa học)

**Body:**

```json
{
  "text": "useMemo - để tối ưu hóa performance",
  "isCorrect": true
}
```

### 8. Xóa đáp án

**DELETE** `/questions/:questionId/answers/:answerId`

**Headers:**

- Authorization: Bearer {token}

**Phân quyền:** ADMIN, INSTRUCTOR (của khóa học)

**Lưu ý:** Không thể xóa nếu câu hỏi chỉ còn 1 đáp án

**Response:**

```json
{
  "message": "Đã xóa đáp án thành công"
}
```

### 9. Tạo nhiều câu hỏi cùng lúc

**POST** `/questions/bulk`

**Headers:**

- Authorization: Bearer {token}

**Phân quyền:** ADMIN, INSTRUCTOR (của khóa học chứa bài học)

**Body:**

```json
{
  "lessonId": "lesson-uuid",
  "questions": [
    {
      "text": "Câu hỏi 1",
      "type": "SINGLE_CHOICE",
      "answers": [
        { "text": "Đáp án A", "isCorrect": true },
        { "text": "Đáp án B", "isCorrect": false }
      ]
    },
    {
      "text": "Câu hỏi 2",
      "type": "MULTIPLE_CHOICE",
      "answers": [
        { "text": "Đáp án A", "isCorrect": true },
        { "text": "Đáp án B", "isCorrect": true },
        { "text": "Đáp án C", "isCorrect": false }
      ]
    }
  ]
}
```

**Response:**

```json
{
  "message": "Đã tạo 2 câu hỏi thành công",
  "questions": [
    {
      "id": "question-uuid-1",
      "text": "Câu hỏi 1",
      "answers": [...]
    },
    {
      "id": "question-uuid-2",
      "text": "Câu hỏi 2",
      "answers": [...]
    }
  ]
}
```

### 10. Xóa nhiều câu hỏi cùng lúc

**DELETE** `/questions/bulk`

**Headers:**

- Authorization: Bearer {token}

**Phân quyền:** ADMIN, INSTRUCTOR (của khóa học)

**Body:**

```json
{
  "questionIds": ["question-uuid-1", "question-uuid-2", "question-uuid-3"]
}
```

**Response:**

```json
{
  "message": "Đã xóa 3 câu hỏi thành công"
}
```

### 11. Sao chép câu hỏi

**POST** `/questions/:id/duplicate`

**Headers:**

- Authorization: Bearer {token}

**Phân quyền:** ADMIN, INSTRUCTOR (của khóa học đích)

**Body:**

```json
{
  "targetLessonId": "target-lesson-uuid"
}
```

**Lưu ý:** Nếu không cung cấp `targetLessonId`, câu hỏi sẽ được sao chép trong cùng bài học

**Response:**

```json
{
  "id": "new-question-uuid",
  "text": "React Hook nào dùng để quản lý state? (Copy)",
  "type": "SINGLE_CHOICE",
  "order": 5,
  "answers": [...],
  "lession": {
    "id": "target-lesson-uuid",
    "title": "Bài học đích"
  }
}
```

### 12. Sắp xếp lại thứ tự câu hỏi

**PATCH** `/questions/reorder`

**Headers:**

- Authorization: Bearer {token}

**Phân quyền:** ADMIN, INSTRUCTOR (của khóa học)

**Body:**

```json
{
  "questionOrders": [
    { "id": "question-uuid-1", "order": 1 },
    { "id": "question-uuid-2", "order": 2 },
    { "id": "question-uuid-3", "order": 3 }
  ]
}
```

**Response:**

```json
{
  "message": "Đã cập nhật thứ tự câu hỏi thành công"
}
```

## Phân quyền chi tiết

### Tạo/Sửa/Xóa questions:

- **ADMIN**: Có quyền với tất cả questions
- **INSTRUCTOR**: Chỉ có quyền với questions thuộc khóa học mình dạy

### Xem questions:

- **ADMIN**: Xem tất cả questions với đáp án đúng
- **INSTRUCTOR**: Xem questions của khóa học mình dạy với đáp án đúng
- **STUDENT**: Xem questions nhưng không thấy đáp án đúng (field `isCorrect` bị ẩn)
- **Anonymous**: Xem questions public nhưng không thấy đáp án đúng

## Validation Rules

### Câu hỏi:

- `text`: Không được để trống
- `type`: Phải là `SINGLE_CHOICE` hoặc `MULTIPLE_CHOICE`
- `lessonId`: Phải là UUID hợp lệ và lesson phải tồn tại
- `order`: Số nguyên >= 0 (optional, tự động tăng nếu không cung cấp)

### Đáp án:

- Mỗi câu hỏi phải có ít nhất 2 đáp án
- `SINGLE_CHOICE`: Phải có đúng 1 đáp án đúng
- `MULTIPLE_CHOICE`: Phải có ít nhất 1 đáp án đúng
- `text`: Không được để trống
- `isCorrect`: Phải là boolean

### Pagination:

- `page`: >= 1
- `limit`: 1-100

## Error Codes

- **400**: Validation error, dữ liệu không hợp lệ
- **401**: Chưa đăng nhập
- **403**: Không có quyền thực hiện thao tác
- **404**: Không tìm thấy resource (question, lesson, answer)

## Sử dụng với Quiz System

Questions API này tích hợp hoàn toàn với Quiz system hiện có:

- Questions được tạo cho các lessons có `type = "QUIZ"`
- Quiz attempts sử dụng questions này để tạo bài thi
- Kết quả quiz được tính dựa trên `isCorrect` của answers
