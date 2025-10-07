/**
 * Admin Approval Actions
 * API functions for course, class, and lesson approval workflows
 */
import { auth } from "@/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
async function getAccessToken(): Promise<string> {
  // This will be called from client components that have session access
  const response = await fetch("/api/auth/session");
  const session = await response.json();

  if (!session?.accessToken) {
    throw new Error("Vui lòng đăng nhập lại");
  }

  return session.accessToken;
}
// Helper function to make authenticated API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get session from NextAuth for server-side authentication
  const accessToken = await getAccessToken();

  if (!accessToken) {
    throw new Error("Authentication required - no access token");
  }
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();

    // Handle specific error cases
    if (response.status === 401) {
      throw new Error("Unauthorized - token expired or invalid");
    }
    if (response.status === 403) {
      throw new Error("Forbidden - insufficient permissions");
    }
    if (response.status === 404) {
      throw new Error("Resource not found");
    }

    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// ==========================================
// COURSE APPROVAL ACTIONS
// ==========================================

export interface PendingCoursesParams {
  page?: number;
  limit?: number;
  sortBy?: "oldest" | "newest" | "instructor";
}

export interface PendingCoursesResponse {
  data: any[]; // Replace with proper Course type
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Get list of courses pending approval
 */
export async function getPendingCourses(
  params: PendingCoursesParams = {},
): Promise<PendingCoursesResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);

  return apiRequest(`/courses/pending/list?${searchParams}`);
}

/**
 * Approve a course
 */
export async function approveCourse(courseId: string): Promise<any> {
  return apiRequest(`/courses/${courseId}/approve`, {
    method: "POST",
  });
}

/**
 * Reject a course with reason
 */
