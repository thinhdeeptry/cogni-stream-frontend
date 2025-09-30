// "use server";
import { AxiosFactory } from "@/lib/axios";

import { getQuestions } from "./assessmentAction";

const quizApi = await AxiosFactory.getApiInstance("courses");

// ===== QUIZ MANAGEMENT APIs =====

export interface QuizStatus {
  canAttempt: boolean /** Học viên có thể làm bài quiz không */;
  reason: string /** Lý do không thể làm bài (nếu có) */;
  attemptsUsed: number /** Số lần đã làm bài */;
  maxAttempts:
    | number
    | null /** Số lần làm bài tối đa (null = không giới hạn) */;
  timeLimit:
    | number
    | null /** Thời gian giới hạn làm bài (phút, null = không giới hạn) */;
  retryDelay:
    | number
    | null /** Thời gian chờ giữa các lần làm (phút, null = không có) */;
  passPercent: number /** Phần trăm điểm cần để qua bài */;
  lastScore: number /** Điểm số lần làm gần nhất (0 nếu chưa từng làm) */;
  bestScore: number /** Điểm cao nhất trong các lần làm */;
  isPassed: boolean /** Đã qua bài quiz chưa */;
  timeUntilNextAttempt:
    | number
    | null /** Số phút còn lại đến lần làm tiếp theo (null = có thể làm ngay) */;
  nextAllowedAt:
    | string
    | null /** Thời gian (ISO string) được phép làm tiếp (null = có thể làm ngay) */;
  isBlocked: boolean /** Có đang bị chặn làm bài không */;
  blockedUntil:
    | string
    | null /** Thời gian hết bị chặn (ISO string, null = không bị chặn) */;
  blockedReason?: string /** Lý do bị chặn (nếu có) */;
  requireUnlockAction: boolean /** Có yêu cầu hành động mở khóa trước khi làm không */;
  unlockRequirements: any[] /** Danh sách điều kiện để mở khóa quiz */;
  lesson: {
    /** Thông tin bài học liên quan quiz */ id: string;
    title: string;
    description: string | null;
    blockAfterMaxAttempts: boolean;
    blockDuration: number | null;
  };
  unlockRequirementsSummary: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    allCompleted: boolean;
  };
}

export interface QuizAttempt {
  id: string;
  attemptNumber: number;
  timeLimit: number | null; // in minutes
  nextAllowedAt: string | null;
  lesson?: {
    id: string;
    title: string;
    description: string | null;
    passPercent: number;
  };
  startedAt: string;
  questions?: QuizQuestion[]; // Optional since we fetch separately
}

export interface QuizQuestion {
  id: string;
  text: string;
  type:
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE"
    | "SHORT_ANSWER"
    | "ESSAY"
    | "FILL_IN_BLANK";
  order: number;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  text: string;
}

export interface QuizSubmission {
  answers: Array<{
    questionId: string;
    answerId?: string[]; // Luôn là array cho cả SINGLE_CHOICE và MULTIPLE_CHOICE
    textAnswer?: string;
  }>;
}

export interface QuizResult {
  score: number;
  isPassed: boolean;
  attemptNumber: number;
  timeSpent: number; // in minutes
  canRetry: boolean;
  nextAllowedAt: string | null;
  results: Array<{
    questionId: string;
    isCorrect: boolean;
    score: number;
    feedback: string;
  }>;
}

export interface QuizHistory {
  attempts: Array<{
    id: string;
    attemptNumber: number;
    score: number;
    isPassed: boolean;
    timeSpent: number;
    submittedAt: string;
    canRetry: boolean;
    nextAllowedAt: string | null;
  }>;
  bestScore: number;
  totalAttempts: number;
  isPassed: boolean;
}

/**
 * Kiểm tra trạng thái quiz attempt của học viên
 */
