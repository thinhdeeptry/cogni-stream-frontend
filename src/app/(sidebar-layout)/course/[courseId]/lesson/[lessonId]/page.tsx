"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { usePopupChatbot } from "@/hooks/usePopupChatbot";
import { AxiosFactory } from "@/lib/axios";
import { Course, LessonType } from "@/types/course/types";
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
  Minus,
  Plus,
} from "lucide-react";
import { useSession } from "next-auth/react";
import ReactPlayer from "react-player";
import { JSX } from "react/jsx-runtime";
import { toast } from "sonner";

import { getCourseById, getLessonById } from "@/actions/courseAction";
import { getThreadByResourceId } from "@/actions/discussion.action";
import { checkEnrollmentStatus } from "@/actions/enrollmentActions";

import { useProgressStore } from "@/stores/useProgressStore";
import useUserStore from "@/stores/useUserStore";

import { extractPlainTextFromBlockNote } from "@/utils/blocknote";

import Discussion from "@/components/discussion";
import { DiscussionType } from "@/components/discussion/type";
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
import { Progress } from "@/components/ui/progress";

interface Block {
  id: string;
  type: string;
  props: {
    textColor?: string;
    backgroundColor?: string;
    textAlignment?: string;
    level?: number;
    name?: string;
    url?: string;
    caption?: string;
    showPreview?: boolean;
    previewWidth?: number;
  };
  content?: Array<{
    type: string;
    text: string;
    styles: Record<string, any>;
  }>;
  children: Block[];
}

