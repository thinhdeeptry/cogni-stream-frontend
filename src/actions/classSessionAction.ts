import { AxiosFactory } from "@/lib/axios";
import { ClassSession } from "@/types/course/types";

const classSessionApi = await AxiosFactory.getApiInstance("sessions");

// Lấy các session của 1 class theo id
export const getClassSessionsByClassroomId = async (
  classroomId: string,
): Promise<ClassSession[]> => {
  try {
    const { data } = await classSessionApi.get(
      `/class-sessions?classroomId=${classroomId}`,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

// Lấy thông tin 1 class session
export const getClassSessionById = async (
  sessionId: string,
): Promise<ClassSession> => {
  try {
    const { data } = await classSessionApi.get(`/class-session/${sessionId}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Tạo mới 1 class session
export const createClassSession = async (
  sessionData: Omit<ClassSession, "id">,
) => {
  try {
    const { data } = await classSessionApi.post("/class-sessions", sessionData);
    return {
      success: true,
      data,
      message: "Tạo buổi học thành công",
    };
  } catch (error) {
    throw error;
  }
};

// Cập nhật buổi học
export const updateClassSession = async (
  sessionId: string,
  sessionData: Partial<Omit<ClassSession, "id">>,
) => {
  try {
    const { data } = await classSessionApi.patch(
      `/class-sessions/${sessionId}`,
      sessionData,
    );
    return {
      success: true,
      data,
      message: "Cập nhật buổi học thành công",
    };
  } catch (error) {}
};

export const deleteClassSession = async (sessionId: string) => {
  try {
    const { data } = await classSessionApi.delete(
      `/class-sessions/${sessionId}`,
    );
    return {
      success: true,
      data,
      message: "Xóa buổi học thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Lỗi khi xóa buổi học",
      error,
    };
  }
};
