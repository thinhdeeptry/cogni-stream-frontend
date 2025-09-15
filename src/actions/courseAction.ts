// "use server";
import { AxiosFactory } from "@/lib/axios";
import {
  Category,
  Course,
  CoursePrice,
  Lesson,
  PricingDetail,
  PricingHeader,
} from "@/types/course/types";

const courseApi = await AxiosFactory.getApiInstance("courses");

export interface CourseFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  level?: string;
  createdAt?: Date;
  isPublished?: boolean;
  skipPagination?: boolean; // Option to skip pagination and return all courses
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export const getAllCourses = async (
  filters: CourseFilters = {},
  page: number = 1,
  limit: number = 10,
): Promise<PaginatedResponse<Course>> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();

    // Add pagination parameters if not skipping pagination
    if (!filters.skipPagination) {
      params.append("page", page.toString());
      params.append("limit", limit.toString());
    } else {
      // If skipping pagination, request a large limit to get all courses
      params.append("limit", "1000"); // Use a large number to get all courses
    }

    // Add filter parameters if they exist
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.minPrice !== undefined)
      params.append("minPrice", filters.minPrice.toString());
    if (filters.maxPrice !== undefined)
      params.append("maxPrice", filters.maxPrice.toString());
    if (filters.level) params.append("level", filters.level);
    if (filters.createdAt)
      params.append("createdAt", filters.createdAt.toISOString());

    // Always include isPublished parameter if specified
    if (filters.isPublished !== undefined) {
      params.append("isPublished", filters.isPublished.toString());
    }

    console.log("API Request URL:", `/courses?${params.toString()}`);
    const { data } = await courseApi.get(`/courses?${params.toString()}`);
    console.log("data course: ", data);
    // If the backend doesn't return a paginated response format yet, transform it
    if (Array.isArray(data)) {
      // Filter out unpublished courses if isPublished=true is specified
      let filteredData = data;
      if (filters.isPublished === true) {
        console.log("Filtering for published courses only");
        filteredData = data.filter(
          (course: Course) => course.isPublished === true,
        );
        console.log("Filtered data length:", filteredData.length);
      }

      // If skipPagination is true, return all courses
      if (filters.skipPagination) {
        console.log("Skipping pagination, returning all filtered courses");
        return {
          data: filteredData,
          meta: {
            totalCount: filteredData.length,
            page: 1,
            limit: filteredData.length,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        };
      }

      // Apply manual pagination if needed
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      console.log(
        `Paginating data: page ${page}, limit ${limit}, showing ${paginatedData.length} of ${filteredData.length} courses`,
      );

      return {
        data: paginatedData,
        meta: {
          totalCount: filteredData.length,
          page,
          limit,
          totalPages: Math.ceil(filteredData.length / limit),
          hasPreviousPage: page > 1,
          hasNextPage: endIndex < filteredData.length,
        },
      };
    }

    // If the backend returns a paginated response, use it directly
    // But ensure we filter by isPublished if needed
    if (
      data &&
      data.data &&
      Array.isArray(data.data) &&
      filters.isPublished === true
    ) {
      const filteredData = data.data.filter(
        (course: Course) => course.isPublished === true,
      );
      return {
        data: filteredData,
        meta: {
          ...data.meta,
          total: filteredData.length,
          totalPages: Math.ceil(
            filteredData.length / (data.meta.limit || limit),
          ),
        },
      };
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const getCourseById = async (courseId: string): Promise<Course> => {
  try {
    const { data } = await courseApi.get(`/courses/${courseId}`);
    console.log("dataCourse: ", data);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getCoursesByCategory = async (
  categoryId: string,
): Promise<Course[]> => {
  try {
    const { data } = await courseApi.get(`/courses/category/${categoryId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getCourseStructure = async (courseId: string) => {
  try {
    const { data } = await courseApi.get(`/courses/${courseId}/structure`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getUserCourseStructure = async (userId: string) => {
  try {
    const { data } = await courseApi.get(`/courses/user/${userId}/structure`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const publishCourse = async (courseId: string) => {
  try {
    const { data } = await courseApi.patch(`/courses/${courseId}/publish`);
    return data;
  } catch (error) {
    throw error;
  }
};
export const createCourse = async (courseData: {
  title: string;
  description: string;
  categoryId: string;
  level: string;
  isPublished: boolean;
  isHasCertificate: boolean;
  tags?: string[];
  price: number;
  learningOutcomes?: string[];
  requirements?: string[];
  targetAudience?: string;
  thumbnailUrl?: string;
  instructorId: string;
}) => {
  try {
    // Đổi tên price thành basePrice để phù hợp với BE
    const payload = {
      ...courseData,
      basePrice: courseData.price,
    };
    delete (payload as any).price;

    const { data } = await courseApi.post("/courses", payload);
    console.log("+ data >>>", data.id);
    return {
      error: false,
      success: true,
      data,
      message: "Tạo khóa học thành công",
    };
  } catch (error) {
    return {
      error: true,
      success: false,
      message: "Đã xảy ra lỗi khi tạo khóa học",
      data: null,
    };
  }
};

export const unpublishCourse = async (courseId: string) => {
  try {
    const { data } = await courseApi.patch(`/courses/${courseId}/unpublish`);
    return data;
  } catch (error) {
    throw error;
  }
};
export const updateCourse = async (
  courseId: string,
  courseData: {
    title: string;
    description: string;
    categoryId: string;
    level: string;
    isPublished: boolean;
    isHasCertificate: boolean;
    tags?: string[];
    learningOutcomes: string[];
    requirements: string[];
    targetAudience: string;
    thumbnailUrl?: string;
  },
) => {
  try {
    const { data } = await courseApi.patch(`/courses/${courseId}`, courseData);
    return {
      error: false,
      success: true,
      data,
      message: "Cập nhật khóa học thành công",
    };
  } catch (error) {
    return {
      error: true,
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật khóa học",
      data: null,
    };
  }
};
export const createChapter = async (courseId: string, chapterData: any) => {
  try {
    const { data } = await courseApi.post(
      `/courses/${courseId}/chapters`,
      chapterData,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

export const getChapters = async (courseId: string) => {
  try {
    const { data } = await courseApi.get(`/courses/${courseId}/chapters`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getChapterById = async (chapterId: string) => {
  try {
    const { data } = await courseApi.get(`/chapters/${chapterId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateChapter = async (
  chapterId: string,
  chapterData: {
    title: string;
    description?: string;
    isPublished?: boolean;
  },
) => {
  try {
    const { data } = await courseApi.patch(
      `/chapters/${chapterId}`,
      chapterData,
    );
    return {
      success: true,
      data,
      message: "Cập nhật chương thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật chương",
      error,
    };
  }
};
export const deleteCourse = async (courseId: string) => {
  try {
    const { data } = await courseApi.delete(`/courses/${courseId}`);
    return data;
  } catch (error) {
    throw error;
  }
};
export const deleteChapter = async (chapterId: string) => {
  try {
    console.log("++  chapterId", chapterId);
    const { data } = await courseApi.delete(`/chapters/${chapterId}`);
    console.log("++  data", data);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getUserCourseStructureWithDetails = async (userId: string) => {
  try {
    console.log("Calling API with URL:", `/courses/user/${userId}/structure`);
    console.log("User ID:", userId);

    const { data } = await courseApi.get(`/courses/user/${userId}/structure`);
    console.log("API Response:", data);

    return {
      success: true,
      data: data,
      message: "Lấy cấu trúc khóa học thành công",
    };
  } catch (error: any) {
    console.error("Error fetching course structure:", error);
    console.error("Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    });
    return {
      success: false,
      message: "Đã xảy ra lỗi khi lấy cấu trúc khóa học",
      error,
    };
  }
};

// Lấy cấu trúc khóa học với thông tin thống kê câu hỏi
export const getCourseStructureWithQuestionStats = async () => {
  try {
    console.log(
      "Calling API with URL:",
      `/courses/structure?include=questionStats&lessonType=QUIZ`,
    );

    const { data } = await courseApi.get(
      `/courses/structure?include=questionStats&lessonType=QUIZ`,
    );
    console.log("getCourseStructureWithQuestionStats", data);

    return {
      success: true,
      data: data,
      message: "Lấy cấu trúc khóa học với thống kê câu hỏi thành công",
    };
  } catch (error: any) {
    console.error(
      "Error fetching course structure with question stats:",
      error,
    );
    console.error("Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
    });
    return {
      success: false,
      message: "Đã xảy ra lỗi khi lấy cấu trúc khóa học với thống kê câu hỏi",
      error,
    };
  }
};
export const createLesson = async (
  courseId: string,
  chapterId: string,
  lessonData: {
    title: string;
    content?: string;
    type: string;
    videoUrl?: string;
    isPublished?: boolean;
    isFreePreview?: boolean;
    passPercent?: number;
    timeLimit?: number | null;
    maxAttempts?: number | null;
    retryDelay?: number | null;
  },
) => {
  try {
    const { data } = await courseApi.post(
      `/lessons/courses/${courseId}/chapters/${chapterId}`,
      lessonData,
    );
    return {
      success: true,
      data,
      message: "Tạo bài học thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Đã xảy ra lỗi khi tạo bài học",
      error,
    };
  }
};

export const getLessonsByChapter = async (chapterId: string) => {
  try {
    const { data } = await courseApi.get(`/lessons/chapters/${chapterId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getLessonsByCourse = async (courseId: string) => {
  try {
    const { data } = await courseApi.get(`/lessons/courses/${courseId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const getLessonById = async (lessonId: string) => {
  try {
    const { data } = await courseApi.get(`/lessons/${lessonId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateLesson = async (
  lessonId: string,
  lessonData: {
    title?: string;
    content?: string;
    type?: string;
    videoUrl?: string;
    isPublished?: boolean;
    isFreePreview?: boolean;
    passPercent?: number;
    timeLimit?: number | null;
    maxAttempts?: number | null;
    retryDelay?: number | null;
  },
) => {
  try {
    const { data } = await courseApi.put(`/lessons/${lessonId}`, lessonData);
    return {
      success: true,
      data,
      message: "Cập nhật bài học thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật bài học",
      error,
    };
  }
};

export const deleteLesson = async (lessonId: string) => {
  try {
    const { data } = await courseApi.delete(`/lessons/${lessonId}`);
    return {
      success: true,
      data,
      message: "Xóa bài học thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Đã xảy ra lỗi khi xóa bài học",
      error,
    };
  }
};
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const { data } = await courseApi.get("/categories");
    return data;
  } catch (error) {
    throw error;
  }
};

export const uploadImage = async (
  file: File,
  bucket: string = "courses",
  folder?: string,
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    if (folder) {
      formData.append("folder", folder);
    }

    const response = await fetch(
      "https://storage.eduforge.io.vn/api/v1/storage/upload",
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error("Lỗi khi tải lên hình ảnh");
    }

    const data = await response.json();
    return {
      success: true,
      url: data.url,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    return {
      success: false,
      message: "Không thể tải lên hình ảnh",
    };
  }
};

export const createCategory = async (categoryData: {
  name: string;
  description?: string;
}): Promise<Category> => {
  try {
    const { data } = await courseApi.post("/categories", categoryData);
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    await courseApi.delete(`/categories/${categoryId}`);
  } catch (error) {
    throw error;
  }
};

// ============================================
// PRICING MANAGEMENT FUNCTIONS
// ============================================

// Lấy giá hiện tại của khóa học
export const getCourseCurrentPrice = async (
  courseId: string,
): Promise<CoursePrice> => {
  try {
    const { data } = await courseApi.get(`/courses/${courseId}/price`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách chính sách giá
export const getPricingHeaders = async (): Promise<PricingHeader[]> => {
  try {
    const { data } = await courseApi.get("/pricing/headers");
    return data;
  } catch (error) {
    throw error;
  }
};

// Tạo chính sách giá mới
export const createPricingHeader = async (headerData: {
  name: string;
  description?: string;
  type: "BASE_PRICE" | "PROMOTION";
  startDate?: string;
  endDate?: string;
}): Promise<PricingHeader> => {
  try {
    const { data } = await courseApi.post("/pricing/headers", headerData);
    return data;
  } catch (error) {
    throw error;
  }
};

// Cập nhật chính sách giá
export const updatePricingHeader = async (
  headerId: string,
  headerData: Partial<PricingHeader>,
): Promise<PricingHeader> => {
  try {
    const { data } = await courseApi.patch(
      `/pricing/headers/${headerId}`,
      headerData,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

// Kích hoạt/vô hiệu hóa chính sách giá
export const updatePricingHeaderStatus = async (
  headerId: string,
  status: "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED",
): Promise<PricingHeader> => {
  try {
    const { data } = await courseApi.patch(
      `/pricing/headers/${headerId}/status`,
      { status },
    );
    return data;
  } catch (error) {
    throw error;
  }
};

// Lấy chi tiết giá của một chính sách
export const getPricingDetails = async (
  headerId: string,
): Promise<PricingDetail[]> => {
  try {
    const { data } = await courseApi.get(
      `/pricing/headers/${headerId}/details`,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

// Thêm/cập nhật giá cho khóa học/danh mục
export const createPricingDetail = async (detailData: {
  headerId: string;
  price: number;
  courseId?: string;
  categoryId?: string;
}): Promise<PricingDetail> => {
  try {
    const { data } = await courseApi.post("/pricing/details", detailData);
    return data;
  } catch (error) {
    throw error;
  }
};

// ============================================
// REORDER FUNCTIONS
// ============================================

// Sắp xếp lại thứ tự chapters
export const reorderChapters = async (
  courseId: string,
  chapters: { id: string; order: number }[],
) => {
  try {
    console.log("Calling reorderChapters API:", {
      courseId,
      chapters,
      endpoint: `/courses/${courseId}/chapters/reorder`,
    });

    const { data } = await courseApi.put(
      `/courses/${courseId}/chapters/reorder`,
      {
        chapters,
      },
    );

    console.log("reorderChapters API response:", data);

    return {
      success: true,
      data,
      message: "Cập nhật thứ tự chương thành công",
    };
  } catch (error: any) {
    console.error("Error reordering chapters:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Không thể cập nhật thứ tự chương",
      error,
    };
  }
};

// Sắp xếp lại thứ tự lessons (hỗ trợ di chuyển giữa chapters)
export const reorderLessons = async (
  lessons: { id: string; order: number; chapterId: string }[],
) => {
  try {
    console.log("Calling reorderLessons API:", {
      lessons,
      endpoint: `/lessons/reorder`,
    });

    const { data } = await courseApi.put(`/lessons/reorder`, {
      lessons,
    });

    console.log("reorderLessons API response:", data);

    return {
      success: true,
      data,
      message: "Cập nhật thứ tự bài học thành công",
    };
  } catch (error: any) {
    console.error("Error reordering lessons:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Không thể cập nhật thứ tự bài học",
      error,
    };
  }
};

// Di chuyển lesson sang chapter khác
export const moveLessonToChapter = async (
  lessonId: string,
  targetChapterId: string,
  order?: number,
) => {
  try {
    console.log("Calling moveLessonToChapter API:", {
      lessonId,
      targetChapterId,
      order,
      endpoint: `/lessons/${lessonId}/move/${targetChapterId}`,
    });

    const requestBody = order ? { order } : {};
    const { data } = await courseApi.put(
      `/lessons/${lessonId}/move/${targetChapterId}`,
      requestBody,
    );

    console.log("moveLessonToChapter API response:", data);

    return {
      success: true,
      data,
      message: "Di chuyển bài học thành công",
    };
  } catch (error: any) {
    console.error("Error moving lesson:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể di chuyển bài học",
      error,
    };
  }
};
