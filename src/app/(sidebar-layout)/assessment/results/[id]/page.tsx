"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { Question } from "@/types/assessment/types";
import { ArrowLeft, Clock, Trophy } from "lucide-react";
import { toast } from "sonner";

import { getTestResult } from "@/actions/testAction";

import { ResultQuestionView } from "@/components/assessment/result-question-view";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface TestResult {
  id: string;
  testId: string;
  testTitle: string;
  testType: string;
  attemptNumber: number;
  totalScore: number;
  maxScore: number;
  startedAt: string;
  submittedAt: string;
  canReview: boolean;
  questions: Array<{
    id: string;
    question: Question;
    maxScore: number;
    earnedScore: number;
    feedback: string;
    userAnswer: any;
    optionOrder: string[];
    referenceAnswer?: {
      content: any;
      notes?: string;
    };
  }>;
}

export default function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  return <ResultPageClient id={resolvedParams.id} />;
}

function ResultPageClient({ id }: { id: string }) {
  const router = useRouter();
  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setIsLoading(true);
        const result = await getTestResult(id);

        if (!result.success) {
          throw new Error(
            result.message || "Không thể lấy kết quả bài kiểm tra",
          );
        }

        setResult(result.data);
      } catch (error) {
        console.error("Error fetching test result:", error);
        toast.error("Có lỗi xảy ra khi tải kết quả bài kiểm tra");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Không tìm thấy kết quả</h2>
          <p className="text-muted-foreground">
            Kết quả không tồn tại hoặc đã bị xóa
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push("/assessment/tests")}
          >
            Quay lại danh sách bài kiểm tra
          </Button>
        </div>
      </div>
    );
  }

  const scorePercentage = (result.totalScore / result.maxScore) * 100;
  const startTime = new Date(result.startedAt);
  const endTime = new Date(result.submittedAt);
  const duration = Math.floor(
    (endTime.getTime() - startTime.getTime()) / 60000,
  ); // in minutes

  const getTestTypeText = (type: string) => {
    switch (type) {
      case "PRACTICE":
        return "Bài tập";
      case "QUIZ":
        return "Bài kiểm tra";
      case "FINAL":
        return "Bài thi cuối kỳ";
      case "ASSIGNMENT":
        return "Bài tập về nhà";
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push("/assessment/tests")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách bài kiểm tra
        </Button>

        <h1 className="text-2xl font-bold">{result.testTitle}</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{getTestTypeText(result.testType)}</span>
          <span>•</span>
          <span>Lần thử #{result.attemptNumber}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">Điểm số</h3>
          </div>
          <div className="text-3xl font-bold mb-2">
            {result.totalScore}/{result.maxScore}
          </div>
          <Progress value={scorePercentage} className="h-2" />
          <div className="text-sm text-muted-foreground mt-2">
            {scorePercentage.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Thời gian làm bài</h3>
          </div>
          <div className="text-3xl font-bold mb-2">{duration} phút</div>
          <div className="text-sm text-muted-foreground">
            Bắt đầu: {startTime.toLocaleString()}
            <br />
            Kết thúc: {endTime.toLocaleString()}
          </div>
        </div>
      </div>

      {!result.canReview ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">
            Không thể xem lại chi tiết bài làm
          </h3>
          <p className="text-muted-foreground">
            Giáo viên đã tắt tính năng xem lại chi tiết bài làm cho bài kiểm tra
            này.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Chi tiết bài làm</h2>
          {result.questions.map((item, index) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-medium">Câu hỏi {index + 1}</h3>
              </div>
              <ResultQuestionView
                question={item.question}
                optionOrder={item.optionOrder}
                userAnswer={item.userAnswer}
                earnedScore={item.earnedScore}
                maxScore={item.maxScore}
                feedback={item.feedback}
                referenceAnswer={item.referenceAnswer}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
