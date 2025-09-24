/**
 * Attendance Actions - API calls for attendance system
 * Workflow: Create Code -> Submit Code -> Check Status -> View Stats
 */
import {
  AttendanceCode,
  AttendanceRecord,
  AttendanceStats,
} from "@/types/course/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// =============================================
// WORKFLOW STEP 1: Tạo mã điểm danh (Giảng viên)
// =============================================

export async function createAttendanceCode(data: {
  syllabusItemId: string;
  code?: string; // Optional - nếu không có thì auto generate
  expiresAt?: Date;
}) {
  try {
    const response = await fetch(`${API_BASE}/attendance/codes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // TODO: Add authorization header
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to create attendance code");
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error creating attendance code:", error);
    return {
      success: false,
      message: error.message || "Lỗi tạo mã điểm danh",
    };
  }
}

// =============================================
// WORKFLOW STEP 2: Đóng mã điểm danh (Giảng viên)
// =============================================

export async function deactivateAttendanceCode(syllabusItemId: string) {
  try {
    const response = await fetch(
      `${API_BASE}/attendance/codes/${syllabusItemId}/deactivate`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // TODO: Add authorization header
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to deactivate attendance code");
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error deactivating attendance code:", error);
    return {
      success: false,
      message: error.message || "Lỗi đóng điểm danh",
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
    const response = await fetch(`${API_BASE}/attendance/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // TODO: Add authorization header
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to submit attendance");
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error submitting attendance:", error);
    return {
      success: false,
      message: error.message || "Lỗi điểm danh",
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
    const response = await fetch(
      `${API_BASE}/attendance/status/${syllabusItemId}/${enrollmentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // TODO: Add authorization header
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to check attendance status");
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error checking attendance status:", error);
    return {
      success: false,
      message: error.message || "Lỗi kiểm tra trạng thái điểm danh",
    };
  }
}

// =============================================
// BONUS: Xem thống kê điểm danh (Giảng viên)
// =============================================

export async function getAttendanceStats(syllabusItemId: string) {
  try {
    const response = await fetch(
      `${API_BASE}/attendance/stats/${syllabusItemId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // TODO: Add authorization header
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to get attendance stats");
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error getting attendance stats:", error);
    return {
      success: false,
      message: error.message || "Lỗi lấy thống kê điểm danh",
    };
  }
}

// =============================================
// HELPER: Kiểm tra mã điểm danh hiện tại
// =============================================

export async function getCurrentAttendanceCode(syllabusItemId: string) {
  try {
    const response = await fetch(
      `${API_BASE}/attendance/codes/${syllabusItemId}/current`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // TODO: Add authorization header
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to get current attendance code",
      );
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error getting current attendance code:", error);
    return {
      success: false,
      message: error.message || "Lỗi lấy mã điểm danh hiện tại",
    };
  }
}

// =============================================
// Export types for convenience
// =============================================

export type { AttendanceCode, AttendanceRecord, AttendanceStats };
