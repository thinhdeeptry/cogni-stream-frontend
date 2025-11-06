import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  createProgress,
  getInitialProgress,
  getOverallProgress,
  updateProgress,
  verifyCourseCompletion,
} from "@/actions/progressActions";

interface ProgressState {
  enrollmentId: string | null;
  currentCourseId: string | null;
  progress: number;
  currentLesson: string;
  lessonId: string;
  isLessonCompleted: boolean;
  lastUpdated: string;
  overallProgress: number;
  isCompleted: boolean;
  status: string;
  currentProgress: any;
  completedLessonIds: string[];
  completedItems: any;
  error: string | null;

  // Actions
  setEnrollmentId: (enrollmentId: string) => void;
  setCurrentCourseId: (courseId: string | null) => void;
  clearProgress: () => void;
  fetchInitialProgress: () => Promise<void>;
  fetchOverallProgress: () => Promise<void>;
  createSyllabusProgress: (currentSyllabusItemId?: string) => Promise<void>;
  updateLessonProgress: (progressData: {
    progress: number;
    currentProgressId: string;
    nextLesson?: string;
    nextLessonId?: string;
    nextSyllabusItemId?: string;
    isLessonCompleted: boolean;
  }) => Promise<void>;
  verifyCompletion: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      // Initial state
      enrollmentId: null,
      currentCourseId: null,
      progress: 0,
      currentLesson: "",
      lessonId: "",
      isLessonCompleted: false,
      lastUpdated: "",
      overallProgress: 0,
      isCompleted: false,
      status: "",
      currentProgress: null,
      completedLessonIds: [],
      completedItems: null,
      error: null,

      // Actions
      setEnrollmentId: (enrollmentId) => {
        const currentEnrollmentId = get().enrollmentId;

        // Clear progress data when switching to different enrollment
        if (currentEnrollmentId && currentEnrollmentId !== enrollmentId) {
          set({
            enrollmentId,
            progress: 0,
            currentLesson: "",
            lessonId: "",
            isLessonCompleted: false,
            lastUpdated: "",
            overallProgress: 0,
            isCompleted: false,
            status: "",
            currentProgress: null,
            completedItems: null,
            error: null,
          });
        } else {
          set({ enrollmentId });
        }
      },
      setCurrentCourseId: (courseId) => set({ currentCourseId: courseId }),

      clearProgress: () =>
        set({
          enrollmentId: null,
          currentCourseId: null,
          progress: 0,
          currentLesson: "",
          lessonId: "",
          isLessonCompleted: false,
          lastUpdated: "",
          overallProgress: 0,
          isCompleted: false,
          status: "",
          completedLessonIds: [],
          currentProgress: null,
          completedItems: null,
          error: null,
        }),

      fetchInitialProgress: async () => {
        const { enrollmentId } = get();
        if (!enrollmentId) {
          set({ error: "No enrollment ID provided" });
          return;
        }

        try {
          const result = await getInitialProgress(enrollmentId);
          console.log("Initial progress result:", result);
          if (result.success && result.data) {
            set({
              progress: result.data.progress,
              currentLesson: result.data.currentLesson,
              completedItems: result.data.completedItems,
              lessonId: result.data.lessonId,
              isLessonCompleted: result.data.isLessonCompleted,
              lastUpdated: result.data.lastUpdated,
              currentProgress: result.data.currentProgress,
              completedLessonIds: result.data.completedLessonIds || [],
              error: null,
            });
          } else {
            set({
              error: result.message || "Failed to fetch initial progress",
            });
          }
        } catch (error) {
          set({ error: "Failed to fetch initial progress" });
        }
      },

      fetchOverallProgress: async () => {
        const { enrollmentId } = get();
        if (!enrollmentId) {
          set({ error: "No enrollment ID provided" });
          return;
        }

        try {
          const result = await getOverallProgress(enrollmentId);
          if (result.success && result.data) {
            set({
              overallProgress: result.data.overallProgress,
              isCompleted: result.data.completed,
              // status: result.data.status,
              error: null,
            });
          } else {
            set({
              error: result.message || "Failed to fetch overall progress",
            });
          }
        } catch (error) {
          set({ error: "Failed to fetch overall progress" });
        }
      },

      updateLessonProgress: async (progressData) => {
        const { enrollmentId } = get();
        if (!enrollmentId) {
          set({ error: "No enrollment ID provided" });
          return;
        }

        try {
          const result = await updateProgress(enrollmentId, progressData);
          if (result.success && result.data) {
            set({
              progress: result.data.progress,
              currentLesson: result.data.currentLesson,
              completedItems: result.data.completedItems,
              lessonId: result.data.lessonId,
              isCompleted: result.data.isCompleted,
              lastUpdated: result.data.lastUpdated,
              error: null,
            });
            // After updating lesson progress, fetch overall progress
            await get().fetchOverallProgress();
          } else {
            set({ error: result.message || "Failed to update progress" });
          }
        } catch (error) {
          set({ error: "Failed to update progress" });
        }
      },
      createSyllabusProgress: async (currentSyllabusItemId?: string) => {
        const { enrollmentId } = get();
        if (!enrollmentId) {
          set({ error: "No enrollment ID provided" });
          return;
        }

        try {
          const result = await createProgress(
            enrollmentId,
            currentSyllabusItemId,
          );
          if (result.success && result.data) {
            set({
              progress: result.data.progress,
              currentLesson: result.data.currentLesson,
              completedItems: result.data.completedItems,
              lessonId: result.data.lessonId,
              isCompleted: result.data.isCompleted,
              lastUpdated: result.data.lastUpdated,
              error: null,
            });
            // After create lesson progress, fetch overall progress
            await get().fetchOverallProgress();
          } else {
            set({ error: result.message || "Failed to create progress" });
          }
        } catch (error) {
          set({ error: "Failed to create progress" });
        }
      },
      verifyCompletion: async () => {
        const { enrollmentId } = get();
        if (!enrollmentId) {
          set({ error: "No enrollment ID provided" });
          return;
        }

        try {
          const result = await verifyCourseCompletion(enrollmentId);
          if (result.success && result.data) {
            set({
              isCompleted: result.data,
              error: null,
            });
          } else {
            set({ error: result.message || "Failed to verify completion" });
          }
        } catch (error) {
          set({ error: "Failed to verify completion" });
        }
      },
    }),
    {
      name: "progress-storage",
    },
  ),
);
