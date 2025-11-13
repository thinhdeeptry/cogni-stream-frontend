"use client";

import { motion } from "framer-motion";
import { Check, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface LessonCompletionCardProps {
  isCompleted: boolean;
  onComplete: () => void;
  isLoading?: boolean;
}

export function LessonCompletionCard({
  isCompleted,
  onComplete,
  isLoading = false,
}: LessonCompletionCardProps) {
  if (isCompleted) {
    return (
      <motion.div
        className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <span className="font-medium">Bài học đã hoàn thành</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-green-800 mb-1">
            Hoàn thành bài học
          </h3>
          <p className="text-sm text-green-600">
            Đánh dấu bài học này là đã hoàn thành để tiếp tục học
          </p>
        </div>
        <Button
          onClick={onComplete}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          {isLoading ? "Đang xử lý..." : "Hoàn thành"}
        </Button>
      </div>
    </motion.div>
  );
}
