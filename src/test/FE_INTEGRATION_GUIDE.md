# Hướng dẫn tích hợp Front-end cho Hệ thống Câu hỏi và Auto-Grading

## 📋 Tổng quan hệ thống

Hệ thống hỗ trợ 5 loại câu hỏi với auto-grading thông minh:

- **SINGLE_CHOICE**: Trắc nghiệm 1 đáp án
- **MULTIPLE_CHOICE**: Trắc nghiệm nhiều đáp án
- **SHORT_ANSWER**: Câu trả lời ngắn (1-2 từ)
- **ESSAY**: Câu trả lời dài (đoạn văn)
- **FILL_IN_BLANK**: Điền vào chỗ trống

## 🎯 Loại câu hỏi và cách xử lý

### 1. Câu hỏi trắc nghiệm (SINGLE_CHOICE, MULTIPLE_CHOICE)

**Dữ liệu từ API:**

```typescript
interface MultipleChoiceQuestion {
  id: string;
  text: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  answers: {
    id: string;
    text: string;
    isCorrect: boolean; // Ẩn khỏi FE
  }[];
}
```

**Cách hiển thị:**

```jsx
// Single Choice - Radio buttons
<div className="question-single">
  <h3>{question.text}</h3>
  {question.answers.map(answer => (
    <label key={answer.id}>
      <input
        type="radio"
        name={`question-${question.id}`}
        value={answer.id}
        onChange={(e) => setSelectedAnswer(e.target.value)}
      />
      {answer.text}
    </label>
  ))}
</div>

// Multiple Choice - Checkboxes
<div className="question-multiple">
  <h3>{question.text}</h3>
  {question.answers.map(answer => (
    <label key={answer.id}>
      <input
        type="checkbox"
        value={answer.id}
        onChange={(e) => handleMultipleChoice(e)}
      />
      {answer.text}
    </label>
  ))}
</div>
```

**Dữ liệu gửi lên:**

```typescript
// Single choice
{
  questionId: "question-id",
  selectedAnswerIds: ["answer-id"]
}

// Multiple choice
{
  questionId: "question-id",
  selectedAnswerIds: ["answer-id-1", "answer-id-2"]
}
```

### 2. Câu hỏi tự luận (SHORT_ANSWER, ESSAY, FILL_IN_BLANK)

**Dữ liệu từ API:**

```typescript
interface TextQuestion {
  id: string;
  text: string;
  type: "SHORT_ANSWER" | "ESSAY" | "FILL_IN_BLANK";
  answers: [
    {
      id: string;
      text: string; // Đây là mẫu đáp án (ẩn khỏi FE)
      acceptedAnswers: string[]; // Ẩn khỏi FE
      caseSensitive: boolean; // Ẩn khỏi FE
      exactMatch: boolean; // Ẩn khỏi FE
      points: number; // Ẩn khỏi FE
    },
  ];
}
```

**Cách hiển thị:**

```jsx
// Short Answer
<div className="question-short">
  <h3>{question.text}</h3>
  <input
    type="text"
    placeholder="Nhập câu trả lời ngắn gọn..."
    value={textAnswer}
    onChange={(e) => setTextAnswer(e.target.value)}
    maxLength={100}
  />
  <small>Tối đa 100 ký tự</small>
</div>

// Essay
<div className="question-essay">
  <h3>{question.text}</h3>
  <textarea
    rows={6}
    placeholder="Viết câu trả lời chi tiết..."
    value={textAnswer}
    onChange={(e) => setTextAnswer(e.target.value)}
    maxLength={2000}
  />
  <small>Tối đa 2000 ký tự</small>
</div>

// Fill in the blank
<div className="question-fill-blank">
  <h3>{question.text}</h3>
  <input
    type="text"
    placeholder="Điền vào chỗ trống..."
    value={textAnswer}
    onChange={(e) => setTextAnswer(e.target.value)}
    maxLength={50}
  />
  <small>Tối đa 50 ký tự</small>
</div>
```

**Dữ liệu gửi lên:**

```typescript
{
  questionId: "question-id",
  textAnswer: "Câu trả lời của học viên"
}
```

## 🔄 API Flow và cách tích hợp

### 1. Lấy danh sách câu hỏi của bài học

