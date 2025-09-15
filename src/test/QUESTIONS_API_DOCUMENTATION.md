# Questions API Documentation

## Tổng quan

Module Questions cung cấp các API để quản lý câu hỏi (Question) trong hệ thống quiz. Hỗ trợ đầy đủ các thao tác CRUD, quản lý đáp án, và các tính năng nâng cao bao gồm auto-grading cho câu hỏi tự luận.

## Quiz Timing & Retry System

### Lesson Quiz Settings

Mỗi lesson có type = "QUIZ" được cấu hình với các field:

- **timeLimit**: Thời gian làm bài (phút). `null` = không giới hạn thời gian
- **maxAttempts**: Số lần làm tối đa. `null` = không giới hạn
- **retryDelay**: Thời gian chờ giữa các lần làm (phút)
- **passPercent**: Điểm đạt (mặc định 80%)

### Quiz Attempt Tracking

- **attemptNumber**: Lần thử thứ mấy (1, 2, 3...)
- **nextAllowedAt**: Thời gian cho phép làm lại (null nếu có thể làm ngay)

### Auto-Grading System

Hệ thống tự động chấm điểm cho câu hỏi tự luận:

- **acceptedAnswers**: Mảng các đáp án được chấp nhận
- **caseSensitive**: Phân biệt hoa/thường (default: false)
- **exactMatch**: So sánh chính xác hay fuzzy matching (default: true)
- **points**: Điểm số của đáp án (default: 1.0)

Thuật toán chấm:

- **Exact match**: 100% điểm
- **Fuzzy match** (Levenshtein distance): 80% điểm
- **Contains match**: 50% điểm

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

## Quiz Management APIs

### 13. Bắt đầu quiz attempt

**POST** `/quizzes/:lessonId/start`

**Headers:**

- Authorization: Bearer {token}

**Response:**

```json
{
  "attemptId": "attempt-uuid",
  "attemptNumber": 2,
  "timeLimit": 60,
  "nextAllowedAt": null,
  "questions": [
    {
      "id": "question-uuid",
      "text": "Câu hỏi...",
      "type": "SINGLE_CHOICE",
      "answers": [
        {
          "id": "answer-uuid",
          "text": "Đáp án A"
        }
      ]
    }
  ]
}
```

### 14. Kiểm tra quiz attempt status

**GET** `/quizzes/:lessonId/status`

**Response:**

```json
{
  "canAttempt": true,
  "attemptsUsed": 1,
  "maxAttempts": 3,
  "lastScore": 65,
  "isPassed": false,
  "nextAllowedAt": "2025-09-15T15:30:00Z",
  "timeUntilNextAttempt": 45
}
```

### 15. Submit quiz attempt

**POST** `/quizzes/:attemptId/submit`

**Body:**

```json
{
  "answers": [
    {
      "questionId": "question-uuid",
      "answerId": "answer-uuid"
    },
    {
      "questionId": "question-uuid-2",
      "textAnswer": "Câu trả lời tự luận"
    }
  ]
}
```

**Response:**

```json
{
  "score": 85,
  "isPassed": true,
  "attemptNumber": 2,
  "timeSpent": 45,
  "canRetry": false,
  "nextAllowedAt": null,
  "results": [
    {
      "questionId": "question-uuid",
      "isCorrect": true,
      "score": 1.0,
      "feedback": "Chính xác!"
    },
    {
      "questionId": "question-uuid-2",
      "isCorrect": true,
      "score": 0.8,
      "feedback": "Fuzzy match - 80% điểm"
    }
  ]
}
```

### 16. Cập nhật quiz settings (Lesson)

**PATCH** `/lessons/:id/quiz-settings`

**Headers:**

- Authorization: Bearer {token}

**Phân quyền:** ADMIN, INSTRUCTOR (của khóa học)

**Body:**

```json
{
  "timeLimit": 90,
  "maxAttempts": 5,
  "retryDelay": 120,
  "passPercent": 75
}
```

**Response:**

```json
{
  "message": "Đã cập nhật cài đặt quiz thành công",
  "settings": {
    "timeLimit": 90,
    "maxAttempts": 5,
    "retryDelay": 120,
    "passPercent": 75
  }
}
```

### 17. Lấy quiz history của học viên

**GET** `/quizzes/:lessonId/history`

**Query Parameters:**

