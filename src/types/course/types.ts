// Enums
export enum CourseLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

export enum CourseType {
  SELF_PACED = "SELF_PACED", // Khóa học tự học
  LIVE = "LIVE", // Lớp học trực tuyến
}

export enum LessonType {
  VIDEO = "VIDEO",
  BLOG = "BLOG",
  MIXED = "MIXED",
  QUIZ = "QUIZ",
}

// Enums mới cho hệ thống pricing
export enum PricingType {
  BASE_PRICE = "BASE_PRICE",
  PROMOTION = "PROMOTION",
}

export enum PricingStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SCHEDULED = "SCHEDULED",
  EXPIRED = "EXPIRED",
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
  courseType: CourseType; // Thêm loại khóa học
  instructorId: string; // Thay đổi từ ownerId sang instructorId
  instructor?: {
    headline?: string;
    bio?: string;
    specialization?: string;
    avgRating?: number;
    totalRatings?: number;
    status?: string;
    user?: {
      image?: string;
    };
  };
  thumbnailUrl?: string;
  tags: string[];
  isHasCertificate: boolean;
  chapters?: Chapter[];
  classes?: Class[]; // Thêm danh sách các lớp học cho LIVE courses
  createdAt: Date;
  updatedAt: Date;
  totalLessons: number;
  learningOutcomes: string[];
  requirements: string[];
  targetAudience?: string;
  avgRating?: number;
  totalRatings?: number;
  totalStudents?: number;
  // Loại bỏ price, currency, promotionPrice - sẽ được lấy từ API riêng
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
  passPercent?: number; // Điểm đậu cho QUIZ (default: 80%)
  chapter?: Chapter;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces mới cho hệ thống pricing
export interface PricingHeader {
  id: string;
  name: string;
  description?: string;
  type: PricingType;
  status: PricingStatus;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  details?: PricingDetail[];
}

export interface PricingDetail {
  id: string;
  price: number;
  headerId: string;
  courseId?: string;
  categoryId?: string;
  createdAt: Date;
  header?: PricingHeader;
  course?: Course;
  category?: Category;
}

export interface CoursePrice {
  currentPrice: number | null;
  priceType: "promotion" | "base" | "none";
  promotionName?: string;
  promotionEndDate?: string;
  hasPromotion: boolean;
  allPricings?: PricingHeader[]; // Thêm danh sách tất cả pricing policies
}

export interface CourseWithUser {
  id: string;
  title: string;
  thumbnailUrl?: string;
  totalLessons: number;
  enrollmentCount?: number;
  ownerAvatarUrl?: string;
  // Thông tin giá sẽ được lấy từ API riêng
  pricing?: CoursePrice;
}

// Interface cho pricing policy chi tiết
export interface PricingPolicy {
  id: string;
  price: number;
  type: "BASE_PRICE" | "PROMOTION";
  name: string;
  description?: string;
  status: PricingStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// Interface cho response của course pricing policies
export interface CoursePricingPolicies {
  courseId: string;
  courseTitle: string;
  prices: PricingPolicy[];
}

export interface ClassSession {
  id: string;
  topic: string;
  scheduledAt: string; // ISO date string
  durationMinutes: number;
  status?: string;
  meetingLink?: string;
  recordingUrl?: string;
  lesson?: {
    id: string;
    title: string;
    type: LessonType;
    order: number;
    isFreePreview: boolean;
    chapter: {
      id: string;
      title: string;
      order: number;
    };
  } | null;
  dayOfWeek: string;
  date: string;
  time: string;
}

// Interface cho response từ API /classes/:classId/sessions
export interface ClassSessionsResponse {
  class: {
    id: string;
    name: string;
    description: string | null;
    status: "UPCOMING" | "IN_PROGRESS" | "FINISHED" | "CANCELED";
    startDate: string;
    endDate: string;
    platform: string;
    isPublished: boolean;
    schedules: any;
    course: {
      id: string;
      title: string;
      description: string | null;
      level: CourseLevel;
      thumbnailUrl: string | null;
    };
    instructor: {
      name: string;
      image: string | null;
      headline: string | null;
      bio: string | null;
      avgRating: number;
      totalRatings: number;
    };
    enrollment: {
      currentStudents: number;
      maxStudents: number | null;
      availableSlots: number | null;
      isFullyBooked: boolean;
    };
  };
  sessions: {
    upcoming: ClassSession[];
    past: ClassSession[];
  };
  summary: {
    totalSessions: number;
    upcomingSessionsCount: number;
    pastSessionsCount: number;
    estimatedDurationHours: number;
    nextSession: {
      topic: string;
      scheduledAt: string;
      dayOfWeek: string;
      date: string;
      time: string;
    } | null;
  };
}

// Interface cho Class (Lớp học) - chỉ dành cho LIVE courses
export interface Class {
  id: string;
  courseId: string;
  course?: Course;
  name: string; // Tên lớp (VD: Lớp K1, Lớp buổi tối)
  description?: string;
  instructorId?: string;
  maxStudents: number;
  currentStudents: number;
  startDate: string; // Ngày bắt đầu lớp
  endDate?: string; // Ngày kết thúc lớp (có thể không có)
  schedules?: Schedule[]; // Lịch học đơn giản theo API response
  isPublished: boolean; // Trạng thái mở/đóng đăng ký
  status?: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface cho Schedule theo API response
export interface Schedule {
  days: string[]; // ["monday", "wednesday", "friday"]
  name: string; // "Lịch học chính"
  startDate: string; // "2025-09-01"
  endDate: string; // "2025-11-30"
  startTime: string; // "19:00"
  endTime?: string; // "21:00" - có thể không có
}

// Form data cho tạo Class
export interface CreateClassFormData {
  courseId: string;
  name: string;
  description?: string;
  maxStudents: number;
  startDate: string;
  endDate?: string;
  schedules?: Schedule[];
}

// Enums cho Syllabus
export enum SyllabusItemType {
  LESSON = "LESSON",
  LIVE_SESSION = "LIVE_SESSION",
}

// Interface cho Syllabus Item
export interface SyllabusItem {
  id: string;
  day: number;
  order: number;
  itemType: SyllabusItemType;
  classId: string;
  lessonId?: string;
  classSessionId?: string;
  lesson?: {
    id: string;
    title: string;
    type: LessonType;
    estimatedDurationMinutes: number;
    isFreePreview: boolean;
    isPublished: boolean;
  } | null;
  classSession?: {
    id: string;
    topic: string;
    scheduledAt: string;
    durationMinutes: number;
    meetingDetail?: string;
  } | null;
  class?: {
    id: string;
    name: string;
  };
}

// Interface cho request tạo Syllabus Item
export interface CreateSyllabusItemRequest {
  day: number;
  order: number;
  itemType: SyllabusItemType;
  lessonId?: string;
  classSessionId?: string;
  classId: string;
}

// Interface cho update Syllabus Item
export interface UpdateSyllabusItemRequest {
  day?: number;
  order?: number;
  itemType?: SyllabusItemType;
  lessonId?: string;
  classSessionId?: string;
}

// Interfaces mới cho question management
export interface CourseStructureResponse {
  id: string;
  title: string;
  description?: string;
  courseType: "SELF_PACED" | "LIVE"; // Quan trọng để phân biệt
  instructorId: string;
  isPublished: boolean;
  thumbnailUrl?: string;

