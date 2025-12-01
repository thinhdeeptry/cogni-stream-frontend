"use client";

import Link from "next/link";

import { Course, Lesson } from "@/types/course/types";
import { motion } from "framer-motion";
import { ChevronRight, Eye } from "lucide-react";

interface LessonHeaderProps {
  course: Course | null;
  lesson: Lesson | null;
  isInstructorOrAdmin: boolean;
  userRole?: string;
}

const slideUp = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

export function LessonHeader({
  course,
  lesson,
  isInstructorOrAdmin,
  userRole,
}: LessonHeaderProps) {
  return (
    <>
      {/* Instructor/Admin Preview Banner */}
      {isInstructorOrAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-300 text-gray-950 p-4 mb-4 rounded-lg shadow-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <Eye className="h-5 w-5" />
            <span className="font-medium">
              {userRole === "ADMIN"
                ? "Chế độ xem trước Admin"
                : "Chế độ xem trước Giảng viên"}
            </span>
          </div>
          <p className="text-center text-sm mt-1 opacity-90">
            Bạn đang xem bài học với quyền{" "}
            {userRole === "ADMIN" ? "quản trị viên" : "giảng viên"}. Tiến trình
            học tập và thời gian học không được theo dõi.
          </p>
        </motion.div>
      )}

      {/* Course Navigation Breadcrumb */}
      <motion.div
        variants={slideUp}
        className="flex flex-col md:flex-row md:items-center text-sm text-gray-500 px-0 pt-4 gap-1 md:gap-0"
      >
        {/* Course path - always on top */}
        <div className="flex items-center">
          <Link href="/" className="hover:text-orange-500 transition-colors">
            Khóa học
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link
            href={course ? `/course/${course.id}` : "#"}
            className="hover:text-orange-500 transition-colors"
          >
            {course?.title}
          </Link>
          <ChevronRight className="h-4 w-4 mx-2 hidden md:block" />
        </div>

        {/* Lesson title - mobile: new line, desktop: same line */}
        <div className="flex items-center md:ml-0">
          <ChevronRight className="h-4 w-4 mr-2 md:hidden" />
          <span className="text-gray-700 font-medium truncate">
            {lesson?.title}
          </span>
        </div>
      </motion.div>
    </>
  );
}
