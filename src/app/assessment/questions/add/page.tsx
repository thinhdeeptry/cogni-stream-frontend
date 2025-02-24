"use client";

import { QuestionForm } from "@/components/question-form";
import { Question } from "@/types";
import { mockCourses } from "@/data/mock";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AddQuestionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const [courseName, setCourseName] = useState("");

  useEffect(() => {
    if (!courseId) {
      toast.error("Không tìm thấy thông tin khóa học");
      router.push("/assessment/questions");
      return;
    }

    const course = mockCourses.find((course) => course.id === courseId);
    if (!course) {
      toast.error("Không tìm thấy thông tin khóa học");
      router.push("/assessment/questions");
      return;
    }

    setCourseName(course.name);
  }, [courseId, router]);

  const handleSubmit = async (data: Question) => {
    try {
      // Bỏ qua các trường media khi gửi request
      const requestData = {
        ...data,
        courseId,
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

      await axios.post("http://localhost:3003/questions", requestData);
      toast.success("Thêm câu hỏi thành công");
      router.push("/assessment/questions");
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("Có lỗi xảy ra khi thêm câu hỏi");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 space-y-4">
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
          <p className="text-muted-foreground">Khóa học: {courseName}</p>
        </div>
      </div>
      <QuestionForm lessonId="" onSubmit={handleSubmit} />
    </div>
  );
}