  // Thông tin thống kê quan trọng cho questions/quiz
  stats: {
    totalChapters: number;
    totalLessons: number;
    totalQuestions: number; // Tổng số câu hỏi trong course
    totalQuizzes: number; // Tổng số quiz/test trong course
    totalClasses?: number; // Chỉ cho LIVE courses
  };

  chapters: ChapterStructure[];
  classes?: ClassStructure[]; // Chỉ cho LIVE courses
}

export interface ChapterStructure {
  id: string;
  title: string;
  description?: string;
  order: number;
  isPublished: boolean;

  // Thông tin quan trọng cho question management
  stats: {
    totalLessons: number;
    totalQuestions: number; // Tổng câu hỏi trong chapter này
    questionsByType: {
      // Phân loại câu hỏi theo type
      SINGLE_CHOICE: number;
      MULTIPLE_CHOICE: number;
      SHORT_ANSWER: number;
      ESSAY: number;
      FILL_IN_BLANK: number;
    };
    totalQuizzes: number;
  };

  lessons: LessonStructure[];
}

export interface LessonStructure {
  id: string;
  title: string;
  type: "VIDEO" | "BLOG" | "MIXED" | "QUIZ";
  order: number;
  isPublished: boolean;
  isFreePreview: boolean;
  estimatedDurationMinutes?: number;

  // Thông tin câu hỏi - quan trọng nhất
  questionStats: {
    totalQuestions: number;
    questionsByType: {
      SINGLE_CHOICE: number;
      MULTIPLE_CHOICE: number;
      SHORT_ANSWER: number;
      ESSAY: number;
      FILL_IN_BLANK: number;
    };
    hasQuestions: boolean; // Quick check
  };

  // Thông tin quiz/test
  quizStats: {
    totalQuizzes: number;
    activeQuizzes: number;
    quizTypes: string[]; // ["PRACTICE", "QUIZ", "FINAL"]
    hasActiveQuiz: boolean;
  };
}

export interface ClassStructure {
  id: string;
  name: string;
  description?: string;
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate?: string;
  maxStudents: number;
  currentStudents: number;

  // Thông tin quan trọng cho question management
  stats: {
    totalSessions: number;
    totalLessons: number; // Lessons được assign vào class
    totalQuestions: number; // Tổng câu hỏi trong class
    questionsByType: {
      SINGLE_CHOICE: number;
      MULTIPLE_CHOICE: number;
      SHORT_ANSWER: number;
      ESSAY: number;
      FILL_IN_BLANK: number;
    };
    totalQuizzes: number;
  };

  // Syllabus items summary
  syllabusStats: {
    totalItems: number;
    lessonItems: number;
    sessionItems: number;
    daysCovered: number;
  };
}
