"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { Question } from "@/types/assessment/quiz-types";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Ban,
  BookOpen,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  History,
  Info,
  Menu,
  Play,
  RefreshCw,
  RotateCcw,
  Timer,
  Trophy,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  type QuizAttempt,
  type QuizHistory,
  type QuizResult,
  type QuizStatus,
  type QuizSubmission,
  canStartQuiz,
  formatTimeLimit,
  formatWaitTime,
  getQuizHistory,
  getQuizQuestions,
  getQuizStatus,
  startQuizAttempt,
  submitQuizAttempt,
} from "@/actions/quizAction";

import QuizSidebar from "@/components/quiz/quiz-sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConfettiRef } from "@/components/ui/confetti";
import { Progress } from "@/components/ui/progress";

import { Confetti } from "../ui/confetti";

interface QuizSectionProps {
  lessonId: string;
  enrollmentId: string;
  lessonTitle: string;
  isEnrolled: boolean;
  classId?: string; // For navigation to specific lessons in class
  courseId?: string; // For navigation
  onQuizCompleted?: (success: boolean) => void; // Callback when quiz is completed successfully
  onNavigateToLesson?: (lessonId: string) => void; // Callback to navigate to required lesson
  onNavigateToNextIncomplete?: () => void; // Callback to navigate to next incomplete syllabus item (class page provides)
  isInstructorOrAdmin?: boolean; // Preview mode for instructor/admin - bypasses time restrictions
  onQuizStateChange?: (isActivelyTaking: boolean) => void; // Callback when quiz active state changes
}