- `studentId` (optional, ADMIN/INSTRUCTOR only): UUID - Xem history của học viên khác

**Response:**

```json
{
  "attempts": [
    {
      "id": "attempt-uuid",
      "attemptNumber": 1,
      "score": 65,
      "isPassed": false,
      "startedAt": "2025-09-15T10:00:00Z",
      "submittedAt": "2025-09-15T10:45:00Z",
      "timeSpent": 45
    },
    {
      "id": "attempt-uuid-2",
      "attemptNumber": 2,
      "score": 85,
      "isPassed": true,
      "startedAt": "2025-09-15T12:00:00Z",
      "submittedAt": "2025-09-15T12:30:00Z",
      "timeSpent": 30
    }
  ],
  "bestScore": 85,
  "totalAttempts": 2,
  "isPassed": true
}
```

## Quiz Timing Business Rules

### Thời gian làm bài (timeLimit):

- `null`: Không giới hạn thời gian
- `> 0`: Thời gian làm bài tính bằng phút
- Khi hết thời gian, bài thi tự động submit
- Timer hiển thị countdown trên frontend

### Số lần làm tối đa (maxAttempts):

- `null`: Không giới hạn số lần làm
- `> 0`: Số lần làm tối đa
- Đã đạt `passPercent`: Không cho phép làm lại (trừ khi ADMIN reset)
- Hết số lần: Không cho phép làm lại

### Thời gian chờ (retryDelay):

- `null` hoặc `0`: Có thể làm lại ngay lập tức
- `> 0`: Phải chờ X phút mới được làm lại
- `nextAllowedAt` = `submittedAt` + `retryDelay` minutes
- Áp dụng khi chưa đạt điểm pass

### Điểm đạt (passPercent):

- Mặc định: 80%
- Range: 0-100
- `score >= passPercent`: Đạt, không cần làm lại
- `score < passPercent`: Chưa đạt, có thể làm lại (nếu còn attempt)

### Auto-grading cho câu tự luận:

- **SINGLE_CHOICE/MULTIPLE_CHOICE**: Tự động chấm 100% chính xác
- **SHORT_ANSWER/ESSAY/FILL_IN_BLANK**: Sử dụng auto-grading:
  - So sánh với `acceptedAnswers[]`
  - Áp dụng `caseSensitive` và `exactMatch` settings
  - Điểm = `points` × matching_percentage

### Question Types Support:

- **SINGLE_CHOICE**: 1 đáp án đúng duy nhất
- **MULTIPLE_CHOICE**: 1 hoặc nhiều đáp án đúng
- **SHORT_ANSWER**: Câu trả lời ngắn, auto-grading
- **ESSAY**: Tự luận dài, auto-grading hoặc manual review
- **FILL_IN_BLANK**: Điền vào chỗ trống, auto-grading

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
- `type`: Phải là một trong các QuestionType
- `lessonId`: Phải là UUID hợp lệ và lesson phải tồn tại
- `order`: Số nguyên >= 0 (optional, tự động tăng nếu không cung cấp)

### Đáp án:

- Mỗi câu hỏi phải có ít nhất 2 đáp án (trừ tự luận)
- `SINGLE_CHOICE`: Phải có đúng 1 đáp án đúng
- `MULTIPLE_CHOICE`: Phải có ít nhất 1 đáp án đúng
- `SHORT_ANSWER/ESSAY/FILL_IN_BLANK`: Có thể không có đáp án cố định
- `text`: Không được để trống
- `isCorrect`: Phải là boolean
- `acceptedAnswers`: Array string cho tự luận
- `caseSensitive`: Boolean (default: false)
- `exactMatch`: Boolean (default: true)
- `points`: Number >= 0 (default: 1.0)

### Quiz Settings:

- `timeLimit`: null hoặc số nguyên > 0
- `maxAttempts`: null hoặc số nguyên > 0
- `retryDelay`: null hoặc số nguyên >= 0
- `passPercent`: 0-100

### Pagination:

- `page`: >= 1
- `limit`: 1-100

## Error Codes

- **400**: Validation error, dữ liệu không hợp lệ
- **401**: Chưa đăng nhập
- **403**: Không có quyền thực hiện thao tác
- **404**: Không tìm thấy resource (question, lesson, answer)
- **409**: Conflict - Đã hết số lần làm, chưa đến thời gian làm lại
- **423**: Locked - Quiz đang trong thời gian chờ retry
