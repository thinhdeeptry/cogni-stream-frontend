// "use server";
import { AxiosFactory } from "@/lib/axios";

interface EnrollmentData {
  studentId: string;
  type: "STREAM" | "ONLINE";
  courseId?: string;
  classId?: string;
  progress?: number;
  isCompleted?: boolean;
  transactionId?: string; // ID của transaction khi thanh toán thành công
}

export interface EnrollmentStats {
  totalEnrollments: number;
  newEnrollmentsLast30Days: number;
  dropoutRate: number;
  enrollmentsByCourse: {
    courseId: string;
    enrollments: number;
  }[];
  averageTimeToComplete: number;
  averageCompletionRate: number;
  popularCourses: {
    courseId: string;
    title: string;
    enrollments: number;
  }[];
}

export const enrollCourse = async (enrollmentData: EnrollmentData) => {
  try {
    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
    const response = await enrollmentApi.post("/enrollments", enrollmentData);
    console.log("response", response);
    return {
      error: false,
      success: true,
      message: "Đăng ký khóa học thành công!",
      data: response.data,
    };
  } catch (error) {
    return {
      error: true,
      success: false,
      message:
        (error as any).response?.data?.message ||
        "Có lỗi xảy ra khi đăng ký khóa học.",
      data: null,
    };
  }
};

// Hàm tạo enrollment sau thanh toán thành công
export const createEnrollment = async (enrollmentData: EnrollmentData) => {
  try {
    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
    const response = await enrollmentApi.post("/enrollments", enrollmentData);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || "Lỗi tạo enrollment",
    );
  }
};

export async function checkEnrollmentStatus(
  userId: string,
  courseId: string,
  classId?: string,
) {
  try {
    const api = await AxiosFactory.getApiInstance("enrollment");

    // Determine enrollment type based on classId presence
    const enrollmentType = classId ? "STREAM" : "ONLINE";

    // Build query parameters
    const queryParams = new URLSearchParams({
      type: enrollmentType,
    });

    if (classId) {
      queryParams.append("classId", classId);
    }

    const res = await api.get(
      // `/enrollments/check/${courseId}?${queryParams.toString()}`,
      `/enrollments/check/${courseId}?${queryParams.toString()}`,
    );

    return {
      success: true,
      isEnrolled: res?.data?.data === true,
      message: res?.data?.message || "Success",
    };
  } catch (error: any) {
    console.error("Error in checkEnrollmentStatus:", error);
    console.error("Error response:", error?.response?.data);
    return {
      success: false,
      isEnrolled: false,
      message: error?.response?.data?.message || "Error checking enrollment",
    };
  }
}

export const createCertificate = async (params: {
  courseId: string;
  metadata: {
    courseName: string;
    completedAt: string;
    [key: string]: any;
  };
}) => {
  try {
    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");

    // Lấy enrollment ID từ courseId và userId hiện tại
    const enrollmentResponse = await enrollmentApi.get(
      `/enrollments/find/${params.courseId}`,
    );
    const enrollment = enrollmentResponse.data;
    console.log("Data tìm đc của user: ", enrollment);

    if (!enrollment || !enrollment.id) {
      throw new Error("Không tìm thấy thông tin đăng ký khóa học");
    }

    // Kiểm tra lại trạng thái enrollment
    const updatedEnrollmentResponse = await enrollmentApi.get(
      `/enrollments/${enrollment.id}`,
    );
    const updatedEnrollment = updatedEnrollmentResponse.data;

    // Nếu trạng thái vẫn chưa là COMPLETED, cập nhật trực tiếp
    if (updatedEnrollment.status !== "COMPLETED") {
      await enrollmentApi.put(`/enrollments/${enrollment.id}/status`, {
        status: "COMPLETED",
      });
    }

    // Tạo chứng chỉ thông qua certificates API
    const certificatesApi = await AxiosFactory.getApiInstance("certificates");
    const response = await certificatesApi.post(
      `/certificates/issue/${enrollment.id}`,
    );

    return {
      error: false,
      success: true,
      message: "Tạo chứng chỉ thành công!",
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error creating certificate:", error);
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message || "Có lỗi xảy ra khi tạo chứng chỉ.",
      data: null,
    };
  }
};

