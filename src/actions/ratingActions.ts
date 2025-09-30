import { AxiosFactory } from "@/lib/axios";
import {
  CreateRatingRequest,
  PaginatedRatings,
  Rating,
  RatingApiResponse,
  RatingInfoApiResponse,
  RatingStats,
  UpdateRatingRequest,
} from "@/types/rating/types";

// Get rating API instance (use courses service for now)
const ratingApi = await AxiosFactory.getApiInstance("courses");

// ============================================
// RATING ACTIONS
// ============================================

/**
 * Create a new rating for a course
 */
export const createRating = async (
  ratingData: CreateRatingRequest,
): Promise<RatingApiResponse> => {
  try {
    const { data } = await ratingApi.post("/ratings", ratingData);
    return {
      success: true,
      data,
      message: "Đánh giá khóa học thành công",
    };
  } catch (error: any) {
    console.error("Error creating rating:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể đánh giá khóa học",
      error,
    };
  }
};

/**
 * Update an existing rating
 */
export const updateRating = async (
  ratingId: string,
  ratingData: UpdateRatingRequest,
): Promise<RatingApiResponse> => {
  try {
    const { data } = await ratingApi.patch(`/ratings/${ratingId}`, ratingData);
    return {
      success: true,
      data,
      message: "Cập nhật đánh giá thành công",
    };
  } catch (error: any) {
    console.error("Error updating rating:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể cập nhật đánh giá",
      error,
    };
  }
};

/**
 * Delete a rating
 */
export const deleteRating = async (ratingId: string) => {
  try {
    const { data } = await ratingApi.delete(`/ratings/${ratingId}`);
    return {
      success: true,
      data,
      message: "Xóa đánh giá thành công",
    };
  } catch (error: any) {
    console.error("Error deleting rating:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể xóa đánh giá",
      error,
    };
  }
};

/**
 * Get all ratings for a course with pagination
 */
export const getCourseRatings = async (
  courseId: string,
  page: number = 1,
  limit: number = 10,
): Promise<PaginatedRatings> => {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    const { data } = await ratingApi.get(
      `/ratings/course/${courseId}?${params.toString()}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching course ratings:", error);
    throw error;
  }
};

/**
 * Get rating statistics for a course
 */
export const getCourseRatingStats = async (
  courseId: string,
): Promise<RatingStats> => {
  try {
    const { data } = await ratingApi.get(`/ratings/course/${courseId}/stats`);
    return data;
  } catch (error) {
    console.error("Error fetching course rating stats:", error);
    throw error;
  }
};

/**
 * Get current user's rating for a course
 */
export const getUserRatingForCourse = async (
  courseId: string,
  classId?: string,
): Promise<Rating | null> => {
  try {
    const params = new URLSearchParams();
    if (classId) {
      params.append("classId", classId);
    }

    const queryString = params.toString();
    const url = `/ratings/my-rating/${courseId}${queryString ? `?${queryString}` : ""}`;

    const { data } = await ratingApi.get(url);
    return data;
  } catch (error: any) {
    // If 404, user hasn't rated yet
    if (error.response?.status === 404) {
      return null;
    }
    console.error("Error fetching user rating:", error);
    throw error;
  }
};

/**
 * Check if user can rate a course (is enrolled)
 */
export const canUserRateCourse = async (
  courseId: string,
  classId?: string,
): Promise<boolean> => {
  try {
    // This uses existing enrollment check endpoint
    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");

    const params = new URLSearchParams();
    if (classId) {
      params.append("classId", classId);
      params.append("type", "STREAM");
    } else {
      params.append("type", "ONLINE");
    }

    const queryString = params.toString();
    const url = `/enrollments/check/${courseId}${queryString ? `?${queryString}` : ""}`;

    const { data } = await enrollmentApi.get(url);
    return data?.isEnrolled === true;
  } catch (error) {
    console.error("Error checking enrollment status:", error);
    return false;
  }
};

/**
 * Get comprehensive rating info for a course (stats + user's rating)
 */
export const getCourseRatingInfo = async (
  courseId: string,
  classId?: string,
): Promise<RatingInfoApiResponse> => {
  try {
    const [stats, userRating, canRate] = await Promise.all([
      getCourseRatingStats(courseId),
      getUserRatingForCourse(courseId, classId),
      canUserRateCourse(courseId, classId),
    ]);

    return {
      success: true,
      data: {
        stats,
        userRating,
        canRate,
      },
    };
  } catch (error: any) {
    console.error("Error fetching course rating info:", error);
    return {
      success: false,
      message: "Không thể lấy thông tin đánh giá khóa học",
      error,
    };
  }
};
