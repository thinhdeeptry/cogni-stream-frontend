# API Documentation - Syllabus & Quiz Modules

## Module Syllabus - Lộ trình học

### 1. Tạo mục lộ trình học mới

**POST** `/syllabus`

**Headers:**

- Authorization: Bearer {token}

**Body:**

```json
{
  "day": 1,
  "order": 1,
  "itemType": "LESSON",
  "lessonId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "classSessionId": null,
  "classId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**Response:**

```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "day": 1,
  "order": 1,
  "itemType": "LESSON",
  "classId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "lessonId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "classSessionId": null,
  "lesson": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "title": "Giới thiệu về React Hooks",
    "type": "QUIZ",
    "estimatedDurationMinutes": 30,
    "isFreePreview": false
  },
  "classSession": null,
  "class": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Lớp React Cơ bản"
  }
}
```

### 2. Lấy lộ trình học theo lớp

**GET** `/syllabus/class/{classId}`

**Response:**

```json
[
  {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "day": 1,
    "order": 1,
    "itemType": "LESSON",
    "lesson": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "title": "Giới thiệu về React",
      "type": "VIDEO",
      "estimatedDurationMinutes": 45,
      "isFreePreview": true,
      "isPublished": true
    },
    "classSession": null
  },
  {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d480",
    "day": 1,
    "order": 2,
    "itemType": "LIVE_SESSION",
    "lesson": null,
    "classSession": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d480",
      "topic": "Q&A Session về React",
      "scheduledAt": "2025-01-20T10:00:00Z",
      "durationMinutes": 60,
      "meetingDetail": "Buổi hỏi đáp trực tiếp với giảng viên"
    }
  }
]
```

### 3. Lấy chi tiết mục lộ trình học

**GET** `/syllabus/{id}`

### 4. Cập nhật mục lộ trình học

**PATCH** `/syllabus/{id}`

### 5. Xóa mục lộ trình học

**DELETE** `/syllabus/{id}`

---

## Module Quizzes - Bài kiểm tra

### 1. Tạo quiz cho bài học

**POST** `/quizzes/lesson/{lessonId}`

**Headers:**

- Authorization: Bearer {token}

**Body:**

```json
{
  "questions": [
    {
      "text": "React là gì?",
      "type": "MULTIPLE_CHOICE",
      "explanation": "Câu hỏi về định nghĩa React",
      "answers": [
        {
          "text": "Một thư viện JavaScript để xây dựng UI",
          "isCorrect": true,
          "explanation": "Đúng! React là thư viện UI"
        },
        {
          "text": "Một framework backend",
          "isCorrect": false,
          "explanation": "Sai! React không phải là framework backend"
        },
        {
          "text": "Một database",
          "isCorrect": false,
          "explanation": "Sai! React không phải là database"
        }
      ]
    },
    {
      "text": "Hook nào được sử dụng để quản lý state?",
      "type": "MULTIPLE_CHOICE",
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
      ]
    }
  ]
}
```

**Response:**

```json
{
  "lessonId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "questions": [
    {
      "id": "q1",
      "text": "React là gì?",
      "type": "MULTIPLE_CHOICE",
      "order": 0,
      "lessionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "answers": [
        {
          "id": "a1",
          "text": "Một thư viện JavaScript để xây dựng UI",
          "isCorrect": true,
          "questionId": "q1"
        }
      ]
    }
  ]
}
```

### 2. Lấy quiz theo bài học

**GET** `/quizzes/lesson/{lessonId}`

**Note:**

- Nếu là student: Chỉ hiển thị câu hỏi và đáp án, ẩn thông tin `isCorrect`
- Nếu là instructor/admin: Hiển thị đầy đủ thông tin bao gồm `isCorrect`

### 3. Cập nhật quiz

**PATCH** `/quizzes/lesson/{lessonId}`

### 4. Xóa quiz

**DELETE** `/quizzes/lesson/{lessonId}`

---

## Quiz Attempt System - Hệ thống làm bài

### 1. Bắt đầu làm bài quiz

**POST** `/quizzes/attempt/start`

**Headers:**

- Authorization: Bearer {token}

**Body:**

```json
{
  "lessonId": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**Response:**

```json
{
  "attemptId": "attempt123",
  "startedAt": "2025-01-15T10:00:00Z",
  "lesson": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "title": "Quiz React Cơ bản",
    "description": "Kiểm tra kiến thức về React",
    "passPercent": 80
  }
}
```

### 2. Nộp bài quiz

**POST** `/quizzes/attempt/{attemptId}/submit`

**Headers:**

- Authorization: Bearer {token}

**Body:**

```json
{
  "answers": [
    {
      "questionId": "q1",
      "selectedAnswerIds": ["a1"]
    },
    {
      "questionId": "q2",
      "selectedAnswerIds": ["a3", "a4"]
    }
  ]
}
```

**Response:**

```json
{
  "attemptId": "attempt123",
  "score": 85,
  "totalQuestions": 2,
  "correctAnswers": 1,
  "passed": true,
  "passPercent": 80,
  "submittedAt": "2025-01-15T10:15:00Z"
}
```

### 3. Lấy lịch sử làm bài quiz

**GET** `/quizzes/attempts/lesson/{lessonId}`

**Headers:**

- Authorization: Bearer {token}

**Response:**

```json
[
  {
    "id": "attempt123",
    "startedAt": "2025-01-15T10:00:00Z",
    "submittedAt": "2025-01-15T10:15:00Z",
    "score": 85,
    "passed": true,
    "lesson": {
      "title": "Quiz React Cơ bản",
      "passPercent": 80
    }
  }
]
```

### 4. Lấy chi tiết kết quả làm bài

**GET** `/quizzes/attempt/{attemptId}`

**Headers:**

- Authorization: Bearer {token}

**Response:**

```json
{
  "id": "attempt123",
  "startedAt": "2025-01-15T10:00:00Z",
  "submittedAt": "2025-01-15T10:15:00Z",
  "score": 85,
  "passed": true,
  "lesson": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "title": "Quiz React Cơ bản",
    "passPercent": 80
  },
  "questions": [
    {
      "id": "q1",
      "text": "React là gì?",
      "type": "MULTIPLE_CHOICE",
      "answers": [
        {
          "id": "a1",
          "text": "Một thư viện JavaScript",
          "isCorrect": true,
          "isSelected": true
        },
        {
          "id": "a2",
          "text": "Một framework backend",
          "isCorrect": false,
          "isSelected": false
        }
      ]
    }
  ]
}
```

---

## Enum Values

### SyllabusItemType

- `LESSON`: Bài học tự học
- `LIVE_SESSION`: Buổi học trực tiếp

### QuestionType

- `MULTIPLE_CHOICE`: Trắc nghiệm (có thể chọn nhiều đáp án)
- `SINGLE_CHOICE`: Chọn một đáp án
- `TRUE_FALSE`: Đúng/Sai

### LessonType

- `VIDEO`: Bài học video
- `QUIZ`: Bài kiểm tra
- `DOCUMENT`: Tài liệu
- `ASSIGNMENT`: Bài tập

---

## Authorization

### Syllabus Module:

- **Tạo/Sửa/Xóa**: Cần role `INSTRUCTOR` (của lớp đó) hoặc `ADMIN`
- **Xem**: Public (không cần đăng nhập)

### Quiz Module:

- **Tạo/Sửa/Xóa quiz**: Cần role `INSTRUCTOR` (của khóa học đó) hoặc `ADMIN`
- **Xem quiz**: Public, nhưng student chỉ thấy câu hỏi và đáp án (không thấy đáp án đúng)
- **Làm bài quiz**: Cần đăng nhập và đã đăng ký khóa học

### Quiz Attempt:

- **Tất cả endpoints**: Cần đăng nhập và đã đăng ký khóa học chứa bài học quiz đó
