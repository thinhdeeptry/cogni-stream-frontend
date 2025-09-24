"use client";

import { cn } from "@/lib/utils";
import type { Question } from "@/types/assessment/quiz-types";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  Circle,
  Clock,
  Flag,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface QuizSidebarProps {
  questions: Question[];
  answers: Record<string, string | string[]>;
  flaggedQuestions: Set<string>;
  currentPage: number;
  questionsPerPage: number;
  timeRemaining: number | null;
  isOpen: boolean;
  onClose: () => void;
  onQuestionClick: (questionIndex: number) => void;
  onToggleFlag: (questionId: string) => void;
  onSubmitQuiz: () => void;
  isSubmitting: boolean;
}

export default function QuizSidebar({
  questions,
  answers,
  flaggedQuestions,
  currentPage,
  questionsPerPage,
  timeRemaining,
  isOpen,
  onClose,
  onQuestionClick,
  onToggleFlag,
  onSubmitQuiz,
  isSubmitting,
}: QuizSidebarProps) {
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progressPercentage = (answeredCount / totalQuestions) * 100;

  const getQuestionStatus = (questionId: string) => {
    const isAnswered = !!answers[questionId];
    const isFlagged = flaggedQuestions.has(questionId);

    if (isAnswered && isFlagged) return "answered-flagged";
    if (isAnswered) return "answered";
    if (isFlagged) return "flagged";
    return "unanswered";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "answered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "answered-flagged":
        return (
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <Flag className="h-3 w-3 text-orange-500" />
          </div>
        );
      case "flagged":
        return <Flag className="h-4 w-4 text-orange-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "answered":
        return "border-l-green-500 bg-green-50";
      case "answered-flagged":
        return "border-l-orange-500 bg-orange-50";
      case "flagged":
        return "border-l-orange-500 bg-orange-50";
      default:
        return "border-l-gray-300";
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimerColor = (seconds: number) => {
    if (seconds < 300) return "text-red-600"; // < 5 minutes
    if (seconds < 600) return "text-orange-600"; // < 10 minutes
    return "text-blue-600";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l shadow-xl z-50 lg:relative lg:shadow-none"
          >
            <Card className="h-full rounded-none lg:rounded-lg">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Danh sách câu hỏi</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="lg:hidden"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Timer */}
                {timeRemaining !== null && (
                  <div
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-300",
                      timeRemaining < 300
                        ? "border-red-200 bg-red-50 animate-pulse"
                        : timeRemaining < 600
                          ? "border-orange-200 bg-orange-50"
                          : "border-blue-200 bg-blue-50",
                    )}
                  >
                    <Clock
                      className={cn("h-5 w-5", getTimerColor(timeRemaining))}
                    />
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          "font-mono text-lg font-bold",
                          getTimerColor(timeRemaining),
                        )}
                      >
                        {formatTime(timeRemaining)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {timeRemaining < 300
                          ? "Sắp hết giờ!"
                          : timeRemaining < 600
                            ? "Còn ít thời gian"
                            : "Thời gian còn lại"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tiến độ</span>
                    <span className="font-medium">
                      {answeredCount}/{totalQuestions}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Đã trả lời: {answeredCount}</span>
                    <span>Đã đánh dấu: {flaggedQuestions.size}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto p-4 space-y-2">
                  {questions.map((question, index) => {
                    const questionNumber = index + 1;
                    const status = getQuestionStatus(question.id);
                    const isCurrentPage =
                      Math.ceil(questionNumber / questionsPerPage) ===
                      currentPage;

                    return (
                      <div key={question.id} className="relative">
                        <Button
                          variant={isCurrentPage ? "default" : "ghost"}
                          size="sm"
                          onClick={() => onQuestionClick(index)}
                          className={cn(
                            "w-full justify-start text-left h-auto p-3 border-l-4",
                            getStatusColor(status),
                          )}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Badge
                              variant={
                                status === "answered" ||
                                status === "answered-flagged"
                                  ? "default"
                                  : "secondary"
                              }
                              className="flex-shrink-0"
                            >
                              {questionNumber}
                            </Badge>

                            <div className="flex-1 min-w-0">
                              <div
                                className="text-xs truncate"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    question.text
                                      .replace(/<[^>]*>/g, "")
                                      .substring(0, 50) + "...",
                                }}
                              />
                              {question.isRequired && (
                                <div className="flex items-center gap-1 mt-1">
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                  <span className="text-xs text-red-600">
                                    Bắt buộc
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {getStatusIcon(status)}
                            </div>
                          </div>
                        </Button>

                        {/* Flag toggle button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFlag(question.id);
                          }}
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                        >
                          <Flag
                            className={cn(
                              "h-3 w-3",
                              flaggedQuestions.has(question.id)
                                ? "text-orange-500 fill-orange-500"
                                : "text-gray-400",
                            )}
                          />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                {/* Submit Button */}
                <div className="p-4 border-t bg-gray-50">
                  <Button
                    onClick={onSubmitQuiz}
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {isSubmitting ? "Đang nộp bài..." : "Nộp bài"}
                  </Button>

                  {answeredCount < totalQuestions && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Còn {totalQuestions - answeredCount} câu chưa trả lời
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
