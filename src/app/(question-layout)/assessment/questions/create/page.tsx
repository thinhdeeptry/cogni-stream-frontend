"use client";

import { useRouter } from "next/navigation";

import { Question } from "@/types/assessment/types";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { QuestionForm } from "@/components/assessment/question-form";
import { Button } from "@/components/ui/button";

export default function CreateQuestionPage() {
  const router = useRouter();

  const handleSubmit = async (data: Question) => {
    try {
      // Bỏ qua các trường media khi gửi request
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

      await axios.post("http://localhost:3005/api/v1/questions", requestData);
      toast.success("Thêm câu hỏi thành công");
      router.push("/assessment/questions");
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("Có lỗi xảy ra khi thêm câu hỏi");
    }
  };

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
          <h2 className="text-2xl font-semibold">Thêm câu hỏi mới</h2>
          <p className="text-muted-foreground">
            Tạo câu hỏi mới cho ngân hàng đề
          </p>
        </div>
      </div>
      <QuestionForm onSubmit={handleSubmit} />
    </div>
  );
}
