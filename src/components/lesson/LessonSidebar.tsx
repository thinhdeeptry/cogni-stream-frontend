"use client";

import Link from "next/link";

import { LessonType } from "@/types/course/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { Check, ChevronRight, Clock, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

interface LessonSidebarProps {
  course: any;
  lesson: any;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  expandedChapters: Record<string, boolean>;
  toggleChapter: (chapterId: string) => void;
  completedLessonIds: string[];
  allLessons: any[];
  params: { lessonId: string; courseId: string };
  lastLessonId: string | null;
  isEnrolled: boolean;
  isInstructorOrAdmin: boolean;
  isButtonEnabled: boolean;
  isQuizActivelyTaking?: boolean;
}

export function LessonSidebar({
  course,
  lesson,
  isSidebarOpen,
  setIsSidebarOpen,
  expandedChapters,
  toggleChapter,
  completedLessonIds,
  allLessons,
  params,
  lastLessonId,
  isEnrolled,
  isInstructorOrAdmin,
  isButtonEnabled,
  isQuizActivelyTaking = false,
}: LessonSidebarProps) {
  // Don't render sidebar if quiz is actively being taken
  if (isQuizActivelyTaking) {
    return null;
  }
  return (
    <>
      {/* Floating Toggle Button for Quiz on mobile when sidebar is closed */}
      {lesson.type === LessonType.QUIZ && !isSidebarOpen && (
        <div className="fixed top-20 right-4 z-50 md:hidden">
          <Button
            onClick={() => setIsSidebarOpen(true)}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Sidebar */}
      {(lesson.type !== LessonType.QUIZ || isSidebarOpen) && (
        <div
          className={`fixed right-0 top-0 h-[calc(100vh-73px)] w-[350px] bg-gray-50 border-l transform transition-transform duration-300 ${
            lesson.type === LessonType.QUIZ
              ? isSidebarOpen
                ? "translate-x-0"
                : "translate-x-full"
              : isSidebarOpen
                ? "translate-x-0"
                : "translate-x-full"
          } ${
            lesson.type === LessonType.QUIZ
              ? isSidebarOpen
                ? "z-50"
                : "z-10"
              : isSidebarOpen
                ? "z-40"
                : "z-10"
          }`}
        >
          <div className="py-4 px-2.5 pr-4 h-full overflow-auto">
            <div className="flex items-center justify-between mb-7">
              <h2 className="text-xl font-semibold">
                {lesson.type === LessonType.QUIZ
                  ? "Danh sách bài học"
                  : "Nội dung khoá học"}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-orange-50 hover:border-orange-200 transition-colors"
                onClick={() => setIsSidebarOpen(false)}
              >
                <ChevronRight className="h-5 w-5 text-orange-500" />
              </Button>
            </div>

            <div className="space-y-4">
              {course?.chapters?.map((chapter: any) => (
                <Collapsible
                  key={chapter.id}
                  open={expandedChapters[chapter.id]}
                  onOpenChange={() => toggleChapter(chapter.id)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200">
                    <div className="flex items-center gap-2 truncate">
                      <div className="text-gray-500 transition-transform duration-200">
                        {expandedChapters[chapter.id] ? (
                          <div className="transform transition-transform duration-200">
                            <Minus className="h-4 w-4 text-orange-500" />
                          </div>
                        ) : (
                          <Plus className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-700">
                        {chapter.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 pl-1">
                      <span className="text-sm text-gray-600 truncate">
                        {chapter.lessons?.length || 0} bài
                      </span>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="pl-4">
                    <ul className="mt-2 space-y-2">
                      {chapter.lessons?.map((chapterLesson: any) => {
                        if (chapterLesson.status !== "PUBLISHED") {
                          return null;
                        }

                        const isLessonCompleted = completedLessonIds.includes(
                          chapterLesson.id,
                        );

                        const currentLessonIndex = allLessons.findIndex(
                          (lessonItem) => lessonItem?.id === params.lessonId,
                        );
                        const lessonIndex = allLessons.findIndex(
                          (lessonItem) => lessonItem?.id === chapterLesson.id,
                        );

                        // Improved Logic accessibility lesson:
                        // 1. Instructor/Admin: access all
                        // 2. Enrolled users:
                        //    - First lesson (index 0): always accessible
                        //    - Completed lessons: always accessible
                        //    - Current lesson: always accessible
                        //    - Next lessons: only if ALL previous lessons are completed

                        let canAccessLesson = isInstructorOrAdmin;

                        if (!canAccessLesson && isEnrolled) {
                          // Check if this is the first lesson
                          if (lessonIndex === 0) {
                            canAccessLesson = true;
                          }
                          // Check if lesson is completed
                          else if (isLessonCompleted) {
                            canAccessLesson = true;
                          }
                          // Check if this is current lesson
                          else if (chapterLesson.id === params.lessonId) {
                            canAccessLesson = true;
                          }
                          // For other lessons, check if all previous lessons are completed
                          else {
                            const previousLessons = allLessons.slice(
                              0,
                              lessonIndex,
                            );
                            const allPreviousCompleted = previousLessons.every(
                              (prevLesson) =>
                                prevLesson?.id &&
                                completedLessonIds.includes(prevLesson.id),
                            );
                            canAccessLesson = allPreviousCompleted;
                          }
                        }

                        // Debug log for lesson accessibility
                        console.log(
                          `🔍 [LessonAccess] Lesson "${chapterLesson.title}" (${chapterLesson.id}):`,
                          {
                            lessonIndex,
                            currentLessonIndex,
                            isCompleted: isLessonCompleted,
                            isCurrentLesson:
                              chapterLesson.id === params.lessonId,
                            canAccess: canAccessLesson,
                            isFirstLesson: lessonIndex === 0,
                            completedLessonIds: completedLessonIds,
                            allLessons: allLessons.length,
                          },
                        );

                        const linkContent = (
                          <div className="flex items-center gap-2 min-h-[32px]">
                            <div className="flex-shrink-0">
                              {isLessonCompleted ? (
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              ) : chapterLesson.id === params.lessonId ? (
                                <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                  <Clock className="w-3 h-3 text-white" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <span
                                className={`block truncate text-[15px] ${
                                  chapterLesson.id === params.lessonId
                                    ? "font-medium text-orange-600"
                                    : ""
                                } ${!canAccessLesson ? "text-gray-400 cursor-not-allowed" : "text-gray-700"}`}
                              >
                                {chapterLesson.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {/* Hiển thị đơn giản - chỉ cần icon tích xanh cho bài hoàn thành */}
                            </div>
                          </div>
                        );

                        return canAccessLesson ? (
                          <Link
                            href={`/course/${course ? course.id : ""}/lesson/${chapterLesson.id}`}
                            key={chapterLesson.id}
                            className={`block p-2 rounded-lg transition-colors ${
                              chapterLesson.id === params.lessonId
                                ? "bg-orange-100"
                                : "hover:bg-gray-200"
                            } cursor-pointer`}
                            onClick={() => {
                              if (window.innerWidth < 768) {
                                setIsSidebarOpen(false);
                              }
                            }}
                          >
                            {linkContent}
                          </Link>
                        ) : (
                          <div
                            key={chapterLesson.id}
                            className={`block p-2 rounded-lg transition-colors ${
                              chapterLesson.id === params.lessonId
                                ? "bg-orange-100"
                                : "bg-gray-50"
                            } cursor-not-allowed opacity-60`}
                            title={`Bài học bị khóa. Hãy hoàn thành tất cả các bài học trước đó để mở khóa. (Vị trí: ${lessonIndex + 1}/${allLessons.length})`}
                          >
                            {linkContent}
                          </div>
                        );
                      })}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
