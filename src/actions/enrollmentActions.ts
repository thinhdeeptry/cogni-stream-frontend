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
