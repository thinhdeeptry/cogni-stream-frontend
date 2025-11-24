"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface StatisticsParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  period?: "day" | "week" | "month" | "quarter" | "year";
}

export interface DashboardStatistics {
  overview: {
    totalRevenue: number;
    totalStudents: number;
    totalInstructors: number;
    totalCourses: number;
    totalEnrollments: number;
    totalTransactions: number;
    avgCourseRating: number;
    completionRate: number;
  };
  charts: {
    revenueByMonth: Array<{
      month: string;
      year: number;
      revenue: number;
      transactionCount: number;
    }>;
    revenueByCourseLevel: Array<{
      level: string;
      revenue: number;
      courseCount: number;
      percentage: number;
    }>;
    revenueByCategory: Array<{
      categoryId: string;
      categoryName: string;
      revenue: number;
      courseCount: number;
      percentage: number;
    }>;
  };
  highlights: {
    topCourses: Array<{
      id: string;
      title: string;
      revenue: number;
      studentCount: number;
      avgRating: number;
      instructor: {
        id: string;
        name: string;
        email: string;
      };
      category?: {
        id: string;
        name: string;
      };
    }>;
    topInstructors: Array<{
      id: string;
      name: string;
      email: string;
      image?: string;
      totalRevenue: number;
      totalCourses: number;
      totalStudents: number;
      avgRating: number;
      completionRate: number;
    }>;
    recentGrowth: {
      revenueGrowth: number;
      studentGrowth: number;
      courseGrowth: number;
    };
  };
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
}

export async function getDashboardStatistics(
  params: StatisticsParams = {},
): Promise<{
  success: boolean;
  data?: DashboardStatistics;
  error?: string;
  status: number;
}> {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return {
        success: false,
        error: "Không tìm thấy access token",
        status: 401,
      };
    }

    // Check if user is admin
    if (session.user?.role !== "ADMIN") {
      return {
        success: false,
        error: "Bạn không có quyền truy cập thống kê",
        status: 403,
      };
    }

    // Build query string
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.period) queryParams.append("period", params.period);

    const url = `${API_URL}/statistics/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error:
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    }

    const data = await response.json();

    return {
      success: true,
      data,
      status: 200,
    };
  } catch (error: any) {
    console.error("Dashboard statistics fetch error:", error);
    return {
      success: false,
      error: error.message || "Đã xảy ra lỗi khi tải dữ liệu thống kê",
      status: 500,
    };
  }
}

export async function getRevenueSummary(
  params: StatisticsParams = {},
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  status: number;
}> {
  try {
    const session = await auth();

    if (!session?.accessToken || session.user?.role !== "ADMIN") {
      return {
        success: false,
        error: "Không có quyền truy cập",
        status: 403,
      };
    }

    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.period) queryParams.append("period", params.period);

    const url = `${API_URL}/statistics/revenue-summary${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    const data = await response.json();

    return {
      success: true,
      data,
      status: 200,
    };
  } catch (error: any) {
    console.error("Revenue summary fetch error:", error);
    return {
      success: false,
      error: error.message || "Đã xảy ra lỗi khi tải dữ liệu doanh thu",
      status: 500,
    };
  }
}

export async function getInstructorsSummary(
  params: StatisticsParams = {},
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  status: number;
}> {
  try {
    const session = await auth();

    if (!session?.accessToken || session.user?.role !== "ADMIN") {
      return {
        success: false,
        error: "Không có quyền truy cập",
        status: 403,
      };
    }

    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const url = `${API_URL}/statistics/instructors-summary${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    const data = await response.json();

    return {
      success: true,
      data,
      status: 200,
    };
  } catch (error: any) {
    console.error("Instructors summary fetch error:", error);
    return {
      success: false,
      error: error.message || "Đã xảy ra lỗi khi tải dữ liệu giảng viên",
      status: 500,
    };
  }
}

export async function getStudentsSummary(
  params: StatisticsParams = {},
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  status: number;
}> {
  try {
    const session = await auth();

    if (!session?.accessToken || session.user?.role !== "ADMIN") {
      return {
        success: false,
        error: "Không có quyền truy cập",
        status: 403,
      };
    }

    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const url = `${API_URL}/statistics/students-summary${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    const data = await response.json();

    return {
      success: true,
      data,
      status: 200,
    };
  } catch (error: any) {
    console.error("Students summary fetch error:", error);
    return {
      success: false,
      error: error.message || "Đã xảy ra lỗi khi tải dữ liệu học viên",
      status: 500,
    };
  }
}
