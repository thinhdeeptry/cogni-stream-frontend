import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  createProgress,
  getCompletedItems,
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
  syncCompletedLessons: () => Promise<void>;
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
        console.log("🔄 [ProgressStore] fetchInitialProgress called:", {
          enrollmentId,
        });

        if (!enrollmentId) {
          console.error(
            "❌ [ProgressStore] No enrollment ID provided for fetchInitialProgress",
          );
          set({ error: "No enrollment ID provided" });
          return;
        }

        try {
          const result = await getInitialProgress(enrollmentId);
          console.log(
            "📊 [ProgressStore] getInitialProgress API result:",
            result,
          );

          if (result.success && result.data) {
            console.log("✅ [ProgressStore] Setting initial progress data:", {
              progress: result.data.progress,
              currentLesson: result.data.currentLesson,
              lessonId: result.data.lessonId,
              completedLessonIds: result.data.completedLessonIds,
              completedItems: result.data.completedItems?.length || 0,
            });

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

            console.log(
              "🎯 [ProgressStore] Store state after fetchInitialProgress:",
              {
                progress: get().progress,
                completedLessonIds: get().completedLessonIds,
                currentLesson: get().currentLesson,
              },
            );
          } else {
            console.error(
              "❌ [ProgressStore] fetchInitialProgress failed:",
              result.message,
            );
            set({
              error: result.message || "Failed to fetch initial progress",
            });
          }
        } catch (error) {
          console.error(
            "❌ [ProgressStore] fetchInitialProgress error:",
            error,
          );
          set({ error: "Failed to fetch initial progress" });
        }
      },

      fetchOverallProgress: async () => {
        const { enrollmentId } = get();
        console.log("📊 [ProgressStore] fetchOverallProgress called:", {
          enrollmentId,
        });

        if (!enrollmentId) {
          console.error(
            "❌ [ProgressStore] No enrollment ID provided for fetchOverallProgress",
          );
          set({ error: "No enrollment ID provided" });
          return;
        }

        try {
          const result = await getOverallProgress(enrollmentId);
          console.log(
            "📊 [ProgressStore] getOverallProgress API result:",
            result,
          );

          if (result.success && result.data) {
            console.log("✅ [ProgressStore] Setting overall progress data:", {
              overallProgress: result.data.overallProgress,
              isCompleted: result.data.completed,
            });

            set({
              overallProgress: result.data.overallProgress,
              isCompleted: result.data.completed,
              error: null,
            });
          } else {
            console.error(
              "❌ [ProgressStore] fetchOverallProgress failed:",
              result.message,
            );
            set({
              error: result.message || "Failed to fetch overall progress",
            });
          }
        } catch (error) {
          console.error(
            "❌ [ProgressStore] fetchOverallProgress error:",
            error,
          );
          set({ error: "Failed to fetch overall progress" });
        }
      },

      updateLessonProgress: async (progressData) => {
        const { enrollmentId, completedLessonIds: currentCompletedIds } = get();
        console.log("🔄 [ProgressStore] updateLessonProgress called:", {
          enrollmentId,
          progressData,
          currentCompletedIds,
          "Store state before": {
            progress: get().progress,
            currentLesson: get().currentLesson,
            lessonId: get().lessonId,
            isCompleted: get().isCompleted,
          },
        });

        if (!enrollmentId) {
          console.error("❌ [ProgressStore] No enrollment ID provided");
          set({ error: "No enrollment ID provided" });
          return;
        }

        try {
          const result = await updateProgress(enrollmentId, progressData);
          console.log("📊 [ProgressStore] updateProgress API result:", result);

          if (result.success && result.data) {
            // Update completed lesson IDs if provided
            const updatedCompletedLessonIds =
              result.data.completedLessonIds || get().completedLessonIds;

            console.log("✅ [ProgressStore] Updating store state:", {
              "Previous completed IDs": get().completedLessonIds,
              "New completed IDs": updatedCompletedLessonIds,
              "Result data": result.data,
            });

            set({
              progress: result.data.progress,
              currentLesson: result.data.currentLesson,
              completedItems: result.data.completedItems,
              lessonId: result.data.lessonId,
              isCompleted: result.data.isCompleted,
              lastUpdated: result.data.lastUpdated,
              completedLessonIds: updatedCompletedLessonIds,
              error: null,
            });

            console.log("🔄 [ProgressStore] Store state after update:", {
              progress: get().progress,
              currentLesson: get().currentLesson,
              completedLessonIds: get().completedLessonIds,
              isCompleted: get().isCompleted,
            });

            // After updating lesson progress, fetch overall progress
            await get().fetchOverallProgress();
          } else {
            console.error("❌ [ProgressStore] Update failed:", result.message);
            set({ error: result.message || "Failed to update progress" });
          }
        } catch (error) {
          console.error("❌ [ProgressStore] Update error:", error);
          set({ error: "Failed to update progress" });
        }
      },
      createSyllabusProgress: async (currentSyllabusItemId?: string) => {
        const { enrollmentId } = get();
        console.log("🔄 [ProgressStore] createSyllabusProgress called:", {
          enrollmentId,
          currentSyllabusItemId,
        });

        if (!enrollmentId) {
          console.error(
            "❌ [ProgressStore] No enrollment ID provided for createSyllabusProgress",
          );
          set({ error: "No enrollment ID provided" });
          return;
        }

        try {
          const result = await createProgress(
            enrollmentId,
            currentSyllabusItemId,
          );
          console.log("📊 [ProgressStore] createProgress API result:", result);

          if (result.success && result.data) {
            console.log("✅ [ProgressStore] Setting created progress data:", {
              progress: result.data.progress,
              currentLesson: result.data.currentLesson,
              completedLessonIds: result.data.completedLessonIds,
            });

            set({
              progress: result.data.progress,
              currentLesson: result.data.currentLesson,
              completedItems: result.data.completedItems,
              lessonId: result.data.lessonId,
              isCompleted: result.data.isCompleted,
              lastUpdated: result.data.lastUpdated,
              completedLessonIds: result.data.completedLessonIds || [],
              error: null,
            });
            // After create lesson progress, fetch overall progress
            await get().fetchOverallProgress();
          } else {
            console.error(
              "❌ [ProgressStore] createSyllabusProgress failed:",
              result.message,
            );
            set({ error: result.message || "Failed to create progress" });
          }
        } catch (error) {
          console.error(
            "❌ [ProgressStore] createSyllabusProgress error:",
            error,
          );
          set({ error: "Failed to create progress" });
        }
      },

      syncCompletedLessons: async () => {
        const { enrollmentId } = get();
        console.log("🔄 [ProgressStore] syncCompletedLessons called:", {
          enrollmentId,
        });

        if (!enrollmentId) {
          console.error(
            "❌ [ProgressStore] No enrollment ID provided for syncCompletedLessons",
          );
          set({ error: "No enrollment ID provided" });
          return;
        }

        try {
          console.log(
            "📡 [ProgressStore] Syncing completed lessons for enrollment:",
            enrollmentId,
          );
          const completedItemsResponse = await getCompletedItems(enrollmentId);
          console.log(
            "📊 [ProgressStore] getCompletedItems API response:",
            completedItemsResponse,
          );

          if (
            completedItemsResponse.success &&
            completedItemsResponse.data?.data?.completedItems
          ) {
            const completedIds = completedItemsResponse.data.data.completedItems
              .filter((item: any) => item.lessonId || item.lesson?.id)
              .map((item: any) => item.lessonId || item.lesson?.id)
              .filter(Boolean);

            console.log("✅ [ProgressStore] Extracted completed lesson IDs:", {
              "Raw items": completedItemsResponse.data.data.completedItems,
              "Completed IDs": completedIds,
              "Previous store IDs": get().completedLessonIds,
            });

            set({
              completedLessonIds: completedIds,
              error: null,
            });

            console.log(
              "🎯 [ProgressStore] Store updated with completed lessons:",
              get().completedLessonIds,
            );
          } else {
            console.log(
              "⚠️ [ProgressStore] No completed items found or sync failed:",
              completedItemsResponse.message,
            );
          }
        } catch (error) {
          console.error(
            "❌ [ProgressStore] Error syncing completed lessons:",
            error,
          );
          set({ error: "Failed to sync completed lessons" });
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
