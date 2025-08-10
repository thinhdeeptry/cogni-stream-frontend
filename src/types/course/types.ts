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
