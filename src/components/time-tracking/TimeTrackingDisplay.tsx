import React from "react";

import { formatTime } from "@/hooks/useTimeTracking";
import { Check, Pause, Play, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface TimeTrackingDisplayProps {
  elapsedSeconds: number;
  requiredMinutes: number;
  progress: number;
  remainingMinutes: number;
  isTimeComplete: boolean;
  isActive: boolean;
  onPause: () => void;
  onResume: () => void;
  variant?: "lesson" | "session";
  className?: string;
}

export const TimeTrackingDisplay: React.FC<TimeTrackingDisplayProps> = ({
  elapsedSeconds,
  requiredMinutes,
  progress,
  remainingMinutes,
  isTimeComplete,
  isActive,
  onPause,
  onResume,
  variant = "lesson",
  className = "",
}) => {
  const isLesson = variant === "lesson";
  const colorScheme = isLesson
    ? {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
        textLight: "text-blue-700",
        textLighter: "text-blue-600",
        button: "text-blue-600 border-blue-300 hover:bg-blue-100",
        progressBg: "bg-blue-200",
      }
    : {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-800",
        textLight: "text-orange-700",
        textLighter: "text-orange-600",
        button: "text-orange-600 border-orange-300 hover:bg-orange-100",
        progressBg: "bg-orange-200",
      };

  const activityLabel = isLesson ? "học tập" : "tham gia buổi học";
  const timeLabel = isLesson ? "đã học" : "đã tham gia";
  const remainingLabel = isLesson
    ? "để hoàn thành bài học"
    : "để hoàn thành buổi học";
  const completeLabel = isLesson
    ? "Đã học đủ thời gian yêu cầu"
    : "Đã tham gia đủ thời gian yêu cầu";

  return (
    <div
      className={`p-4 ${colorScheme.bg} border ${colorScheme.border} rounded-lg ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3
          className={`font-semibold ${colorScheme.text} flex items-center gap-2`}
        >
          <Timer className="h-5 w-5" />
          Thời gian {activityLabel}
        </h3>
        <div className="flex items-center gap-2">
          {isActive ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onPause}
              className={colorScheme.button}
            >
              <Pause className="h-4 w-4 mr-1" />
              Tạm dừng
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onResume}
              className={colorScheme.button}
            >
              <Play className="h-4 w-4 mr-1" />
              Tiếp tục
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div
          className={`flex justify-between text-sm ${colorScheme.textLight}`}
        >
          <span>
            Thời gian {timeLabel}: {formatTime(elapsedSeconds)}
          </span>
          <span>Yêu cầu: {requiredMinutes} phút</span>
        </div>

        <Progress
          value={progress}
          className={`w-full h-2 ${colorScheme.progressBg}`}
        />

        {!isTimeComplete && (
          <p className={`text-sm ${colorScheme.textLighter}`}>
            Còn lại: {remainingMinutes} phút {remainingLabel}
          </p>
        )}

        {isTimeComplete && (
          <p className="text-sm text-green-600 font-medium flex items-center gap-1">
            <Check className="h-4 w-4" />
            {completeLabel}
          </p>
        )}
      </div>
    </div>
  );
};
