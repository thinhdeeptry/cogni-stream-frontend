"use client";

import { useState } from "react";

import { LessonType } from "@/types/course/types";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import ReactPlayer from "react-player";

import QuizSection from "@/components/quiz/QuizSection";
import { Card, CardContent } from "@/components/ui/card";

import { Block, BlockContentRenderer } from "./BlockContentRenderer";

interface LessonContentProps {
  lesson: any;
  enrollmentId: string | null;
  isEnrolled: boolean;
  isInstructorOrAdmin: boolean;
  courseId: string;
  onQuizCompleted?: (success: boolean) => void;
  onNavigateToLesson?: (targetLessonId: string) => void;
  onNavigateToNextIncomplete?: () => void;
  onQuizStateChange?: (isActivelyTaking: boolean) => void;
  onCourseCompletion?: () => void;
}

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export function LessonContent({
  lesson,
  enrollmentId,
  isEnrolled,
  isInstructorOrAdmin,
  courseId,
  onQuizCompleted,
  onNavigateToLesson,
  onNavigateToNextIncomplete,
  onQuizStateChange,
  onCourseCompletion,
}: LessonContentProps) {
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  // Parse lesson content for BLOG or MIXED types
  let contentBlocks: Block[] = [];
  if (
    lesson?.content &&
    typeof lesson.content === "string" &&
    (lesson.type === LessonType.BLOG || lesson.type === LessonType.MIXED)
  ) {
    try {
      const trimmedContent = lesson.content.trim();
      if (
        trimmedContent &&
        (trimmedContent[0] === "[" || trimmedContent[0] === "{")
      ) {
        contentBlocks = JSON.parse(lesson.content);
      } else {
        console.warn("Lesson content is not in JSON format:", lesson.content);
      }
    } catch (error) {
      console.error("Error parsing lesson content:", error);
    }
  }

  return (
    <>
      {/* Video Content for VIDEO or MIXED */}
      {(lesson.type === LessonType.VIDEO || lesson.type === LessonType.MIXED) &&
        lesson.videoUrl && (
          <motion.div
            variants={slideUp}
            className="relative rounded-lg overflow-hidden shadow-lg w-full max-w-full"
            style={{ aspectRatio: "16/9" }}
          >
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/30 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white mt-4 font-medium">
                    Đang tải video...
                  </p>
                </div>
              </div>
            )}
            <ReactPlayer
              url={lesson.videoUrl}
              controls={true}
              onReady={() => setIsVideoLoading(false)}
              onBuffer={() => setIsVideoLoading(true)}
              onBufferEnd={() => setIsVideoLoading(false)}
              config={{
                youtube: {
                  playerVars: { showinfo: 1 },
                },
              }}
              className="react-player"
              width="100%"
              height="100%"
            />
          </motion.div>
        )}

      {/* Lesson Content for non-Quiz lessons */}
      {lesson.type !== LessonType.QUIZ && (
        <motion.div
          variants={slideUp}
          className="prose max-w-none pb-16 w-full"
        >
          <Card className="overflow-hidden border-none shadow-md rounded-xl w-full">
            <CardContent className="p-4 sm:p-6 w-full">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent inline-block mb-4 items-center">
                <BookOpen className="w-6 h-6 mr-2 text-orange-500" />
                Nội dung bài học
              </h1>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {lesson.order}
                </span>
                <span>{lesson.title}</span>
              </h2>

              {/* Render Parsed Content for BLOG or MIXED */}
              {(lesson.type === LessonType.BLOG ||
                lesson.type === LessonType.MIXED) &&
                contentBlocks.length > 0 && (
                  <BlockContentRenderer blocks={contentBlocks} />
                )}

              {/* Fallback for VIDEO-only or empty content */}
              {lesson.type === LessonType.VIDEO && !lesson.videoUrl && (
                <p className="text-md text-gray-500">
                  Không có nội dung video.
                </p>
              )}
              {(lesson.type === LessonType.BLOG ||
                lesson.type === LessonType.MIXED) &&
                contentBlocks.length === 0 && (
                  <p className="text-md text-gray-500">
                    Không có nội dung bài viết.
                  </p>
                )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quiz Section - Only show for QUIZ type lessons */}
      {lesson.type === LessonType.QUIZ && (
        <motion.div variants={slideUp} className="mt-6 sm:mt-8 pb-16 w-full">
          <div className="max-w-none prose-headings:text-gray-900 prose-p:text-gray-700">
            {enrollmentId || isInstructorOrAdmin ? (
              <QuizSection
                lessonId={lesson.id}
                enrollmentId={enrollmentId || ""}
                lessonTitle={lesson.title}
                isEnrolled={isEnrolled}
                courseId={courseId}
                isInstructorOrAdmin={isInstructorOrAdmin}
                onQuizCompleted={onQuizCompleted}
                onNavigateToLesson={onNavigateToLesson}
                onNavigateToNextIncomplete={onNavigateToNextIncomplete}
                onQuizStateChange={onQuizStateChange}
                onCourseCompletion={onCourseCompletion}
              />
            ) : (
              <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
}
