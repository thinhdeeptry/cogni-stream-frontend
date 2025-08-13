// Enums
export enum CourseLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

export enum LessonType {
  VIDEO = "VIDEO",
  BLOG = "BLOG",
  MIXED = "MIXED",
}

// Interfaces
export interface Category {
  id: string;
  name: string;
  description?: string;
  courses?: Course[];
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  isPublished: boolean;
  category?: Category;
  level?: CourseLevel;
  ownerId: string;
  price: number;
  currency: string;
  thumbnailUrl?: string;
  tags: string[];
  promotionPrice?: number;
  isHasCertificate: boolean;
  chapters?: Chapter[];
  createdAt: Date;
  updatedAt: Date;
  totalLessons: number;
  learningOutcomes: string[];
  requirements: string[];
  targetAudience?: string;
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  courseId: string;
  isPublished: boolean;
  course?: Course;
  lessons?: Lesson[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  title: string;
  content?: string;
  type: LessonType;
  videoUrl?: string;
  order: number;
  chapterId: string;
  isPublished: boolean;
  isFreePreview: boolean;
  chapter?: Chapter;
  createdAt: Date;
  updatedAt: Date;
}
export interface CourseWithUser {
  id: string;
  title: string;
  thumbnailUrl?: string;
  price: number;
  promotionPrice?: number;
  currency?: string;
  totalLessons: number;
  enrollmentCount?: number;
  ownerAvatarUrl?: string;
}

export interface ClassSession {
  id: string;
  classroomId: string;
  topic: string;
  scheduledAt: string; // ISO date string
  durationMinutes: number;
  status?: string;
}