export const getCertificate = async (certificateId: string) => {
  try {
    const certificatesApi = await AxiosFactory.getApiInstance("certificates");
    const response = await certificatesApi.get(
      `/certificates/${certificateId}`,
    );

    return {
      error: false,
      success: true,
      data: response.data.data, // Backend trả về {message, statusCode, data}
    };
  } catch (error: any) {
    console.error("Error fetching certificate:", error);
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message ||
        "Có lỗi xảy ra khi lấy thông tin chứng chỉ.",
      data: null,
    };
  }
};

export const getStudentCertificates = async (
  studentId: string,
  page: number = 1,
  limit: number = 10,
) => {
  try {
    const certificatesApi = await AxiosFactory.getApiInstance("certificates");
    const response = await certificatesApi.get(
      `/certificates/student/${studentId}?page=${page}&limit=${limit}`,
    );

    return {
      error: false,
      success: true,
      data: response.data.data, // Backend trả về paginated data
    };
  } catch (error: any) {
    console.error("Error fetching student certificates:", error);
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message ||
        "Có lỗi xảy ra khi lấy danh sách chứng chỉ.",
      data: null,
    };
  }
};

export const getEnrollmentStats = async () => {
  try {
    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
    const response = await enrollmentApi.get("/enrollments/get/stats");
    return {
      error: false,
      success: true,
      data: response.data as EnrollmentStats,
    };
  } catch (error) {
    console.error("Error fetching enrollment stats:", error);
    return {
      error: true,
      success: false,
      message:
        (error as any).response?.data?.message ||
        "Không thể lấy thống kê đăng ký.",
      data: null,
    };
  }
};

/**
 * Get all enrollments for a user
 * @param userId User ID
 * @returns List of enrollments with progress information
 */
export const getUserEnrollments = async (userId: string) => {
  try {
    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
    const response = await enrollmentApi.get(
      `/enrollments/user/${userId}/courses`,
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error fetching user enrollments:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch enrollments",
      data: [],
    };
  }
};

/**
 * Get my classes for a user (only STREAM enrollments)
 * @param userId User ID
 * @returns List of classes that user is enrolled in
 */
export const getMyClasses = async (userId: string) => {
  try {
    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
    const response = await enrollmentApi.get(
      `/enrollments/my-classes?userId=${userId}`,
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error fetching my classes:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch my classes",
      data: null,
    };
  }
};

export async function getEnrollmentByCourse(courseId: string) {
  try {
    const api = await AxiosFactory.getApiInstance("enrollment");
    const res = await api.get(`/enrollments/find/${courseId}`);
    return { success: true, data: res.data };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Error fetching enrollment",
    };
  }
}

export async function getEnrollmentsByUser(userId: string) {
  try {
    const api = await AxiosFactory.getApiInstance("enrollment");
    const res = await api.get(`/enrollments/user/${userId}`);
    return { success: true, data: res.data };
  } catch (error: any) {
    return {
      success: false,
      message:
        error?.response?.data?.message || "Error fetching user enrollments",
    };
  }
}

export async function getEnrollmentByCourseAndType(
  courseId: string,
  type: "STREAM" | "ONLINE",
  studentId: string,
  classId?: string,
) {
  try {
    const api = await AxiosFactory.getApiInstance("enrollment");

    const res = await api.get(
      `/enrollments/course/${courseId}/classId/${classId}/studentId/${studentId}/type/${type}`,
    );

    return { success: true, data: res.data };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || "Error fetching enrollment",
    };
  }
}

export async function getProgressByEnrollment(enrollmentId: string) {
  try {
    const api = await AxiosFactory.getApiInstance("enrollment");
    const res = await api.get(`/enrollments/${enrollmentId}/progress`);
    return {
      success: true,
      data: res.data,
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error?.response?.data?.message || "Error fetching student progress",
    };
  }
}

/**
 * Đánh dấu hoàn thành khóa học và cấp chứng chỉ tự động
 */
export async function markCourseAsCompleted(enrollmentId: string) {
  try {
    const api = await AxiosFactory.getApiInstance("enrollment");
    const res = await api.patch(`/enrollments/${enrollmentId}/complete`);
    return {
      success: true,
      data: res.data,
      message: res.data?.message || "Đánh dấu hoàn thành khóa học thành công!",
    };
  } catch (error: any) {
    console.error("Error marking course as completed:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message ||
        "Không thể đánh dấu hoàn thành khóa học",
    };
  }
}
