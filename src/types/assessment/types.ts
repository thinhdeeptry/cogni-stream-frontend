export enum QuestionType {
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  SHORT_ANSWER = "SHORT_ANSWER",
  ESSAY = "ESSAY",
  FILL_IN_BLANK = "FILL_IN_BLANK",
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
}

// Interfaces mới theo API documentation
export interface Answer {
  id?: string;
  text: string;
  isCorrect: boolean;
  questionId?: string;
  // Thêm properties cho auto-grading
  acceptedAnswers?: string[];
  caseSensitive?: boolean;
  exactMatch?: boolean;
  points?: number;
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
  text: string;
  type: QuestionType;
  order?: number;
  lessonId?: string;
  answers: Answer[];
  lession?: QuestionLesson; // Note: API uses "lession" not "lesson"
  // Thêm properties mới
  content?: QuestionContent;
  options?: any[]; // Legacy support
  referenceAnswer?: {
    content?: QuestionContent;
    notes?: string;
  };
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
  answers?: Answer[];
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
