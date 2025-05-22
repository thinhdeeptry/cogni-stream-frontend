export enum QuestionType {
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
  ESSAY = "ESSAY",
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

export interface ContentItem {
  text: string;
  image?: string;
  audio?: string;
}

export interface AnswerOption {
  id?: string;
  content: ContentItem;
  order?: number;
  isCorrect: boolean;
}

export interface ReferenceAnswer {
  content: ContentItem;
  notes?: string;
}

export interface Question {
  id?: string;
  type: QuestionType;
  content: ContentItem;
  explanation?: string;
  questionSetterId?: string;
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
  difficulty: QuestionDifficulty;
  options?: AnswerOption[];
  referenceAnswer?: ReferenceAnswer;
}

export interface QuestionFormValues {
  type: QuestionType;
  content: ContentItem;
  questionSetterId?: string;
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
  difficulty: QuestionDifficulty;
  options?: AnswerOption[];
  referenceAnswer?: ReferenceAnswer;
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
