"use client";

import Link from "next/link";
import { useState } from "react";

import { formatTime } from "@/hooks/useTimeTracking";
import { LessonType } from "@/types/course/types";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

import {
  getEnrollmentByCourse,
  markCourseAsCompleted,
} from "@/actions/enrollmentActions";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LessonNavigationBarProps {
  enrollmentId: any;
  lesson: any;
  course: any;
  previousLesson: any;
  nextLesson: any;
  isButtonEnabled: boolean;
  isEnrolled: boolean;
  currentLessonIndex: number;
  allLessons: any[];
  hasCertificate: boolean;
  certificateId: string | null;
  timeTracking: any;
  forceRender: number;
  isQuizActivelyTaking: boolean;
  onLessonCompletion: () => void;
  onCourseCompletion: () => void;
  handleCourseCompletion: () => void;
  onSidebarToggle: () => void;
  router: any;
  onUpdateCertificate?: (
    hasCertificate: boolean,
    certificateId: string | null,
  ) => void;
}

export function LessonNavigationBar({
  enrollmentId,
  lesson,
  course,
  previousLesson,
  nextLesson,
  isButtonEnabled,
  isEnrolled,
  currentLessonIndex,
  allLessons,
  hasCertificate,
  certificateId,
  timeTracking,
  forceRender,
  isQuizActivelyTaking,
  onLessonCompletion,
  onCourseCompletion,
  handleCourseCompletion,
  onSidebarToggle,
  router,
  onUpdateCertificate,
}: LessonNavigationBarProps) {
  // Don't show navigation during active quiz
  if (lesson.type === LessonType.QUIZ && isQuizActivelyTaking) {
    return null;
  }
  console.log(
    "hasCertificate:",
    hasCertificate,
    "certificateId:",
    certificateId,
    "nextLesson:",
    nextLesson,
    "isButtonEnabled:",
    isButtonEnabled,
  );
  console.log("isButtonEnabled:", isButtonEnabled);
  const isLastLesson = currentLessonIndex === allLessons.length - 1;
  // const [enrollmentId, setEnrollmentId] = useState<string>("id");
  const handleLessonCompletionWithCertCheck = async () => {
    try {
      // Cập nhật certificate status trước khi complete lesson
      const response = await getEnrollmentByCourse(course.id);
      console.log("CHỗ này nè, response enrollment:", response);
      const newHasCertificate = response.data?.data?.isHasCertificate
        ? true
        : false;
      const newCertificateId = response.data?.data?.certificate?.id || null;
      // setEnrollmentId(response.data?.data?.enrollment.id || null);
      enrollmentId = response.data?.data?.enrollment.id || null;
      console.log("Certificate status after lesson completion:", {
        enrollmentId: response.data?.data?.enrollment.id,
        hasCertificate: newHasCertificate,
        certificateId: newCertificateId,
      });

      // Cập nhật state của component cha
      if (onUpdateCertificate) {
        onUpdateCertificate(newHasCertificate, newCertificateId);
      }

      // Gọi lesson completion
      await onLessonCompletion();
    } catch (error) {
      console.error("Error updating certificate status:", error);
      // Vẫn tiếp tục với lesson completion nếu có lỗi
      await onLessonCompletion();
    }
  };

  const handleViewCertificate = async () => {
    if (certificateId) {
      router.push(`/certificate/${certificateId}`);
    }
    const response = await markCourseAsCompleted(enrollmentId);
    console.log("Course completion response:", response);
    if (response.data?.data?.certificate?.id) {
      router.push(`/certificate/${response.data?.data?.certificate?.id}`);
    }
  };
  console.log("nextLesson", nextLesson);
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t px-6 py-3 z-1"
    >
      <div className="flex items-center justify-center gap-4">
        {/* Previous Lesson Button */}
        {previousLesson ? (
          <Link
            href={
              course ? `/course/${course.id}/lesson/${previousLesson.id}` : "#"
            }
          >
            <Button
              variant="outline"
              className="w-40 group transition-all duration-300 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50"
            >
              <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Bài trước
            </Button>
          </Link>
        ) : (
          <Button variant="outline" className="w-40 opacity-50" disabled>
            <ChevronLeft className="mr-2 h-4 w-4" /> Bài trước
          </Button>
        )}

        {/* Next/Complete Button Logic */}

        {nextLesson ? (
          isButtonEnabled ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  key={`next-lesson-btn-enabled-${forceRender}`}
                  className="w-40 transition-all duration-300 group bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                >
                  Học tiếp{" "}
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-xl border-none shadow-xl">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                      Xác nhận hoàn thành bài học
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-gray-600 mt-2">
                      {isEnrolled &&
                      lesson.type !== LessonType.QUIZ &&
                      timeTracking.isTimeComplete &&
                      lesson.estimatedDurationMinutes ? (
                        <>
                          Bạn đã học {formatTime(timeTracking.elapsedSeconds)} /{" "}
                          {lesson.estimatedDurationMinutes} phút yêu cầu.
                          <br />
                          Hãy đảm bảo rằng bạn đã nắm vững kiến thức trước khi
                          chuyển sang bài tiếp theo.
                        </>
                      ) : lesson.type === LessonType.QUIZ ? (
                        "Bạn đã hoàn thành quiz này chưa? Hãy đảm bảo rằng bạn đã đạt điểm yêu cầu để chuyển sang bài tiếp theo."
                      ) : (
                        "Bạn đã hoàn thành bài học này chưa? Hãy đảm bảo rằng bạn đã nắm vững kiến thức trước khi chuyển sang bài tiếp theo."
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex gap-3 mt-4">
                    <AlertDialogCancel className="w-full">
                      Chưa, tôi cần học lại
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLessonCompletionWithCertCheck}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                    >
                      Đã hoàn thành, học tiếp
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </motion.div>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      className="w-40 bg-gray-300 text-gray-500 cursor-not-allowed transition-all duration-300"
                      disabled={true}
                    >
                      Học tiếp <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Bạn cần học ít nhất {lesson?.estimatedDurationMinutes || 5}{" "}
                    phút để hoàn thành bài học này
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        ) : isEnrolled && isLastLesson ? (
          // Last lesson - Course completion
          hasCertificate ? (
            <Button
              className="w-40 bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 group"
              onClick={handleViewCertificate}
            >
              Xem bằng{" "}
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : isButtonEnabled ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  key={`complete-course-btn-enabled-${forceRender}`}
                  className="w-40 transition-all duration-300 group bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                >
                  Hoàn thành{" "}
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-xl border-none shadow-xl">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                      Chúc mừng bạn đã hoàn thành khóa học!
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-gray-600 mt-2">
                      Bạn đã hoàn thành toàn bộ bài học trong khóa. Bạn có thể
                      quay lại trang khóa học để xem lại nội dung hoặc khám phá
                      các khóa học khác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex gap-3 mt-4">
                    <AlertDialogCancel className="w-full">
                      Ở lại trang này
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCourseCompletion}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                    >
                      Hoàn thành khóa học
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </motion.div>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      className="w-40 bg-gray-300 text-gray-500 cursor-not-allowed transition-all duration-300"
                      disabled={true}
                    >
                      Hoàn thành <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Bạn cần học ít nhất {lesson?.estimatedDurationMinutes || 5}{" "}
                    phút để hoàn thành bài học này
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        ) : (
          <Button variant="outline" className="w-40 opacity-50" disabled>
            Học tiếp
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Chapter name and sidebar toggle */}
      <div className="absolute top-1/4 right-4 flex items-center">
        <span className="text-md text-gray-600 font-semibold pr-2 hidden sm:block">
          {course?.chapters?.find((chapter: any) =>
            chapter.lessons?.some(
              (chapterLesson: any) => chapterLesson.id === lesson.id,
            ),
          )?.title || ""}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="bg-white border shadow-sm hover:bg-orange-50 hover:border-orange-200 transition-colors"
          onClick={onSidebarToggle}
        >
          <Menu className="h-4 w-4 text-orange-500" />
        </Button>
      </div>
    </motion.div>
  );
}
