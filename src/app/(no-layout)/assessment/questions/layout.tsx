"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import axios from "axios";

import { Skeleton } from "@/components/ui/skeleton";
import { Tree } from "@/components/ui/tree";

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

function transformCoursesToTreeData(courses: Course[]) {
  if (!courses || !Array.isArray(courses) || courses.length === 0) {
    return [];
  }

  return courses.map((course) => ({
    id: course.id,
    name: course.title,
    children:
      course.chapters && Array.isArray(course.chapters)
        ? course.chapters.map((chapter) => ({
            id: chapter.id,
            name: chapter.title,
            children:
              chapter.lessons && Array.isArray(chapter.lessons)
                ? chapter.lessons.map((lesson) => ({
                    id: lesson.id,
                    name: lesson.title,
                  }))
                : [],
          }))
        : [],
  }));
}

export default function QuestionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("contextId") || "";
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get(
          "http://localhost:3002/courses/user/25e1d787-4ce1-4109-b8eb-a90fe40d942c/structure",
        );

        if (response.data && response.data.value) {
          setCourses(response.data.value);
        } else if (Array.isArray(response.data)) {
          setCourses(response.data);
        } else {
          setError("Cấu trúc dữ liệu API không đúng định dạng");
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
  }, []);

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
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="text-center py-4 text-red-500 bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="font-semibold">Lỗi:</p>
              <p>{error}</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Tree
              data={transformCoursesToTreeData(courses)}
              onSelect={handleSelect}
              selectedId={selectedId}
            />
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
