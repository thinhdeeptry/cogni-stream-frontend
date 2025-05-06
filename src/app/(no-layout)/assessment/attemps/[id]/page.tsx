"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { Question } from "@/types/assessment/types";
import { toast } from "sonner";

import { getQuestionsById } from "@/actions/assessmentAction";
import {
  getTestAttemptById,
  saveTestAnswer,
  submitTestAttempt,
} from "@/actions/testAction";

import { QuestionGrid } from "@/components/assessment/question-grid";
import { QuestionView } from "@/components/assessment/question-view";

interface TestAttempt {
  id: string;
  testTakerId: string;
  testId: string;
  attemptNumber: number;
  questionOrder: string[];
  optionOrders: Record<string, string[]>;
  totalScore: number | null;
  startedAt: string;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  answers: Array<{
    id: string;
    questionId: string;
    answerData: any;
    submittedAt: string;
  }>;
  test: {
    id: string;
    title: string;
    duration: number;
    maxScore: number;
    testType: string;
  };
}

interface TestQuestion {
  id: string;
  question: Question;
  answer: any | null;
  isAnswered: boolean;
}

export default function AttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return <AttemptPageClient id={resolvedParams.id} />;
}

function AttemptPageClient({ id }: { id: string }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const QUESTIONS_PER_PAGE = 4;
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const currentQuestions = questions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE,
  );

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        setIsLoading(true);

        // Get attempt data
        const attemptResult = await getTestAttemptById(id);
        if (!attemptResult.success) {
          throw new Error(
            attemptResult.message || "Không thể lấy thông tin bài làm",
          );
        }

        const attemptData = attemptResult.data;
        setAttempt(attemptData);

        // Create a map of existing answers
        const answersMap = new Map(
          attemptData.answers.map((answer: any) => [
            answer.questionId,
            answer.answerData,
          ]),
        );

        // Fetch all questions in one call
        const questionsResult = await getQuestionsById(
          attemptData.questionOrder,
        );
        if (!questionsResult.success) {
          throw new Error(
            questionsResult.message || "Không thể lấy danh sách câu hỏi",
          );
        }

        // Combine questions with existing answers
        const questionsData = attemptData.questionOrder
          .map((questionId: string, index: number) => {
            return {
              id: questionId,
              question: questionsResult.data
                ? questionsResult.data[index]
                : null,
              answer: answersMap.get(questionId) || null,
              isAnswered: answersMap.has(questionId),
            };
          })
          .filter((item: TestQuestion) => item.question !== null); // Filter out any null questions

        setQuestions(questionsData);
      } catch (error) {
        console.error("Error fetching attempt:", error);
        toast.error("Có lỗi xảy ra khi tải bài làm");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttempt();
  }, [id]);

  const handleAnswer = async (questionId: string, answer: any) => {
    try {
      const result = await saveTestAnswer(id, {
        questionId,
        answerData: answer,
      });

      if (!result.success) {
        throw new Error(result.message || "Không thể lưu câu trả lời");
      }

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, answer, isAnswered: true } : q,
        ),
      );

      toast.success("Đã lưu câu trả lời");
    } catch (error) {
      console.error("Error saving answer:", error);
      toast.error("Có lỗi xảy ra khi lưu câu trả lời");
    }
  };

  const handleSubmit = async () => {
    try {
      const result = await submitTestAttempt(id);

      if (!result.success) {
        throw new Error(result.message || "Không thể nộp bài");
      }

      toast.success("Đã nộp bài thành công");
      // Chuyển hướng đến trang kết quả
      router.push(`/assessment/results/${id}`);
    } catch (error) {
      console.error("Error submitting attempt:", error);
      toast.error("Có lỗi xảy ra khi nộp bài");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Không tìm thấy bài làm</h2>
          <p className="text-muted-foreground">
            Bài làm không tồn tại hoặc đã bị xóa
          </p>
        </div>
      </div>
    );
  }

  const isSubmitted = !!attempt.submittedAt;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Right column - Question grid */}
      <div className="w-2/3 flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold">{attempt.test.title}</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <p>Lần thử #{attempt.attemptNumber}</p>
            <p>Thời gian: {attempt.test.duration} phút</p>
            <p>Điểm tối đa: {attempt.test.maxScore}</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 p-4">
            {currentQuestions.map((question) => (
              <div key={question.id} className="border rounded-lg">
                <QuestionView
                  question={question.question}
                  optionOrder={attempt.optionOrders[question.id]}
                  answer={question.answer}
                  onAnswer={(answer) => handleAnswer(question.id, answer)}
                  disabled={isSubmitted}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t flex items-center justify-between">
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 0}
            >
              Trang trước
            </button>
            <button
              className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages - 1}
            >
              Trang sau
            </button>
          </div>
          {!isSubmitted && (
            <button
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSubmit}
            >
              Nộp bài
            </button>
          )}
        </div>
      </div>

      {/* Left column - Questions */}

      <div className="w-1/3 border-r p-6">
        <QuestionGrid
          questions={questions}
          currentPage={currentPage}
          onSelect={(index) =>
            setCurrentPage(Math.floor(index / QUESTIONS_PER_PAGE))
          }
        />
      </div>
    </div>
  );
}
