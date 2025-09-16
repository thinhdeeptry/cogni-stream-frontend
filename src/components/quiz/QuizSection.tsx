"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  History,
  Menu,
  Play,
  RefreshCw,
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
  formatWaitTime,
  getQuizHistory,
  getQuizQuestions,
  getQuizStatus,
  startQuizAttempt,
  submitQuizAttempt,
} from "@/actions/quizAction";

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
import { Progress } from "@/components/ui/progress";

interface QuizSectionProps {
  lessonId: string;
  lessonTitle: string;
  isEnrolled: boolean;
}

export default function QuizSection({
  lessonId,
  lessonTitle,
  isEnrolled,
}: QuizSectionProps) {
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

  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const questionsPerPage = 5;
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);
  const currentQuestions = allQuestions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage,
  );

  useEffect(() => {
    if (!isEnrolled) return;
    fetchQuizData();
  }, [lessonId, isEnrolled]);

  useEffect(() => {
    if (!currentAttempt || timeRemaining === null || timeRemaining <= 0) return;

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
  }, [currentAttempt, timeRemaining]);

  const fetchQuizData = async () => {
    try {
      setIsLoading(true);
      const [statusResult, historyResult] = await Promise.all([
        getQuizStatus(lessonId),
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
        setAllQuestions(result.data.questions);
        setTotalQuestions(result.data.total);
        console.log("Fetched all questions:", result.data.questions);
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
    if (!status || !canStartQuiz(status)) {
      toast.error("Không thể bắt đầu quiz lúc này");
      return;
    }

    try {
      setIsStarting(true);
      const result = await startQuizAttempt(lessonId);

      if (result.success && result.data) {
        setCurrentAttempt(result.data);
        setCurrentPage(1);
        setAnswers({});
        setResult(null);
        setQuizStartTime(new Date());

        if (result.data.timeLimit) {
          setTimeRemaining(result.data.timeLimit * 60);
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
              answerId: answer,
            };
          } else if (
            question.type === "MULTIPLE_CHOICE" &&
            Array.isArray(answer)
          ) {
            return {
              questionId: question.id,
              answerId: answer[0] || "",
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

      const result = await submitQuizAttempt(
        currentAttempt.attemptId,
        submission,
      );

      if (result.success && result.data) {
        setResult(result.data);
        setCurrentAttempt(null);
        setTimeRemaining(null);
        await fetchQuizData();

        if (result.data.isPassed) {
          toast.success(
            `Chúc mừng! Bạn đã đạt ${result.data.score}% và vượt qua quiz!`,
          );
        } else {
          toast.warning(
            `Bạn đạt ${result.data.score}%. ${result.data.canRetry ? "Hãy cố gắng lần sau!" : "Bạn đã hết lượt thử."}`,
          );
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

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
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
                  <CardTitle className="text-xl text-blue-900">
                    {lessonTitle}
                  </CardTitle>
                  <p className="text-sm text-blue-700">
                    Lần thử thứ {currentAttempt.attemptNumber || 1}
                    {quizStartTime && (
                      <span className="ml-2">
                        • Bắt đầu lúc:{" "}
                        {quizStartTime.toLocaleTimeString("vi-VN")}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {timeRemaining !== null && (
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
                            <div className="space-y-3 ml-12">
                              {question.answers.map((answer, answerIndex) => (
                                <div
                                  key={answer.id}
                                  className="flex items-start space-x-3"
                                >
                                  <input
                                    type={
                                      question.type === "SINGLE_CHOICE"
                                        ? "radio"
                                        : "checkbox"
                                    }
                                    id={`${question.id}-${answer.id}`}
                                    name={question.id}
                                    value={answer.id}
                                    checked={
                                      question.type === "SINGLE_CHOICE"
                                        ? answers[question.id] === answer.id
                                        : Array.isArray(answers[question.id]) &&
                                          (
                                            answers[question.id] as string[]
                                          ).includes(answer.id)
                                    }
                                    onChange={(e) => {
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

                                        if (e.target.checked) {
                                          handleAnswerChange(question.id, [
                                            ...currentAnswers,
                                            answer.id,
                                          ]);
                                        } else {
                                          handleAnswerChange(
                                            question.id,
                                            currentAnswers.filter(
                                              (id) => id !== answer.id,
                                            ),
                                          );
                                        }
                                      }
                                    }}
                                    className="w-4 h-4 mt-1 text-primary focus:ring-primary flex-shrink-0"
                                  />
                                  <label
                                    htmlFor={`${question.id}-${answer.id}`}
                                    className="flex-1 cursor-pointer"
                                  >
                                    <span className="text-sm font-medium mr-2 text-blue-600">
                                      {String.fromCharCode(65 + answerIndex)}.
                                    </span>
                                    <div className="inline">
                                      {renderHTMLContent(answer.text)}
                                    </div>
                                  </label>
                                </div>
                              ))}
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

        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 1024) && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className={cn(
                "w-80 space-y-4",
                sidebarOpen
                  ? "fixed right-4 top-4 bottom-4 z-50 lg:relative lg:top-0 lg:bottom-0"
                  : "hidden lg:block",
              )}
            >
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Danh sách câu hỏi</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarOpen(false)}
                      className="lg:hidden"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Đã trả lời: {answeredCount}/{totalQuestions}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {allQuestions.map((question, index) => {
                    const questionNumber = index + 1;
                    const isAnswered =
                      getQuestionStatus(question.id) === "answered";
                    const isCurrentPage =
                      Math.ceil(questionNumber / questionsPerPage) ===
                      currentPage;

                    return (
                      <Button
                        key={question.id}
                        variant={isCurrentPage ? "default" : "ghost"}
                        size="sm"
                        onClick={() => goToQuestion(index)}
                        className={cn(
                          "w-full justify-start text-left h-auto p-3",
                          isAnswered && "border-l-4 border-l-green-500",
                        )}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <Badge
                            variant={isAnswered ? "default" : "secondary"}
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
                          </div>
                          {isAnswered && (
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {timeRemaining !== null &&
          timeRemaining <= 300 &&
          timeRemaining > 0 && (
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
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <Card
          className={`border-2 ${result.isPassed ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}
        >
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              {result.isPassed ? (
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              ) : (
                <XCircle className="h-16 w-16 text-orange-500 mx-auto" />
              )}

              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {result.isPassed
                    ? "Chúc mừng! Bạn đã đạt!"
                    : "Chưa đạt yêu cầu"}
                </h3>
                <p className="text-lg">
                  Điểm số: <span className="font-bold">{result.score}%</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Thời gian làm bài: {result.timeSpent} phút
                </p>
                {quizStartTime && (
                  <p className="text-sm text-muted-foreground">
                    Bắt đầu: {quizStartTime.toLocaleTimeString("vi-VN")} - Kết
                    thúc: {new Date().toLocaleTimeString("vi-VN")}
                  </p>
                )}
              </div>

              {!result.isPassed && result.canRetry && (
                <div className="space-y-2">
                  <p className="text-sm">
                    Bạn có thể làm lại bài quiz
                    {result.nextAllowedAt &&
                      ` sau ${formatWaitTime(result.nextAllowedAt)}`}
                  </p>
                  <Button
                    onClick={() => {
                      setResult(null);
                      fetchQuizData();
                    }}
                    className="mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Làm lại
                  </Button>
                </div>
              )}
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
      className="space-y-6"
    >
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Play className="h-5 w-5 text-blue-600" />
            Quiz: {lessonTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quiz Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/80 rounded-lg border border-blue-100">
              <div className="text-2xl font-bold text-blue-600">
                {status.attemptsUsed}
              </div>
              <div className="text-sm text-blue-700">
                Đã thử / {status.maxAttempts || "∞"}
              </div>
            </div>

            {status.lastScore !== null && (
              <div className="text-center p-4 bg-white/80 rounded-lg border border-orange-100">
                <div className="text-2xl font-bold text-orange-500">
                  {status.lastScore}%
                </div>
                <div className="text-sm text-orange-700">Điểm gần nhất</div>
              </div>
            )}

            {history && history.bestScore > 0 && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                  <Trophy className="h-5 w-5" />
                  {history.bestScore}%
                </div>
                <div className="text-sm text-yellow-700">Điểm cao nhất</div>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {status.isPassed && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Bạn đã hoàn thành quiz này!
              </span>
            </div>
          )}

          {!canStartQuiz(status) && status.nextAllowedAt && (
            <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-orange-800">
                Bạn cần chờ {formatWaitTime(status.nextAllowedAt)} nữa để làm
                lại
              </span>
            </div>
          )}

          {!status.canAttempt && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">
                Bạn đã hết lượt thử cho quiz này
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleStartQuiz}
              disabled={!canStartQuiz(status) || isStarting}
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
