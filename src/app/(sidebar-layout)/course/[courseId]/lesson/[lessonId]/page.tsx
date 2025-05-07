"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { usePopupChatbot } from "@/hooks/usePopupChatbot";
import { Course, LessonType } from "@/types/course/types";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
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
import { getThreadByResourceId } from "@/actions/discussion.action";

import useUserStore from "@/stores/useUserStore";

import Discussion from "@/components/discussion";
import { DiscussionType } from "@/components/discussion/type";
import { Button } from "@/components/ui/button";

// Interface for transcript items with timestamps
interface TranscriptItem {
  text: string;
  timestamp: string;
  offset: number;
  duration: number;
}

export default function LessonDetail() {
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<any>(null);
  const editor = useCreateBlockNote();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // TODO: Implement enrollment check
  const [timestampedTranscript, setTimestampedTranscript] = useState<
    TranscriptItem[]
  >([]);
  const [isEnrolled] = useState(false); // We're not setting this value, but it's used in the UI
  const [threadId, setThreadId] = useState<string | null>(null);
  const { user } = useUserStore();
  const params = useParams();

  // Memoize the reference text to prevent unnecessary re-renders
  const referenceText = useMemo(() => {
    // Format timestamped transcript for reference
    let transcriptSection = "No video transcript available";

    if (timestampedTranscript.length > 0) {
      // Check if we have valid timestamps (not all 0:00)
      const hasValidTimestamps = timestampedTranscript.some(
        (item) => item.timestamp !== "0:00",
      );

      if (hasValidTimestamps) {
        transcriptSection = timestampedTranscript
          .map((item) => `[${item.timestamp}] ${item.text}`)
          .join("\n");
      } else {
        // If all timestamps are 0:00, log an error and use a simpler format
        console.error(
          "All transcript timestamps are 0:00. Check the YouTube transcript API response.",
        );
        transcriptSection = timestampedTranscript
          .map((item, index) => `[Part ${index + 1}] ${item.text}`)
          .join("\n");
      }
    }

    return `
    Course Title: ${course?.title} \n
    Lesson Title: ${lesson?.title} \n
    Lesson Content: ${lesson?.content}
    Lesson Type: ${lesson?.type} \n
    Lesson Video Transcript with Timestamps: \n${transcriptSection} \n
    `;
  }, [
    course?.title,
    lesson?.title,
    lesson?.content,
    lesson?.type,
    timestampedTranscript,
  ]);

  // Use the memoized chatbot component
  const LessonChatbot = usePopupChatbot({
    initialOpen: false,
    position: "bottom-right",
    referenceText,
    title: "Trợ lý học tập Eduforge AI",
    systemPrompt:
      "Bạn là trợ lý AI hỗ trợ học tập. Hãy ưu tiên trả lời câu hỏi ngắn gọn, rõ ràng và chính xác dựa trên reference text (nội dung bài học được cung cấp). Nếu thông tin trong bài học không đủ, hãy đưa ra lời giải thích hợp lý dựa trên kiến thức phổ thông hoặc kỹ năng suy luận, và thông báo rõ khi bạn mở rộng ngoài nội dung reference. Mục tiêu là giúp người học hiểu bài và nắm vững kiến thức. Format bằng markdown và đảm bảo định dạng đúng, dễ đọc, dễ hiểu cho người dùng",
  });

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
        if (lessonData?.videoUrl) {
          try {
            // Use our server-side API route to fetch the transcript
            const response = await fetch(
              `/api/youtube-transcript?url=${encodeURIComponent(lessonData.videoUrl)}`,
            );

            if (!response.ok) {
              throw new Error(
                `Failed to fetch transcript: ${response.statusText}`,
              );
            }

            const data = await response.json();
            setTimestampedTranscript(data.timestampedTranscript || []);
            console.log("Transcript fetched successfully");
            console.log("Timestamped transcript:", data.timestampedTranscript);
          } catch (error) {
            console.error("Error fetching transcript:", error);
          }
        }

        // Load content into BlockNote editor if it exists
        if (lessonData.content) {
          try {
            const content = JSON.parse(lessonData.content);
            if (Array.isArray(content)) {
              editor.replaceBlocks(editor.document, content);
            }
          } catch (error) {
            console.error("Error parsing lesson content:", error);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.courseId, params.lessonId]);

  // Separate useEffect for fetching thread to avoid infinite loops
  useEffect(() => {
    const fetchOrCreateThread = async () => {
      // Validate required parameters
      if (!params.lessonId) {
        console.log("Missing lessonId, cannot fetch/create thread");
        return;
      }

      if (!user) {
        console.log("User not logged in, skipping thread fetch/create");
        return;
      }

      try {
        // Get thread by resource ID
        const thread = await getThreadByResourceId(
          params.lessonId as string,
          DiscussionType.LESSON_DISCUSSION,
        );

        if (thread) {
          setThreadId(thread.id);
        } else {
          console.log("No thread returned from getThreadByResourceId");
        }
      } catch (err) {
        console.error("Error in discussion thread handling:", err);
        // Don't set an error state here, as discussion is not critical for the page to function
      }
    };

    // Only run once when we have both lesson data and user but no threadId yet
    if (lesson && user && !threadId) {
      fetchOrCreateThread();
    }
  }, [params.lessonId, user, threadId]);

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
    <>
      <div className="w-full flex-1 flex flex-col min-h-screen relative">
        <div
          className={`flex-1 p-6 ${isSidebarOpen ? "pr-[400px]" : ""} transition-all duration-300`}
        >
          <div className="space-y-8">
            {/* Video Content */}
            {(lesson.type === LessonType.VIDEO ||
              lesson.type === LessonType.MIXED) &&
              lesson.videoUrl && (
                <div className="aspect-video w-full bg-gray-100 rounded-lg mb-8">
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
              )}

            {/* Lesson Content */}
            <div className="prose max-w-none">
              <h1 className="text-2xl font-semibold mb-4">Nội dung bài học</h1>
              <h1 className="text-xl font-semibold mb-4">
                <span>{lesson.order}. </span>
                {lesson.title}
              </h1>

              {/* BlockNote Content */}
              {(lesson.type === LessonType.BLOG ||
                lesson.type === LessonType.MIXED) &&
                lesson.content && (
                  <div className="mt-4">
                    <BlockNoteView editor={editor} theme="light" />
                  </div>
                )}

              {/* Fallback for plain text content */}
              {(!lesson.type ||
                (!lesson.content && lesson.type !== LessonType.VIDEO)) && (
                <p className="text-md">{lesson.content}</p>
              )}
            </div>

            {/* Discussion Component - Always render it */}
            <Discussion threadId={threadId || ""} />
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
                  <ChevronLeft className="mr-2 h-4 w-4" /> Bài trước
                </Button>
              </Link>
            ) : (
              <Button variant="outline" className="w-40" disabled>
                <ChevronLeft className="mr-2 h-4 w-4" /> Bài trước
              </Button>
            )}
            {nextLesson ? (
              <Link href={`/course/${course.id}/lesson/${nextLesson.id}`}>
                <Button
                  variant="outline"
                  className="w-40"
                  disabled={!nextLesson}
                >
                  Học tiếp <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" className="w-40" disabled>
                Học tiếp <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="absolute top-1/4 right-4 flex items-center">
            <span className="text-md text-gray-600 font-semibold pr-2">
              {course.chapters?.find((chapter) =>
                chapter.lessons?.some(
                  (lesson) => lesson.id === params.lessonId,
                ),
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
      <LessonChatbot />
    </>
  );
}
