"use client";

import { useRouter } from "next/navigation";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

interface ClassHeaderProps {
  currentItemTitle?: string;
  className: string;
  day?: number;
  courseId: string;
}

export function ClassHeader({
  currentItemTitle,
  className,
  day,
  courseId,
}: ClassHeaderProps) {
  const router = useRouter();

  return (
    <motion.div
      className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between sticky top-0 z-10"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            {currentItemTitle}
          </h1>
          <p className="text-sm text-gray-600">
            {className} {day && `- Ngày ${day}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/course/${courseId}`)}
        >
          Thông tin khóa học
        </Button>
      </div>
    </motion.div>
  );
}
