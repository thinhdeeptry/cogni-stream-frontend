"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { mockCourses } from "@/data/mock";
import { Question, QuestionType } from "@/types/assessment/types";
import axios from "axios";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Hàm lấy tên của item được chọn
function getSelectedName(selectedId?: string | null) {
  if (!selectedId) return "Tất cả câu hỏi";

  if (selectedId.startsWith("course-")) {
    const course = mockCourses.find((c) => c.id === selectedId);
    return course ? `Khóa học: ${course.name}` : "Tất cả câu hỏi";
  }

  if (selectedId.startsWith("chapter-")) {
    for (const course of mockCourses) {
      const chapter = course.chapters.find((c) => c.id === selectedId);
      if (chapter) {
        return `Chương: ${chapter.name} - ${course.name}`;
      }
    }
  }

  if (selectedId.startsWith("lesson-")) {
    for (const course of mockCourses) {
      for (const chapter of course.chapters) {
        const lesson = chapter.lessons.find((l) => l.id === selectedId);
        if (lesson) {
          return `Bài: ${lesson.name} - ${chapter.name} - ${course.name}`;
        }
      }
    }
  }

  return "Tất cả câu hỏi";
}

export default function QuestionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("contextId");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuestions = async (id?: string | null) => {
    try {
      setIsLoading(true);
      let params = {};

      if (id) {
        if (id.startsWith("course-")) {
          params = { courseId: id };
        } else if (id.startsWith("chapter-")) {
          params = { chapterId: id };
        } else if (id.startsWith("lesson-")) {
          params = { lessonId: id };
        }
      }

      const response = await axios.get(
        "http://localhost:3005/api/v1/questions",
        { params },
      );
      setQuestions(response.data);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Có lỗi xảy ra khi tải danh sách câu hỏi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(selectedId);
  }, [selectedId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Ngân hàng câu hỏi</h2>
          <p className="text-muted-foreground">{getSelectedName(selectedId)}</p>
        </div>
        <Button
          onClick={() => router.push("/assessment/questions/create")}
          size="lg"
          className="h-12 px-6"
        >
          <Plus className="mr-2 h-5 w-5" />
          Thêm câu hỏi
        </Button>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Không có câu hỏi nào
          </div>
        ) : (
          questions.map((question, index) => (
            <Card key={question.id || index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  Câu hỏi {index + 1}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium 
                    ${question.type === QuestionType.SINGLE_CHOICE ? "bg-blue-50 text-blue-700" : ""}
                    ${question.type === QuestionType.MULTIPLE_CHOICE ? "bg-purple-50 text-purple-700" : ""}
                    ${question.type === QuestionType.TRUE_FALSE ? "bg-green-50 text-green-700" : ""}
                    ${question.type === QuestionType.ESSAY ? "bg-orange-50 text-orange-700" : ""}`}
                  >
                    {question.type === QuestionType.SINGLE_CHOICE &&
                      "Trắc nghiệm một đáp án"}
                    {question.type === QuestionType.MULTIPLE_CHOICE &&
                      "Trắc nghiệm nhiều đáp án"}
                    {question.type === QuestionType.TRUE_FALSE && "Đúng/Sai"}
                    {question.type === QuestionType.ESSAY && "Tự luận"}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/assessment/questions/${question.id}/edit`)
                    }
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Cập nhật
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex">
                    <span className="font-medium mr-2">Câu hỏi:</span>
                    <p className="flex-1">{question.content.text}</p>
                  </div>
                  {question.options && (
                    <div>
                      <p className="font-medium mb-2">Đáp án:</p>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className="flex items-center gap-3 rounded-lg border p-4"
                          >
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                              {String.fromCharCode(65 + optionIndex)}
                            </div>
                            <p className="flex-1">{option.content.text}</p>
                            {option.isCorrect && (
                              <div className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                                Đáp án đúng
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {question.referenceAnswer && (
                    <div>
                      <p className="font-medium mb-2">Đáp án tham khảo:</p>
                      <div className="rounded-lg border p-4">
                        <p>{question.referenceAnswer.content.text}</p>
                        {question.referenceAnswer.notes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {question.referenceAnswer.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
