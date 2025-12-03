"use client";

import { useEffect, useMemo, useState } from "react";

import { PopupChatbot } from "@/components/ai/PopupChatbot";

interface UsePopupChatbotOptions {
  systemPrompt?: string;
  referenceText?: string;
  title?: string;
  placeholder?: string;
  buttonClassName?: string;
  cardClassName?: string;
  initialOpen?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  suggestedQuestions?: string[];
  balloonText?: string;
  showBalloon?: boolean;
  welcomeMessage?: string;
  // New context-aware options
  userName?: string;
  courseName?: string;
  lessonName?: string;
  lessonOrder?: number;
  totalLessons?: number;
  chapterName?: string;
  // Student Lesson Context API - Enriched context for AI
  studentLessonContext?: {
    learnerLevel?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    needsEncouragement?: boolean;
    strugglingAreas?: string[];
    strongAreas?: string[];
    recommendedActions?: string[];
    contextSummary?: string;
    courseProgress?: number;
    quizInfo?: {
      highestScore?: number | null;
      isPassed?: boolean;
      totalAttempts?: number;
      canRetry?: boolean;
    };
  };
  // Syllabus Structure - Full learning path context
  syllabusStructure?: {
    currentDay: number;
    totalDays: number;
    // Progress statistics from backend
    completedSessions: number;
    completedLessons: number;
    sessionProgress: number; // 0-100 percentage
    lessonProgress: number; // 0-100 percentage
    lessons: Array<{
      id: string;
      title: string;
      type: "QUIZ" | "VIDEO" | "BLOG" | "MIXED";
      content?: string;
      chapterTitle?: string;
      order: number;
      estimatedDurationMinutes?: number;
      isCompleted: boolean;
      isCurrent: boolean;
    }>;
    liveSessions: Array<{
      id: string;
      topic: string;
      order: number;
      durationMinutes?: number;
      isCompleted: boolean;
    }>;
  };
}

/**
 * Hook to add a popup chatbot to any page with reference content
 * @param options Configuration options for the popup chatbot
 * @returns A React component that renders the popup chatbot
 */
export function usePopupChatbot(options: UsePopupChatbotOptions = {}) {
  const [mounted, setMounted] = useState(false);

  // Use client-side only rendering to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize the component to prevent unnecessary re-renders
  const MemoizedChatbot = useMemo(() => {
    // Return a memoized component that only depends on the mounted state and options
    return function ChatbotComponent() {
      if (!mounted) return null;

      return (
        <PopupChatbot
          systemPrompt={options.systemPrompt}
          referenceText={options.referenceText}
          title={options.title}
          placeholder={options.placeholder}
          buttonClassName={options.buttonClassName}
          cardClassName={options.cardClassName}
          initialOpen={options.initialOpen}
          position={options.position}
          suggestedQuestions={options.suggestedQuestions}
          balloonText={options.balloonText}
          showBalloon={options.showBalloon}
          welcomeMessage={options.welcomeMessage}
          userName={options.userName}
          courseName={options.courseName}
          lessonName={options.lessonName}
          lessonOrder={options.lessonOrder}
          totalLessons={options.totalLessons}
          chapterName={options.chapterName}
          studentLessonContext={options.studentLessonContext}
          syllabusStructure={options.syllabusStructure}
        />
      );
    };
  }, [
    mounted,
    options.systemPrompt,
    options.referenceText,
    options.title,
    options.placeholder,
    options.buttonClassName,
    options.cardClassName,
    options.initialOpen,
    options.position,
    options.suggestedQuestions,
    options.balloonText,
    options.showBalloon,
    options.welcomeMessage,
    options.userName,
    options.courseName,
    options.lessonName,
    options.lessonOrder,
    options.totalLessons,
    options.chapterName,
    options.studentLessonContext,
    options.syllabusStructure,
  ]);

  return MemoizedChatbot;
}
