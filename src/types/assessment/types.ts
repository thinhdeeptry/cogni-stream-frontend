export enum QuestionType {
  SINGLE_CHOICE = "SINGLE_CHOICE", // Chọn 1 đáp án
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE", // Chọn nhiều đáp án
  SHORT_ANSWER = "SHORT_ANSWER", // Câu trả lời ngắn
  ESSAY = "ESSAY", // Tự luận dài
  FILL_IN_BLANK = "FILL_IN_BLANK", // Điền từ vào chỗ trống
  // Giữ lại legacy types để tương thích ngược
  TRUE_FALSE = "TRUE_FALSE",
}

export enum QuestionDifficulty {
  REMEMBERING = "REMEMBERING",
  UNDERSTANDING = "UNDERSTANDING",
  APPLYING = "APPLYING",
  ANALYZING = "ANALYZING",
  EVALUATING = "EVALUATING",
  CREATING = "CREATING",
}

export enum TestType {
  PRACTICE = "PRACTICE",
  QUIZ = "QUIZ",
  FINAL = "FINAL",
  ASSIGNMENT = "ASSIGNMENT",
}

export enum ScoringPolicy {
  HIGHEST = "HIGHEST",
  AVERAGE = "AVERAGE",
  LATEST = "LATEST",
}

export interface Course {
  id: string;
  name: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  name: string;
  title: string;
  type: "VIDEO" | "BLOG" | "MIXED" | "QUIZ";
  content?: string;
  description?: string; // Hướng dẫn làm bài quiz
  passPercent?: number; // Điểm đậu (default: 80%)

  // Relations
  questions?: Question[]; // Câu hỏi trong quiz
  quizAttempts?: QuizAttempt[]; // Lịch sử làm bài
}

// Interfaces mới theo API documentation
export interface Answer {
  id?: string;
  text: string; // Đáp án hiển thị (cho trắc nghiệm)
  isCorrect: boolean; // Đáp án đúng/sai
  questionId?: string;

  // Auto-grading fields cho tự luận
  acceptedAnswers?: string[]; // Các đáp án được chấp nhận ["useState", "use state"]
  caseSensitive?: boolean; // Phân biệt hoa/thường
  exactMatch?: boolean; // So sánh chính xác hay fuzzy
  points?: number; // Điểm số (1.0 = 100%)
}

export interface QuestionContent {
  text: string;
}

export interface QuestionLesson {
  id: string;
  title: string;
  type: string;
  chapter?: {
    id: string;
    title: string;
    course?: {
      id: string;
      title: string;
      instructorId?: string;
    };
  };
}

export interface Question {
  id?: string;
  text: string; // Nội dung câu hỏi
  type: QuestionType;
  order?: number; // Thứ tự hiển thị
  lessonId?: string; // Thuộc lesson nào
  answers: Answer[]; // Các đáp án (cho trắc nghiệm)
  lesson?: QuestionLesson;

  // Legacy support
  content?: QuestionContent;
  options?: any[];
  referenceAnswer?: {
    content?: QuestionContent;
    notes?: string;
  };

  // Relations
  attemptAnswers?: AttemptAnswer[]; // Câu trả lời của học viên
}

export interface QuestionResponse {
  data: Question[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPermissionToSeeAnswers: boolean;
  };
}

export interface CreateQuestionDto {
  text: string;
  type: QuestionType;
  lessonId: string;
  answers: Omit<Answer, "id" | "questionId">[];
  order?: number;
}

export interface UpdateQuestionDto {
  text?: string;
  type?: QuestionType;
  answers?: Omit<Answer, "questionId">[];
  order?: number;
}

export interface CreateAnswerDto {
  text: string;
  isCorrect: boolean;
}

export interface UpdateAnswerDto {
  text?: string;
  isCorrect?: boolean;
}

export interface BulkCreateQuestionsDto {
  lessonId: string;
  questions: {
    text: string;
    type: QuestionType;
    answers: Omit<Answer, "id" | "questionId">[];
  }[];
}

export interface BulkDeleteQuestionsDto {
  questionIds: string[];
}

export interface DuplicateQuestionDto {
  targetLessonId?: string;
}

export interface ReorderQuestionsDto {
  questionOrders: {
    id: string;
    order: number;
  }[];
}

// Quiz System Interfaces
export interface QuizAttempt {
  id: string;
  startedAt: Date;
  submittedAt?: Date;
  score?: number;
  isPassed?: boolean;
  lessonId: string;
  enrollmentId: string;
  answers: AttemptAnswer[];
}

export interface AttemptAnswer {
  id: string;
  questionId: string;
  attemptId: string;

  // Cho trắc nghiệm
  selectedAnswerIds?: string[];

  // Cho tự luận
  textAnswer?: string;

  // Scoring
  isCorrect?: boolean;
  score?: number;
  feedback?: string;
}

export interface SubmitAnswer {
  questionId: string;
  selectedAnswerIds?: string[]; // Multiple choice
  textAnswer?: string; // Short answer / Essay
}

export interface QuizResult {
  score: number;
  isPassed: boolean;
  feedback?: string;
  correctCount: number;
  totalQuestions: number;
}

export interface QuestionFilter {
  lessonId?: string;
  chapterId?: string;
  courseId?: string;
  type?: QuestionType;
  page?: number;
  limit?: number;
}

export interface CreateTestQuestionDto {
  questionId: string;
  maxScore: number;
}

export interface CreateTestDto {
  title: string;
  description?: string;
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
  duration?: number;
  maxScore?: number;
  testType: TestType;
  shuffleQuestions: boolean;
  maxAttempts?: number;
  cooldownPeriod?: number;
  scoringPolicy: ScoringPolicy;
  testQuestions?: CreateTestQuestionDto[];
  questionOrder?: string[];
  allowReview: boolean;
  testStart: Date;
  testEnd?: Date;
  enforceTimeLimit: boolean;
  unlimitedAttempts: boolean;
}
