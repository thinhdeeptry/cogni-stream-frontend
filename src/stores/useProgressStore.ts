import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
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
  error: string | null;

  // Actions
  setEnrollmentId: (enrollmentId: string) => void;
  setCurrentCourseId: (courseId: string | null) => void;
  clearProgress: () => void;
  fetchInitialProgress: () => Promise<void>;
  fetchOverallProgress: () => Promise<void>;
  updateLessonProgress: (progressData: {
    progress: number;
    currentProgressId: string;
    nextLesson: string;
    nextLessonId: string;
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
      error: null,

      // Actions
      setEnrollmentId: (enrollmentId) => set({ enrollmentId }),
      setCurrentCourseId: (courseId) => set({ currentCourseId: courseId }),

      clearProgress: () =>
        set({
          enrollmentId: null,
          progress: 0,
          currentLesson: "",
          lessonId: "",
          isLessonCompleted: false,
          lastUpdated: "",
          overallProgress: 0,
          isCompleted: false,
          status: "",
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
          console.log("res của lấy progress detail: ", result);
          if (result.success && result.data) {
            console.log(
              "Setting progress state with currentProgress:",
              result.data.currentProgress,
            );
            set({
              progress: result.data.progress,
              currentLesson: result.data.currentLesson,
              lessonId: result.data.lessonId,
              isLessonCompleted: result.data.isLessonCompleted,
              lastUpdated: result.data.lastUpdated,
              currentProgress: result.data.currentProgress,
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
              lessonId: result.data.lessonId,
              isLessonCompleted: result.data.isLessonCompleted,
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
