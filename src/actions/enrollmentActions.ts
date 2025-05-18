import { AxiosFactory } from "@/lib/axios";

interface EnrollmentData {
  courseId: string;
  userId: string;
  userName: string;
  courseName: string;
  isFree: boolean;
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
    const response = await enrollmentApi.post("/", enrollmentData);
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

export const checkEnrollmentStatus = async (
  courseId: string,
  userId: string,
) => {
  try {
    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
    const response = await enrollmentApi.get(`/check/${userId}/${courseId}`);
    return {
      error: false,
      success: true,
      data: response.data.enrolled,
    };
  } catch (error) {
    return {
      error: true,
      success: false,
      data: false,
    };
  }
};

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
      `/find/${params.courseId}`,
    );
    const enrollment = enrollmentResponse.data;
    console.log("Data tìm đc của user: ", enrollment);

    if (!enrollment || !enrollment.id) {
      throw new Error("Không tìm thấy thông tin đăng ký khóa học");
    }

    // Kiểm tra tiến độ học tập
    const progressApi = await AxiosFactory.getApiInstance("enrollment");
    const progressResponse = await progressApi.get(`/${enrollment.id}`);
    const progressData = progressResponse.data;

    // Nếu tiến độ chưa đạt 100%, cập nhật tiến độ lên 100%
    // if (progressData.progress < 100) {
    //   await progressApi.put(`/${enrollment.id}`, {
    //     progress: 100,
    //     isLessonCompleted: true
    //   });

    //   // Đợi một chút để đảm bảo trigger cập nhật trạng thái enrollment đã chạy
    //   await new Promise(resolve => setTimeout(resolve, 500));
    // }

    // Kiểm tra lại trạng thái enrollment sau khi cập nhật tiến độ
    const updatedEnrollmentResponse = await enrollmentApi.get(
      `/${enrollment.id}`,
    );
    const updatedEnrollment = updatedEnrollmentResponse.data;

    // Nếu trạng thái vẫn chưa là COMPLETED, cập nhật trực tiếp
    if (updatedEnrollment.status !== "COMPLETED") {
      await enrollmentApi.put(`/${enrollment.id}/status`, {
        status: "COMPLETED",
      });
    }

    // Tạo chứng chỉ
    const response = await enrollmentApi.post(`/${enrollment.id}/certificate`, {
      metadata: params.metadata,
    });

    return {
      error: false,
      success: true,
      message: "Tạo chứng chỉ thành công!",
      data: response.data,
    };
  } catch (error) {
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
    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
    const response = await enrollmentApi.get(
      `/certificate/${certificateId}/verify`,
    );

    return {
      error: false,
      success: true,
      data: response.data,
    };
  } catch (error) {
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

export const getEnrollmentStats = async () => {
  try {
    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
    const response = await enrollmentApi.get("/get/stats");
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
    const response = await enrollmentApi.get(`/user/${userId}/courses`);

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
