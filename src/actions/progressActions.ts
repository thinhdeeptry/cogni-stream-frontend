import { AxiosFactory } from "@/lib/axios";

// import { ProgressStatus } from "@prisma/client";

export type ProgressStatus = "ATTENDED" | "COMPLETED_SELF_STUDY";

export interface CreateStudentProgressDto {
  enrollmentId: string;
  syllabusItemId?: string;
  classSessionId?: string;
  lessonId?: string;
  status?: ProgressStatus;
}

export interface UpdateStudentProgressDto {
  progress: number;
  currentProgressId: string;
  nextLesson?: string; // tên (cho ONLINE)
  nextLessonId?: string; //id (cho ONLINE)
  nextSyllabusItemId?: string; // id syllabusItem tiếp theo (cho STREAM/live)
  isLessonCompleted: boolean;
}
interface OverallProgressResponse {
  overallProgress: number;
  completed: boolean;
  status: string;
}

export const createStudentProgress = async (dto: CreateStudentProgressDto) => {
  try {
    const api = await AxiosFactory.getApiInstance("progress");
    const response = await api.post("/progress", dto);
    return {
      error: false,
      success: true,
      message: "Tạo tiến trình học tập thành công!",
      data: response.data,
    };
  } catch (error: any) {
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message || "Không thể tạo tiến trình học tập.",
      data: null,
    };
  }
};

export const getAllStudentProgress = async () => {
  try {
    const api = await AxiosFactory.getApiInstance("progress");
    const response = await api.get("/");
    return {
      error: false,
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message ||
        "Không thể lấy danh sách tiến trình học tập.",
      data: null,
    };
  }
};

export const getInitialProgress = async (id: string) => {
  try {
    const api = await AxiosFactory.getApiInstance("progress");
    const response = await api.get(`/progress/enrollment/${id}`);
    return {
      error: false,
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message ||
        "Không thể lấy tiến trình học tập chi tiết.",
      data: null,
    };
  }
};

export const updateProgress = async (
  enrollmentId: string,
  dto: UpdateStudentProgressDto,
) => {
  try {
    console.log("dto: ", dto);
    const api = await AxiosFactory.getApiInstance("progress");
    console.log("BaseURL: ", api.defaults.baseURL);
    const response = await api.patch(
      `/progress/enrollment/${enrollmentId}`,
      dto,
    );
    return {
      error: false,
      success: true,
      message: "Cập nhật tiến trình học tập thành công!",
      data: response.data,
    };
  } catch (error: any) {
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message ||
        "Không thể cập nhật tiến trình học tập.",
      data: null,
    };
  }
};
export const createProgress = async (
  enrollmentId: string,
  currentSyllabusItemId?: string,
) => {
  try {
    const api = await AxiosFactory.getApiInstance("progress");
    const dto = {
      enrollmentId,
      syllabusItemId: currentSyllabusItemId,
    };
    const response = await api.post(`/progress`, dto);
    return {
      error: false,
      success: true,
      message: "tạo tiến trình học tập thành công!",
      data: response.data,
    };
  } catch (error: any) {
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message ||
        "Không thể cập nhật tiến trình học tập.",
      data: null,
    };
  }
};
export const verifyCourseCompletion = async (enrollmentId: string) => {
  try {
    const progressApi = await AxiosFactory.getApiInstance("progress");
    const response = await progressApi.get<boolean>(
      `/progress/enrollment/${enrollmentId}/completion`,
    );

    return {
      error: false,
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message ||
        "Không thể kiểm tra trạng thái hoàn thành khóa học.",
      data: null,
    };
  }
};

export const getOverallProgress = async (enrollmentId: string) => {
  try {
    const progressApi = await AxiosFactory.getApiInstance("progress");
    const response = await progressApi.get<OverallProgressResponse>(
      `/progress/enrollment/${enrollmentId}/overall`,
    );

    return {
      error: false,
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message || "Không thể lấy tổng quan tiến trình.",
      data: null,
    };
  }
};

export const getCompletedItems = async (enrollmentId: string) => {
  try {
    const progressApi = await AxiosFactory.getApiInstance("progress");
    const response = await progressApi.get(
      `/progress/enrollment/${enrollmentId}?completed-items=true`,
    );

    return {
      error: false,
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message ||
        "Không thể lấy danh sách bài học đã hoàn thành.",
      data: null,
    };
  }
};

// =============================================
// 🆕 ATTENDANCE-BASED PROGRESS FUNCTIONS
// =============================================

// Đánh dấu hoàn thành live session thông qua điểm danh
export const markLiveSessionCompleted = async (data: {
  enrollmentId: string;
  syllabusItemId: string;
  classSessionId: string;
}) => {
  try {
    const progressApi = await AxiosFactory.getApiInstance("progress");
    const response = await progressApi.post(
      "/progress/live-session/complete",
      data,
    );

    return {
      error: false,
      success: true,
      message: "Hoàn thành buổi học thành công!",
      data: response.data,
    };
  } catch (error: any) {
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message || "Lỗi đánh dấu hoàn thành buổi học.",
      data: null,
    };
  }
};

// Kiểm tra trạng thái của một syllabus item cụ thể
export const getSyllabusItemProgress = async (data: {
  enrollmentId: string;
  syllabusItemId: string;
}) => {
  try {
    const progressApi = await AxiosFactory.getApiInstance("progress");
    const response = await progressApi.get(
      `/progress/syllabus-item/${data.syllabusItemId}/enrollment/${data.enrollmentId}`,
    );

    return {
      error: false,
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message ||
        "Không thể lấy thông tin tiến trình bài học.",
      data: null,
    };
  }
};

// Kiểm tra và mở khóa item tiếp theo
export const unlockNextSyllabusItem = async (data: {
  enrollmentId: string;
  classId: string;
  currentSyllabusItemId: string;
}) => {
  try {
    const progressApi = await AxiosFactory.getApiInstance("progress");
    const response = await progressApi.post("/progress/unlock-next-item", data);

    return {
      error: false,
      success: true,
      data: response.data,
      message: "Đã mở khóa bài học tiếp theo!",
    };
  } catch (error: any) {
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message || "Không thể mở khóa bài học tiếp theo.",
      data: null,
    };
  }
};
