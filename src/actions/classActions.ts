import { AxiosFactory } from "@/lib/axios";
import { Class, CreateClassFormData } from "@/types/course/types";

const classApi = await AxiosFactory.getApiInstance("courses");

// ============================================
// CLASS MANAGEMENT FUNCTIONS (for LIVE courses)
// ============================================

// Tạo lớp học mới
export const createClass = async (
  classData: CreateClassFormData,
): Promise<{
  success: boolean;
  data?: Class;
  message?: string;
}> => {
  try {
    const { data } = await classApi.post("/classes", classData);
    return {
      success: true,
      data: data,
    };
  } catch (error: any) {
    console.error("Error creating class:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Đã có lỗi xảy ra khi tạo lớp học",
    };
  }
};

// Lấy danh sách lớp học của một khóa học
export const getClassesByCourse = async (
  courseId: string,
): Promise<Class[]> => {
  try {
    const { data } = await classApi.get(`/courses/${courseId}/classes`);
    return data;
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error;
  }
};

// Lấy thông tin chi tiết một lớp học
export const getClassById = async (classId: string): Promise<Class> => {
  try {
    const { data } = await classApi.get(`/classes/${classId}`);
    return data;
  } catch (error) {
    console.error("Error fetching class:", error);
    throw error;
  }
};

// Cập nhật lớp học
export const updateClass = async (
  classId: string,
  classData: Partial<CreateClassFormData>,
): Promise<{
  success: boolean;
  data?: Class;
  message?: string;
}> => {
  try {
    const { data } = await classApi.patch(`/classes/${classId}`, classData);
    return {
      success: true,
      data: data,
    };
  } catch (error: any) {
    console.error("Error updating class:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Đã có lỗi xảy ra khi cập nhật lớp học",
    };
  }
};

// Xóa lớp học
export const deleteClass = async (
  classId: string,
): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    await classApi.delete(`/classes/${classId}`);
    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error deleting class:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Đã có lỗi xảy ra khi xóa lớp học",
    };
  }
};

// Cập nhật trạng thái lớp học
export const updateClassStatus = async (
  classId: string,
  status: "DRAFT" | "PUBLISHED" | "ONGOING" | "COMPLETED" | "CANCELLED",
): Promise<{
  success: boolean;
  data?: Class;
  message?: string;
}> => {
  try {
    const { data } = await classApi.patch(`/classes/${classId}/status`, {
      status,
    });
    return {
      success: true,
      data: data,
    };
  } catch (error: any) {
    console.error("Error updating class status:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Đã có lỗi xảy ra khi cập nhật trạng thái lớp học",
    };
  }
};

// Lấy danh sách học viên trong lớp
export const getClassStudents = async (classId: string): Promise<any[]> => {
  try {
    const { data } = await classApi.get(`/classes/${classId}/students`);
    return data;
  } catch (error) {
    console.error("Error fetching class students:", error);
    throw error;
  }
};

// Thêm học viên vào lớp
export const addStudentToClass = async (
  classId: string,
  studentId: string,
): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    await classApi.post(`/classes/${classId}/students`, { studentId });
    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error adding student to class:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Đã có lỗi xảy ra khi thêm học viên vào lớp",
    };
  }
};

// Xóa học viên khỏi lớp
export const removeStudentFromClass = async (
  classId: string,
  studentId: string,
): Promise<{
  success: boolean;
  message?: string;
}> => {
  try {
    await classApi.delete(`/classes/${classId}/students/${studentId}`);
    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error removing student from class:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Đã có lỗi xảy ra khi xóa học viên khỏi lớp",
    };
  }
};
