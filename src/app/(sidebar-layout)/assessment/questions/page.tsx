"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { Question, QuestionType } from "@/types/assessment/types";
// Import new types
import {
  ChapterStructure,
  ClassStructure,
  CourseStructureResponse,
  LessonStructure,
} from "@/types/course/types";
import parse from "html-react-parser";
import {
  BookOpen,
  CheckCircle,
  Circle,
  ClipboardList,
  Edit3,
  FileText,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { getQuestions } from "@/actions/assessmentAction";
import { getCourseStructureWithQuestionStats } from "@/actions/courseAction";

import useUserStore from "@/stores/useUserStore";

import Loading from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Lesson {
  id: string;
  title: string;
  questionStats?: {
    totalQuestions: number;
    questionsByType: Record<string, number>;
    hasQuestions: boolean;
  };
  quizStats?: {
    totalQuizzes: number;
    activeQuizzes: number;
    quizTypes: string[];
    hasActiveQuiz: boolean;
  };
}

interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
  stats?: {
    totalLessons: number;
    totalQuestions: number;
    questionsByType: Record<string, number>;
    totalQuizzes: number;
  };
}

interface Course {
  id: string;
  instructorId: string; // Changed from ownerId
  title: string;
  courseType: "SELF_PACED" | "LIVE";
  isPublished: boolean;
  thumbnailUrl?: string;
  chapters: Chapter[];
  classes?: ClassStructure[];
  stats?: {
    totalChapters: number;
    totalLessons: number;
    totalQuestions: number;
    totalQuizzes: number;
    totalClasses?: number;
  };
}