export async function getQuizStatus(lessonId: string): Promise<{
  success: boolean;
  data?: QuizStatus;
  message: string;
}> {
  try {
    const { data } = await quizApi.get(`/quizzes/lesson/${lessonId}/status`);
    return {
      success: true,
      data: data as QuizStatus,
      message: "Lấy trạng thái quiz thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi lấy trạng thái quiz";
    console.error("Error fetching quiz status:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Bắt đầu quiz attempt
 */
export async function startQuizAttempt(lessonId: string): Promise<{
  success: boolean;
  data?: QuizAttempt;
  message: string;
}> {
  try {
    const { data } = await quizApi.post(`/quizzes/attempt/${lessonId}/start`);
    return {
      success: true,
      data: data as QuizAttempt,
      message: "Bắt đầu quiz thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi bắt đầu quiz";
    console.error("Error starting quiz attempt:", errorMessage);

    // Handle specific error cases
    if (error.response?.status === 409) {
      return {
        success: false,
        message: "Bạn đã hết số lần làm bài cho phép",
      };
    }

    if (error.response?.status === 423) {
      return {
        success: false,
        message: "Bạn cần chờ trước khi làm lại bài quiz",
      };
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Submit quiz attempt
 */
export async function submitQuizAttempt(
  attemptId: string,
  submission: QuizSubmission,
): Promise<{
  success: boolean;
  data?: QuizResult;
  message: string;
}> {
  try {
    const { data } = await quizApi.post(
      `/quizzes/attempt/${attemptId}/submit`,
      submission,
    );
    return {
      success: true,
      data: data as QuizResult,
      message: "Nộp bài quiz thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi nộp bài quiz";
    console.error("Error submitting quiz:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Lấy lịch sử quiz attempts của học viên
 */
export async function getQuizHistory(
  lessonId: string,
  studentId?: string,
): Promise<{
  success: boolean;
  data?: QuizHistory;
  message: string;
}> {
  try {
    const params = studentId ? { studentId } : {};
    const { data } = await quizApi.get(`/quizzes/attempts/lesson/${lessonId}`, {
      params,
    });
    return {
      success: true,
      data: data as QuizHistory,
      message: "Lấy lịch sử quiz thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi lấy lịch sử quiz";
    console.error("Error fetching quiz history:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Cập nhật cài đặt quiz cho lesson (dành cho instructor/admin)
 */
export async function updateQuizSettings(
  lessonId: string,
  settings: {
    timeLimit?: number | null;
    maxAttempts?: number | null;
    retryDelay?: number | null;
    passPercent?: number;
  },
): Promise<{
  success: boolean;
  data?: any;
  message: string;
}> {
  try {
    const { data } = await quizApi.patch(
      `/lessons/${lessonId}/quiz-settings`,
      settings,
    );
    return {
      success: true,
      data: data.settings,
      message: "Cập nhật cài đặt quiz thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi cập nhật cài đặt quiz";
    console.error("Error updating quiz settings:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Format thời gian từ phút sang text dễ đọc
 */
export function formatTimeLimit(minutes: number | null): string {
  if (!minutes) return "Không giới hạn";

  if (minutes < 60) {
    return `${minutes} phút`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} giờ`;
  }

  return `${hours} giờ ${remainingMinutes} phút`;
}

/**
 * Format thời gian chờ từ ISO string
 */
export function formatWaitTime(nextAllowedAt: string | null): string {
  if (!nextAllowedAt) return "";

  const now = new Date();
  const nextTime = new Date(nextAllowedAt);
  const diffMs = nextTime.getTime() - now.getTime();

  if (diffMs <= 0) return "";

  const diffMinutes = Math.ceil(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    return `${diffMinutes} phút`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (minutes === 0) {
    return `${hours} giờ`;
  }

  return `${hours} giờ ${minutes} phút`;
}

/**
 * Kiểm tra xem học viên có thể làm quiz không
 */
export function canStartQuiz(
  status: QuizStatus,
  isComfirmRequirement?: boolean,
): boolean {
  if (isComfirmRequirement) return true;
  return (
    status.canAttempt &&
    (!status.nextAllowedAt || new Date(status.nextAllowedAt) <= new Date())
  );
}

/**
 * Tính phần trăm điểm
 */
export function calculateScorePercentage(
  score: number,
  maxScore: number = 100,
): number {
  return Math.round((score / maxScore) * 100);
}

/**
 * Mở khóa quiz sau khi hoàn thành unlock requirements
 */
export async function unlockQuiz(lessonId: string): Promise<{
  success: boolean;
  data?: any;
  message: string;
}> {
  try {
    const { data } = await quizApi.post(`/quizzes/lesson/${lessonId}/unlock`);
    return {
      success: true,
      data: data,
      message: "Mở khóa quiz thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi mở khóa quiz";
    console.error("Error unlocking quiz:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Đánh dấu hoàn thành một yêu cầu unlock
 */
export async function completeUnlockRequirement(
  lessonId: string,
  classId: string,
  requirementId: string,
  completionData?: any,
): Promise<{
  success: boolean;
  data?: any;
  message: string;
}> {
  try {
    const { data } = await quizApi.post(
      `/quizzes/unlock-requirement/${requirementId}/classId/${classId}/lessonId/${lessonId}/complete`,
    );
    return {
      success: true,
      data: data,
      message: "Hoàn thành yêu cầu unlock thành công",
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Đã xảy ra lỗi khi xác nhận hoàn thành yêu cầu";
    console.error("Error completing unlock requirement:", errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Lấy danh sách câu hỏi quiz với pagination
 */
export async function getQuizQuestions(
  lessonId: string,
  page: number = 1,
  limit: number = 1,
): Promise<{
  success: boolean;
  data?: {
    questions: QuizQuestion[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
}> {
  try {
    const filter = {
      lessonId,
      page,
      limit,
      // Bỏ type filter vì có thể không cần thiết
    };

    const result = await getQuestions(filter);

    if (result.success && result.data) {
      // Convert format từ assessment questions sang quiz questions
      const quizQuestions: QuizQuestion[] = result.data.data.map(
        (q: any, index: number) => ({
          id: q.id,
          text: q.text, // HTML content từ tinyMCE
          type: q.type,
          order: index + 1,
          answers: q.answers.map((a: any) => ({
            id: a.id,
            text: a.text, // HTML content từ tinyMCE
          })),
        }),
      );

      return {
        success: true,
        data: {
          questions: quizQuestions,
          total: result.data.meta.total,
          page: result.data.meta.page,
          limit: result.data.meta.limit,
          totalPages: result.data.meta.totalPages,
        },
        message: "Lấy câu hỏi quiz thành công",
      };
    }

    return {
      success: false,
      message: result.message,
    };
  } catch (error: any) {
    console.error("Error fetching quiz questions:", error);
    return {
      success: false,
      message: "Đã xảy ra lỗi khi lấy câu hỏi quiz",
    };
  }
}
