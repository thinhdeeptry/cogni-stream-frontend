// Rating related types

export interface Rating {
  id: string;
  stars: number;
  content?: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  courseId: string;
  enrollmentId: string;
}

export interface RatingStats {
  avgRating: number;
  totalRatings: number;
  ratingDistribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
}

export interface CreateRatingRequest {
  stars: number;
  content?: string;
  courseId: string;
  classId?: string;
}

export interface UpdateRatingRequest {
  stars?: number;
  content?: string;
}

export interface PaginatedRatings {
  ratings: Rating[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RatingFormData {
  stars: number;
  content: string;
}

// Rating component props
export interface RatingDisplayProps {
  rating: number;
  totalRatings: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export interface RatingInputProps {
  value?: number;
  onChange?: (rating: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  classId?: string;
  existingRating?: Rating;
  onSuccess?: () => void;
}

export interface RatingListProps {
  courseId: string;
  limit?: number;
  showPagination?: boolean;
}

export interface RatingStatsProps {
  stats: RatingStats;
  className?: string;
}

// API Response types
export interface RatingApiResponse {
  success: boolean;
  data?: Rating;
  message: string;
  error?: any;
}

export interface RatingStatsApiResponse {
  success: boolean;
  data?: RatingStats;
  message?: string;
  error?: any;
}

export interface RatingInfoApiResponse {
  success: boolean;
  data?: {
    stats: RatingStats;
    userRating: Rating | null;
    canRate: boolean;
  };
  message?: string;
  error?: any;
}