export async function rejectCourse(
  courseId: string,
  data: { rejectionReason: string },
): Promise<any> {
  return apiRequest(`/courses/${courseId}/reject`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get course details for review
 */
export async function getCourseForReview(courseId: string): Promise<any> {
  return apiRequest(`/courses/${courseId}/review-details`);
}

// ==========================================
// CLASS APPROVAL ACTIONS
// ==========================================

export interface PendingClassesParams {
  page?: number;
  limit?: number;
  sortBy?: "oldest" | "newest" | "instructor" | "enrollment";
}

export interface PendingClassesResponse {
  data: any[]; // Replace with proper Class type
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Get list of classes pending approval for publication
 */
export async function getPendingClasses(
  params: PendingClassesParams = {},
): Promise<PendingClassesResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);

  return apiRequest(`/classes/pending/list?${searchParams}`);
}

/**
 * Approve a class for publication
 */
export async function approveClass(classId: string): Promise<any> {
  return apiRequest(`/classes/${classId}/approve`, {
    method: "POST",
  });
}

/**
 * Reject a class publication with reason
 */
export async function rejectClass(
  classId: string,
  data: { rejectionReason: string },
): Promise<any> {
  return apiRequest(`/classes/${classId}/reject`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get class details for review
 */
export async function getClassForReview(classId: string): Promise<any> {
  return apiRequest(`/classes/${classId}/review-details`);
}

// ==========================================
// LESSON APPROVAL ACTIONS
// ==========================================

export interface PendingLessonsParams {
  page?: number;
  limit?: number;
  sortBy?: "oldest" | "newest" | "instructor" | "course";
  type?: "VIDEO" | "BLOG" | "QUIZ" | "MIXED";
}

export interface PendingLessonsResponse {
  data: any[]; // Replace with proper Lesson type
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Get list of lessons pending approval
 */
export async function getPendingLessons(
  params: PendingLessonsParams = {},
): Promise<PendingLessonsResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.type) searchParams.set("type", params.type);

  return apiRequest(`/lessons/pending/list?${searchParams}`);
}

/**
 * Approve a lesson
 */
export async function approveLesson(lessonId: string): Promise<any> {
  return apiRequest(`/lessons/${lessonId}/approve`, {
    method: "POST",
  });
}

/**
 * Reject a lesson with reason
 */
export async function rejectLesson(
  lessonId: string,
  data: { rejectionReason: string },
): Promise<any> {
  return apiRequest(`/lessons/${lessonId}/reject`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get lesson details for review
 */
export async function getLessonForReview(lessonId: string): Promise<any> {
  return apiRequest(`/lessons/${lessonId}/review-details`);
}

// ==========================================
// APPROVAL STATS & OVERVIEW
// ==========================================

export interface ApprovalStats {
  summary: {
    totalPendingItems: number;
    totalPendingCourses: number;
    totalPendingClasses: number;
    totalPendingLessons: number;
    lastUpdated: string;
  };
  courses: {
    pendingApproval: number;
    approved: number;
    rejected: number;
    published: number;
    total: number;
    oldestPending: {
      id: string;
      title: string;
      submittedAt: string | null;
      daysPending: number;
      instructor: {
        name: string;
        email: string;
      };
    } | null;
  };
  classes: {
    pendingApproval: number;
    approved: number;
    rejected: number;
    published: number;
    total: number;
    oldestPending: {
      id: string;
      title: string;
      submittedAt: string | null;
      daysPending: number;
      instructor: {
        name: string;
        email: string;
      };
    } | null;
  };
  lessons: {
    pendingApproval: number;
    approved: number;
    rejected: number;
    published: number;
    total: number;
    oldestPending: {
      id: string;
      title: string;
      submittedAt: string | null;
      daysPending: number;
      instructor: {
        name: string;
        email: string;
      };
    } | null;
  };
  trends: {
    averageApprovalTime: {
      courses: number | null;
      classes: number | null;
      lessons: number | null;
    };
    dailySubmissions: {
      date: string;
      courses: number;
      classes: number;
      lessons: number;
      total: number;
    }[];
  };
  insights: {
    mostUrgent: {
      type: "course" | "class" | "lesson";
      id: string;
      title: string;
      daysPending: number;
    } | null;
    workloadDistribution: {
      light: boolean;
      moderate: boolean;
      heavy: boolean;
      recommendation: string;
    };
  };
}

/**
 * Get overall approval statistics
 */
export async function getApprovalStats(): Promise<ApprovalStats> {
  return apiRequest("/approvals/stats");
}

export interface RecentActivitiesResponse {
  activities: {
    id: string;
    type: "course" | "class" | "lesson";
    title: string;
    description: string;
    action: "submitted" | "approved" | "rejected";
    timestamp: string;
    status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "PUBLISHED";
    instructor: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
    reviewer: {
      id: string;
      name: string;
      email: string;
    } | null;
    rejectionReason?: string | null;
    course?: {
      id: string;
      title: string;
      category: string;
    };
    metadata: {
      counters: {
        chapters: number;
        enrollments: number;
      };
    };
  }[];
  pagination: {
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Get recent approval activities
 */
export async function getRecentApprovalActivities(
  limit: number = 10,
): Promise<RecentActivitiesResponse> {
  return apiRequest(`/approvals/recent-activities?limit=${limit}`);
}

// ==========================================
// BULK APPROVAL ACTIONS
// ==========================================

/**
 * Bulk approve multiple courses
 */
export async function bulkApproveCourses(courseIds: string[]): Promise<any> {
  return apiRequest("/courses/bulk-approve", {
    method: "POST",
    body: JSON.stringify({ courseIds }),
  });
}

/**
 * Bulk approve multiple classes
 */
export async function bulkApproveClasses(classIds: string[]): Promise<any> {
  return apiRequest("/classes/bulk-approve", {
    method: "POST",
    body: JSON.stringify({ classIds }),
  });
}

/**
 * Bulk approve multiple lessons
 */
export async function bulkApproveLessons(lessonIds: string[]): Promise<any> {
  return apiRequest("/lessons/bulk-approve", {
    method: "POST",
    body: JSON.stringify({ lessonIds }),
  });
}

// ==========================================
// NOTIFICATION ACTIONS
// ==========================================

/**
 * Send notification to instructor about approval/rejection
 */
export async function sendApprovalNotification(
  type: "course" | "class" | "lesson",
  itemId: string,
  status: "approved" | "rejected",
  message?: string,
): Promise<any> {
  return apiRequest("/admin/approvals/notify", {
    method: "POST",
    body: JSON.stringify({
      type,
      itemId,
      status,
      message,
    }),
  });
}

// ==========================================
// APPROVAL HISTORY & AUDIT
// ==========================================

export interface ApprovalHistory {
  id: string;
  type: "course" | "class" | "lesson";
  itemId: string;
  itemTitle: string;
  action: "approved" | "rejected";
  reason?: string;
  adminId: string;
  adminName: string;
  instructorId: string;
  instructorName: string;
  createdAt: string;
}

/**
 * Get approval history
 */
export async function getApprovalHistory(
  params: {
    page?: number;
    limit?: number;
    type?: "course" | "class" | "lesson";
    action?: "approved" | "rejected";
    adminId?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {},
): Promise<{
  data: ApprovalHistory[];
  meta: any;
}> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, value.toString());
    }
  });

  return apiRequest(`/admin/approvals/history?${searchParams}`);
}

/**
 * Export approval history to CSV
 */
export async function exportApprovalHistory(
  params: {
    type?: "course" | "class" | "lesson";
    action?: "approved" | "rejected";
    dateFrom?: string;
    dateTo?: string;
  } = {},
): Promise<Blob> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, value.toString());
    }
  });

  const response = await fetch(
    `${API_BASE_URL}/admin/approvals/export?${searchParams}`,
  );

  if (!response.ok) {
    throw new Error(`Export failed: ${response.status}`);
  }

  return response.blob();
}

// ==========================================
// ERROR HANDLING HELPERS
// ==========================================

export class ApprovalError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "ApprovalError";
  }
}

/**
 * Handle API errors with user-friendly messages
 */
export function handleApprovalError(error: any): string {
  if (error instanceof ApprovalError) {
    return error.message;
  }

  if (error.message?.includes("403")) {
    return "Bạn không có quyền thực hiện hành động này";
  }

  if (error.message?.includes("404")) {
    return "Không tìm thấy nội dung cần xét duyệt";
  }

  if (error.message?.includes("400")) {
    return "Dữ liệu không hợp lệ";
  }

  if (error.message?.includes("500")) {
    return "Lỗi hệ thống, vui lòng thử lại sau";
  }

  return error.message || "Có lỗi xảy ra, vui lòng thử lại";
}

// ==========================================
// HOOKS FOR REACT QUERY (Optional)
// ==========================================

// Example custom hooks if using React Query
/*
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function usePendingCourses(params: PendingCoursesParams = {}) {
  return useQuery({
    queryKey: ['pending-courses', params],
    queryFn: () => getPendingCourses(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useApproveCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: approveCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-courses'] });
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] });
    },
  });
}

export function useRejectCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ courseId, reason }: { courseId: string; reason: string }) =>
      rejectCourse(courseId, { rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-courses'] });
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] });
    },
  });
}
*/