export default function QuizSection({
  lessonId,
  enrollmentId,
  lessonTitle,
  isEnrolled,
  classId,
  courseId,
  onQuizCompleted,
  onNavigateToLesson,
  onNavigateToNextIncomplete,
  isInstructorOrAdmin = false,
  onQuizStateChange,
}: QuizSectionProps) {
  const router = useRouter();
  const [status, setStatus] = useState<QuizStatus | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(
    null,
  );
  const [history, setHistory] = useState<QuizHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Quiz taking states
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  // Confetti ref
  const confettiRef = useRef<ConfettiRef>(null);

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [blockCountdown, setBlockCountdown] = useState<number | null>(null);

  const questionsPerPage = 5;
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);
  const currentQuestions = allQuestions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage,
  );

  useEffect(() => {
    if (!isEnrolled) return;
    console.log("Fetching quiz data for lessonId:", lessonId);

    fetchQuizData();
  }, [lessonId, isEnrolled]);

  // Notify parent when quiz active state changes
  useEffect(() => {
    const isActivelyTaking = !!(
      currentAttempt &&
      allQuestions.length > 0 &&
      !isLoadingQuestions &&
      !result
    );
    onQuizStateChange?.(isActivelyTaking);
  }, [
    currentAttempt,
    allQuestions.length,
    isLoadingQuestions,
    result,
    onQuizStateChange,
  ]);

  useEffect(() => {
    // Skip timer for instructor/admin preview mode
    if (
      !currentAttempt ||
      timeRemaining === null ||
      timeRemaining <= 0 ||
      isInstructorOrAdmin
    )
      return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentAttempt, timeRemaining, isInstructorOrAdmin]);

  // Block countdown timer effect
  useEffect(() => {
    if (!status?.lesson.blockDuration || !status?.blockedUntil) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const blockEnd = new Date(status.blockedUntil!).getTime();
      const timeLeft = Math.floor((blockEnd - now) / 1000);

      if (timeLeft <= 0) {
        setBlockCountdown(null);
        // Refresh quiz status when block expires
        fetchQuizData();
      } else {
        setBlockCountdown(timeLeft);
      }
    };

    // Initial update
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [status?.blockedUntil, status?.lesson.blockDuration]);

  const fetchQuizData = async () => {
    try {
      console.log("Fetching quiz data for lessonId:", lessonId);
      setIsLoading(true);
      const [statusResult, historyResult] = await Promise.all([
        getQuizStatus(lessonId, isInstructorOrAdmin),
        getQuizHistory(lessonId),
      ]);

      if (statusResult.success && statusResult.data) {
        setStatus(statusResult.data);
      }

      if (historyResult.success && historyResult.data) {
        setHistory(historyResult.data);
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      toast.error("Không thể tải thông tin quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllQuestions = async () => {
    try {
      setIsLoadingQuestions(true);
      const result = await getQuizQuestions(lessonId, 1, 100); // Fetch up to 100 questions

      if (result.success && result.data) {
        // Convert API data to Question type format
        const questions: Question[] = result.data.questions.map((q: any) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          order: q.order,
          points: 1, // Default points
          answers: q.answers,
          isRequired: true, // Default required
        }));

        setAllQuestions(questions);
        setTotalQuestions(result.data.total);
        console.log("Fetched all questions:", questions);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Không thể tải câu hỏi");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleStartQuiz = async () => {
    if (
      !status ||
      !canStartQuiz(status, status.unlockRequirementsSummary.allCompleted)
    ) {
      toast.error("Không thể bắt đầu quiz lúc này");
      return;
    }

    try {
      setIsStarting(true);
      const result = await startQuizAttempt(
        lessonId,
        enrollmentId,
        isInstructorOrAdmin,
      );
      console.log("result start Quiz: ", result);
      if (result.success && result.data) {
        setCurrentAttempt(result.data);
        setCurrentPage(1);
        setAnswers({});
        setResult(null);
        setQuizStartTime(new Date());
        setFlaggedQuestions(new Set());
        // Bypass time limit for instructor/admin preview mode
        if (result.data.timeLimit && !isInstructorOrAdmin) {
          setTimeRemaining(result.data.timeLimit * 60);
        } else if (isInstructorOrAdmin) {
          setTimeRemaining(null); // No time limit for preview mode
        }

        await fetchAllQuestions();
        toast.success("Bắt đầu quiz thành công!");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast.error("Không thể bắt đầu quiz");
    } finally {
      setIsStarting(false);
    }
  };
  const handleAnswerChange = (
    questionId: string,
    answer: string | string[],
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleAutoSubmit = async () => {
    if (!currentAttempt || isSubmitting) return;

    setIsSubmitting(true);
    toast.info("⏰ Hết thời gian! Tự động nộp bài...");
    await handleSubmitQuiz();
  };

  const handleSubmitQuiz = async () => {
    if (!currentAttempt || !allQuestions || allQuestions.length === 0) return;

    try {
      setIsSubmitting(true);

      const submission: QuizSubmission = {
        answers: allQuestions.map((question) => {
          const answer = answers[question.id];

          if (question.type === "SINGLE_CHOICE" && typeof answer === "string") {
            return {
              questionId: question.id,
              answerId: [answer], // Chuyển thành array với 1 phần tử
            };
          } else if (
            question.type === "MULTIPLE_CHOICE" &&
            Array.isArray(answer)
          ) {
            return {
              questionId: question.id,
              answerId: answer, // Giữ nguyên array
            };
          } else if (
            ["SHORT_ANSWER", "ESSAY", "FILL_IN_BLANK"].includes(question.type)
          ) {
            return {
              questionId: question.id,
              textAnswer: typeof answer === "string" ? answer : "",
            };
          }

          return {
            questionId: question.id,
            textAnswer: "",
          };
        }),
      };
      console.log("submission: ", submission);
      const result = await submitQuizAttempt(
        currentAttempt.id,
        submission,
        lessonId,
        isInstructorOrAdmin,
      );

      if (result.success && result.data) {
        toast.success("Nộp bài quiz thành công!");
        console.log("Quiz submission result:", result.data);
        setResult(result.data);
        setCurrentAttempt(null);
        setTimeRemaining(null);
        await fetchQuizData();

        if (result.data.passed) {
          toast.success(
            `Chúc mừng! Bạn đã đạt ${result.data.score}% và vượt qua quiz!`,
          );

          // Call callback when quiz is completed successfully
          if (onQuizCompleted) {
            onQuizCompleted(true);
          }
        } else {
          toast.warning(
            `Bạn đạt ${result.data.score}%. ${result.data.canRetry ? "Hãy cố gắng lần sau!" : "Bạn đã hết lượt thử."}`,
          );

          // Call callback even when not passed to update progress
          if (onQuizCompleted) {
            onQuizCompleted(false);
          }
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Không thể nộp bài quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger confetti once when the quiz result is a pass
  useEffect(() => {
    if (result && result.passed) {
      // Try to use the project's Confetti component programmatic API if available
      try {
        confettiRef.current?.fire?.({
          particleCount: 120,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (error) {
        console.error("Confetti fire error:", error);
      }

      // Additionally trigger a fireworks-style confetti using canvas-confetti
      // (based on the snippet the user provided). This produces bursts from
      // both sides for a few seconds to emulate fireworks.
      try {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = {
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 9999,
        };

        const randomInRange = (min: number, max: number) =>
          Math.random() * (max - min) + min;

        const interval = window.setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({
            ...defaults,
            particleCount: Math.round(particleCount),
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          });
          confetti({
            ...defaults,
            particleCount: Math.round(particleCount),
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          });
        }, 250);
      } catch (error) {
        console.error("Fireworks confetti error:", error);
      }
    }
  }, [result]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatCountdownTime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days} ngày ${hours} giờ ${minutes} phút`;
    } else if (hours > 0) {
      return `${hours} giờ ${minutes} phút ${secs} giây`;
    } else if (minutes > 0) {
      return `${minutes} phút ${secs} giây`;
    } else {
      return `${secs} giây`;
    }
  };

  const getTimerColor = (seconds: number) => {
    if (seconds < 300) return "text-red-500"; // < 5 minutes
    if (seconds < 600) return "text-orange-500"; // < 10 minutes
    return "text-blue-500";
  };

  const renderHTMLContent = (htmlContent: string) => {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        className="prose prose-sm max-w-none prose-headings:mb-2 prose-p:mb-2 prose-ul:mb-2 prose-ol:mb-2 
                   prose-img:rounded-lg prose-img:max-w-full prose-img:h-auto
                   prose-strong:font-bold prose-em:italic
                   [&>p]:leading-relaxed [&>ul]:pl-4 [&>ol]:pl-4"
      />
    );
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToQuestion = (questionIndex: number) => {
    const targetPage = Math.ceil((questionIndex + 1) / questionsPerPage);
    setCurrentPage(targetPage);
    setSidebarOpen(false);
  };

  const handleToggleFlag = (questionId: string) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getQuestionStatus = (questionId: string) => {
    if (answers[questionId]) {
      return "answered";
    }
    return "unanswered";
  };

  if (!isEnrolled) {
    return (
      <Card className="border border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-orange-800 mb-2">
              Cần đăng ký khóa học
            </h3>
            <p className="text-orange-600">
              Bạn cần đăng ký khóa học để có thể làm quiz
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentAttempt && isLoadingQuestions) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-primary">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải câu hỏi...</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (currentAttempt && allQuestions.length > 0 && !isLoadingQuestions) {
    const progress =
      (((currentPage - 1) * questionsPerPage + currentQuestions.length) /
        totalQuestions) *
      100;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="flex gap-6 relative">
        {/* Main Quiz Content */}
        <div className="flex-1 space-y-6">
          {/* Quiz Header */}
          <Card className="border-primary bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl text-blue-900">
                      {lessonTitle}
                    </CardTitle>
                    {isInstructorOrAdmin && (
                      <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full font-medium">
                        Chế độ xem trước
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-blue-700">
                    Lần thử thứ {currentAttempt.attemptNumber || 1}
                    {quizStartTime && (
                      <span className="ml-2">
                        • Bắt đầu lúc:{" "}
                        {quizStartTime.toLocaleTimeString("vi-VN")}
                      </span>
                    )}
                    {isInstructorOrAdmin && (
                      <span className="ml-2 text-orange-600">
                        • Không giới hạn thời gian
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {timeRemaining !== null && !isInstructorOrAdmin && (
                    <div
                      className={cn(
                        "flex items-center gap-2 bg-white/90 px-4 py-2 rounded-lg border-2 transition-all duration-300",
                        timeRemaining < 300
                          ? "border-red-200 bg-red-50/90 animate-pulse"
                          : timeRemaining < 600
                            ? "border-orange-200 bg-orange-50/90"
                            : "border-blue-200",
                      )}
                    >
                      <Timer
                        className={cn("h-5 w-5", getTimerColor(timeRemaining))}
                      />
                      <div className="flex flex-col items-center">
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

                  {isInstructorOrAdmin && (
                    <div className="flex items-center gap-2 bg-orange-50/90 px-4 py-2 rounded-lg border-2 border-orange-200">
                      <Timer className="h-5 w-5 text-orange-600" />
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-lg font-bold text-orange-600">
                          ∞ Không giới hạn
                        </span>
                        <span className="text-xs text-orange-500">
                          Chế độ xem trước
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>
                    Trang {currentPage} / {totalPages}
                  </span>
                  <span>
                    Đã trả lời: {answeredCount}/{totalQuestions}
                  </span>
                </div>
                <Progress value={progress} className="h-3 bg-white/50" />
              </div>
            </CardHeader>
          </Card>

          {/* Questions */}
          <div className="space-y-6">
            {currentQuestions.map((question, index) => {
              const questionNumber =
                (currentPage - 1) * questionsPerPage + index + 1;
              const isAnswered = getQuestionStatus(question.id) === "answered";

              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={cn(
                      "transition-all duration-200",
                      isAnswered
                        ? "border-green-200 bg-green-50/50"
                        : "border-gray-200",
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Badge
                            variant={isAnswered ? "default" : "secondary"}
                            className="mt-1 flex-shrink-0"
                          >
                            {questionNumber}
                          </Badge>
                          <div className="flex-1">
                            {renderHTMLContent(question.text)}
                          </div>
                        </div>

                        {/* Answer Options */}
                        {(question.type === "SINGLE_CHOICE" ||
                          question.type === "MULTIPLE_CHOICE") &&
                          question.answers &&
                          question.answers.length > 0 && (
                            <div className="space-y-2 ml-0">
                              {question.answers.map(
                                (answer: any, answerIndex: number) => {
                                  const isSelected =
                                    question.type === "SINGLE_CHOICE"
                                      ? answers[question.id] === answer.id
                                      : Array.isArray(answers[question.id]) &&
                                        (
                                          answers[question.id] as string[]
                                        ).includes(answer.id);

                                  return (
                                    <div
                                      key={answer.id}
                                      className={cn(
                                        "relative group transition-all duration-200 cursor-pointer",
                                        "border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50/50",
                                        isSelected
                                          ? "border-blue-500 bg-blue-50 shadow-md"
                                          : "border-gray-200 bg-white hover:shadow-sm",
                                      )}
                                      onClick={() => {
                                        if (question.type === "SINGLE_CHOICE") {
                                          handleAnswerChange(
                                            question.id,
                                            answer.id,
                                          );
                                        } else {
                                          const currentAnswers = Array.isArray(
                                            answers[question.id],
                                          )
                                            ? (answers[question.id] as string[])
                                            : [];

                                          if (isSelected) {
                                            handleAnswerChange(
                                              question.id,
                                              currentAnswers.filter(
                                                (id) => id !== answer.id,
                                              ),
                                            );
                                          } else {
                                            handleAnswerChange(question.id, [
                                              ...currentAnswers,
                                              answer.id,
                                            ]);
                                          }
                                        }
                                      }}
                                    >
                                      <div className="flex items-start gap-3">
                                        {/* Custom Radio/Checkbox */}
                                        <div className="flex-shrink-0 mt-0.5">
                                          {question.type === "SINGLE_CHOICE" ? (
                                            <div
                                              className={cn(
                                                "w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
                                                isSelected
                                                  ? "border-blue-500 bg-blue-500"
                                                  : "border-gray-300 group-hover:border-blue-400",
                                              )}
                                            >
                                              {isSelected && (
                                                <div className="w-2 h-2 rounded-full bg-white"></div>
                                              )}
                                            </div>
                                          ) : (
                                            <div
                                              className={cn(
                                                "w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center",
                                                isSelected
                                                  ? "border-blue-500 bg-blue-500"
                                                  : "border-gray-300 group-hover:border-blue-400",
                                              )}
                                            >
                                              {isSelected && (
                                                <svg
                                                  className="w-3 h-3 text-white"
                                                  fill="currentColor"
                                                  viewBox="0 0 20 20"
                                                >
                                                  <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                  />
                                                </svg>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {/* Answer Option Label */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start gap-2">
                                            <span
                                              className={cn(
                                                "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold flex-shrink-0 transition-colors",
                                                isSelected
                                                  ? "bg-blue-500 text-white"
                                                  : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600",
                                              )}
                                            >
                                              {String.fromCharCode(
                                                65 + answerIndex,
                                              )}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                              <div
                                                className={cn(
                                                  "prose prose-sm max-w-none transition-colors",
                                                  "[&>p]:mb-1 [&>p]:leading-relaxed",
                                                  "[&>ul]:mb-1 [&>ol]:mb-1 [&>ul]:pl-4 [&>ol]:pl-4",
                                                  "[&>img]:rounded [&>img]:max-w-full [&>img]:h-auto",
                                                  isSelected
                                                    ? "prose-blue [&>p]:text-blue-900"
                                                    : "prose-gray [&>p]:text-gray-700 group-hover:[&>p]:text-gray-900",
                                                )}
                                              >
                                                <div
                                                  dangerouslySetInnerHTML={{
                                                    __html: answer.text,
                                                  }}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Selection Indicator */}
                                      {isSelected && (
                                        <div className="absolute top-2 right-2">
                                          <CheckCircle className="w-4 h-4 text-blue-500" />
                                        </div>
                                      )}

                                      {/* Hidden input for form compatibility */}
                                      <input
                                        type={
                                          question.type === "SINGLE_CHOICE"
                                            ? "radio"
                                            : "checkbox"
                                        }
                                        id={`${question.id}-${answer.id}`}
                                        name={question.id}
                                        value={answer.id}
                                        checked={isSelected}
                                        onChange={() => {}} // Controlled by onClick
                                        className="sr-only"
                                      />
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          )}

                        {/* Text Answer Input */}
                        {["SHORT_ANSWER", "ESSAY", "FILL_IN_BLANK"].includes(
                          question.type,
                        ) && (
                          <div className="ml-12">
                            {question.type === "ESSAY" ? (
                              <textarea
                                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                rows={6}
                                placeholder="Nhập câu trả lời của bạn..."
                                value={
                                  typeof answers[question.id] === "string"
                                    ? answers[question.id]
                                    : ""
                                }
                                onChange={(e) =>
                                  handleAnswerChange(
                                    question.id,
                                    e.target.value,
                                  )
                                }
                              />
                            ) : (
                              <input
                                type="text"
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Nhập câu trả lời..."
                                value={
                                  typeof answers[question.id] === "string"
                                    ? answers[question.id]
                                    : ""
                                }
                                onChange={(e) =>
                                  handleAnswerChange(
                                    question.id,
                                    e.target.value,
                                  )
                                }
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trang trước
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Trang {currentPage} / {totalPages}
                  </span>
                </div>

                {currentPage < totalPages ? (
                  <Button
                    onClick={handleNextPage}
                    className="flex items-center gap-2"
                  >
                    Trang tiếp
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Nộp bài
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận nộp bài</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn nộp bài? Sau khi nộp, bạn không
                          thể thay đổi câu trả lời.
                          <br />
                          <span className="font-semibold">
                            Đã trả lời: {answeredCount}/{totalQuestions} câu
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleSubmitQuiz}
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSubmitting ? "Đang nộp..." : "Nộp bài"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quiz Sidebar */}
        <QuizSidebar
          questions={allQuestions}
          answers={answers}
          flaggedQuestions={flaggedQuestions}
          currentPage={currentPage}
          questionsPerPage={questionsPerPage}
          timeRemaining={timeRemaining}
          isOpen={sidebarOpen || window.innerWidth >= 1024}
          onClose={() => setSidebarOpen(false)}
          onQuestionClick={goToQuestion}
          onToggleFlag={handleToggleFlag}
          onSubmitQuiz={handleSubmitQuiz}
          isSubmitting={isSubmitting}
        />

        {timeRemaining !== null &&
          timeRemaining <= 300 &&
          timeRemaining > 0 &&
          !isInstructorOrAdmin && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
            >
              <Card className="border-red-200 bg-red-50 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">
                      ⚠️ Chỉ còn {formatTime(timeRemaining)} - Hãy nhanh chóng
                      hoàn thành!
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
      </div>
    );
  }

  // Show quiz result
  if (result) {
    console.log("🎯 [QuizResult] Rendering quiz result:", {
      passed: result.passed,
      score: result.score,
      canRetry: result.canRetry,
      timeSpent: result.timeSpent,
    });

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        {/* Confetti - manual trigger via ref (prevents auto-fire on mount) */}
        <Confetti
          ref={confettiRef}
          manualstart
          options={{}}
          className="absolute top-0 left-0 pointer-events-none z-0 size-full"
        />
        <Card
          className={`border-2 relative z-10 ${result.passed ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}
        >
          <CardContent className="p-6">
            <div className="text-center space-y-4 relative z-20">
              {result.passed ? (
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              ) : (
                <XCircle className="h-16 w-16 text-orange-500 mx-auto" />
              )}

              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {result.passed
                    ? "Chúc mừng! Bạn đã đạt!"
                    : "Chưa đạt yêu cầu"}
                </h3>
                <p className="text-lg">
                  Điểm số: <span className="font-bold">{result.score}%</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Thời gian làm bài: {result.timeSpent} phút
                </p>
              </div>

              <div className="flex gap-3 justify-center relative z-10">
                {result.passed ? (
                  // Nút "Tiếp tục học" khi đã đạt
                  <Button
                    onClick={() => {
                      console.log(
                        "✅ [QuizResult] Tiếp tục học button clicked",
                      );
                      // Prefer navigating to the next incomplete syllabus item if parent provided a handler
                      if (onNavigateToNextIncomplete) {
                        try {
                          console.log("Navigating to next incomplete item");
                          onNavigateToNextIncomplete();
                          return;
                        } catch (err) {
                          console.error(
                            "onNavigateToNextIncomplete error:",
                            err,
                          );
                        }
                      } else {
                        console.log(
                          "No onNavigateToNextIncomplete handler provided",
                        );
                      }
                      // Fallback: navigate to course/class overview
                      // const backPath = classId
                      //   ? `/course/${courseId}/class/${classId}`
                      //   : `/course/${courseId}`;
                      // router.push(backPath);
                    }}
                    className="bg-green-600 hover:bg-green-700 flex items-center gap-2 relative z-20"
                  >
                    <span>Tiếp tục học</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  // Nút "Làm lại" khi chưa đạt
                  <Button
                    onClick={(e) => {
                      console.log(
                        "🔄 [QuizResult] Làm lại quiz button clicked",
                        e,
                      );
                      console.log("🔄 [QuizResult] Current status:", {
                        isInstructorOrAdmin,
                        canAttempt: status?.canAttempt,
                        canStart: status
                          ? canStartQuiz(
                              status,
                              status.unlockRequirementsSummary?.allCompleted,
                            )
                          : false,
                      });
                      e.preventDefault();
                      e.stopPropagation();
                      setResult(null);
                      fetchQuizData();
                    }}
                    // Disable button only if not admin/instructor and cannot attempt
                    disabled={
                      !isInstructorOrAdmin && status && !status.canAttempt
                        ? true
                        : undefined
                    }
                    className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2 relative z-20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Làm lại quiz</span>
                  </Button>
                )}

                {/* Nút quay về khóa học */}
                <Button
                  variant="outline"
                  onClick={(e) => {
                    console.log(
                      "🏠 [QuizResult] Quay về khóa học button clicked",
                      e,
                    );
                    e.preventDefault();
                    e.stopPropagation();
                    const backPath = classId
                      ? `/course/${courseId}/class/${classId}`
                      : `/course/${courseId}`;
                    router.push(backPath);
                  }}
                  className="flex items-center gap-2 relative z-20"
                >
                  <span>Quay về khóa học</span>
                </Button>
              </div>

              {/* {!result.passed && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 text-center">
                    {result.nextAllowedAt
                      ? `Bạn có thể làm lại sau ${formatWaitTime(result.nextAllowedAt)}`
                      : "Bạn đã hết lượt thử cho quiz này"}
                  </p>
                </div>
              )} */}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Không có quiz cho bài học này</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show quiz start interface
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 -mt-10"
    >
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Play className="h-5 w-5 text-blue-600" />
            Quiz: {lessonTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quiz Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/80 rounded-lg border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">
                {status.attemptsUsed}
              </div>
              <div className="text-sm text-blue-700">
                Đã thử / {status.maxAttempts || "∞"}
              </div>
            </div>

            <div className="text-center p-4 bg-white/80 rounded-lg border border-purple-100">
              <div className="text-2xl font-bold text-purple-600">
                {status.passPercent}%
              </div>
              <div className="text-sm text-purple-700">Điều kiện đạt</div>
            </div>

            {status.lastScore !== null && status.lastScore > 0 && (
              <div className="text-center p-4 bg-white/80 rounded-lg border border-orange-100">
                <div className="text-2xl font-bold text-orange-500">
                  {status.lastScore}%
                </div>
                <div className="text-sm text-orange-700">Điểm gần nhất</div>
              </div>
            )}

            {status.bestScore > 0 && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                  <Trophy className="h-5 w-5" />
                  {status.bestScore}%
                </div>
                <div className="text-sm text-yellow-700">Điểm cao nhất</div>
              </div>
            )}
          </div>

          {/* Detailed Quiz Information - Only show if not passed */}
          {!status.isPassed && (
            <div className="bg-white/60 rounded-lg border border-blue-100 p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Thông tin chi tiết quiz
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* Time Limit */}
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Thời gian làm bài:
                  </span>
                  <span className="font-medium text-blue-800">
                    {formatTimeLimit(status.timeLimit)}
                  </span>
                </div>

                {/* Retry Delay */}
                {status.retryDelay && (
                  <div className="flex justify-between items-center py-2 border-b border-blue-100">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      Thời gian chờ giữa các lần:
                    </span>
                    <span className="font-medium text-blue-800">
                      {status.retryDelay} phút
                    </span>
                  </div>
                )}

                {/* Max Attempts */}
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Số lần làm tối đa:
                  </span>
                  <span className="font-medium text-blue-800">
                    {status.maxAttempts || "Không giới hạn"}
                  </span>
                </div>

                {/* Current Status */}
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <span className="text-gray-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Trạng thái:
                  </span>
                  <span
                    className={`font-medium ${status.isPassed ? "text-green-600" : "text-orange-600"}`}
                  >
                    {status.isPassed ? "Đã hoàn thành" : "Chưa hoàn thành"}
                  </span>
                </div>

                {/* Block Status */}
                {status.isBlocked && (
                  <div className="flex justify-between items-center py-2 border-b border-red-100 md:col-span-2">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Ban className="h-4 w-4" />
                      Bị chặn đến:
                    </span>
                    <span className="font-medium text-red-600">
                      {status.blockedUntil
                        ? new Date(status.blockedUntil).toLocaleString("vi-VN")
                        : "Vô thời hạn"}
                    </span>
                  </div>
                )}

                {/* Block Reason */}
                {status.isBlocked && status.blockedReason && (
                  <div className="md:col-span-2 py-2">
                    <span className="text-gray-600 block mb-1">
                      Lý do bị chặn:
                    </span>
                    <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded text-xs">
                      {status.blockedReason}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Messages & Notifications */}
          <div className="space-y-3">
            {/* Success - Passed */}
            {status.isPassed && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <span className="text-green-800 font-medium block">
                    🎉 Chúc mừng! Bạn đã hoàn thành quiz này!
                  </span>
                  <span className="text-green-600 text-sm">
                    Điểm số tốt nhất: {status.bestScore}% (cần{" "}
                    {status.passPercent}% để đạt)
                  </span>
                </div>
                <button
                  onClick={() => {
                    // Navigate back to the class or course to access next lesson
                    const backPath = classId
                      ? `/course/${courseId}/class/${classId}`
                      : `/course/${courseId}`;
                    router.push(backPath);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  <span>Tiếp tục học</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Warning - Wait Time */}
            {!canStartQuiz(status) &&
              status.nextAllowedAt &&
              new Date(status.nextAllowedAt).getTime() > Date.now() && (
                <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <span className="text-orange-800 font-medium block">
                      ⏳ Cần chờ thêm thời gian
                    </span>
                    <span className="text-orange-600 text-sm">
                      Bạn có thể làm lại sau:{" "}
                      {formatWaitTime(status.nextAllowedAt)}
                      {status.retryDelay &&
                        ` (Thời gian chờ: ${status.retryDelay} phút)`}
                    </span>
                  </div>
                </div>
              )}

            {/* Error - No More Attempts */}
            {!status.canAttempt &&
              status.attemptsUsed >= (status.maxAttempts || 0) &&
              status.maxAttempts !== null && (
                <div className="space-y-4">
                  {/* Priority 1: Unlock Requirements - Show study requirements if available */}
                  {status.unlockRequirements &&
                  status.unlockRequirements.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className=" bg-white/60 border border-blue-200 rounded-lg pb-4"
                    >
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                            <BookOpen className="h-6 w-6" />
                            <h3 className="text-lg font-semibold">
                              Bạn cần hoàn thành các bài học sau để có thể làm
                              lại quiz
                            </h3>
                          </div>
                          <p className="text-blue-600 text-sm">
                            Hãy ôn tập lại kiến thức từ những bài học này để
                            chuẩn bị tốt hơn cho lần làm bài tiếp theo nhé! 💪
                          </p>
                        </div>

                        <div className="space-y-3">
                          {status.unlockRequirements.map(
                            (requirement: any, index: number) => {
                              return (
                                <div
                                  key={requirement.id || index}
                                  className="p-4 mb-4 rounded-xl hover:bg-blue-100/60 transition-colors"
                                >
                                  <div className="flex items-center -mt-8">
                                    <div className="flex-shrink-0">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-5">
                                        <span className="text-blue-600 font-semibold text-sm">
                                          {index + 1}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-blue-900 mb-1">
                                        {requirement.title ||
                                          requirement.description ||
                                          "Yêu cầu học tập"}
                                      </h4>
                                      {requirement.description &&
                                        requirement.title && (
                                          <p className="text-blue-600 text-sm">
                                            {requirement.description}
                                          </p>
                                        )}

                                      {/* Display requirement type */}
                                      <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          {requirement.type ===
                                            "WATCH_LESSON" && "👁️ Xem bài học"}
                                          {requirement.type ===
                                            "COMPLETE_QUIZ" &&
                                            "📝 Hoàn thành quiz"}
                                          {requirement.type === "WAIT_TIME" &&
                                            "⏱️ Chờ thời gian"}
                                          {![
                                            "WATCH_LESSON",
                                            "COMPLETE_QUIZ",
                                            "WAIT_TIME",
                                          ].includes(requirement.type) &&
                                            "📖 Yêu cầu học tập"}
                                        </span>

                                        {requirement.isRequired && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                            Bắt buộc
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Navigation button for lessons */}
                                    {requirement.targetLesson?.id &&
                                      onNavigateToLesson && (
                                        <button
                                          onClick={() =>
                                            onNavigateToLesson(
                                              requirement.targetLesson.id,
                                            )
                                          }
                                          className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                          <span>Học ngay</span>
                                          <ExternalLink className="h-3 w-3" />
                                        </button>
                                      )}
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>

                        <div className="text-center pt-2">
                          <div className="flex items-center justify-center gap-4 text-xs text-blue-500">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                              <span>Học tập để mở khóa</span>
                            </div>
                            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
                            <div className="flex items-center gap-1">
                              <Trophy className="h-3 w-3" />
                              <span>Thành công đang chờ đón bạn</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    /* Priority 2: Block Duration Countdown - Only show if no unlock requirements */
                    status.lesson.blockDuration &&
                    blockCountdown !== null &&
                    blockCountdown > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6"
                      >
                        <div className="text-center space-y-4">
                          <div className="flex items-center justify-center gap-2 text-blue-700">
                            <Clock className="h-6 w-6" />
                            <h3 className="text-lg font-semibold">
                              ⏰ Thời gian chờ để thử lại
                            </h3>
                          </div>

                          <div className="bg-white/80 rounded-xl p-4 border border-blue-100">
                            <div className="text-3xl font-bold text-blue-600 font-mono">
                              {formatCountdownTime(blockCountdown)}
                            </div>
                            <div className="text-sm text-blue-500 mt-1">
                              còn lại để có thể làm lại quiz
                            </div>
                          </div>

                          <div className="space-y-2 text-center">
                            <p className="text-blue-800 font-medium">
                              📚 Hãy ôn tập lại kiến thức nhé!
                            </p>
                            <p className="text-blue-600 text-sm leading-relaxed">
                              Thời gian này là cơ hội tuyệt vời để bạn xem lại
                              tài liệu, làm bài tập thêm và chuẩn bị kỹ càng hơn
                              cho lần thử tiếp theo. Chúc bạn học tập hiệu quả!
                              💪
                            </p>
                          </div>

                          <div className="flex items-center justify-center gap-4 text-xs text-blue-500">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                              <span>Đang đếm ngược</span>
                            </div>
                            <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
                            <div className="flex items-center gap-1">
                              <Trophy className="h-3 w-3" />
                              <span>Chuẩn bị cho thành công</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  )}

                  {/* Success message when countdown expires or requirements are complete */}
                  {(!status.unlockRequirements ||
                    status.unlockRequirements.length === 0) &&
                    status.lesson.blockDuration &&
                    (!blockCountdown || blockCountdown <= 0) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-center">
                          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <p className="text-green-800 font-medium">
                            🎉 Bạn đã có thể làm lại quiz!
                          </p>
                          <p className="text-green-600 text-sm">
                            Nhấn "Làm lại" để bắt đầu lần thử mới
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              )}

            {/* Error - Blocked */}
            {/* {status.isBlocked && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <Ban className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <span className="text-red-800 font-medium block">
                    🔒 Tài khoản bị chặn làm quiz
                  </span>
                  <span className="text-red-600 text-sm block">
                    {status.blockedReason ||
                      "Bạn đã vi phạm quy định khi làm quiz"}
                  </span>
                  {status.blockedUntil && (
                    <span className="text-red-500 text-xs">
                      Hết hạn chặn:{" "}
                      {new Date(status.blockedUntil).toLocaleString("vi-VN")}
                    </span>
                  )}
                </div>
              </div>
            )} */}

            {/* Warning - Time Until Next Attempt */}
            {/* {status.timeUntilNextAttempt !== 0 && (
              <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Timer className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <span className="text-yellow-800 font-medium block">
                    ⏱️ Thời gian chờ còn lại
                  </span>
                  <span className="text-yellow-600 text-sm">
                    {Math.ceil(status?.timeUntilNextAttempt ?? 0)} phút nữa bạn
                    có thể làm lại
                  </span>
                </div>
              </div>
            )} */}

            {/* Info - Unlock Requirements */}
            {/* {!status.canAttempt &&
              status.attemptsUsed >= (status.maxAttempts || 0) &&
              status.maxAttempts !== null &&
              status.requireUnlockAction &&
              status.unlockRequirements.length > 0 && (
                <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <span className="text-blue-800 font-medium block">
                      🔐 Cần hoàn thành điều kiện mở khóa
                    </span>
                    <div className="text-blue-600 text-sm mt-1">
                      {status.unlockRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                          {typeof req === "string"
                            ? req
                            : req.description || "Điều kiện chưa xác định"}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )} */}
          </div>

          {/* Performance Summary */}
          {history && history.totalAttempts > 0 && (
            <div className="bg-white/60 rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Thống kê hiệu suất
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {history.totalAttempts}
                  </div>
                  <div className="text-gray-600">Tổng lần thử</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {history.bestScore}%
                  </div>
                  <div className="text-gray-600">Điểm cao nhất</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${history.isPassed ? "text-green-600" : "text-orange-600"}`}
                  >
                    {history.isPassed ? "✅" : "⏳"}
                  </div>
                  <div className="text-gray-600">
                    {history.isPassed ? "Đã hoàn thành" : "Chưa hoàn thành"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {status.passPercent}%
                  </div>
                  <div className="text-gray-600">Điểm yêu cầu</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Tiến độ đạt điểm</span>
                  <span>
                    {Math.round((history.bestScore / status.passPercent) * 100)}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      history.bestScore >= status.passPercent
                        ? "bg-green-500"
                        : "bg-orange-400"
                    }`}
                    style={{
                      width: `${Math.min((history.bestScore / status.passPercent) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleStartQuiz}
              disabled={
                !canStartQuiz(
                  status,
                  status.unlockRequirementsSummary.allCompleted,
                ) || isStarting
              }
              size="lg"
              className="px-8 bg-blue-600 hover:bg-blue-700"
            >
              {isStarting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Đang chuẩn bị...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  {status.attemptsUsed > 0 ? "Làm lại" : "Bắt đầu"}
                </>
              )}
            </Button>

            {history && history.totalAttempts > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
              >
                <History className="h-4 w-4 mr-2" />
                Lịch sử ({history.totalAttempts})
              </Button>
            )}
          </div>

          {/* Quiz History */}
          {showHistory && history && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <h4 className="font-semibold">Lịch sử làm bài</h4>
              <div className="space-y-2">
                {history.attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-3 bg-white/80 rounded-lg border border-blue-100"
                  >
                    <div>
                      <span className="font-medium">
                        Lần {attempt.attemptNumber}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {new Date(attempt.submittedAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={attempt.isPassed ? "default" : "secondary"}
                      >
                        {attempt.score}%
                      </Badge>
                      {attempt.isPassed && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
