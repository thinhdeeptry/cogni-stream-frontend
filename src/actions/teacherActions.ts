// No "use server" directive - this is a client-side API module like courseAction.ts
import { AxiosFactory } from "@/lib/axios";

let teachersApi: any = null;

async function getTeachersApi() {
  if (!teachersApi) {
    teachersApi = await AxiosFactory.getApiInstance("teachers");
  }
  return teachersApi;
}

export interface TeacherProfile {
  userId: string;
  headline?: string;
  bio?: string;
  specialization?: string;
  avgRating: number;
  totalRatings: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    role: string;
    phone?: string;
    address?: string;
  };
  courses?: Array<{
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
    totalStudents: number;
    avgRating: number;
    totalRatings: number;
    isPublished: boolean;
    createdAt: string;
  }>;
  totalStudents?: number;
  totalCourses?: number;
}

export interface CreateTeacherProfileData {
  headline?: string;
  bio?: string;
  specialization?: string;
  status?: "ACTIVE" | "SUSPENDED";
}

export interface UpdateTeacherProfileData {
  headline?: string;
  bio?: string;
  specialization?: string;
  status?: "ACTIVE" | "SUSPENDED";
}

export interface TeacherStats {
  totalCourses: number;
  totalStudents: number;
  avgRating: number;
  totalRatings: number;
}

/**
 * Tạo hồ sơ giảng viên mới
 */
export async function createTeacherProfile(
  data: CreateTeacherProfileData,
): Promise<{ success: boolean; message: string; data?: TeacherProfile }> {
  try {
    const api = await getTeachersApi();
    const response = await api.post("/teachers", data);

    return {
      success: true,
      message: "Tạo hồ sơ giảng viên thành công",
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error creating teacher profile:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Có lỗi xảy ra khi tạo hồ sơ giảng viên",
    };
  }
}

/**
 * Lấy danh sách tất cả giảng viên
 */
export async function getAllTeachers(): Promise<TeacherProfile[]> {
  try {
    const api = await getTeachersApi();
    const { data } = await api.get("/teachers");
    return data;
  } catch (error: any) {
    console.error("Error fetching teachers:", error);
    console.error("Response:", error.response?.data);
    console.error("Status:", error.response?.status);
    throw new Error("Không thể tải danh sách giảng viên");
  }
}

/**
 * Lấy thông tin hồ sơ giảng viên theo userId
 */
export async function getTeacherProfile(
  userId: string,
): Promise<TeacherProfile> {
  try {
    const api = await getTeachersApi();
    const { data } = await api.get(`/teachers/${userId}`);
    return data;
  } catch (error: any) {
    console.error("Error fetching teacher profile:", error);
    console.error("Response:", error.response?.data);
    console.error("Status:", error.response?.status);
    throw new Error("Không thể tải thông tin giảng viên");
  }
}

/**
 * Lấy thông tin hồ sơ giảng viên của user hiện tại
 */
export async function getMyTeacherProfile(): Promise<TeacherProfile> {
  try {
    const api = await getTeachersApi();
    const { data } = await api.get("/teachers/profile");
    return data;
  } catch (error: any) {
    console.error("Error fetching my teacher profile:", error);
    console.error("Response:", error.response?.data);
    console.error("Status:", error.response?.status);
    throw new Error("Không thể tải thông tin hồ sơ giảng viên của bạn");
  }
}

/**
 * Cập nhật hồ sơ giảng viên
 */
export async function updateTeacherProfile(
  data: UpdateTeacherProfileData,
): Promise<{ success: boolean; message: string; data?: TeacherProfile }> {
  try {
    const api = await getTeachersApi();
    const response = await api.patch("/teachers", data);

    return {
      success: true,
      message: "Cập nhật hồ sơ giảng viên thành công",
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error updating teacher profile:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Có lỗi xảy ra khi cập nhật hồ sơ giảng viên",
    };
  }
}

/**
 * Xóa hồ sơ giảng viên
 */
export async function deleteTeacherProfile(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const api = await getTeachersApi();
    await api.delete("/teachers");

    return {
      success: true,
      message: "Xóa hồ sơ giảng viên thành công",
    };
  } catch (error: any) {
    console.error("Error deleting teacher profile:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Có lỗi xảy ra khi xóa hồ sơ giảng viên",
    };
  }
}

/**
 * Lấy thống kê của giảng viên
 */
export async function getTeacherStats(): Promise<TeacherStats> {
  try {
    const api = await getTeachersApi();
    const { data } = await api.get("/teachers/stats");
    return data;
  } catch (error: any) {
    console.error("Error fetching teacher stats:", error);
    console.error("Response:", error.response?.data);
    console.error("Status:", error.response?.status);
    throw new Error("Không thể tải thống kê giảng viên");
  }
}
