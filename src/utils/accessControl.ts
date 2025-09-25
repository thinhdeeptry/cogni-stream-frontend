/**
 * Utility functions for controlling access to lessons and course items
 */

/**
 * Check if a user can access a lesson based on enrollment status and completion of previous lessons
 * @param lesson - The lesson to check access for
 * @param lessonIndex - Index of the lesson in the course
 * @param isEnrolled - Whether the user is enrolled in the course
 * @param allLessons - Array of all lessons in order
 * @param progress - User's progress data
 * @returns boolean indicating if the lesson can be accessed
 */
export const canAccessLesson = (
  lesson: any,
  lessonIndex: number,
  isEnrolled: boolean,
  allLessons: any[],
  progress: any[],
): boolean => {
  // Nếu là preview, luôn cho phép truy cập
  if (lesson.isFreePreview) {
    return true;
  }

  // Nếu chưa đăng ký, chỉ cho phép truy cập preview
  if (!isEnrolled) {
    return false;
  }

  // Nếu đã đăng ký, kiểm tra tuần tự
  // Cho phép truy cập bài học hiện tại và các bài đã hoàn thành trước đó
  if (lessonIndex === 0) {
    return true; // Bài đầu tiên luôn được phép
  }

  // Kiểm tra xem tất cả bài học trước đó đã hoàn thành chưa
  for (let i = 0; i < lessonIndex; i++) {
    const prevLesson = allLessons[i];
    if (!prevLesson) continue;

    // Bỏ qua bài preview khi kiểm tra completion
    if (prevLesson.isFreePreview) continue;

    // Kiểm tra xem bài học trước đó đã hoàn thành chưa
    const isCompleted =
      progress && Array.isArray(progress)
        ? progress.some(
            (p: any) => p.lessonId === prevLesson.id && p.isCompleted === true,
          )
        : false;

    if (!isCompleted) {
      return false; // Nếu có bài trước chưa hoàn thành, không cho phép truy cập
    }
  }

  return true;
};

/**
 * Check if a user can access a syllabus item based on enrollment status and completion of previous items
 * @param item - The syllabus item to check access for
 * @param itemIndex - Index of the item in the syllabus
 * @param isEnrolled - Whether the user is enrolled in the course
 * @param allItems - Array of all syllabus items in order
 * @param progress - User's progress data
 * @returns boolean indicating if the item can be accessed
 */
export const canAccessSyllabusItem = (
  item: any,
  itemIndex: number,
  isEnrolled: boolean,
  allItems: any[],
  progress: any[],
): boolean => {
  // Nếu chưa đăng ký, không cho phép truy cập bất kỳ item nào
  if (!isEnrolled) {
    return false;
  }

  // Bài đầu tiên luôn được phép truy cập
  if (itemIndex === 0) {
    return true;
  }

  // Kiểm tra xem tất cả các item trước đó đã hoàn thành chưa
  for (let i = 0; i < itemIndex; i++) {
    const prevItem = allItems[i];
    if (!prevItem) continue;

    // Kiểm tra xem item trước đó đã hoàn thành chưa
    const isCompleted =
      progress && Array.isArray(progress)
        ? progress.some(
            (p: any) =>
              p.syllabusItemId === prevItem.id && p.isCompleted === true,
          )
        : false;

    if (!isCompleted) {
      return false; // Nếu có item trước chưa hoàn thành, không cho phép truy cập
    }
  }

  return true;
};

/**
 * Get access control messages for UI feedback
 */
export const getAccessControlMessage = (isEnrolled: boolean) => {
  if (!isEnrolled) {
    return {
      title: "Chưa đăng ký",
      description: "Bạn cần đăng ký khóa học để truy cập nội dung này",
    };
  } else {
    return {
      title: "Chưa hoàn thành bài trước",
      description: "Bạn cần hoàn thành các bài học trước đó để mở khóa bài này",
    };
  }
};
