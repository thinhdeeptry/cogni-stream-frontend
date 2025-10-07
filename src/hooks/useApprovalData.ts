/**
 * Custom hook for approval store convenience functions
 * Provides computed values and helper functions for approval data
 */
import { useMemo } from "react";

import { useApprovalStore } from "@/stores/useApprovalStore";

export const useApprovalData = () => {
  const store = useApprovalStore();

  // Computed values
  const computedValues = useMemo(() => {
    const courses = store.coursesData?.data || [];
    const classes = store.classesData?.data || [];
    const lessons = store.lessonsData?.data || [];

    return {
      // Raw data arrays
      courses,
      classes,
      lessons,

      // Pagination meta
      coursesMeta: store.coursesData?.meta,
      classesMeta: store.classesData?.meta,
      lessonsMeta: store.lessonsData?.meta,

      // Counts
      coursesCount: courses.length,
      classesCount: classes.length,
      lessonsCount: lessons.length,
      totalPendingCount: courses.length + classes.length + lessons.length,

      // Helper arrays for UI
      allPendingItems: [
        ...courses.map((c) => ({ ...c, type: "course" as const })),
        ...classes.map((c) => ({ ...c, type: "class" as const })),
        ...lessons.map((l) => ({ ...l, type: "lesson" as const })),
      ].sort(
        (a, b) =>
          new Date(b.submittedAt || b.createdAt).getTime() -
          new Date(a.submittedAt || a.createdAt).getTime(),
      ),

      // Loading states
      isLoading:
        store.isLoadingCourses ||
        store.isLoadingClasses ||
        store.isLoadingLessons,
      hasData:
        store.coursesData !== null ||
        store.classesData !== null ||
        store.lessonsData !== null,
    };
  }, [
    store.coursesData,
    store.classesData,
    store.lessonsData,
    store.isLoadingCourses,
    store.isLoadingClasses,
    store.isLoadingLessons,
  ]);

  // Action helpers
  const actions = useMemo(
    () => ({
      // Fetch actions
      refreshCourses: (force = false) => store.fetchPendingCourses(force),
      refreshClasses: (force = false) => store.fetchPendingClasses(force),
      refreshLessons: (force = false) => store.fetchPendingLessons(force),
      refreshStats: (force = false) => store.fetchApprovalStats(force),
      refreshAll: () => store.refreshAllData(),

      // Approval actions
      approveCourse: (id: string) => store.handleApproveCourse(id),
      rejectCourse: (id: string, reason: string) =>
        store.handleRejectCourse(id, reason),
      approveClass: (id: string) => store.handleApproveClass(id),
      rejectClass: (id: string, reason: string) =>
        store.handleRejectClass(id, reason),
      approveLesson: (id: string) => store.handleApproveLesson(id),
      rejectLesson: (id: string, reason: string) =>
        store.handleRejectLesson(id, reason),

      // Utility
      isProcessing: (id: string) => store.isItemProcessing(id),
      clearCache: () => store.clearCache(),
    }),
    [store],
  );

  return {
    ...computedValues,
    ...actions,

    // Direct store access for complex scenarios
    stats: store.stats,
    recentActivities: store.recentActivities,
    isLoadingStats: store.isLoadingStats,
  };
};

export default useApprovalData;
