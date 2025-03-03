"use client";

import { useState, useEffect } from "react";
import { Tree } from "@/components/ui/tree";
import { mockCourses } from "@/data/mock";
import { mockQuestions } from "@/data/mock-questions";
import { Question, QuestionType } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionForm } from "@/components/assessment/question-form";
import axios from "axios";
import { toast } from "sonner";

function transformCoursesToTreeData(courses: typeof mockCourses) {
  return courses.map((course) => ({
    id: course.id,
    name: course.name,
    children: course.chapters.map((chapter) => ({
      id: chapter.id,
      name: chapter.name,
      children: chapter.lessons.map((lesson) => ({
        id: lesson.id,
        name: lesson.name,
      })),
    })),
  }));
}

// Hàm lấy thông tin courseId và chapterId từ lessonId
function getQuestionContext(lessonId: string) {
  for (const course of mockCourses) {
    for (const chapter of course.chapters) {
      const lesson = chapter.lessons.find((l) => l.id === lessonId);
      if (lesson) {
        return {
          courseId: course.id,
          chapterId: chapter.id,
          lessonId: lesson.id,
        };
      }
    }
  }
  return null;
}

// Hàm lấy thông tin courseId từ chapterId
function getCourseFromChapter(chapterId: string) {
  for (const course of mockCourses) {
    const chapter = course.chapters.find((c) => c.id === chapterId);
    if (chapter) {
      return {
        courseId: course.id,
        chapterId: chapter.id,
      };
    }
  }
  return null;
}

export default function QuestionsPage() {
  const [selectedId, setSelectedId] = useState<string>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuestions = async (id?: string) => {
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
        "http://localhost:3005/assessment/api/v1/questions",
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

  const handleTreeSelect = (id: string) => {
    setSelectedId(id);
  };

  const handleAddClick = () => {
    if (!selectedId) {
      toast.error("Vui lòng chọn nơi muốn thêm câu hỏi");
      return;
    }
    setShowForm(true);
  };

  const handleSubmit = async (data: Question) => {
    try {
      let contextData = {};

      if (selectedId) {
        if (selectedId.startsWith("lesson-")) {
          const context = getQuestionContext(selectedId);
          if (context) {
            contextData = context;
          }
        } else if (selectedId.startsWith("chapter-")) {
          const context = getCourseFromChapter(selectedId);
          if (context) {
            contextData = context;
          }
        } else if (selectedId.startsWith("course-")) {
          contextData = { courseId: selectedId };
        }
      }

      // Bỏ qua các trường media khi gửi request
      const requestData = {
        ...data,
        ...contextData,
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

      await axios.post(
        "http://localhost:3005/assessment/api/v1/questions",
        requestData,
      );
      toast.success("Thêm câu hỏi thành công");
      setShowForm(false);
      // Cập nhật lại danh sách câu hỏi
      const newQuestions = [
        ...questions,
        { ...requestData, id: Math.random().toString() },
      ];
      setQuestions(newQuestions);
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("Có lỗi xảy ra khi thêm câu hỏi");
    }
  };

  // Lấy tên của item được chọn
  const getSelectedName = () => {
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
  };

  return (
    <div className="flex h-screen">
      <div className="w-80 border-r p-6">
        <h2 className="text-lg font-semibold mb-4">Danh sách khóa học</h2>
        <Tree
          data={transformCoursesToTreeData(mockCourses)}
          onSelect={handleTreeSelect}
          selectedId={selectedId}
        />
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {showForm ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  className="h-12 px-6 gap-2 text-base"
                  onClick={() => setShowForm(false)}
                >
                  <ArrowLeft className="h-5 w-5" />
                  Quay lại
                </Button>
                <div>
                  <h2 className="text-2xl font-semibold">Thêm câu hỏi mới</h2>
                  <p className="text-muted-foreground">{getSelectedName()}</p>
                </div>
              </div>
              <QuestionForm lessonId="" onSubmit={handleSubmit} />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Ngân hàng câu hỏi</h2>
                  <p className="text-muted-foreground">{getSelectedName()}</p>
                </div>
                <Button
                  onClick={handleAddClick}
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
                    <Card key={index}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-medium">
                          Câu hỏi {index + 1}
                        </CardTitle>
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
                          {question.type === QuestionType.TRUE_FALSE &&
                            "Đúng/Sai"}
                          {question.type === QuestionType.ESSAY && "Tự luận"}
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
                                    <p className="flex-1">
                                      {option.content.text}
                                    </p>
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
                              <p className="font-medium mb-2">
                                Đáp án tham khảo:
                              </p>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
