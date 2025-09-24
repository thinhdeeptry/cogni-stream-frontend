// Quiz Status và Response Types
export interface QuizStatusResponse {
  canAttempt: boolean;
  reason: string | null;

  // Thông tin attempts
  attemptsLeft: number;
  totalAttempts: number;
  nextAllowedAt: Date | null;

  // Thông tin blocking
  isBlocked: boolean;
  blockedUntil: Date | null;
  blockedReason: string | null;
  requireUnlockAction: boolean;

  // Unlock requirements (nếu bị khóa và cần unlock)
  unlockRequirements: UnlockRequirement[];

  // Quiz settings
  timeLimit: number | null;
  lastScore: number | null;
}

export interface UnlockRequirement {
  id: string;
  type: "WATCH_LESSON" | "COMPLETE_QUIZ" | "WAIT_TIME";
  title: string;
  description?: string;
  isRequired: boolean;
  isCompleted: boolean;
  progress: number;
  targetLessonId?: string;
  targetQuizId?: string;
  waitTimeMinutes?: number;
}

export interface QuizAttempt {
  id: string;
  attemptId: string; // Added attemptId for API compatibility
  lessonId: string;
  userId: string;
  attemptNumber: number;
  startedAt: Date;
  submittedAt?: Date;
  timeLimit?: number;
  answers: Record<string, string | string[]>;
  score?: number;
  passed?: boolean;
  status: "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";
}

export interface QuizResult {
  id: string;
  score: number;
  isPassed: boolean; // Changed from 'passed' to 'isPassed' for consistency
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: Date;
  timeSpent: number;
  feedback?: string;
  canRetry?: boolean; // Added canRetry field
  nextAllowedAt?: Date; // Added nextAllowedAt field
}

export interface QuizHistory {
  attempts: QuizAttempt[];
  bestScore: number | null;
  averageScore: number | null;
  totalAttempts: number;
  passedAttempts: number;
}

export interface QuizStatus {
  canAttempt: boolean;
  reason?: string;
  attemptsLeft: number;
  attemptsUsed: number; // Added attemptsUsed field
  totalAttempts: number;
  nextAllowedAt?: Date;
  isBlocked: boolean;
  blockedUntil?: Date;
  requireUnlockAction: boolean;
  unlockRequirements: UnlockRequirement[];
  timeLimit?: number;
  lastScore?: number;
  isPassed?: boolean; // Added isPassed field
}

export interface Question {
  id: string;
  text: string;
  type:
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE"
    | "SHORT_ANSWER"
    | "ESSAY"
    | "FILL_IN_BLANK";
  order: number;
  points: number;
  answers: Answer[];
  explanation?: string;
  isRequired: boolean;
}

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
  explanation?: string;
}

export interface QuizSubmission {
  answers: Array<{
    questionId: string;
    answerId?: string;
    textAnswer?: string;
  }>;
}

// Quiz Messages
export const QUIZ_MESSAGES = {
  retryDelay: (minutes: number) =>
    `Bạn cần chờ ${minutes} phút nữa mới có thể làm lại`,
  blockedTemporary: (time: string, maxAttempts: number) =>
    `Quiz bị khóa đến ${time} do đã hết ${maxAttempts} lần làm`,
  blockedPermanent:
    "Quiz bị khóa vĩnh viễn. Hoàn thành các yêu cầu bên dưới để mở khóa",
  unlockProgress: (completed: number, total: number) =>
    `Đã hoàn thành ${completed}/${total} yêu cầu mở khóa`,
  maxAttempts: (maxAttempts: number) =>
    `Bạn đã hết ${maxAttempts} lần làm bài cho quiz này`,
  timeWarning: {
    critical: "Sắp hết giờ!",
    warning: "Còn ít thời gian",
    normal: "Thời gian còn lại",
  },
};
