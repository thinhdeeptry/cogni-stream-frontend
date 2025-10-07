/**
 * Zustand Store for Approval System
 * Centralized state management for courses, classes, lessons approval data
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";

import {
  type ApprovalStats as APIApprovalStats,
  type PendingClassesResponse,
  type PendingCoursesResponse,
  type PendingLessonsResponse,
  type RecentActivitiesResponse,
  approveClass,
  approveCourse,
  approveLesson,
  getApprovalStats,
  getPendingClasses,
  getPendingCourses,
  getPendingLessons,
  getRecentApprovalActivities,
  rejectClass,
  rejectCourse,
  rejectLesson,
} from "@/actions/approvalActions";

export interface Course {
  id: string;
  title: string;
  description: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "PUBLISHED";
  instructor: {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
    headline?: string;
    avgRating?: number;
    totalRatings?: number;
  };
  createdAt: string;
  submittedAt: string;
  thumbnail?: string;
  category?: string;
  difficulty?: string;
  estimatedDuration?: number;
  price?: number;
  rejectionReason?: string;
}

export interface Class {
  id: string;
  title: string;
  description: string;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  statusActive: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "PUBLISHED";
  instructor: {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
    headline?: string;
  };
  schedule: {
    startDate: string;
    endDate: string;
    time: string;
  };
  maxStudents: number;
  currentStudents: number;
  createdAt: string;
  submittedAt: string;
  rejectionReason?: string;
  courseId: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: "VIDEO" | "BLOG" | "QUIZ" | "MIXED";
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "PUBLISHED";
  instructor: {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
    headline?: string;
  };
  content: {
    videoUrl?: string;
    blogContent?: string;
    quizData?: any;
    attachments?: string[];
  };
  duration?: number;
  createdAt: string;
  submittedAt: string;
  rejectionReason?: string;
  courseId: string;
  order: number;
}

// Updated ApprovalStats to match actual API response
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

export interface RecentActivity {
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
}

interface ApprovalStore {
  // State - using API response types
  coursesData: PendingCoursesResponse | null;
  classesData: PendingClassesResponse | null;
  lessonsData: PendingLessonsResponse | null;
  stats: ApprovalStats | null;
  recentActivities: RecentActivity[];

  // Loading states
  isLoadingCourses: boolean;
  isLoadingClasses: boolean;
  isLoadingLessons: boolean;
  isLoadingStats: boolean;

  // Processing states
  processingItems: Set<string>;

  // Last fetch timestamps
  lastCourseFetch: number | null;
  lastClassFetch: number | null;
  lastLessonFetch: number | null;
  lastStatsFetch: number | null;

  // Cache duration (5 minutes)
  CACHE_DURATION: number;

  // Actions
  fetchPendingCourses: (force?: boolean) => Promise<void>;
  fetchPendingClasses: (force?: boolean) => Promise<void>;
  fetchPendingLessons: (force?: boolean) => Promise<void>;
  fetchApprovalStats: (force?: boolean) => Promise<void>;
  fetchRecentActivities: (force?: boolean) => Promise<void>;

  // Course actions
  handleApproveCourse: (courseId: string) => Promise<void>;
  handleRejectCourse: (courseId: string, reason: string) => Promise<void>;

  // Class actions
  handleApproveClass: (classId: string) => Promise<void>;
  handleRejectClass: (classId: string, reason: string) => Promise<void>;

  // Lesson actions
  handleApproveLesson: (lessonId: string) => Promise<void>;
  handleRejectLesson: (lessonId: string, reason: string) => Promise<void>;

  // Utility actions
  refreshAllData: () => Promise<void>;
  clearCache: () => void;
  isItemProcessing: (itemId: string) => boolean;
}

export const useApprovalStore = create<ApprovalStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      coursesData: null,
      classesData: null,
      lessonsData: null,
      stats: null,
      recentActivities: [],

      // Loading states
      isLoadingCourses: false,
      isLoadingClasses: false,
      isLoadingLessons: false,
      isLoadingStats: false,

      // Processing states
      processingItems: new Set<string>(),

      // Cache timestamps
      lastCourseFetch: null,
      lastClassFetch: null,
      lastLessonFetch: null,
      lastStatsFetch: null,

      // Cache duration: 5 minutes
      CACHE_DURATION: 5 * 60 * 1000,

      // Fetch pending courses
      fetchPendingCourses: async (force = false) => {
        const { lastCourseFetch, CACHE_DURATION } = get();
        const now = Date.now();

        // Check cache validity
        if (
          !force &&
          lastCourseFetch &&
          now - lastCourseFetch < CACHE_DURATION
        ) {
          return;
        }

        set({ isLoadingCourses: true });

        try {
          const coursesData = await getPendingCourses({
            page: 1,
            limit: 20,
            sortBy: "newest",
          });
          set({
            coursesData,
            lastCourseFetch: now,
            isLoadingCourses: false,
          });
        } catch (error) {
          console.error("Error fetching pending courses:", error);
          set({ isLoadingCourses: false });
        }
      },

      // Fetch pending classes
      fetchPendingClasses: async (force = false) => {
        const { lastClassFetch, CACHE_DURATION } = get();
        const now = Date.now();

        if (!force && lastClassFetch && now - lastClassFetch < CACHE_DURATION) {
          return;
        }

        set({ isLoadingClasses: true });

        try {
          const classesData = await getPendingClasses();
          set({
            classesData,
            lastClassFetch: now,
            isLoadingClasses: false,
          });
        } catch (error) {
          console.error("Error fetching pending classes:", error);
          set({ isLoadingClasses: false });
        }
      },

      // Fetch pending lessons
      fetchPendingLessons: async (force = false) => {
        const { lastLessonFetch, CACHE_DURATION } = get();
        const now = Date.now();

        if (
          !force &&
          lastLessonFetch &&
          now - lastLessonFetch < CACHE_DURATION
        ) {
          return;
        }

        set({ isLoadingLessons: true });

        try {
          const lessonsData = await getPendingLessons();
          set({
            lessonsData,
            lastLessonFetch: now,
            isLoadingLessons: false,
          });
        } catch (error) {
          console.error("Error fetching pending lessons:", error);
          set({ isLoadingLessons: false });
        }
      },

      // Fetch approval stats
      fetchApprovalStats: async (force = false) => {
        const { lastStatsFetch, CACHE_DURATION } = get();
        const now = Date.now();

        if (!force && lastStatsFetch && now - lastStatsFetch < CACHE_DURATION) {
          return;
        }

        set({ isLoadingStats: true });

        try {
          const [stats, recentActivitiesData] = await Promise.all([
            getApprovalStats(),
            getRecentApprovalActivities(10),
          ]);

          set({
            stats,
            recentActivities: recentActivitiesData.activities,
            lastStatsFetch: now,
            isLoadingStats: false,
          });
        } catch (error) {
          console.error("Error fetching approval stats:", error);
          set({ isLoadingStats: false });
        }
      },

      // Fetch recent activities
      fetchRecentActivities: async (force = false) => {
        const { lastStatsFetch, CACHE_DURATION } = get();
        const now = Date.now();

        if (!force && lastStatsFetch && now - lastStatsFetch < CACHE_DURATION) {
          return;
        }

        try {
          const recentActivitiesData = await getRecentApprovalActivities(10);
          set({ recentActivities: recentActivitiesData.activities });
        } catch (error) {
          console.error("Error fetching recent activities:", error);
        }
      },

      // Course approval actions
      handleApproveCourse: async (courseId: string) => {
        const { processingItems } = get();

        set({
          processingItems: new Set([...processingItems, courseId]),
        });

        try {
          await approveCourse(courseId);

          // Refresh data after approval
          get().fetchPendingCourses(true);
          get().fetchApprovalStats(true);
          get().fetchRecentActivities(true);
        } catch (error) {
          console.error("Error approving course:", error);
          set((state) => ({
            processingItems: new Set(
              [...state.processingItems].filter((id) => id !== courseId),
            ),
          }));
          throw error;
        }
      },

      handleRejectCourse: async (courseId: string, reason: string) => {
        const { processingItems } = get();

        set({
          processingItems: new Set([...processingItems, courseId]),
        });

        try {
          await rejectCourse(courseId, { rejectionReason: reason });

          // Refresh data after rejection
          get().fetchPendingCourses(true);
          get().fetchApprovalStats(true);
          get().fetchRecentActivities(true);
        } catch (error) {
          console.error("Error rejecting course:", error);
          set((state) => ({
            processingItems: new Set(
              [...state.processingItems].filter((id) => id !== courseId),
            ),
          }));
          throw error;
        }
      },

      // Class approval actions
      handleApproveClass: async (classId: string) => {
        const { processingItems } = get();

        set({
          processingItems: new Set([...processingItems, classId]),
        });

        try {
          await approveClass(classId);

          get().fetchPendingClasses(true);
          get().fetchApprovalStats(true);
          get().fetchRecentActivities(true);
        } catch (error) {
          console.error("Error approving class:", error);
          set((state) => ({
            processingItems: new Set(
              [...state.processingItems].filter((id) => id !== classId),
            ),
          }));
          throw error;
        }
      },

      handleRejectClass: async (classId: string, reason: string) => {
        const { processingItems } = get();

        set({
          processingItems: new Set([...processingItems, classId]),
        });

        try {
          await rejectClass(classId, { rejectionReason: reason });

          get().fetchPendingClasses(true);
          get().fetchApprovalStats(true);
          get().fetchRecentActivities(true);
        } catch (error) {
          console.error("Error rejecting class:", error);
          set((state) => ({
            processingItems: new Set(
              [...state.processingItems].filter((id) => id !== classId),
            ),
          }));
          throw error;
        }
      },

      // Lesson approval actions
      handleApproveLesson: async (lessonId: string) => {
        const { processingItems } = get();

        set({
          processingItems: new Set([...processingItems, lessonId]),
        });

        try {
          await approveLesson(lessonId);

          get().fetchPendingLessons(true);
          get().fetchApprovalStats(true);
          get().fetchRecentActivities(true);
        } catch (error) {
          console.error("Error approving lesson:", error);
          set((state) => ({
            processingItems: new Set(
              [...state.processingItems].filter((id) => id !== lessonId),
            ),
          }));
          throw error;
        }
      },

      handleRejectLesson: async (lessonId: string, reason: string) => {
        const { processingItems } = get();

        set({
          processingItems: new Set([...processingItems, lessonId]),
        });

        try {
          await rejectLesson(lessonId, { rejectionReason: reason });

          get().fetchPendingLessons(true);
          get().fetchApprovalStats(true);
          get().fetchRecentActivities(true);
        } catch (error) {
          console.error("Error rejecting lesson:", error);
          set((state) => ({
            processingItems: new Set(
              [...state.processingItems].filter((id) => id !== lessonId),
            ),
          }));
          throw error;
        }
      },

      // Utility actions
      refreshAllData: async () => {
        await Promise.all([
          get().fetchPendingCourses(true),
          get().fetchPendingClasses(true),
          get().fetchPendingLessons(true),
          get().fetchApprovalStats(true),
          get().fetchRecentActivities(true),
        ]);
      },

      clearCache: () => {
        set({
          lastCourseFetch: null,
          lastClassFetch: null,
          lastLessonFetch: null,
          lastStatsFetch: null,
        });
      },

      isItemProcessing: (itemId: string) => {
        return get().processingItems.has(itemId);
      },
    }),
    {
      name: "approval-store",
    },
  ),
);