```typescript
// GET /questions/lesson/{lessonId}
const getQuestions = async (lessonId: string) => {
  const response = await fetch(`/api/questions/lesson/${lessonId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const questions = await response.json();
  return questions;
};
```

### 2. Bắt đầu làm bài

```typescript
// POST /quizzes/start
const startQuiz = async (lessonId: string) => {
  const response = await fetch("/api/quizzes/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ lessonId }),
  });

  const { id: quizAttemptId } = await response.json();
  return quizAttemptId;
};
```

### 3. Nộp bài làm

```typescript
// POST /quizzes/{attemptId}/submit
const submitQuiz = async (attemptId: string, answers: Answer[]) => {
  const response = await fetch(`/api/quizzes/${attemptId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ answers }),
  });

  const result = await response.json();
  return result;
};

// Format câu trả lời
interface Answer {
  questionId: string;
  selectedAnswerIds?: string[]; // Cho trắc nghiệm
  textAnswer?: string; // Cho tự luận
}
```

## 🎨 UI/UX Recommendations

### 1. Visual indicators cho từng loại câu hỏi

```css
.question-single {
  border-left: 4px solid #3b82f6;
} /* Blue */
.question-multiple {
  border-left: 4px solid #10b981;
} /* Green */
.question-short {
  border-left: 4px solid #f59e0b;
} /* Orange */
.question-essay {
  border-left: 4px solid #8b5cf6;
} /* Purple */
.question-fill-blank {
  border-left: 4px solid #ef4444;
} /* Red */
```

### 2. Icons cho từng loại

```jsx
const QuestionIcon = ({ type }) => {
  const icons = {
    SINGLE_CHOICE: "⚪",
    MULTIPLE_CHOICE: "☑️",
    SHORT_ANSWER: "✏️",
    ESSAY: "📝",
    FILL_IN_BLANK: "📋",
  };
  return <span>{icons[type]}</span>;
};
```

### 3. Progress indicator

```jsx
const QuizProgress = ({ current, total, answered }) => (
  <div className="quiz-progress">
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
    <span>
      Câu {current}/{total} • Đã trả lời: {answered}
    </span>
  </div>
);
```

## 📊 Kết quả Auto-Grading

### 1. Response structure

```typescript
interface QuizResult {
  id: string;
  score: number; // Điểm phần trăm (0-100)
  totalScore: number; // Tổng điểm đạt được
  maxPossibleScore: number; // Tổng điểm tối đa
  totalQuestions: number;
  passed: boolean; // Có pass hay không (>= 60%)
  submittedAt: string;
  timeTaken: number; // Thời gian làm bài (giây)

  // Chi tiết từng câu (optional - có thể ẩn)
  questionResults?: {
    questionId: string;
    isCorrect: boolean;
    pointsEarned: number;
    maxPoints: number;
    gradingDetails?: {
      method: "exact_match" | "fuzzy_match" | "contains" | "no_match";
      similarity?: number; // 0-1 cho fuzzy match
      explanation: string;
    };
  }[];
}
```

### 2. Hiển thị kết quả

```jsx
const QuizResult = ({ result }) => (
  <div className="quiz-result">
    {/* Overall Score */}
    <div className="score-summary">
      <div className={`score-circle ${result.passed ? "passed" : "failed"}`}>
        <span className="score">{Math.round(result.score)}%</span>
        <span className="status">{result.passed ? "ĐẠT" : "CHƯA ĐẠT"}</span>
      </div>

      <div className="score-details">
        <p>
          Điểm: {result.totalScore}/{result.maxPossibleScore}
        </p>
        <p>Thời gian: {formatTime(result.timeTaken)}</p>
        <p>Số câu: {result.totalQuestions}</p>
      </div>
    </div>

    {/* Auto-grading explanation */}
    <div className="grading-info">
      <h4>💡 Cách chấm điểm tự động:</h4>
      <ul>
        <li>
          <strong>Trắc nghiệm:</strong> Đúng 100%, sai 0%
        </li>
        <li>
          <strong>Tự luận chính xác:</strong> 100% điểm
        </li>
        <li>
          <strong>Tự luận gần đúng:</strong> 80% điểm
        </li>
        <li>
          <strong>Tự luận chứa từ khóa:</strong> 50% điểm
        </li>
        <li>
          <strong>Sai hoàn toàn:</strong> 0% điểm
        </li>
      </ul>
    </div>
  </div>
);
```

## ⚡ Best Practices cho FE

### 1. Validation trước khi submit

```typescript
const validateAnswers = (questions: Question[], answers: Answer[]) => {
  const errors: string[] = [];

  questions.forEach((question) => {
    const answer = answers.find((a) => a.questionId === question.id);

    if (!answer) {
      errors.push(`Vui lòng trả lời câu hỏi: ${question.text.slice(0, 50)}...`);
      return;
    }

    // Validate theo loại câu hỏi
    if (["SINGLE_CHOICE", "MULTIPLE_CHOICE"].includes(question.type)) {
      if (!answer.selectedAnswerIds?.length) {
        errors.push(`Vui lòng chọn đáp án cho câu hỏi trắc nghiệm`);
      }
    } else {
      if (!answer.textAnswer?.trim()) {
        errors.push(`Vui lòng nhập câu trả lời cho câu tự luận`);
      }

      // Length validation
      if (question.type === "SHORT_ANSWER" && answer.textAnswer.length > 100) {
        errors.push(`Câu trả lời ngắn không được quá 100 ký tự`);
      }
    }
  });

  return errors;
};
```

### 2. Auto-save draft answers

```typescript
const useDraftAnswers = (quizAttemptId: string) => {
  const [answers, setAnswers] = useState<Answer[]>([]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`quiz-draft-${quizAttemptId}`);
    if (saved) setAnswers(JSON.parse(saved));
  }, [quizAttemptId]);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(
      `quiz-draft-${quizAttemptId}`,
      JSON.stringify(answers),
    );
  }, [answers, quizAttemptId]);

  // Clear after submit
  const clearDraft = () => {
    localStorage.removeItem(`quiz-draft-${quizAttemptId}`);
  };

  return { answers, setAnswers, clearDraft };
};
```

### 3. Error handling

```typescript
const handleQuizSubmit = async () => {
  try {
    setLoading(true);

    // Validate
    const errors = validateAnswers(questions, answers);
    if (errors.length) {
      setValidationErrors(errors);
      return;
    }

    // Submit
    const result = await submitQuiz(quizAttemptId, answers);

    // Success
    clearDraft();
    setResult(result);
  } catch (error) {
    if (error.status === 400) {
      setError("Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.");
    } else if (error.status === 404) {
      setError("Không tìm thấy bài kiểm tra. Vui lòng thử lại.");
    } else if (error.status === 409) {
      setError("Bài kiểm tra đã được nộp rồi.");
    } else {
      setError("Có lỗi xảy ra. Vui lòng thử lại sau.");
    }
  } finally {
    setLoading(false);
  }
};
```

## 🔧 TypeScript Types

```typescript
// Question types
export type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "SHORT_ANSWER"
  | "ESSAY"
  | "FILL_IN_BLANK";

export interface BaseQuestion {
  id: string;
  text: string;
  type: QuestionType;
  lessonId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MultipleChoiceAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TextAnswer {
  id: string;
  text: string;
  acceptedAnswers: string[];
  caseSensitive: boolean;
  exactMatch: boolean;
  points: number;
}

export interface Question extends BaseQuestion {
  answers: MultipleChoiceAnswer[] | TextAnswer[];
}

// Answer submission
export interface AnswerSubmission {
  questionId: string;
  selectedAnswerIds?: string[];
  textAnswer?: string;
}

// Quiz result
export interface QuizResult {
  id: string;
  score: number;
  totalScore: number;
  maxPossibleScore: number;
  totalQuestions: number;
  passed: boolean;
  submittedAt: string;
  timeTaken: number;
}
```

## 🎯 Auto-Grading Logic Chi tiết

### 1. SHORT_ANSWER (Exact Match Priority)

- **100% điểm**: Khớp chính xác với acceptedAnswers
- **0% điểm**: Không khớp

### 2. ESSAY & FILL_IN_BLANK (Fuzzy Match)

- **100% điểm**: Khớp chính xác (exactMatch = true)
- **80% điểm**: Độ tương tự >= 80% (Levenshtein distance)
- **50% điểm**: Chứa từ khóa quan trọng
- **0% điểm**: Không khớp gì

### 3. Algorithm Details

```typescript
// Fuzzy matching algorithm
const calculateSimilarity = (answer: string, target: string) => {
  const distance = levenshteinDistance(
    answer.toLowerCase(),
    target.toLowerCase(),
  );
  const maxLength = Math.max(answer.length, target.length);
  return 1 - distance / maxLength;
};

// Scoring logic
const getScoreMultiplier = (similarity: number, method: string) => {
  if (method === "exact_match") return 1.0;
  if (method === "fuzzy_match" && similarity >= 0.8) return 0.8;
  if (method === "contains") return 0.5;
  return 0;
};
```

Hệ thống auto-grading này giúp giảm tải cho giảng viên trong việc chấm bài tự luận, đồng thời đảm bảo tính công bằng và nhất quán trong việc đánh giá.
