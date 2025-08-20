import { AxiosFactory } from "@/lib/axios";
import { ClassSession } from "@/types/course/types";

const api = await AxiosFactory.getApiInstance("sessions"); // không truyền "sessions"

// Lấy các session của 1 class theo id
export const getClassSessionsByClassroomId = async (
  classroomId: string,
): Promise<ClassSession[]> => {
  const { data } = await api.get(`/sessions/by-class/${classroomId}`);
  return data;
};

// Lấy thông tin 1 class session
export const getClassSessionById = async (
  sessionId: string,
): Promise<ClassSession> => {
  const { data } = await api.get(`/sessions/${sessionId}`);
  return data;
};

// Tạo mới 1 class session
export const createClassSession = async (
  sessionData: Omit<ClassSession, "id" | "createdAt" | "updatedAt">,
) => {
  const { data } = await api.post(`/sessions`, sessionData);
  return { success: true, data, message: "Tạo buổi học thành công" };
};

// Cập nhật buổi học
export const updateClassSession = async (
  sessionId: string,
  sessionData: Partial<Omit<ClassSession, "id" | "createdAt" | "updatedAt">>,
) => {
  const { data } = await api.patch(`/sessions/${sessionId}`, sessionData);
  return { success: true, data, message: "Cập nhật buổi học thành công" };
};

// Xóa buổi học
export const deleteClassSession = async (sessionId: string) => {
  const { data } = await api.delete(`/sessions/${sessionId}`);
  return { success: true, data, message: "Xóa buổi học thành công" };
};

// Lịch của tôi
export const mySchedule = async () => {
  try {
    const { data } = await api.get("/sessions/my-schedule");
    return data;
  } catch (error) {
    throw new Error("dâsdfasd");
  }
};
