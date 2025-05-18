"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { BookOpen, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getUserCourseStructureWithDetails } from "@/actions/courseAction";
import { deleteTest, getTests } from "@/actions/testAction";

import useUserStore from "@/stores/useUserStore";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Test {
  id: string;
  title: string;
  description: string;
  testType: string;
  duration: number;
  maxScore: number;
  maxAttempts: number;
  testStart: string;
  testEnd: string;
  courseId: string;
  chapterId: string;
  lessonId: string;
}

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

function getSelectedName(selectedId?: string | null, courses: Course[] = []) {
  if (!selectedId) return "Tất cả bài kiểm tra";

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

  return "Tất cả bài kiểm tra";
}

function getTestTypeText(type: string) {
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
}

export default function TestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("contextId");
  const [tests, setTests] = useState<Test[]>([]);
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

  // Lấy danh sách bài kiểm tra
  useEffect(() => {
    const fetchTests = async () => {
      // Chỉ fetch bài kiểm tra khi có selectedId
      if (!selectedId) {
        setTests([]);
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

        const result = await getTests(params);

        if (result.success && result.data) {
          console.log("API response data:", result.data);
          setTests(result.data);
        } else {
          throw new Error(
            result.message || "Không thể lấy danh sách bài kiểm tra",
          );
        }
      } catch (error) {
        console.error("Error fetching tests:", error);
        setError(
          "Không thể kết nối đến API bài kiểm tra. Vui lòng kiểm tra kết nối hoặc liên hệ quản trị viên.",
        );
        toast.error("Có lỗi xảy ra khi tải danh sách bài kiểm tra");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, [selectedId, courses]);

  const handleDeleteTest = async (testId: string) => {
    try {
      const result = await deleteTest(testId);
      if (result.success) {
        toast.success("Xóa bài kiểm tra thành công");
        // Refresh the tests list
        const updatedTests = tests.filter((test) => test.id !== testId);
        setTests(updatedTests);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error deleting test:", error);
      toast.error("Có lỗi xảy ra khi xóa bài kiểm tra");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Quản lý bài kiểm tra</h2>
          <p className="text-muted-foreground">
            {getSelectedName(selectedId, courses)}
          </p>
        </div>
        <Button
          onClick={() => {
            // Xác định context hiện tại để truyền vào trang tạo bài kiểm tra
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

            router.push(`/assessment/tests/create?${params.toString()}`);
          }}
          size="lg"
          className="h-12 px-6"
        >
          <Plus className="mr-2 h-5 w-5" />
          Thêm bài kiểm tra
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
              Hãy chọn một bài học từ danh sách bên trái để xem các bài kiểm tra
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
        ) : tests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Không có bài kiểm tra nào
          </div>
        ) : (
          tests.map((test) => (
            <Card key={test.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {test.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/assessment/tests/${test.id}/edit`)
                    }
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Chỉnh sửa
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Xóa
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc chắn muốn xóa bài kiểm tra này? Hành động
                          này không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTest(test.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Xóa
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {test.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Loại:</span>
                      <span>{getTestTypeText(test.testType)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Thời gian:</span>
                      <span>{test.duration} phút</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Điểm tối đa:</span>
                      <span>{test.maxScore} điểm</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
