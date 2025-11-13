"use client";

import { motion } from "framer-motion";
import { Check, Pause, Play, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface TimeTrackingCardProps {
  isActive: boolean;
  elapsedSeconds: number;
  progress: number;
  remainingMinutes: number;
  isTimeComplete: boolean;
  requiredMinutes: number;
  onPause: () => void;
  onResume: () => void;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export function TimeTrackingCard({
  isActive,
  elapsedSeconds,
  progress,
  remainingMinutes,
  isTimeComplete,
  requiredMinutes,
  onPause,
  onResume,
}: TimeTrackingCardProps) {
  return (
    <motion.div
      className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg -mt-10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-blue-800 flex items-center gap-2">
          <Timer className="h-5 w-5" />
          Thời gian học tập
        </h3>
        <div className="flex items-center gap-2">
          {isActive ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onPause}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              <Pause className="h-4 w-4 mr-1" />
              Tạm dừng
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onResume}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              <Play className="h-4 w-4 mr-1" />
              Tiếp tục
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-blue-700">
          <span>Thời gian đã học: {formatTime(elapsedSeconds)}</span>
          <span>Yêu cầu: {requiredMinutes} phút</span>
        </div>

        <Progress value={progress} className="w-full h-2 bg-blue-200" />

        {!isTimeComplete ? (
          <p className="text-sm text-blue-600">
            Còn lại: {remainingMinutes} phút để hoàn thành bài học
          </p>
        ) : (
          <p className="text-sm text-green-600 font-medium flex items-center gap-1">
            <Check className="h-4 w-4" />
            Đã học đủ thời gian yêu cầu
          </p>
        )}
      </div>
    </motion.div>
  );
}
