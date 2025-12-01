"use client";

import { motion } from "framer-motion";
import { Eye } from "lucide-react";

interface InstructorPreviewBannerProps {
  userRole?: string;
}

export function InstructorPreviewBanner({
  userRole,
}: InstructorPreviewBannerProps) {
  const isAdmin = userRole === "ADMIN";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-300 text-gray-950 p-4 mb-4 rounded-lg shadow-lg mx-2"
    >
      <div className="flex items-center justify-center gap-2">
        <Eye className="h-5 w-5" />
        <span className="font-medium">
          {isAdmin ? "Chế độ xem trước Admin" : "Chế độ xem trước Giảng viên"}
        </span>
      </div>
      <p className="text-center text-sm mt-1 opacity-90">
        Bạn đang xem lớp học với quyền{" "}
        {isAdmin ? "quản trị viên" : "giảng viên"}. Tiến trình học tập và thời
        gian học không được theo dõi.
      </p>
    </motion.div>
  );
}
