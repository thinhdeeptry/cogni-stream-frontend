/**
 * Attendance Actions - API calls for attendance system
 * Workflow: Create Code -> Submit Code -> Check Status -> View Stats
 */
import {
  AttendanceCode,
  AttendanceRecord,
  AttendanceStats,
} from "@/types/course/types";
import { getSession } from "next-auth/react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Helper function to get auth headers
async function getAuthHeaders() {
  const session = await getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  if (session?.user?.id) {
    headers["X-User-Id"] = session.user.id;
  }

  return headers;
}

// =============================================
// WORKFLOW STEP 1: Tạo mã điểm danh (Giảng viên)
// =============================================

export async function createAttendanceCode(data: {
  syllabusItemId: string;
  expiresAt?: Date;
}) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/attendance/codes`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        syllabusItemId: data.syllabusItemId,
        expiresAt: data.expiresAt?.toISOString(),
        autoExpire: !!data.expiresAt,
      }),
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
    // First get current code, then deactivate it
    const currentCodeResult = await getCurrentAttendanceCode(syllabusItemId);
    if (!currentCodeResult.success || !currentCodeResult.data) {
      throw new Error("Không tìm thấy mã điểm danh đang hoạt động");
    }

    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE}/attendance/codes/${currentCodeResult.data.id}`,
      {
        method: "DELETE",
        headers,
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
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/attendance/check-in`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        code: data.code,
        syllabusItemId: data.syllabusItemId,
      }),
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
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE}/attendance/syllabus/${syllabusItemId}/info`,
      {
        method: "GET",
        headers,
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
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE}/attendance/syllabus/${syllabusItemId}/report`,
      {
        method: "GET",
        headers,
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
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE}/attendance/syllabus/${syllabusItemId}/codes`,
      {
        method: "GET",
        headers,
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to get current attendance code",
      );
    }

    // Find active code from the list
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
      message: error.message || "Lỗi lấy mã điểm danh hiện tại",
    };
  }
}

// =============================================
// HELPER: Lấy tất cả mã điểm danh của syllabus item
// =============================================

export async function getAttendanceCodesBySyllabusItem(syllabusItemId: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${API_BASE}/attendance/syllabus/${syllabusItemId}/codes`,
      {
        method: "GET",
        headers,
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to get attendance codes");
    }

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
      message: error.message || "Lỗi lấy danh sách mã điểm danh",
    };
  }
}

// =============================================
// HELPER: Lấy lịch sử điểm danh của học viên
// =============================================

export async function getStudentAttendanceHistory(classId?: string) {
  try {
    const headers = await getAuthHeaders();
    const url = classId
      ? `${API_BASE}/attendance/history?classId=${classId}`
      : `${API_BASE}/attendance/history`;

    const response = await fetch(url, {
      method: "GET",
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to get student attendance history",
      );
    }

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
      message: error.message || "Lỗi lấy lịch sử điểm danh",
    };
  }
}

// =============================================
// Export types for convenience
// =============================================

export type { AttendanceCode, AttendanceRecord, AttendanceStats };
