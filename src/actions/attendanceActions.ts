/**
 * Attendance Actions - API calls for attendance system
 * Workflow: Create Code -> Submit Code -> Check Status -> View Stats
 */
import { AxiosFactory } from "@/lib/axios";
import {
  AttendanceCode,
  AttendanceRecord,
  AttendanceStats,
} from "@/types/course/types";

const attendanceApi = await AxiosFactory.getApiInstance("attendance");

// =============================================
// WORKFLOW STEP 1: Tạo mã điểm danh (Giảng viên)
// =============================================

export async function createAttendanceCode(data: {
  syllabusItemId: string;
  expiresAt?: string;
  autoExpire?: boolean;
}) {
  try {
    const payload: any = {
      syllabusItemId: data.syllabusItemId,
      autoExpire: data.autoExpire ?? true,
    };

    if (data.expiresAt) {
      payload.expiresAt = new Date(data.expiresAt).toISOString();
    }

    const { data: result } = await attendanceApi.post(
      "/attendance/codes",
      payload,
    );

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error creating attendance code:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi tạo mã điểm danh",
    };
  }
}

// =============================================
// WORKFLOW STEP 2: Xóa mã điểm danh (Giảng viên)
// =============================================

export async function deleteAttendanceCode(codeId: string) {
  try {
    const { data: result } = await attendanceApi.delete(
      `/attendance/codes/${codeId}`,
    );

    return {
      success: true,
      data: result.data,
      message: result.message || "Xóa mã điểm danh thành công",
    };
  } catch (error: any) {
    console.error("Error deleting attendance code:", error);
    throw new Error(
      error.response?.data?.message || "Không thể xóa mã điểm danh",
    );
  }
}

// =============================================
// WORKFLOW STEP 2b: Đóng mã điểm danh (Giảng viên)
// =============================================

export async function deactivateAttendanceCode(syllabusItemId: string) {
  try {
    const currentCodeResult = await getCurrentAttendanceCode(syllabusItemId);
    if (!currentCodeResult.success || !currentCodeResult.data) {
      throw new Error("Không tìm thấy mã điểm danh đang hoạt động");
    }

    const { data: result } = await attendanceApi.delete(
      `/attendance/codes/${currentCodeResult.data.id}`,
    );

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error deactivating attendance code:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi đóng điểm danh",
    };
  }
}

// =============================================
// WORKFLOW STEP 3: Học viên gửi mã điểm danh
// =============================================

export async function submitAttendanceCode(data: {
  syllabusItemId: string;
  enrollmentId: string;
  code: string;
}) {
  try {
    const { data: result } = await attendanceApi.post("/attendance/check-in", {
      code: data.code,
      syllabusItemId: data.syllabusItemId,
    });

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error submitting attendance:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi điểm danh",
    };
  }
}

// =============================================
// WORKFLOW STEP 4: Kiểm tra trạng thái điểm danh
// =============================================

export async function checkAttendanceStatus(
  syllabusItemId: string,
  enrollmentId: string,
) {
  try {
    const { data: result } = await attendanceApi.get(
      `/attendance/syllabus/${syllabusItemId}/info`,
    );

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error checking attendance status:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Lỗi kiểm tra trạng thái điểm danh",
    };
  }
}

// =============================================
// BONUS: Xem thống kê điểm danh (Giảng viên)
// =============================================

export async function getAttendanceStats(syllabusItemId: string) {
  try {
    const { data: result } = await attendanceApi.get(
      `/attendance/syllabus/${syllabusItemId}/report`,
    );

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error getting attendance stats:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi lấy thống kê điểm danh",
    };
  }
}

// =============================================
// HELPER: Kiểm tra mã điểm danh hiện tại
// =============================================

export async function getCurrentAttendanceCode(syllabusItemId: string) {
  try {
    const { data: result } = await attendanceApi.get(
      `/attendance/syllabus/${syllabusItemId}/codes?ts=${Date.now()}`,
    );

    const activeCodes = result.data?.filter((code: any) => code.isActive);
    const activeCode = activeCodes?.[0] || null;

    return {
      success: true,
      data: activeCode,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error getting current attendance code:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi lấy mã điểm danh hiện tại",
    };
  }
}

// =============================================
// HELPER: Lấy tất cả mã điểm danh của syllabus item
// =============================================

export async function getAttendanceCodesBySyllabusItem(syllabusItemId: string) {
  try {
    const { data: result } = await attendanceApi.get(
      `/attendance/syllabus/${syllabusItemId}/codes?ts=${Date.now()}`,
    );

    return {
      success: true,
      data: result.data || [],
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error getting attendance codes:", error);
    return {
      success: false,
      data: [],
      message:
        error.response?.data?.message || "Lỗi lấy danh sách mã điểm danh",
    };
  }
}

// =============================================
// HELPER: Lấy lịch sử điểm danh của học viên
// =============================================

export async function getStudentAttendanceHistory(classId?: string) {
  try {
    const endpoint = classId
      ? `/attendance/history?classId=${classId}`
      : "/attendance/history";

    const { data: result } = await attendanceApi.get(endpoint);

    return {
      success: true,
      data: result.data || [],
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error getting student attendance history:", error);
    return {
      success: false,
      data: [],
      message: error.response?.data?.message || "Lỗi lấy lịch sử điểm danh",
    };
  }
}

// =============================================
// Export types for convenience
// =============================================

export type { AttendanceCode, AttendanceRecord, AttendanceStats };
