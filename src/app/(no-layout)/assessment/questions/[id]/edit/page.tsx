"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Question } from "@/types/assessment/types";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { QuestionForm } from "@/components/assessment/question-form";
import { Button } from "@/components/ui/button";

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams(); // Lấy params từ URL
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dữ liệu câu hỏi khi component mount
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await axios.get<Question>(
          `http://localhost:3005/api/v1/questions/${params.id}`,
        );
        setQuestion(response.data);
      } catch (error) {
        console.error("Error fetching question:", error);
        toast.error("Có lỗi xảy ra khi tải thông tin câu hỏi");
        router.push("/assessment/questions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestion();
  }, [params.id, router]);

  // Hàm xử lý submit form
  const handleSubmit = async (data: Question) => {
    try {
      const requestData = {
        ...data,
        content: {
          text: data.content.text,
        },
        options: data.options?.map((option) => ({
          ...option,
          content: {
            text: option.content.text,
          },
        })),
        referenceAnswer: data.referenceAnswer
          ? {
              ...data.referenceAnswer,
              content: {
                text: data.referenceAnswer.content.text,
              },
            }
          : undefined,
      };

      await axios.patch(
        `http://localhost:3005/api/v1/questions/${params.id}`,
        requestData,
      );
      toast.success("Cập nhật câu hỏi thành công");
      router.push("/assessment/questions");
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error("Có lỗi xảy ra khi cập nhật câu hỏi");
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
      <QuestionForm initialData={question} onSubmit={handleSubmit} />
    </div>
  );
}
