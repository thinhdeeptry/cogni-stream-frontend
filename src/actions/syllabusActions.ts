// No "use server" directive - this is a client-side API module like courseAction.ts
import { AxiosFactory } from "@/lib/axios";
import {
  CreateSyllabusItemRequest,
  SyllabusItem,
  UpdateSyllabusItemRequest,
} from "@/types/course/types";

const syllabusApi = await AxiosFactory.getApiInstance("courses");

/**
 * Interface cho grouped syllabus
 */
export interface GroupedSyllabusItem {
  day: number;
  items: SyllabusItem[];
}

/**
 * Interface cho syllabus response từ API - Backend đã trả về data đã được nhóm theo ngày
 */
export interface SyllabusResponse {
  id: string;
  classId: string;
  className: string;
  groupedItems: GroupedSyllabusItem[]; // Backend đã nhóm theo ngày
  totalDays: number;
  totalSessions: number;
  totalLessons: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Lấy lộ trình học theo lớp - Main function for course detail page
 */
export async function getSyllabusByClassId(
  classId: string,
): Promise<SyllabusResponse> {
  try {
    const { data } = await syllabusApi.get(`/syllabus/class/${classId}`);
    return data;
  } catch (error: any) {
    console.error("Lỗi khi fetch lộ trình:", error);
    console.error("Response:", error.response?.data);
    console.error("Status:", error.response?.status);
    throw new Error("Không thể tải lộ trình học");
  }
}

/**
 * Lấy lộ trình học theo lớp (legacy function - compatibility)
 */
export async function getSyllabusByClass(
  classId: string,
): Promise<SyllabusItem[]> {
  try {
    const { data } = await syllabusApi.get(`/syllabus/class/${classId}`);
    // Nếu API trả về object với items, lấy items, không thì trả về data
    return Array.isArray(data) ? data : data.items || [];
  } catch (error: any) {
    console.error("Lỗi khi fetch lộ trình:", error);
    console.error("Response:", error.response?.data);
    console.error("Status:", error.response?.status);
    throw new Error("Không thể tải lộ trình học");
  }
}

/**
 * Tạo mục lộ trình học mới
 */
export async function createSyllabusItem(
  data: CreateSyllabusItemRequest,
): Promise<{ success: boolean; message: string; data?: SyllabusItem }> {
  try {
    const response = await syllabusApi.post("/syllabus", data);

    return {
      success: true,
      message: "Thêm mục lộ trình thành công",
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error creating syllabus item:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Có lỗi xảy ra khi thêm mục lộ trình",
    };
  }
}

/**
 * Cập nhật mục lộ trình học
 */
export async function updateSyllabusItem(
  id: string,
  data: UpdateSyllabusItemRequest,
): Promise<{ success: boolean; message: string; data?: SyllabusItem }> {
  try {
    const response = await syllabusApi.patch(`/syllabus/${id}`, data);

    return {
      success: true,
      message: "Cập nhật mục lộ trình thành công",
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error updating syllabus item:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Có lỗi xảy ra khi cập nhật mục lộ trình",
    };
  }
}

/**
 * Xóa mục lộ trình học
 */
export async function deleteSyllabusItem(
  id: string,
): Promise<{ success: boolean; message: string }> {
  try {
    await syllabusApi.delete(`/syllabus/${id}`);

    return {
      success: true,
      message: "Xóa mục lộ trình thành công",
    };
  } catch (error: any) {
    console.error("Error deleting syllabus item:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Có lỗi xảy ra khi xóa mục lộ trình",
    };
  }
}

/**
 * Lấy chi tiết mục lộ trình học
 */
export async function getSyllabusItemById(id: string): Promise<SyllabusItem> {
  try {
    const { data } = await syllabusApi.get(`/syllabus/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching syllabus item:", error);
    throw new Error("Không thể tải chi tiết mục lộ trình");
  }
}

/**
 * Cập nhật thứ tự nhiều mục lộ trình (cho drag & drop)
 */
export async function updateSyllabusOrder(
  items: Array<{ id: string; day: number; order: number }>,
): Promise<{ success: boolean; message: string }> {
  try {
    // Gọi API update cho từng item (có thể tối ưu bằng bulk update nếu API hỗ trợ)
    const updatePromises = items.map((item) =>
      syllabusApi.patch(`/syllabus/${item.id}`, {
        day: item.day,
        order: item.order,
      }),
    );

    await Promise.all(updatePromises);

    return {
      success: true,
      message: "Cập nhật thứ tự lộ trình thành công",
    };
  } catch (error: any) {
    console.error("Error updating syllabus order:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật thứ tự",
    };
  }
}

/**
 * Lấy thông tin tiến độ của user trong class
 */
export async function getUserClassProgress(
  classId: string,
  userId: string,
): Promise<{
  currentItem?: SyllabusItem;
  completedItems: string[];
  overallProgress: number;
}> {
  try {
    const { data } = await syllabusApi.get(
      `/classes/${classId}/progress/${userId}`,
    );
    return data;
  } catch (error: any) {
    console.error("Error fetching user class progress:", error);
    return {
      completedItems: [],
      overallProgress: 0,
    };
  }
}

/**
 * Cập nhật tiến độ của user trong class
 */
export async function updateUserClassProgress(
  classId: string,
  userId: string,
  data: {
    currentItemId: string;
    isCompleted?: boolean;
    progressPercentage?: number;
  },
): Promise<{ success: boolean; message: string }> {
  try {
    await syllabusApi.post(`/classes/${classId}/progress/${userId}`, data);
    return {
      success: true,
      message: "Cập nhật tiến độ thành công",
    };
  } catch (error: any) {
    console.error("Error updating user class progress:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật tiến độ",
    };
  }
}
