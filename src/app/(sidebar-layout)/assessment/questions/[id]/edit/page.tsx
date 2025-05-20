"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Question, QuestionFormValues } from "@/types/assessment/types";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { getQuestionById, updateQuestion } from "@/actions/assessmentAction";

import { QuestionForm } from "@/components/assessment/question-form";
import { Button } from "@/components/ui/button";

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : null;
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dữ liệu câu hỏi khi component mount
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        if (!questionId) {
          throw new Error("Không tìm thấy ID câu hỏi");
        }

        const result = await getQuestionById(questionId);
        console.log("Fetched question:", result);

        if (result.success && result.data) {
          setQuestion(result.data);
        } else {
          throw new Error(result.message || "Không thể lấy thông tin câu hỏi");
        }
      } catch (error: any) {
        console.error("Error fetching question:", error);
        toast.error(error.message || "Có lỗi xảy ra khi tải thông tin câu hỏi");
        router.push("/assessment/questions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestion();
  }, [questionId, router]);

  // Hàm xử lý submit form
  const handleSubmit = async (formData: QuestionFormValues): Promise<void> => {
    console.log("EditQuestionPage handleSubmit called with data:", formData);

    if (!questionId) {
      toast.error("Không tìm thấy ID câu hỏi");
      return;
    }

    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Simplify the data conversion
      const requestData = {
        id: questionId, // Make sure ID is included
        type: formData.type,
        content: formData.content,
        difficulty: formData.difficulty,
        courseId: formData.courseId,
        chapterId: formData.chapterId,
        lessonId: formData.lessonId,
        options: formData.options?.map((option: any) => ({
          content: option.content,
          isCorrect: option.isCorrect,
          order: option.order,
        })),
        referenceAnswer: formData.referenceAnswer,
      };

      console.log(
        "Converted request data:",
        JSON.stringify(requestData, null, 2),
      );

      // Direct API call
      const result = await updateQuestion(questionId, requestData);
      console.log("API response:", result);

      if (result.success) {
        toast.success("Cập nhật câu hỏi thành công");
        router.push("/assessment/questions");
      } else {
        toast.error(result.message || "Không thể cập nhật câu hỏi");
      }
    } catch (error: any) {
      console.error("Error updating question:", error);
      toast.error(error.message || "Có lỗi xảy ra khi cập nhật câu hỏi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hiển thị loading khi đang fetch dữ liệu
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Trường hợp không có dữ liệu
  if (!question) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          className="h-12 px-6 gap-2 text-base"
          onClick={() => router.push("/assessment/questions")}
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lại
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Cập nhật câu hỏi</h2>
          <p className="text-muted-foreground">Chỉnh sửa thông tin câu hỏi</p>
        </div>
      </div>
      <QuestionForm
        initialData={question}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
