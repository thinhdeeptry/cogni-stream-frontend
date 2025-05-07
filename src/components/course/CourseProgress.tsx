import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import { useProgressStore } from "@/stores/useProgressStore";

import { Progress } from "@/components/ui/progress";

export default function CourseProgress() {
  const { overallProgress } = useProgressStore();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate progress from current to target value
    const timer = setTimeout(() => {
      setProgress(overallProgress || 0);
    }, 100);

    return () => clearTimeout(timer);
  }, [overallProgress]);

  if (typeof overallProgress !== "number") return null;

  return (
    <div className="flex items-center gap-3 w-[200px] group relative">
      <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-200 to-orange-100 opacity-50" />

        {/* Progress bar */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-500 to-orange-400"
          style={{
            width: `${progress}%`,
            transition: "width 0.5s ease-out",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {/* Shine effect */}
        <motion.div
          className="absolute top-0 bottom-0 w-4 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      </div>

      {/* Percentage display with pop effect on change */}
      <motion.div
        key={progress}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "text-xs font-medium w-[45px] text-center",
          progress === 100 ? "text-orange-500" : "text-gray-600",
        )}
      >
        {Math.round(progress)}%
      </motion.div>

      {/* Tooltip */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Tiến độ khóa học
      </div>
    </div>
  );
}
