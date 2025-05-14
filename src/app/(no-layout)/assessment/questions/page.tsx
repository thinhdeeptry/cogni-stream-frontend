"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Question, QuestionType } from "@/types/assessment/types";
import parse from "html-react-parser";
import { BookOpen, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { getQuestions } from "@/actions/assessmentAction";
import { getUserCourseStructureWithDetails } from "@/actions/courseAction";

import useUserStore from "@/stores/useUserStore";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Lesson {
  id: string;
  title: string;
}

interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  ownerId: string;
  title: string;
  chapters: Chapter[];
}

// Hàm lấy tên của item được chọn
function getSelectedName(selectedId?: string | null, courses: Course[] = []) {
  if (!selectedId) return "Tất cả câu hỏi";

  // Tìm khóa học
  const course = courses.find((c) => c.id === selectedId);
  if (course) {
    return `Khóa học: ${course.title}`;
  }

  // Tìm chương
  for (const course of courses) {
    const chapter = course.chapters.find((ch) => ch.id === selectedId);
    if (chapter) {
      return `Chương: ${chapter.title} - ${course.title}`;
    }
  }

  // Tìm bài học
  for (const course of courses) {
    for (const chapter of course.chapters) {
      const lesson = chapter.lessons.find((l) => l.id === selectedId);
      if (lesson) {
        return `Bài: ${lesson.title} - ${chapter.title} - ${course.title}`;
      }
    }
  }

  return "Tất cả câu hỏi";
}

// Add a component to safely render HTML content
const RichTextContent = ({ content }: { content: string }) => {
  return (
    <div className="prose max-w-none dark:prose-invert">{parse(content)}</div>
  );
};

export default function QuestionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("contextId");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lấy thông tin user từ store
  const user = useUserStore((state) => state.user);

  // Lấy danh sách khóa học
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (!user?.id) {
          setError("Bạn cần đăng nhập để xem danh sách khóa học");
          return;
        }

        const result = await getUserCourseStructureWithDetails(user.id);

        if (result.success && result.data) {
          // Handle both possible response formats
          const courseData = Array.isArray(result.data)
            ? result.data
            : result.data.value
              ? result.data.value
              : [];

          if (courseData.length === 0) {
            setError("Không tìm thấy khóa học nào");
            return;
          }

          setCourses(courseData);
        } else {
          setError(result.message || "Không thể lấy dữ liệu khóa học");
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setError(
          "Không thể kết nối đến API khóa học. Vui lòng kiểm tra kết nối hoặc liên hệ quản trị viên.",
        );
      }
    };

    fetchCourses();
  }, [user?.id]);

  // Lấy danh sách câu hỏi
  useEffect(() => {
    const fetchQuestions = async () => {
      // Chỉ fetch câu hỏi khi có selectedId
      if (!selectedId) {
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Xác định loại ID (course, chapter, lesson) dựa vào cấu trúc của courses
        let params = {};
        let idType = "";

        // Tìm trong courses
        const course = courses.find((c) => c.id === selectedId);
        if (course) {
          params = { courseId: selectedId };
          idType = "course";
        } else {
          // Tìm trong chapters
          let foundChapter = false;
          for (const course of courses) {
            const chapter = course.chapters.find((ch) => ch.id === selectedId);
            if (chapter) {
              params = { chapterId: selectedId };
              idType = "chapter";
              foundChapter = true;
              break;
            }
          }

          // Nếu không phải chapter, tìm trong lessons
          if (!foundChapter) {
            for (const course of courses) {
              for (const chapter of course.chapters) {
                const lesson = chapter.lessons.find((l) => l.id === selectedId);
                if (lesson) {
                  params = { lessonId: selectedId };
                  idType = "lesson";
                  break;
                }
              }
            }
          }
        }

        console.log(`Selected ${idType} ID: ${selectedId}`);
        console.log("Sending API request with params:", params);

        const result = await getQuestions(params);

        if (result.success && result.data) {
          console.log("API response data:", result.data);
          setQuestions(result.data);
        } else {
          throw new Error(result.message || "Không thể lấy danh sách câu hỏi");
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        setError(
          "Không thể kết nối đến API câu hỏi. Vui lòng kiểm tra kết nối hoặc liên hệ quản trị viên.",
        );
        toast.error("Có lỗi xảy ra khi tải danh sách câu hỏi");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedId, courses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Ngân hàng câu hỏi</h2>
          <p className="text-muted-foreground">
            {getSelectedName(selectedId, courses)}
          </p>
        </div>
        <Button
          onClick={() => {
            // Xác định context hiện tại để truyền vào trang tạo câu hỏi
            let params = new URLSearchParams();

            if (selectedId) {
              // Tìm trong courses
              const course = courses.find((c) => c.id === selectedId);
              if (course) {
                params.set("courseId", selectedId);
              } else {
                // Tìm trong chapters
                let foundChapter = false;
                for (const course of courses) {
                  const chapter = course.chapters.find(
                    (ch) => ch.id === selectedId,
                  );
                  if (chapter) {
                    params.set("courseId", course.id);
                    params.set("chapterId", selectedId);
                    foundChapter = true;
                    break;
                  }
                }

                // Nếu không phải chapter, tìm trong lessons
                if (!foundChapter) {
                  for (const course of courses) {
                    for (const chapter of course.chapters) {
                      const lesson = chapter.lessons.find(
                        (l) => l.id === selectedId,
                      );
                      if (lesson) {
                        params.set("courseId", course.id);
                        params.set("chapterId", chapter.id);
                        params.set("lessonId", selectedId);
                        break;
                      }
                    }
                  }
                }
              }
            }

            router.push(`/assessment/questions/create?${params.toString()}`);
          }}
          size="lg"
          className="h-12 px-6"
        >
          <Plus className="mr-2 h-5 w-5" />
          Thêm câu hỏi
        </Button>
      </div>

      <div className="grid gap-6">
        {!selectedId ? (
          <div className="text-center py-12 px-6 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/20">
            <div className="mb-4 flex justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Vui lòng chọn bài học
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Hãy chọn một bài học từ danh sách bên trái để xem các câu hỏi
              tương ứng với bài học đó.
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="font-semibold">Lỗi:</p>
            <p>{error}</p>
          </div>
        ) : isLoading ? (
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
                  <div className="space-y-2">
                    <span className="font-medium">Câu hỏi:</span>
                    <RichTextContent content={question.content.text} />
                  </div>
                  {question.options && (
                    <div>
                      <p className="font-medium mb-2">Đáp án:</p>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className="flex items-start gap-3 rounded-lg border p-4"
                          >
                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                              {String.fromCharCode(65 + optionIndex)}
                            </div>
                            <div className="flex-1">
                              <RichTextContent content={option.content.text} />
                            </div>
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
                        <RichTextContent
                          content={question.referenceAnswer.content.text}
                        />
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
