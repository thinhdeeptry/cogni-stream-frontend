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
  thumbnailUrl?: string;
  tags: string[];
  isHasCertificate: boolean;
  chapters?: Chapter[];
  createdAt: Date;
  updatedAt: Date;
  totalLessons: number;
  learningOutcomes: string[];
  requirements: string[];
  targetAudience?: string;
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
  classroomId: string;
  topic: string;
  scheduledAt: string; // ISO date string
  durationMinutes: number;
  status?: string;
  meetingLink?: string;
  recordingUrl?: string;
}

// Interface cho Class (Lớp học) - chỉ dành cho LIVE courses
export interface Class {
  id: string;
  courseId: string;
  course?: Course;
  name: string; // Tên lớp (VD: Lớp K1, Lớp buổi tối)
  description?: string;
  instructorId: string;
  maxStudents: number;
  currentStudents: number;
  startDate: string; // Ngày bắt đầu lớp
  endDate?: string; // Ngày kết thúc lớp (có thể không có)
  meetingUrl?: string; // Link Google Meet/Zoom
  scheduleType: "WEEKLY" | "DAILY" | "CUSTOM"; // Loại lịch học
  weeklySchedule?: WeeklySchedule[]; // Lịch học hàng tuần
  customSchedule?: CustomSchedule[]; // Lịch học tùy chỉnh
  timezone: string; // Múi giờ
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
}

// Lịch học hàng tuần
export interface WeeklySchedule {
  dayOfWeek: number; // 0 = Chủ nhật, 1 = Thứ 2, ...
  startTime: string; // HH:mm format
  durationMinutes: number;
}

// Lịch học tùy chỉnh
export interface CustomSchedule {
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  durationMinutes: number;
  topic?: string;
}

// Form data cho tạo Class
export interface CreateClassFormData {
  courseId: string;
  name: string;
  description?: string;
  maxStudents: number;
  startDate: string;
  endDate?: string;
  meetingUrl?: string;
  scheduleType: "WEEKLY" | "DAILY" | "CUSTOM";
  weeklySchedule?: WeeklySchedule[];
  customSchedule?: CustomSchedule[];
  timezone: string;
}
