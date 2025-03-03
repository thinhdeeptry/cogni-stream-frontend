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
  content: ContentItem;
  order: number;
  isCorrect: boolean;
}

export interface ReferenceAnswer {
  content: ContentItem;
  notes?: string;
}

export interface Question {
  type: QuestionType;
  content: ContentItem;
  explanation?: string;
  questionSetterId?: string;
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
  difficulty?: QuestionDifficulty;
  options?: AnswerOption[];
  referenceAnswer?: ReferenceAnswer;
}