// Hàm lấy tên của item được chọn với thông tin thống kê
function getSelectedName(selectedId?: string | null, courses: Course[] = []) {
  if (!selectedId) return "Tất cả câu hỏi";

  // Tìm khóa học
  const course = courses.find((c) => c.id === selectedId);
  if (course) {
    const courseTypeText =
      course.courseType === "LIVE" ? "Lớp học trực tuyến" : "Khóa học tự học";
    const statsText = course.stats
      ? ` (${course.stats.totalQuestions} câu hỏi, ${course.stats.totalQuizzes} quiz)`
      : "";
    return `${courseTypeText}: ${course.title}${statsText}`;
  }

  // Tìm lớp học (cho LIVE courses)
  for (const course of courses) {
    if (course.classes) {
      const classItem = course.classes.find((c) => c.id === selectedId);
      if (classItem) {
        const statsText = classItem.stats
          ? ` (${classItem.stats.totalQuestions} câu hỏi, ${classItem.stats.totalQuizzes} quiz)`
          : "";
        return `Lớp: ${classItem.name} - ${course.title}${statsText}`;
      }
    }
  }

  // Tìm chương
  for (const course of courses) {
    const chapter = course.chapters.find((ch) => ch.id === selectedId);
    if (chapter) {
      const statsText = chapter.stats
        ? ` (${chapter.stats.totalQuestions} câu hỏi, ${chapter.stats.totalQuizzes} quiz)`
        : "";
      return `Chương: ${chapter.title} - ${course.title}${statsText}`;
    }
  }

  // Tìm bài học
  for (const course of courses) {
    for (const chapter of course.chapters) {
      const lesson = chapter.lessons.find((l) => l.id === selectedId);
      if (lesson) {
        const statsText = lesson.questionStats
          ? ` (${lesson.questionStats.totalQuestions} câu hỏi)`
          : "";
        const quizText =
          lesson.quizStats && lesson.quizStats.totalQuizzes > 0
            ? `, ${lesson.quizStats.totalQuizzes} quiz`
            : "";
        return `Bài: ${lesson.title} - ${chapter.title} - ${course.title}${statsText}${quizText}`;
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

// Question type display helper
const getQuestionTypeInfo = (type: QuestionType) => {
  switch (type) {
    case QuestionType.SINGLE_CHOICE:
      return {
        label: "Trắc nghiệm 1 đáp án",
        icon: <Circle className="h-4 w-4" />,
        color: "bg-blue-50 text-blue-700 border-blue-200",
        borderColor: "border-l-blue-500",
      };
    case QuestionType.MULTIPLE_CHOICE:
      return {
        label: "Trắc nghiệm nhiều đáp án",
        icon: <CheckCircle className="h-4 w-4" />,
        color: "bg-green-50 text-green-700 border-green-200",
        borderColor: "border-l-green-500",
      };
    case "SHORT_ANSWER" as QuestionType:
      return {
        label: "Câu trả lời ngắn",
        icon: <Edit3 className="h-4 w-4" />,
        color: "bg-orange-50 text-orange-700 border-orange-200",
        borderColor: "border-l-orange-500",
      };
    case QuestionType.ESSAY:
      return {
        label: "Câu trả lời dài",
        icon: <FileText className="h-4 w-4" />,
        color: "bg-purple-50 text-purple-700 border-purple-200",
        borderColor: "border-l-purple-500",
      };
    case "FILL_IN_BLANK" as QuestionType:
      return {
        label: "Điền vào chỗ trống",
        icon: <ClipboardList className="h-4 w-4" />,
        color: "bg-red-50 text-red-700 border-red-200",
        borderColor: "border-l-red-500",
      };
    default:
      return {
        label: "Không xác định",
        icon: <Circle className="h-4 w-4" />,
        color: "bg-gray-50 text-gray-700 border-gray-200",
        borderColor: "border-l-gray-500",
      };
  }
};

// Component hiển thị thống kê câu hỏi
const QuestionStatsDisplay = ({
  selectedId,
  courses,
}: {
  selectedId: string;
  courses: Course[];
}) => {
  const getStatsForSelectedItem = () => {
    // Tìm trong courses
    const course = courses.find((c) => c.id === selectedId);
    if (course && course.stats) {
      return {
        type:
          course.courseType === "LIVE"
            ? "Lớp học trực tuyến"
            : "Khóa học tự học",
        stats: course.stats,
        questionsByType: null,
      };
    }

    // Tìm trong classes (cho LIVE courses)
    for (const course of courses) {
      if (course.classes) {
        const classItem = course.classes.find((c) => c.id === selectedId);
        if (classItem && classItem.stats) {
          return {
            type: "Lớp học",
            stats: {
              totalQuestions: classItem.stats.totalQuestions,
              totalQuizzes: classItem.stats.totalQuizzes,
              totalLessons: classItem.stats.totalLessons,
              totalSessions: classItem.stats.totalSessions,
            },
            questionsByType: classItem.stats.questionsByType,
          };
        }
      }
    }

    // Tìm trong chapters
    for (const course of courses) {
      const chapter = course.chapters.find((ch) => ch.id === selectedId);
      if (chapter && chapter.stats) {
        return {
          type: "Chương",
          stats: chapter.stats,
          questionsByType: chapter.stats.questionsByType,
        };
      }
    }

    // Tìm trong lessons
    for (const course of courses) {
      for (const chapter of course.chapters) {
        const lesson = chapter.lessons.find((l) => l.id === selectedId);
        if (lesson && lesson.questionStats) {
          return {
            type: "Bài học",
            stats: {
              totalQuestions: lesson.questionStats.totalQuestions,
              totalQuizzes: lesson.quizStats?.totalQuizzes || 0,
            },
            questionsByType: lesson.questionStats.questionsByType,
          };
        }
      }
    }

    return null;
  };

  const statsData = getStatsForSelectedItem();

  if (!statsData) return null;

  const questionTypeLabels: Record<string, string> = {
    SINGLE_CHOICE: "Trắc nghiệm 1 đáp án",
    MULTIPLE_CHOICE: "Trắc nghiệm nhiều đáp án",
    SHORT_ANSWER: "Câu trả lời ngắn",
    ESSAY: "Câu trả lời dài",
    FILL_IN_BLANK: "Điền vào chỗ trống",
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200"
      >
        📊 {statsData.stats.totalQuestions} câu hỏi
      </Badge>
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200"
      >
        📝 {statsData.stats.totalQuizzes} quiz
      </Badge>

      {statsData.questionsByType &&
        Object.entries(statsData.questionsByType).map(([type, count]) => {
          if (count > 0) {
            return (
              <Badge
                key={type}
                variant="outline"
                className="bg-gray-50 text-gray-700 border-gray-200"
              >
                {questionTypeLabels[type] || type}: {count}
              </Badge>
            );
          }
          return null;
        })}

      {(statsData.stats as any).totalLessons && (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
          📚 {(statsData.stats as any).totalLessons} bài học
        </Badge>
      )}

      {(statsData.stats as any).totalSessions && (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200"
        >
          🎥 {(statsData.stats as any).totalSessions} buổi học
        </Badge>
      )}
    </div>
  );
};

function QuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("contextId");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useUserStore((state) => state.user);

  // Memoize selected name để tránh re-computation - chỉ dùng khi courses stable
  const selectedName = useMemo(() => {
    if (!coursesLoaded) return "Đang tải...";
    return getSelectedName(selectedId, courses);
  }, [selectedId, courses, coursesLoaded]);

  // Lấy danh sách khóa học với thống kê câu hỏi
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoadingCourses(true);
        if (!user?.id) {
          setError("Bạn cần đăng nhập để xem danh sách khóa học");
          return;
        }

        const result = await getCourseStructureWithQuestionStats();

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

          console.log("Course data with question stats:", courseData);
          setCourses(courseData);
          setCoursesLoaded(true);
        } else {
          setError(result.message || "Không thể lấy dữ liệu khóa học");
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setError(
          "Không thể kết nối đến API khóa học. Vui lòng kiểm tra kết nối hoặc liên hệ quản trị viên.",
        );
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [user?.id]);

  // Lấy danh sách câu hỏi
  useEffect(() => {
    const abortController = new AbortController();

    const fetchQuestions = async () => {
      // Chỉ fetch câu hỏi khi có selectedId và courses đã được load xong
      if (!selectedId || !coursesLoaded) {
        setQuestions([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Xác định loại ID (course, chapter, lesson, class) dựa vào cấu trúc của courses
        let params = {};
        let idType = "";

        // Tìm trong courses
        const course = courses.find((c) => c.id === selectedId);
        if (course) {
          params = { courseId: selectedId };
          idType = "course";
        } else {
          // Tìm trong classes (cho LIVE courses)
          let foundClass = false;
          for (const course of courses) {
            if (course.classes) {
              const classItem = course.classes.find((c) => c.id === selectedId);
              if (classItem) {
                params = { classId: selectedId };
                idType = "class";
                foundClass = true;
                break;
              }
            }
          }

          if (!foundClass) {
            // Tìm trong chapters
            let foundChapter = false;
            for (const course of courses) {
              const chapter = course.chapters.find(
                (ch) => ch.id === selectedId,
              );
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
                  const lesson = chapter.lessons.find(
                    (l) => l.id === selectedId,
                  );
                  if (lesson) {
                    params = { lessonId: selectedId };
                    idType = "lesson";
                    break;
                  }
                }
              }
            }
          }
        }

        console.log(`Selected ${idType} ID: ${selectedId}`);
        console.log("Sending API request with params:", params);

        // Check if component is still mounted
        if (abortController.signal.aborted) return;

        const result = await getQuestions(params);

        // Check again if component is still mounted
        if (abortController.signal.aborted) return;

        if (result.success && result.data) {
          console.log("API response data:", result.data);
          // Xử lý cả response format cũ và mới
          const questionsData = Array.isArray(result.data)
            ? result.data
            : result.data.data || result.data;
          setQuestions(questionsData);
        } else {
          // Xử lý lỗi từ API response (bao gồm cả lỗi 401 đã được xử lý trong action)
          const errorMessage =
            result.message || "Không thể lấy danh sách câu hỏi";
          setError(errorMessage);
          if (errorMessage.includes("hết hạn")) {
            toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          } else {
            toast.error(errorMessage);
          }
        }
      } catch (error) {
        if (abortController.signal.aborted) return; // Ignore aborted requests

        console.error("Error fetching questions:", error);

        setError(
          "Không thể kết nối đến API câu hỏi. Vui lòng kiểm tra kết nối hoặc liên hệ quản trị viên.",
        );
        toast.error("Có lỗi xảy ra khi tải danh sách câu hỏi");
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchQuestions();

    // Cleanup function để abort request khi component unmount hoặc dependencies thay đổi
    return () => {
      abortController.abort();
    };
  }, [selectedId, coursesLoaded, courses]); // Depend vào selectedId, coursesLoaded và courses

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Ngân hàng câu hỏi</h2>
          <p className="text-muted-foreground">{selectedName}</p>

          {/* Hiển thị thông tin thống kê nếu có context được chọn */}
          {selectedId && (
            <div className="mt-2">
              <QuestionStatsDisplay selectedId={selectedId} courses={courses} />
            </div>
          )}
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
                // Tìm trong classes (cho LIVE courses)
                let foundClass = false;
                for (const course of courses) {
                  if (course.classes) {
                    const classItem = course.classes.find(
                      (c) => c.id === selectedId,
                    );
                    if (classItem) {
                      params.set("courseId", course.id);
                      params.set("classId", selectedId);
                      foundClass = true;
                      break;
                    }
                  }
                }

                if (!foundClass) {
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
          questions.map((question, index) => {
            const typeInfo = getQuestionTypeInfo(question.type);

            return (
              <Card
                key={question.id || index}
                className={`border-l-4 ${typeInfo.borderColor}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    {typeInfo.icon}
                    Câu hỏi {index + 1}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${typeInfo.color} flex items-center gap-1`}
                    >
                      {typeInfo.label}
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
                      <RichTextContent
                        content={question.content?.text || question.text || ""}
                      />
                    </div>

                    {/* Hiển thị đáp án cho trắc nghiệm */}
                    {(question.type === QuestionType.SINGLE_CHOICE ||
                      question.type === QuestionType.MULTIPLE_CHOICE) &&
                      question.answers && (
                        <div>
                          <p className="font-medium mb-2">Đáp án:</p>
                          <div className="space-y-2">
                            {question.answers.map(
                              (answer: any, answerIndex: number) => (
                                <div
                                  key={answer.id || answerIndex}
                                  className={`flex items-start gap-3 rounded-lg border p-4 ${
                                    answer.isCorrect
                                      ? "bg-green-50 border-green-200"
                                      : "bg-gray-50"
                                  }`}
                                >
                                  <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                    {String.fromCharCode(65 + answerIndex)}
                                  </div>
                                  <div className="flex-1">
                                    <RichTextContent
                                      content={
                                        answer.text ||
                                        answer.content?.text ||
                                        ""
                                      }
                                    />
                                  </div>
                                  {answer.isCorrect && (
                                    <div className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 border border-emerald-200">
                                      ✓ Đáp án đúng
                                    </div>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                    {/* Hiển thị thông tin cho câu hỏi tự luận */}
                    {(question.type === ("SHORT_ANSWER" as QuestionType) ||
                      question.type === QuestionType.ESSAY ||
                      question.type === ("FILL_IN_BLANK" as QuestionType)) && (
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">
                              Thông tin tự động chấm điểm:
                            </span>
                          </div>
                          <div className="text-sm text-blue-700 space-y-1">
                            {question.type ===
                              ("SHORT_ANSWER" as QuestionType) && (
                              <>
                                <p>• Tối đa 100 ký tự</p>
                                <p>
                                  • Chấm điểm dựa trên độ khớp chính xác với đáp
                                  án mẫu
                                </p>
                              </>
                            )}
                            {question.type === QuestionType.ESSAY && (
                              <>
                                <p>• Tối đa 2000 ký tự</p>
                                <p>
                                  • Chấm điểm dựa trên thuật toán fuzzy matching
                                  và từ khóa
                                </p>
                              </>
                            )}
                            {question.type ===
                              ("FILL_IN_BLANK" as QuestionType) && (
                              <>
                                <p>• Tối đa 50 ký tự</p>
                                <p>
                                  • Chấm điểm dựa trên độ khớp với các đáp án
                                  được chấp nhận
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Hiển thị đáp án mẫu nếu có */}
                        {question.answers && question.answers.length > 0 && (
                          <div>
                            <p className="font-medium mb-2">Đáp án mẫu:</p>
                            <div className="rounded-lg border p-4 bg-gray-50">
                              {question.answers.map(
                                (answer: any, answerIndex: number) => (
                                  <div
                                    key={answer.id || answerIndex}
                                    className="space-y-2"
                                  >
                                    <RichTextContent
                                      content={
                                        answer.text ||
                                        answer.content?.text ||
                                        ""
                                      }
                                    />
                                    {answer.acceptedAnswers &&
                                      answer.acceptedAnswers.length > 0 && (
                                        <div className="text-sm text-gray-600">
                                          <span className="font-medium">
                                            Các đáp án được chấp nhận:{" "}
                                          </span>
                                          <span className="italic">
                                            {answer.acceptedAnswers.join(", ")}
                                          </span>
                                        </div>
                                      )}
                                    {answer.caseSensitive !== undefined && (
                                      <div className="text-xs text-gray-500">
                                        {answer.caseSensitive
                                          ? "🔤 Phân biệt hoa thường"
                                          : "🔤 Không phân biệt hoa thường"}
                                      </div>
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Giữ lại logic cũ cho tương thích ngược */}
                    {question.options && (
                      <div>
                        <p className="font-medium mb-2">Đáp án (Legacy):</p>
                        <div className="space-y-2">
                          {question.options.map(
                            (option: any, optionIndex: number) => (
                              <div
                                key={optionIndex}
                                className="flex items-start gap-3 rounded-lg border p-4"
                              >
                                <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
                                  {String.fromCharCode(65 + optionIndex)}
                                </div>
                                <div className="flex-1">
                                  <RichTextContent
                                    content={
                                      option.content?.text || option.text || ""
                                    }
                                  />
                                </div>
                                {option.isCorrect && (
                                  <div className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                                    Đáp án đúng
                                  </div>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {question.referenceAnswer && (
                      <div>
                        <p className="font-medium mb-2">Đáp án tham khảo:</p>
                        <div className="rounded-lg border p-4">
                          <RichTextContent
                            content={
                              question.referenceAnswer.content?.text || ""
                            }
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
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading isLoading={true} />}>
      <QuestionsContent />
    </Suspense>
  );
}