const renderBlockToHtml = (block: Block): JSX.Element => {
  // Xử lý màu sắc và background
  const textColorStyle =
    block.props.textColor !== "default" ? { color: block.props.textColor } : {};
  const backgroundColorStyle =
    block.props.backgroundColor !== "default"
      ? { backgroundColor: block.props.backgroundColor }
      : {};
  const textAlignStyle = {
    textAlign: block.props.textAlignment as React.CSSProperties["textAlign"],
  };

  const baseStyles = {
    ...textColorStyle,
    ...backgroundColorStyle,
    ...textAlignStyle,
  };

  // Render nội dung content
  const renderContent = () => {
    if (!block.content) return null;

    return block.content.map((contentItem, index) => {
      if (contentItem.type === "link") {
        return (
          <a
            key={index}
            href={contentItem.text}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {contentItem.text
              ?.split(" ")
              .map((word: string, linkIndex: number) => (
                <span key={linkIndex} style={contentItem.styles}>
                  {word}
                </span>
              ))}
          </a>
        );
      }

      const textStyles = {
        ...contentItem.styles,
        ...(contentItem.styles?.bold && { fontWeight: "bold" }),
        ...(contentItem.styles?.italic && { fontStyle: "italic" }),
        ...(contentItem.styles?.underline && { textDecoration: "underline" }),
        ...(contentItem.styles?.strike && { textDecoration: "line-through" }),
        ...(contentItem.styles?.textColor && {
          color: contentItem.styles.textColor,
        }),
      };

      return (
        <span key={index} style={textStyles}>
          {contentItem.text}
        </span>
      );
    });
  };

  switch (block.type) {
    case "paragraph":
      return (
        <p className="mb-4" style={baseStyles}>
          {renderContent()}
        </p>
      );

    case "heading":
      const HeadingTag =
        `h${block.props.level || 1}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag
          className={`mb-4 font-semibold ${
            block.props.level === 1
              ? "text-3xl"
              : block.props.level === 2
                ? "text-2xl"
                : "text-xl"
          }`}
          style={baseStyles}
        >
          {renderContent()}
        </HeadingTag>
      );

    case "quote":
      return (
        <blockquote
          className="border-l-4 border-gray-300 pl-4 italic my-4"
          style={baseStyles}
        >
          {renderContent()}
          {block.children.length > 0 && (
            <div className="mt-2 pl-4">
              {block.children.map((child, index) => (
                <div key={child.id || `child-${index}`}>
                  {renderBlockToHtml(child)}
                </div>
              ))}
            </div>
          )}
        </blockquote>
      );

    case "bulletListItem":
      return (
        <li className="list-disc ml-6 my-1" style={baseStyles}>
          {renderContent()}
          {block.children.length > 0 && (
            <ul className="ml-6">
              {block.children.map((child) => renderBlockToHtml(child))}
            </ul>
          )}
        </li>
      );

    case "numberedListItem":
      return (
        <li className="list-decimal ml-6 my-1" style={baseStyles}>
          {renderContent()}
          {block.children.length > 0 && (
            <ol className="ml-6">
              {block.children.map((child) => renderBlockToHtml(child))}
            </ol>
          )}
        </li>
      );

    case "codeBlock":
      return (
        <pre
          className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"
          style={baseStyles}
        >
          <code className="language-text">{renderContent()}</code>
        </pre>
      );

    case "table":
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border">
            <tbody>
              {(block.content as any)?.rows?.map(
                (row: any, rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.cells.map(
                      (
                        cell: {
                          props: {
                            textAlignment?: string;
                            backgroundColor?: string;
                            textColor?: string;
                            colspan?: number;
                            rowspan?: number;
                          };
                          content: Array<{
                            styles: Record<string, any>;
                            text: string;
                          }>;
                        },
                        cellIndex: number,
                      ) => {
                        const cellStyles = {
                          ...baseStyles,
                          textAlign: cell.props.textAlignment,
                          backgroundColor: cell.props.backgroundColor,
                          color: cell.props.textColor,
                          ...(cell.props.colspan && {
                            colspan: cell.props.colspan,
                          }),
                          ...(cell.props.rowspan && {
                            rowspan: cell.props.rowspan,
                          }),
                        };

                        return (
                          <td
                            key={cellIndex}
                            className="border p-2"
                            style={{
                              textAlign: cell.props
                                .textAlignment as React.CSSProperties["textAlign"],
                              backgroundColor: cell.props.backgroundColor,
                              color: cell.props.textColor,
                              ...(cell.props.colspan && {
                                colSpan: cell.props.colspan,
                              }),
                              ...(cell.props.rowspan && {
                                rowSpan: cell.props.rowspan,
                              }),
                            }}
                          >
                            {cell.content.map((content, contentIndex) => (
                              <span key={contentIndex} style={content.styles}>
                                {content.text}
                              </span>
                            ))}
                          </td>
                        );
                      },
                    )}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      );

    case "image":
      return (
        <div className="my-4" style={baseStyles}>
          <img
            src={block.props.url}
            alt={block.props.name || "Lesson image"}
            className="max-w-full rounded-lg mx-auto"
            style={{
              width: block.props.previewWidth
                ? `${block.props.previewWidth}px`
                : "100%",
              maxWidth: "100%",
              height: "auto",
            }}
          />
          {block.props.caption && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              {block.props.caption}
            </p>
          )}
        </div>
      );

    case "video":
      return (
        <div className="my-4" style={baseStyles}>
          <div className="aspect-video w-full">
            <ReactPlayer
              url={block.props.url}
              controls={true}
              width="100%"
              height="100%"
              className="rounded-lg"
            />
          </div>
          {block.props.caption && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              {block.props.caption}
            </p>
          )}
        </div>
      );

    default:
      console.warn(`Unsupported block type: ${block.type}`);
      return (
        <div className="my-4 p-2 bg-yellow-100 text-yellow-800 rounded">
          [Unsupported block type: {block.type}]
        </div>
      );
  }
};

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [timestampedTranscript, setTimestampedTranscript] = useState<
    TranscriptItem[]
  >([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const { user } = useUserStore();
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  // Progress store
  const {
    progress,
    overallProgress,
    setEnrollmentId: setProgressEnrollmentId,
    fetchInitialProgress,
    fetchOverallProgress,
    updateLessonProgress,
  } = useProgressStore();

  const [expandedChapters, setExpandedChapters] = useState<
    Record<string, boolean>
  >({});

  // Set all chapters to expanded by default when course data is loaded
  useEffect(() => {
    if (course?.chapters) {
      const initialExpandedState = course.chapters.reduce(
        (acc, chapter) => {
          acc[chapter.id] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );
      setExpandedChapters(initialExpandedState);
    }
  }, [course?.chapters]);

  // Function to handle chapter expansion toggle
  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  useEffect(() => {
    const checkEnrollment = async () => {
      if (session?.user?.id && course?.id) {
        try {
          const result = await checkEnrollmentStatus(
            course.id,
            session.user.id,
          );
          setIsEnrolled(result.data);
        } catch (err) {
          console.error("Error checking enrollment:", err);
        }
      }
    };

    checkEnrollment();
  }, [course?.id, session?.user?.id]);

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

    // Extract plain text from lesson content if it exists
    const plainContent = lesson?.content
      ? extractPlainTextFromBlockNote(lesson.content)
      : "No content available";

    return `
    Course Title: ${course?.title} \n
    Lesson Title: ${lesson?.title} \n
    Lesson Content: ${plainContent} \n
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

  console.log(referenceText);
  // Use the memoized chatbot component
  const LessonChatbot = usePopupChatbot({
    initialOpen: false,
    position: "bottom-right",
    referenceText,
    title: "Trợ lý học tập Eduforge AI",
    welcomeMessage:
      "Xin chào! Tôi là trợ lý học tập Eduforge AI. Bạn có thể hỏi tôi bất cứ điều gì liên quan đến bài học này.",
    showBalloon: false,
    systemPrompt: `Bạn là trợ lý AI học tập cá nhân của Eduforge, được tối ưu hóa để hỗ trợ quá trình học tập. Hãy tuân thủ các nguyên tắc sau:

1. NỘI DUNG VÀ GIỌNG ĐIỆU
- Trả lời ngắn gọn, đảm bảo thông tin chính xác và có tính giáo dục cao
- Ưu tiên cách giải thích dễ hiểu, sử dụng ví dụ minh họa khi cần thiết
- Sử dụng giọng điệu thân thiện, khuyến khích và tích cực

2. NGUỒN THÔNG TIN
- Phân tích và sử dụng chính xác nội dung từ reference text (bài học) được cung cấp
- Nếu câu hỏi nằm ngoài phạm vi bài học, hãy nói rõ và cung cấp kiến thức nền tảng
- Đề xuất tài liệu bổ sung chỉ khi thực sự cần thiết

3. HỖ TRỢ HỌC TẬP
- Giúp người học hiểu sâu hơn về khái niệm, không chỉ ghi nhớ thông tin 
- Hướng dẫn người học tư duy phản biện và giải quyết vấn đề
- Điều chỉnh độ phức tạp của câu trả lời phù hợp với ngữ cảnh

4. ĐỊNH DẠNG
- Sử dụng Markdown để định dạng câu trả lời và đảm bảo dễ đọc
- Dùng đậm, in nghiêng và danh sách để làm nổi bật điểm quan trọng
- Đảm bảo thuật ngữ kỹ thuật được giải thích rõ ràng

Reference text chứa thông tin về khóa học, bài học và nội dung. Hãy sử dụng thông tin này khi trả lời.`,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseData, lessonData] = await Promise.all([
          getCourseById(params.courseId as string),
          getLessonById(params.lessonId as string),
        ]);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.courseId, params.lessonId]);

  useEffect(() => {
    const fetchOrCreateThread = async () => {
      if (!params.lessonId || !user) {
        return;
      }

      try {
        const thread = await getThreadByResourceId(
          params.lessonId as string,
          DiscussionType.LESSON_DISCUSSION,
        );

        if (thread) {
          setThreadId(thread.id);
        }
      } catch (err) {
        console.error("Error in discussion thread handling:", err);
      }
    };

    if (lesson && user && !threadId) {
      fetchOrCreateThread();
    }
  }, [params.lessonId, user, threadId, lesson]);

  // Add new useEffect for fetching enrollment ID
  useEffect(() => {
    const fetchEnrollmentId = async () => {
      if (session?.user?.id && course?.id) {
        try {
          const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
          const response = await enrollmentApi.get(`/find/${course.id}`);
          console.log("response.data", response.data);
          if (response.data?.id) {
            setEnrollmentId(response.data.id);
            setProgressEnrollmentId(response.data.id);
            // Fetch initial progress
            await fetchInitialProgress();
            await fetchOverallProgress();
          }
        } catch (err) {
          console.error("Error fetching enrollment ID:", err);
        }
      }
    };

    fetchEnrollmentId();
  }, [course?.id, session?.user?.id]);

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

  // Hàm kiểm tra quyền truy cập bài học
  const canAccessLesson = (lesson: any) => {
    return lesson.isFreePreview || isEnrolled;
  };

  // Tìm bài học trước/sau có thể truy cập
  const findAccessibleLesson = (
    lessons: any[],
    currentIndex: number,
    direction: "prev" | "next",
  ) => {
    const step = direction === "prev" ? -1 : 1;
    let index = currentIndex + step;

    while (index >= 0 && index < lessons.length) {
      if (canAccessLesson(lessons[index])) {
        return lessons[index];
      }
      index += step;
    }
    return null;
  };

  const allLessons =
    course.chapters?.flatMap((chapter) => chapter.lessons) || [];
  const currentLessonIndex = allLessons.findIndex(
    (lessonItem) => lessonItem?.id === params.lessonId,
  );

  // Cập nhật logic tìm bài học trước/sau
  const previousLesson = findAccessibleLesson(
    allLessons,
    currentLessonIndex,
    "prev",
  );
  const nextLesson = findAccessibleLesson(
    allLessons,
    currentLessonIndex,
    "next",
  );

  // Calculate current lesson index and total lessons
  const totalLessons = allLessons.length;

  // Parse lesson content for BLOG or MIXED types
  let contentBlocks: Block[] = [];
  if (
    lesson.content &&
    (lesson.type === LessonType.BLOG || lesson.type === LessonType.MIXED)
  ) {
    try {
      contentBlocks = JSON.parse(lesson.content);
    } catch (error) {
      console.error("Error parsing lesson content:", error);
    }
  }

  const handleLessonCompletion = async () => {
    if (!enrollmentId || !lesson) return;

    try {
      await updateLessonProgress({
        progress: ((currentLessonIndex + 1) / totalLessons) * 100,
        currentLesson: lesson.title,
        lessonId: lesson.id,
        isLessonCompleted: true,
      });

      toast.success("Tiến độ học tập đã được cập nhật!");

      // Chuyển sang bài học tiếp theo nếu có
      if (nextLesson) {
        router.push(`/course/${course?.id}/lesson/${nextLesson.id}`);
      }
    } catch (err) {
      toast.error("Không thể cập nhật tiến độ học tập");
    }
  };

  return (
    <>
      <div className="w-full flex-1 flex flex-col min-h-screen relative">
        <div
          className={`flex-1 p-6 ${isSidebarOpen ? "pr-[400px]" : ""} transition-all duration-300`}
        >
          <div className="space-y-8">
            {/* Video Content for VIDEO or MIXED */}
            {(lesson.type === LessonType.VIDEO ||
              lesson.type === LessonType.MIXED) &&
              lesson.videoUrl && (
                <div className="aspect-video w-full bg-gray-100 rounded-lg mb-8">
                  <ReactPlayer
                    url={lesson.videoUrl}
                    controls={true}
                    config={{
                      youtube: {
                        playerVars: { showinfo: 1 },
                      },
                    }}
                    className="react-player"
                    width="100%"
                    height="100%"
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

              {/* Render Parsed Content for BLOG or MIXED */}
              {(lesson.type === LessonType.BLOG ||
                lesson.type === LessonType.MIXED) &&
                contentBlocks.length > 0 && (
                  <div className="mt-4">
                    {contentBlocks.map((block) => (
                      <div key={block.id}>{renderBlockToHtml(block)}</div>
                    ))}
                  </div>
                )}

              {/* Fallback for VIDEO-only or empty content */}
              {lesson.type === LessonType.VIDEO && !lesson.videoUrl && (
                <p className="text-md text-gray-500">
                  Không có nội dung video.
                </p>
              )}
              {(lesson.type === LessonType.BLOG ||
                lesson.type === LessonType.MIXED) &&
                contentBlocks.length === 0 && (
                  <p className="text-md text-gray-500">
                    Không có nội dung bài viết.
                  </p>
                )}
            </div>

            {/* Discussion Component */}
            <Discussion threadId={threadId || ""} />
          </div>
        </div>

        {/* Fixed Navigation Bar */}
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t px-6 py-4 z-10">
          <div className="flex items-center justify-center gap-4">
            {previousLesson ? (
              <Link href={`/course/${course?.id}/lesson/${previousLesson.id}`}>
                <Button variant="outline" className="w-40">
                  <ChevronLeft className="mr-2 h-4 w-4" /> Bài trước
                </Button>
              </Link>
            ) : (
              <Button variant="outline" className="w-40" disabled>
                <ChevronLeft className="mr-2 h-4 w-4" /> Bài trước
              </Button>
            )}

            {nextLesson ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-40">
                    Học tiếp <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Xác nhận hoàn thành bài học
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn đã hoàn thành bài học này chưa? Hãy đảm bảo rằng bạn
                      đã nắm vững kiến thức trước khi chuyển sang bài tiếp theo.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Chưa, tôi cần học lại</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLessonCompletion}>
                      Đã hoàn thành, học tiếp
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button variant="outline" className="w-40" disabled>
                Học tiếp <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="absolute top-1/4 right-4 flex items-center">
            <span className="text-md text-gray-600 font-semibold pr-2">
              {course?.chapters?.find((chapter) =>
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
          className={`fixed right-0 top-0 h-[calc(100vh-73px)] w-[350px] bg-gray-50 border-l transform transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-6 h-full overflow-auto">
            <h2 className="text-xl font-semibold mb-6">Nội dung khoá học</h2>
            <div className="space-y-4">
              {course?.chapters?.map((chapter) => (
                <Collapsible
                  key={chapter.id}
                  open={expandedChapters[chapter.id]}
                  onOpenChange={() => toggleChapter(chapter.id)}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200">
                    <div className="flex items-center gap-2 truncate">
                      <div className="text-gray-500 transition-transform duration-200">
                        {expandedChapters[chapter.id] ? (
                          <div className="transform transition-transform duration-200">
                            <Minus className="h-4 w-4 text-orange-500" />
                          </div>
                        ) : (
                          <Plus className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-700">
                        {chapter.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 pl-1">
                      <span className="text-sm text-gray-600 truncate">
                        {chapter.lessons?.length || 0} bài
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4">
                    <ul className="mt-2 space-y-2">
                      {chapter.lessons?.map((lesson) => (
                        <Link
                          href={
                            canAccessLesson(lesson)
                              ? `/course/${course?.id}/lesson/${lesson.id}`
                              : "#"
                          }
                          key={lesson.id}
                          className={`block p-2 rounded-lg transition-colors ${
                            lesson.id === params.lessonId
                              ? "bg-orange-100"
                              : "hover:bg-gray-200"
                          } ${
                            !canAccessLesson(lesson)
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }`}
                          onClick={(e) => {
                            if (!canAccessLesson(lesson)) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <div className="flex items-center gap-2 min-h-[32px]">
                            <div className="flex-1 overflow-hidden">
                              <span
                                className={`block truncate ${
                                  lesson.id === params.lessonId
                                    ? "font-medium"
                                    : ""
                                }`}
                              >
                                {lesson.title}
                              </span>
                            </div>
                            {lesson.isFreePreview && (
                              <span className="flex-shrink-0 text-xs bg-gray-200 px-2 py-1 rounded">
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
