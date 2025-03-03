"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { QuestionSelectionForm } from "@/components/assessment/question-selection-form";
import { TestForm } from "@/components/assessment/test-form";
import { Button } from "@/components/ui/button";

export default function CreateTestPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [testData, setTestData] = useState<any>(null);

  const handleTestFormSubmit = (data: any) => {
    setTestData(data);
    setStep(2);
  };

  const handleQuestionSelectionSubmit = async (data: any) => {
    try {
      const finalData = {
        ...testData,
        ...data,
      };

      const response = await fetch("http://localhost:3005/api/v1/tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create test");
      }

      toast.success("Tạo bài kiểm tra thành công");
      router.push("/assessment/tests");
    } catch (error) {
      console.error("Error creating test:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi tạo bài kiểm tra",
      );
    }
  };

  return (
    <div className="space-y-6 overflow-y-auto p-20">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          className="h-12 px-6 gap-2 text-base"
          onClick={() => {
            if (step === 2) {
              setStep(1);
            } else {
              router.back();
            }
          }}
        >
          <ArrowLeft className="h-5 w-5" />
          {step === 2 ? "Quay lại" : "Trở về"}
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Thêm bài kiểm tra mới</h2>
          <p className="text-muted-foreground">
            {step === 1
              ? "Thiết lập thông tin cơ bản"
              : "Chọn câu hỏi cho bài kiểm tra"}
          </p>
        </div>
      </div>

      {step === 1 ? (
        <TestForm onSubmit={handleTestFormSubmit} />
      ) : (
        <QuestionSelectionForm
          courseId={testData.courseId}
          chapterId={testData.chapterId}
          lessonId={testData.lessonId}
          onSubmit={handleQuestionSelectionSubmit}
        />
      )}
    </div>
  );
}
