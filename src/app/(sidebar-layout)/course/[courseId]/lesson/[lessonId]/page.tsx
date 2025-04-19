"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Course } from "@/types/course/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import {
  ArrowBigRight,
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
} from "lucide-react";
import ReactPlayer from "react-player";

import { getCourseById, getLessonById } from "@/actions/courseAction";

import useUserStore from "@/stores/useUserStore";

import { Button } from "@/components/ui/button";

export default function LessonDetail() {
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const { user } = useUserStore();
  const params = useParams();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseData, lessonData] = await Promise.all([
          getCourseById(params.courseId as string),
          getLessonById(params.lessonId as string),
        ]);
        console.log(courseData);
        setCourse(courseData);
        setLesson(lessonData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.courseId, params.lessonId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  if (!course || !lesson) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Không tìm thấy khoá học hoặc bài học!
      </div>
    );
  }

  // Find all lessons for navigation
  const allLessons =
    course.chapters?.flatMap((chapter) => chapter.lessons) || [];
  const currentLessonIndex = allLessons.findIndex(
    (lessonItem) => lessonItem?.id === params.lessonId,
  );
  const previousLesson =
    currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen relative">
      <div
        className={`flex-1 p-6 ${isSidebarOpen ? "pr-[400px]" : ""} transition-all duration-300`}
      >
        <div className="space-y-8">
          <div className="aspect-video w-full bg-gray-100 rounded-lg">
            <ReactPlayer
              url={`${lesson.videoUrl}`}
              controls={true}
              config={{
                youtube: {
                  playerVars: { showinfo: 1 },
                },
              }}
              className="react-player"
              width={"100%"}
              height={"100%"}
            />
          </div>

          {/* Lesson Content */}
          <div className="prose max-w-none">
            <h1 className="text-2xl font-semibold mb-4">Nội dung bài học</h1>
            <h1 className="text-xl font-semibold mb-4">
              <span>{lesson.order}. </span>
              {lesson.title}
            </h1>
            <p className="text-md ">{lesson.content}</p>
          </div>
        </div>
      </div>

      {/* Fixed Navigation Bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t px-6 py-4 z-10">
        <div className="flex items-center justify-center gap-4 ">
          {previousLesson ? (
            <Link href={`/course/${course.id}/lesson/${previousLesson.id}`}>
              <Button
                variant="outline"
                className="w-40"
                disabled={!previousLesson}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous Lesson
              </Button>
            </Link>
          ) : (
            <Button variant="outline" className="w-40" disabled>
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous Lesson
            </Button>
          )}
          {nextLesson ? (
            <Link href={`/course/${course.id}/lesson/${nextLesson.id}`}>
              <Button variant="outline" className="w-40" disabled={!nextLesson}>
                Next Lesson <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button variant="outline" className="w-40" disabled>
              Next Lesson <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="absolute top-1/4 right-4 flex items-center">
          <span className="text-md text-gray-600 font-semibold pr-2">
            {course.chapters?.find((chapter) =>
              chapter.lessons?.some((lesson) => lesson.id === params.lessonId),
            )?.title || ""}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="bg-white border shadow-sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <ArrowBigRight className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Collapsible Sidebar */}
      <div
        className={`fixed right-0 top-0 h-[calc(100vh-73px)] w-[350px] bg-gray-50 border-l transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-6 h-full overflow-auto">
          <h2 className="text-xl font-semibold mb-6">Nội dung khoá học</h2>
          <div className="space-y-4">
            {course.chapters?.map((chapter) => (
              <Collapsible key={chapter.id}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="text-gray-500">
                      <Plus className="h-4 w-4 text-orange-500" />
                    </div>
                    <h3 className="font-semibold text-gray-700">
                      {chapter.title}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-600">
                    {chapter.lessons?.length || 0} bài
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4">
                  <ul className="mt-2 space-y-2">
                    {chapter.lessons?.map((lesson) => (
                      <Link
                        href={
                          lesson.isFreePreview || isEnrolled
                            ? `/course/${course.id}/lesson/${lesson.id}`
                            : "#"
                        }
                        key={lesson.id}
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${lesson.id === params.lessonId ? "bg-orange-100" : "hover:bg-gray-200"} ${!lesson.isFreePreview && !isEnrolled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        onClick={(e) => {
                          if (!lesson.isFreePreview && !isEnrolled) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`${lesson.id === params.lessonId ? "font-medium " : ""}`}
                          >
                            {lesson.title}
                          </span>
                          {lesson.isFreePreview && (
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                              Preview
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
