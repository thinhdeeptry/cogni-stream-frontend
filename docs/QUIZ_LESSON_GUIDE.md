# Quiz Lesson Creation Guide 📝

Hướng dẫn chi tiết về tạo lesson loại Quiz với các câu hỏi và câu trả lời tích hợp sẵn.

## Mục lục

- [Tổng quan](#tổng-quan)
- [Cấu trúc dữ liệu](#cấu-trúc-dữ-liệu)
- [API Endpoint](#api-endpoint)
- [Validation Rules](#validation-rules)
- [Ví dụ sử dụng](#ví-dụ-sử-dụng)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Tổng quan

Lesson loại Quiz cho phép instructor tạo một bài học có tích hợp sẵn các câu hỏi và câu trả lời. Khi tạo lesson với type `QUIZ`, bạn có thể truyền kèm danh sách questions và answers trong cùng một request.

### Tính năng chính

- ✅ Tạo lesson quiz và questions trong một transaction
- ✅ Hỗ trợ 3 loại câu hỏi: Single Choice, Multiple Choice, Essay
- ✅ Validation đầy đủ cho questions và answers
- ✅ Auto-ordering cho questions
- ✅ Rollback toàn bộ nếu có lỗi

## Cấu trúc dữ liệu

### Request Body Structure

```typescript
{
  // Thông tin lesson cơ bản
  title: string;
  content?: string;
  type: "QUIZ";  // Bắt buộc phải là QUIZ

  // Quiz settings
  timeLimit?: number;        // Thời gian làm bài (phút)
  maxAttempts?: number;      // Số lần làm tối đa
  retryDelay?: number;       // Thời gian chờ giữa các lần làm
  blockAfterMaxAttempts?: boolean;
  blockDuration?: number;
  requireUnlockAction?: boolean;

  // Danh sách câu hỏi (optional, chỉ dành cho QUIZ)
  questions?: [
    {
      text: string;           // Nội dung câu hỏi
      type: QuestionType;     // SINGLE_CHOICE | MULTIPLE_CHOICE | ESSAY
      points?: number;        // Điểm số (default: 1.0)
      order?: number;         // Thứ tự (auto-increment nếu không có)
      answers: [
        {
          text: string;             // Nội dung đáp án
          isCorrect: boolean;       // Đáp án đúng hay sai
          points?: number;          // Điểm cho đáp án này
          acceptedAnswers?: string[]; // Cho essay questions
          caseSensitive?: boolean;   // Phân biệt hoa thường
          exactMatch?: boolean;      // So sánh chính xác
        }
      ]
    }
  ]
}
```

### Question Types

#### 1. Single Choice (SINGLE_CHOICE)

```json
{
  "text": "React Hook nào được sử dụng để quản lý state?",
  "type": "SINGLE_CHOICE",
  "points": 2.0,
  "answers": [
    { "text": "useState", "isCorrect": true },
    { "text": "useEffect", "isCorrect": false },
    { "text": "useContext", "isCorrect": false },
    { "text": "useReducer", "isCorrect": false }
  ]
}
```

#### 2. Multiple Choice (MULTIPLE_CHOICE)

```json
{
  "text": "Những Hook nào thuộc về React?",
  "type": "MULTIPLE_CHOICE",
  "points": 3.0,
  "answers": [
    { "text": "useState", "isCorrect": true, "points": 1.0 },
    { "text": "useEffect", "isCorrect": true, "points": 1.0 },
    { "text": "useAngular", "isCorrect": false, "points": 0.0 },
    { "text": "useContext", "isCorrect": true, "points": 1.0 }
  ]
}
```

#### 3. Essay (ESSAY)

```json
{
  "text": "Giải thích cách hoạt động của useEffect Hook",
  "type": "ESSAY",
  "points": 5.0,
  "answers": [
    {
      "text": "Đáp án mẫu: useEffect cho phép thực hiện side effects...",
      "isCorrect": true,
      "acceptedAnswers": ["useEffect", "side effect", "cleanup"],
      "caseSensitive": false,
      "exactMatch": false
    }
  ]
}
```

## API Endpoint

### Create Quiz Lesson

```
POST /lessons/courses/{courseId}/chapters/{chapterId}
Content-Type: application/json
Authorization: Bearer {token}
```

### Headers

- `Authorization`: Bearer token (INSTRUCTOR hoặc ADMIN)
- `Content-Type`: application/json

### Path Parameters

- `courseId`: UUID của course
- `chapterId`: UUID của chapter

## Validation Rules

### Lesson Level

- ✅ `title` không được trống
- ✅ `type` phải là `QUIZ` nếu có questions
- ✅ `questions` array không được trống nếu type là QUIZ

### Question Level

- ✅ `text` không được trống
- ✅ `type` phải là một trong: SINGLE_CHOICE, MULTIPLE_CHOICE, ESSAY
- ✅ `answers` array phải có ít nhất 1 phần tử
- ✅ `points` phải >= 0 nếu có

### Answer Level (theo từng loại)

#### Single Choice

- ✅ Phải có ít nhất 2 answers
- ✅ Phải có đúng 1 answer với `isCorrect: true`
- ✅ Tất cả answers phải có `text` không trống

#### Multiple Choice

- ✅ Phải có ít nhất 2 answers
- ✅ Phải có ít nhất 1 answer với `isCorrect: true`
- ✅ Tất cả answers phải có `text` không trống

#### Essay

- ✅ Phải có ít nhất 1 answer (làm mẫu)
- ✅ Không bắt buộc phải có answer đúng
- ✅ `acceptedAnswers` array hỗ trợ multiple keywords

## Ví dụ sử dụng

### Ví dụ 1: Quiz cơ bản với Single Choice

```json
{
  "title": "Quiz React Hooks Cơ bản",
  "content": "Kiểm tra kiến thức về React Hooks",
  "type": "QUIZ",
  "timeLimit": 30,
  "maxAttempts": 3,
  "questions": [
    {
      "text": "useState trả về gì?",
      "type": "SINGLE_CHOICE",
      "points": 1.0,
      "answers": [
        { "text": "Một array với [state, setState]", "isCorrect": true },
        { "text": "Chỉ có state value", "isCorrect": false },
        { "text": "Chỉ có setState function", "isCorrect": false }
      ]
    }
  ]
}
```

### Ví dụ 2: Quiz phức tạp với nhiều loại câu hỏi

```json
{
  "title": "Quiz React Advanced",
  "content": "Kiểm tra kiến thức React nâng cao",
  "type": "QUIZ",
  "timeLimit": 45,
  "maxAttempts": 2,
  "blockAfterMaxAttempts": true,
  "blockDuration": 1440,
  "questions": [
    {
      "text": "Hook nào được sử dụng để tạo side effects?",
      "type": "SINGLE_CHOICE",
      "points": 2.0,
      "answers": [
        { "text": "useState", "isCorrect": false },
        { "text": "useEffect", "isCorrect": true },
        { "text": "useMemo", "isCorrect": false }
      ]
    },
    {
      "text": "Những tính năng nào có trong React 18?",
      "type": "MULTIPLE_CHOICE",
      "points": 3.0,
      "answers": [
        { "text": "Concurrent Features", "isCorrect": true, "points": 1.0 },
        { "text": "Automatic Batching", "isCorrect": true, "points": 1.0 },
        { "text": "Suspense for SSR", "isCorrect": true, "points": 1.0 },
        { "text": "Class Components", "isCorrect": false }
      ]
    },
    {
      "text": "Giải thích Concurrent Mode trong React",
      "type": "ESSAY",
      "points": 5.0,
      "answers": [
        {
          "text": "Concurrent Mode cho phép React làm gián đoạn rendering để ưu tiên các task quan trọng hơn...",
          "isCorrect": true,
          "acceptedAnswers": [
            "concurrent",
            "rendering",
            "priority",
            "interruption"
          ],
          "caseSensitive": false,
          "exactMatch": false
        }
      ]
    }
  ]
}
```

### Response Format

```json
{
  "id": "lesson-uuid",
  "title": "Quiz React Hooks Cơ bản",
  "type": "QUIZ",
  "timeLimit": 30,
  "maxAttempts": 3,
  "chapter": {
    "id": "chapter-uuid",
    "title": "Chapter Title"
  },
  "questions": [
    {
      "id": "question-uuid",
      "text": "useState trả về gì?",
      "type": "SINGLE_CHOICE",
      "points": 1.0,
      "order": 1,
      "answers": [
        {
          "id": "answer-uuid",
          "text": "Một array với [state, setState]",
          "isCorrect": true,
          "points": 1.0
        }
      ]
    }
  ],
  "unlockRequirements": []
}
```

## Best Practices

### 1. Question Design

- ✅ Viết câu hỏi rõ ràng, không gây nhầm lẫn
- ✅ Đảm bảo answers có độ dài tương đương
- ✅ Tránh sử dụng "Tất cả đáp án trên" trong multiple choice
- ✅ Sắp xếp answers theo thứ tự logic

### 2. Points Distribution

- ✅ Sử dụng điểm số hợp lý (1.0, 2.0, 5.0...)
- ✅ Multiple choice: phân chia points cho từng đáp án đúng
- ✅ Essay questions: điểm cao hơn do phức tạp hơn

### 3. Quiz Settings

- ✅ Đặt timeLimit phù hợp với số câu hỏi
- ✅ maxAttempts từ 2-3 lần cho quiz quan trọng
- ✅ Sử dụng blocking cho quiz cuối khóa
- ✅ retryDelay để tránh spam

### 4. Error Handling

- ✅ Luôn kiểm tra validation trước khi submit
- ✅ Sử dụng transaction để đảm bảo consistency
- ✅ Rollback nếu có bất kỳ lỗi nào

## Troubleshooting

### Common Errors

#### 1. "Quiz lesson phải có ít nhất 1 câu hỏi"

```json
// ❌ Sai
{
  "type": "QUIZ",
  "questions": []
}

// ✅ Đúng
{
  "type": "QUIZ",
  "questions": [
    { "text": "...", "type": "SINGLE_CHOICE", "answers": [...] }
  ]
}
```

#### 2. "Câu hỏi trắc nghiệm phải có đúng 1 đáp án đúng"

```json
// ❌ Sai - 2 đáp án đúng cho SINGLE_CHOICE
{
  "type": "SINGLE_CHOICE",
  "answers": [
    { "text": "A", "isCorrect": true },
    { "text": "B", "isCorrect": true }
  ]
}

// ✅ Đúng
{
  "type": "SINGLE_CHOICE",
  "answers": [
    { "text": "A", "isCorrect": true },
    { "text": "B", "isCorrect": false }
  ]
}
```

#### 3. "Câu hỏi trắc nghiệm phải có ít nhất 2 đáp án"

```json
// ❌ Sai
{
  "type": "SINGLE_CHOICE",
  "answers": [
    { "text": "Only one answer", "isCorrect": true }
  ]
}

// ✅ Đúng
{
  "type": "SINGLE_CHOICE",
  "answers": [
    { "text": "Answer A", "isCorrect": true },
    { "text": "Answer B", "isCorrect": false }
  ]
}
```

### Performance Tips

1. **Bulk Creation**: Tạo nhiều questions trong một request thay vì nhiều requests riêng lẻ
2. **Transaction Safety**: Tất cả operations được wrap trong transaction
3. **Validation Early**: Validate tất cả data trước khi tạo lesson
4. **Auto-ordering**: Hệ thống tự động sắp xếp order nếu không cung cấp

### Testing Checklist

- [ ] Tạo quiz với từng loại question riêng biệt
- [ ] Tạo quiz với mix nhiều loại questions
- [ ] Test validation cho từng rule
- [ ] Test với maxAttempts và timeLimit
- [ ] Test blocking settings
- [ ] Test permission (INSTRUCTOR/ADMIN only)
- [ ] Test rollback khi có lỗi

---

## Kết luận

Tính năng Quiz Lesson Creation cho phép instructor tạo quiz hoàn chỉnh trong một request duy nhất, đảm bảo consistency và user experience tốt hơn. Hệ thống validation mạnh mẽ giúp đảm bảo chất lượng câu hỏi và tránh lỗi runtime.

Để biết thêm chi tiết, tham khao:

- [Email Notification System](./EMAIL_NOTIFICATION_SYSTEM.md)
- [Price Approval Summary](./PRICE_APPROVAL_SUMMARY.md)
- [Swagger API Documentation](./SWAGGER_GUIDE.md)
