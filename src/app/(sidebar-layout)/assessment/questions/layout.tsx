"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { ClassStructure } from "@/types/course/types";
import { BarChart3, BookOpen, Calendar, Users } from "lucide-react";

import {
  getCourseStructureWithQuestionStats,
  getUserCourseStructureWithDetails,
} from "@/actions/courseAction";

import useUserStore from "@/stores/useUserStore";

import Loading from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tree } from "@/components/ui/tree";

interface Lesson {
  id: string;
  title: string;
  type: "VIDEO" | "BLOG" | "MIXED" | "QUIZ";
  order: number;
  isPublished: boolean;
  isFreePreview: boolean;
  estimatedDurationMinutes?: number;
  questionStats: {
    totalQuestions: number;
    questionsByType: {
      SINGLE_CHOICE: number;
      MULTIPLE_CHOICE: number;
      SHORT_ANSWER: number;
      ESSAY: number;
      FILL_IN_BLANK: number;
    };
    hasQuestions: boolean;
  };
  quizStats: {
    totalQuizzes: number;
    activeQuizzes: number;
    quizTypes: string[];
    hasActiveQuiz: boolean;
  };
}

interface Chapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  isPublished: boolean;
  lessons: Lesson[];
  stats: {
    totalLessons: number;
    totalQuestions: number;
    questionsByType: {
      SINGLE_CHOICE: number;
      MULTIPLE_CHOICE: number;
      SHORT_ANSWER: number;
      ESSAY: number;
      FILL_IN_BLANK: number;
    };
    totalQuizzes: number;
  };
}

interface Course {
  id: string;
  title: string;
  description?: string;
  courseType: "SELF_PACED" | "LIVE";
  instructorId: string;
  isPublished: boolean;
  thumbnailUrl?: string;
  chapters: Chapter[];
  classes?: ClassStructure[];
  stats: {
    totalChapters: number;
    totalLessons: number;
    totalQuestions: number;
    totalQuizzes: number;
    totalClasses?: number;
  };
}

function transformCoursesToTreeData(courses: Course[]) {
  if (!courses || !Array.isArray(courses) || courses.length === 0) {
    return [];
  }

  return courses.map((course) => ({
    id: course.id,
    name: course.title,
    level: 0,
    metadata: {
      courseType: course.courseType,
      stats: course.stats,
      isPublished: course.isPublished,
    },
    children: [
      // Add classes for LIVE courses
      ...(course.classes && course.courseType === "LIVE"
        ? course.classes.map((classItem) => ({
            id: classItem.id,
            name: `📚 ${classItem.name}`,
            level: 1,
            metadata: {
              type: "class",
              stats: classItem.stats,
              status: classItem.status,
            },
            children: [],
          }))
        : []),
      // Add chapters
      ...(course.chapters && Array.isArray(course.chapters)
        ? course.chapters.map((chapter) => ({
            id: chapter.id,
            name: chapter.title,
            level: course.courseType === "LIVE" ? 2 : 1,
            metadata: {
              type: "chapter",
              stats: chapter.stats,
              isPublished: chapter.isPublished,
            },
            children:
              chapter.lessons && Array.isArray(chapter.lessons)
                ? chapter.lessons.map((lesson) => ({
                    id: lesson.id,
                    name: lesson.title,
                    level: course.courseType === "LIVE" ? 3 : 2,
                    metadata: {
                      type: "lesson",
                      questionStats: lesson.questionStats,
                      quizStats: lesson.quizStats,
                      isPublished: lesson.isPublished,
                      lessonType: lesson.type,
                    },
                  }))
                : [],
          }))
        : []),
    ],
  }));
}

// Custom Tree Component với thông tin thống kê
const CourseTreeItem = ({
  item,
  selectedId,
  onSelect,
  level = 0,
}: {
  item: any;
  selectedId: string;
  onSelect: (id: string) => void;
  level: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isSelected = selectedId === item.id;
  const hasChildren = item.children && item.children.length > 0;

  const paddingLeft = level * 16 + 8;

  const getIcon = () => {
    if (level === 0) {
      return item.metadata?.courseType === "LIVE" ? (
        <Users className="h-4 w-4 text-orange-500" />
      ) : (
        <BookOpen className="h-4 w-4 text-blue-500" />
      );
    } else if (item.metadata?.type === "class") {
      return <Calendar className="h-4 w-4 text-purple-500" />;
    } else if (item.metadata?.type === "chapter") {
      return <BookOpen className="h-4 w-4 text-green-500" />;
    } else if (item.metadata?.type === "lesson") {
      return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
    return <BookOpen className="h-4 w-4" />;
  };

  const getStatsText = () => {
    const metadata = item.metadata;
    if (!metadata) return "";

    if (level === 0 && metadata.stats) {
      return `${metadata.stats.totalQuestions}Q, ${metadata.stats.totalQuizzes}T`;
    } else if (metadata.type === "chapter" && metadata.stats) {
      return `${metadata.stats.totalQuestions}Q`;
    } else if (metadata.type === "lesson" && metadata.questionStats) {
      return metadata.questionStats.hasQuestions
        ? `${metadata.questionStats.totalQuestions}Q`
        : "";
    } else if (metadata.type === "class" && metadata.stats) {
      return `${metadata.stats.totalQuestions}Q`;
    }
    return "";
  };

  return (
    <div>
      <div
        className={`flex items-center justify-between py-2 px-2 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? "bg-primary/10 text-primary border border-primary/20"
            : "hover:bg-gray-100"
        }`}
        style={{ paddingLeft }}
        onClick={() => onSelect(item.id)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          {getIcon()}
          <span className="text-sm font-medium truncate">{item.name}</span>
        </div>

        {getStatsText() && (
          <Badge variant="secondary" className="text-xs ml-2 shrink-0">
            {getStatsText()}
          </Badge>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {item.children.map((child: any) => (
            <CourseTreeItem
              key={child.id}
              item={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function QuestionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("contextId") || "";
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy thông tin user từ store
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!user?.id) {
          setError("Bạn cần đăng nhập để xem danh sách khóa học");
          setCourses([]);
          return;
        }

        const result = await getCourseStructureWithQuestionStats();

        if (result.success && result.data) {
          if (result.data.value) {
            setCourses(result.data.value);
          } else if (Array.isArray(result.data)) {
            setCourses(result.data);
          } else {
            setError("Cấu trúc dữ liệu API không đúng định dạng");
            setCourses([]);
          }
        } else {
          setError(result.message || "Không thể lấy dữ liệu khóa học");
          setCourses([]);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setError(
          "Không thể kết nối đến API khóa học. Vui lòng kiểm tra kết nối hoặc liên hệ quản trị viên.",
        );
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [user?.id]);

  const handleSelect = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("contextId", id);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-80 border-r flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Danh sách khóa học</h2>
          <p className="text-sm text-muted-foreground">
            Chọn khóa học, chương hoặc bài học để quản lý câu hỏi
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {error ? (
            <div className="text-center py-4 text-red-500 bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="font-semibold">Lỗi:</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div>
              {/* Custom Tree Component với thông tin thống kê */}
              {transformCoursesToTreeData(courses).map((courseItem) => (
                <CourseTreeItem
                  key={courseItem.id}
                  item={courseItem}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  level={0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function QuestionLayouts({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Loading isLoading={true} />}>
      <QuestionLayout>{children}</QuestionLayout>
    </Suspense>
  );
}
