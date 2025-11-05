import { useCallback, useEffect, useRef, useState } from "react";

interface TimeTrackingOptions {
  itemId: string; // lesson ID hoặc syllabus item ID
  requiredMinutes: number; // Thời gian yêu cầu (phút)
  onTimeComplete?: () => void; // Callback khi đã học đủ thời gian
}

interface TimeTrackingState {
  elapsedSeconds: number; // Thời gian đã học (giây)
  isActive: boolean; // Đang tracking không
  isTimeComplete: boolean; // Đã học đủ thời gian chưa
  progress: number; // Phần trăm hoàn thành (0-100)
  remainingMinutes: number; // Số phút còn lại
}

export const useTimeTracking = (
  options: TimeTrackingOptions,
): TimeTrackingState & {
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
} => {
  const { itemId, requiredMinutes, onTimeComplete } = options;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);

  // Storage key for persistence - handle empty itemId
  const storageKey = itemId ? `time-tracking-${itemId}` : null;

  // Call completion callback when time is complete (only once)
  const onTimeCompleteRef = useRef(onTimeComplete);
  const hasCalledCompleteRef = useRef(false);
  onTimeCompleteRef.current = onTimeComplete;

  // Load saved time from localStorage
  useEffect(() => {
    if (!storageKey) return;

    // Reset completion flag when itemId changes
    hasCalledCompleteRef.current = false;

    const savedTime = localStorage.getItem(storageKey);
    if (savedTime) {
      const parsed = parseInt(savedTime, 10);
      if (!isNaN(parsed)) {
        setElapsedSeconds(parsed);
        pausedTimeRef.current = parsed;
      }
    }
  }, [storageKey]);

  // Save time to localStorage whenever it changes
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, elapsedSeconds.toString());
    }
  }, [elapsedSeconds, storageKey]);

  // Timer logic
  useEffect(() => {
    if (isActive && startTimeRef.current) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const newElapsed =
          Math.floor((now - startTimeRef.current!) / 1000) +
          pausedTimeRef.current;
        setElapsedSeconds(newElapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  // Calculate derived values
  const requiredSeconds = Math.max((requiredMinutes || 0) * 60, 1); // Minimum 1 second to avoid division by 0
  const isTimeComplete = elapsedSeconds >= requiredSeconds;
  const progress = Math.min((elapsedSeconds / requiredSeconds) * 100, 100);
  const remainingSeconds = Math.max(requiredSeconds - elapsedSeconds, 0);
  const remainingMinutes = Math.ceil(remainingSeconds / 60);

  // Debug logging - only in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("🕒 [useTimeTracking] State update:", {
        itemId,
        requiredMinutes,
        requiredSeconds,
        elapsedSeconds,
        isTimeComplete,
        progress: progress.toFixed(1) + "%",
        remainingMinutes,
        isActive,
      });
    }
  }, [
    itemId,
    requiredMinutes,
    elapsedSeconds,
    isTimeComplete,
    progress,
    remainingMinutes,
    isActive,
  ]);

  useEffect(() => {
    if (
      isTimeComplete &&
      onTimeCompleteRef.current &&
      !hasCalledCompleteRef.current
    ) {
      hasCalledCompleteRef.current = true;
      onTimeCompleteRef.current();
    }

    // Reset when time tracking is reset or itemId changes
    if (!isTimeComplete) {
      hasCalledCompleteRef.current = false;
    }
  }, [isTimeComplete]);

  // Control functions
  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsActive(true);
  }, []);

  const pause = useCallback(() => {
    if (isActive && startTimeRef.current) {
      const now = Date.now();
      const sessionTime = Math.floor((now - startTimeRef.current) / 1000);
      pausedTimeRef.current = pausedTimeRef.current + sessionTime;
      setElapsedSeconds(pausedTimeRef.current);
    }
    setIsActive(false);
    startTimeRef.current = null;
  }, [isActive]);

  const resume = useCallback(() => {
    if (!isActive) {
      startTimeRef.current = Date.now();
      setIsActive(true);
    }
  }, [isActive]);

  const reset = useCallback(() => {
    setElapsedSeconds(0);
    setIsActive(false);
    pausedTimeRef.current = 0;
    startTimeRef.current = null;
    hasCalledCompleteRef.current = false; // Reset completion flag
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [storageKey]);

  return {
    elapsedSeconds,
    isActive,
    isTimeComplete,
    progress,
    remainingMinutes,
    start,
    pause,
    resume,
    reset,
  };
};

// Utility functions
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export const formatTimeMinutes = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes} phút ${secs} giây`;
};
