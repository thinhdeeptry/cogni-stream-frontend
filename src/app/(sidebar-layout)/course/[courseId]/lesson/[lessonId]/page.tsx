"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { toast as useToast } from "@/hooks/use-toast";
import { useOtherUser } from "@/hooks/useOtherUser";
import { usePopupChatbot } from "@/hooks/usePopupChatbot";
import {
  formatTime,
  formatTimeMinutes,
  useTimeTracking,
} from "@/hooks/useTimeTracking";
import { Course, Lesson, LessonType } from "@/types/course/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { motion } from "framer-motion";
import {
  ArrowBigRight,
  BookOpen,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Menu,
  MessageSquare,
  Minus,
  Pause,
  Play,
  Plus,
  Timer,
  Trophy,
} from "lucide-react";
import { useSession } from "next-auth/react";
import ReactPlayer from "react-player";
import { JSX } from "react/jsx-runtime";
import { toast } from "sonner";

import { getCourseById, getLessonById } from "@/actions/courseAction";
import { getThreadByResourceId } from "@/actions/discussion.action";
import {
  checkEnrollmentStatus,
  createCertificate,
  getEnrollmentByCourse,
  markCourseAsCompleted,
} from "@/actions/enrollmentActions";
import { getYoutubeTranscript } from "@/actions/youtubeTranscript.action";

import { useProgressStore } from "@/stores/useProgressStore";
import useUserStore from "@/stores/useUserStore";

import { extractPlainTextFromBlockNote } from "@/utils/blocknote";

import Discussion from "@/components/discussion";
import { DiscussionType } from "@/components/discussion/type";
import QuizSection from "@/components/quiz/QuizSection";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
          className="bg-gray-800 p-4 rounded-lg overflow-x-auto my-4"
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
  const [hasCertificate, setHasCertificate] = useState<boolean>(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [timeCompleteNotified, setTimeCompleteNotified] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

  // console.log("🔍 Component render - Current states:", {
  //   isButtonEnabled,
  //   forceRender,
  //   timeCompleteNotified,
  // });

  const { user } = useUserStore();
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  // Progress store - Moved up to avoid hook order issues
  const {
    progress,
    overallProgress,
    lessonId: lastLessonId,
    currentLesson: lastLessonTitle,
    completedLessonIds: storeCompletedLessonIds,
    setEnrollmentId: setProgressEnrollmentId,
    fetchInitialProgress,
    fetchOverallProgress,
    updateLessonProgress,
    setCurrentCourseId,
  } = useProgressStore();

  // Time tracking callback - memoized to prevent re-creation
  const handleTimeComplete = useCallback(() => {
    if (!timeCompleteNotified) {
      console.log(
        "Time tracking completed for lesson: ",
        lesson?.estimatedDurationMinutes,
      );
      setTimeCompleteNotified(true);
      setForceRender((prev) => prev + 1); // Force re-render
    }
  }, [lesson?.estimatedDurationMinutes, timeCompleteNotified]);

  // Time tracking state - Moved after params declaration
  const timeTracking = useTimeTracking({
    itemId: lesson ? `lesson-${params.lessonId}` : "",
    requiredMinutes: lesson?.estimatedDurationMinutes || 5,
    onTimeComplete: handleTimeComplete,
  });

  // Debug time tracking state
  useEffect(() => {
    // console.log("⏰ Time tracking update:", {
    //   isTimeComplete: timeTracking.isTimeComplete,
    //   elapsedSeconds: timeTracking.elapsedSeconds,
    //   requiredMinutes: lesson?.estimatedDurationMinutes || 5,
    //   isEnrolled,
    // });
  }, [timeTracking.isTimeComplete, timeTracking.elapsedSeconds]);

  // Force re-render when time tracking completes
  useEffect(() => {
    if (timeTracking.isTimeComplete) {
      console.log("Time tracking completed - forcing UI update");
      setForceRender((prev) => prev + 1);
    }
  }, [timeTracking.isTimeComplete]);

  // Sync completed lessons from store
  useEffect(() => {
    if (storeCompletedLessonIds.length > 0) {
      setCompletedLessonIds(storeCompletedLessonIds);
      // Save to localStorage
      if (typeof window !== "undefined" && course?.id) {
        localStorage.setItem(
          `completed-lessons-${course.id}`,
          JSON.stringify(storeCompletedLessonIds),
        );
      }
      console.log(
        "🔄 Synced completed lessons from store:",
        storeCompletedLessonIds,
      );
    }
  }, [storeCompletedLessonIds, course?.id]);

  // Persist completed lessons to localStorage when it changes
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      course?.id &&
      completedLessonIds.length > 0
    ) {
      localStorage.setItem(
        `completed-lessons-${course.id}`,
        JSON.stringify(completedLessonIds),
      );
      // console.log("💾 Saved completed lessons to localStorage:", completedLessonIds);
    }
  }, [completedLessonIds, course?.id]);

  // Tính toán danh sách tất cả bài học từ các chương
  const allLessons = useMemo(() => {
    return course?.chapters?.flatMap((chapter) => chapter.lessons) || [];
  }, [course?.chapters]);

  // Update button enabled state - Check if current lesson is already completed
  useEffect(() => {
    const currentLessonId = params.lessonId as string;
    const isCurrentLessonCompleted =
      completedLessonIds.includes(currentLessonId);

    // If lesson is already completed, enable button immediately
    // Otherwise, wait for time tracking completion
    const shouldEnable =
      isCurrentLessonCompleted || timeTracking.isTimeComplete;

    setIsButtonEnabled(shouldEnable);

    // Force re-render để đảm bảo UI update
    if (shouldEnable !== isButtonEnabled) {
      // console.log("🚀 Forcing re-render due to button state change");
      setForceRender((prev) => prev + 1);
    }
  }, [
    timeTracking.isTimeComplete,
    timeTracking.elapsedSeconds,
    completedLessonIds,
    params.lessonId,
    isButtonEnabled,
  ]);

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
  //flat
  useEffect(() => {
    const checkEnrollment = async () => {
      if (session?.user?.id && course?.id) {
        console.log("id user: ", session?.user?.id);
        console.log("id course: ", course?.id);
        try {
          const result = await checkEnrollmentStatus(
            session.user.id,
            course.id,
            undefined, // No classId for self-paced courses
          );
          console.log("res: ", result);
          // Kiểm tra cả success và isEnrolled
          if (result.success) {
            setIsEnrolled(result.isEnrolled);
            console.log("enrollment status set to: ", result.isEnrolled);
          } else {
            console.warn("Check enrollment failed:", result.message);
            setIsEnrolled(false);
          }
        } catch (err) {
          console.error("Error checking enrollment:", err);
          setIsEnrolled(false);
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

  // console.log(referenceText);
  // Use the memoized chatbot component
  const LessonChatbot = usePopupChatbot({
    initialOpen: false,
    position: "bottom-right",
    referenceText,
    title: "Trợ lý học tập CogniStream AI",
    welcomeMessage: "", // Will be auto-generated based on context
    showBalloon: false,
    // Context-aware props
    userName: user?.name || user?.email?.split("@")[0] || "bạn",
    courseName: course?.title,
    lessonName: lesson?.title,
    lessonOrder: lesson?.order,
    totalLessons: course?.chapters?.reduce(
      (total, chapter) => total + (chapter.lessons?.length || 0),
      0,
    ),
    chapterName: course?.chapters?.find((chapter) =>
      chapter.lessons?.some((l) => l.id === params.lessonId),
    )?.title,
    systemPrompt: `Bạn là trợ lý AI học tập cá nhân của CogniStream, được tối ưu hóa để hỗ trợ quá trình học tập. Hãy tuân thủ các nguyên tắc sau:

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
        // Reset states when lesson changes
        setTimeCompleteNotified(false);
        setForceRender(0);

        // Clear time tracking data when switching lessons
        // BUT only clear if the lesson is not completed
        const currentLessonId = params.lessonId as string;
        const isCurrentLessonCompleted =
          completedLessonIds.includes(currentLessonId);

        if (!isCurrentLessonCompleted) {
          // Clear tracking data for incomplete lessons to restart tracking
          localStorage.removeItem(`time-tracking-lesson-${params.lessonId}`);
          console.log("🧹 Cleared time tracking for incomplete lesson");
        } else {
          console.log("✅ Keeping time tracking data for completed lesson");
        }

        const [courseData, lessonData] = await Promise.all([
          getCourseById(params.courseId as string),
          getLessonById(params.lessonId as string),
        ]);
        setCourse(courseData);
        setLesson(lessonData);

        if (lessonData?.videoUrl) {
          try {
            // Use the new server action to fetch the transcript
            const result = await getYoutubeTranscript(lessonData.videoUrl);

            if ("error" in result) {
              console.warn(
                `Transcript fetch failed: ${result.error}`,
                result.details,
              );
              setTimestampedTranscript([]);
            } else {
              setTimestampedTranscript(result.timestampedTranscript);
              console.log("Transcript fetched successfully");
            }
          } catch (error) {
            console.error("Error fetching transcript:", error);
            setTimestampedTranscript([]);
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

  // useEffect(() => {
  //   const fetchOrCreateThread = async () => {
  //     if (!params.lessonId || !user) {
  //       return;
  //     }

  //     try {
  //       const thread = await getThreadByResourceId(
  //         params.lessonId as string,
  //         DiscussionType.LESSON_DISCUSSION,
  //       );

  //       if (thread) {
  //         setThreadId(thread.id);
  //       }
  //     } catch (err) {
  //       console.error("Error in discussion thread handling:", err);
  //     }
  //   };

  //   if (lesson && user && !threadId) {
  //     fetchOrCreateThread();
  //   }
  // }, [params.lessonId, user, threadId, lesson]);

  // Add new useEffect for fetching enrollment ID
  useEffect(() => {
    const fetchEnrollmentId = async () => {
      if (session?.user?.id && course?.id) {
        try {
          // Kiểm tra xem lesson hiện tại có phải là preview không
          const allCourseLessons =
            course.chapters?.flatMap((chapter) => chapter.lessons || []) || [];
          const currentLesson = allCourseLessons.find(
            (lesson) => lesson?.id === params.lessonId,
          );
          const isCurrentLessonPreview = currentLesson?.isFreePreview || false;

          // Luôn cập nhật currentCourseId trong progress store
          useProgressStore.getState().clearProgress(); // Reset all progress data
          setCurrentCourseId(course.id);

          // Nếu đang xem bài học preview mà chưa enrolled, không cần fetch enrollment
          // const checkEnroll = await checkEnrollmentStatus

          // if (isCurrentLessonPreview && isEnrolled) {
          //   console.log(
          //     "Viewing preview lesson without enrollment - skipping enrollment API call",
          //   );
          //   return;
          // }

          // const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
          const response = await getEnrollmentByCourse(course.id);
          if (response.data?.data.id) {
            setEnrollmentId(response.data.data.id);
            setProgressEnrollmentId(response.data.data.id);

            // Kiểm tra xem có certificate không
            if (response.data.data.certificate) {
              setHasCertificate(true);
              setCertificateId(response.data.data.certificate.id);
            } else {
              setHasCertificate(false);
              setCertificateId(null);
            }

            // Fetch initial progress
            const res = await fetchInitialProgress();

            // Update local completed lessons from store
            const currentStore = useProgressStore.getState();
            let completedIds = currentStore.completedLessonIds || [];

            // If backend doesn't provide completedLessonIds, generate from current progress
            if (
              completedIds.length === 0 &&
              course?.chapters &&
              currentStore.progress > 0
            ) {
              const allCourseLessons = course.chapters.flatMap(
                (chapter) => chapter.lessons || [],
              );
              const progressPercentage = currentStore.progress;
              const totalLessons = allCourseLessons.length;
              const completedLessonsCount = Math.floor(
                (progressPercentage / 100) * totalLessons,
              );

              // Mark lessons as completed based on progress percentage
              completedIds = allCourseLessons
                .slice(0, completedLessonsCount)
                .map((lesson) => lesson.id)
                .filter(Boolean);
            }

            setCompletedLessonIds(completedIds);

            await fetchOverallProgress();
          }
        } catch (err: any) {
          // Nếu lỗi 404, đây có thể là bài preview mà người dùng chưa đăng ký
          if (err.response?.status === 404) {
            console.log("User not enrolled in this course yet");
            // Không hiển thị lỗi trong console cho trường hợp này
            useProgressStore.getState().clearProgress();
          } else {
            console.error("Error fetching enrollment ID:", err);
          }
        }
      }
    };

    fetchEnrollmentId();
  }, [
    course,
    session?.user?.id,
    params.lessonId,
    isEnrolled,
    fetchInitialProgress,
    fetchOverallProgress,
    setProgressEnrollmentId,
    setCurrentCourseId,
  ]);

  // New state for video loading
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  // Auto start time tracking when lesson loads and user is enrolled
  useEffect(() => {
    const currentLessonId = params.lessonId as string;
    const isCurrentLessonCompleted =
      completedLessonIds.includes(currentLessonId);

    // Only start tracking if lesson is not completed yet
    if (
      lesson &&
      isEnrolled &&
      !lesson.isFreePreview &&
      !isCurrentLessonCompleted
    ) {
      console.log("🕒 Starting time tracking for incomplete lesson");
      timeTracking.start();
    } else if (isCurrentLessonCompleted) {
      // console.log("✅ Lesson already completed - skipping time tracking");
      // Stop tracking if it's currently active
      if (timeTracking.isActive) {
        timeTracking.pause();
      }
    }

    return () => {
      if (timeTracking.isActive) {
        timeTracking.pause();
      }
    };
  }, [lesson, isEnrolled, completedLessonIds, params.lessonId]);

  // Handle page visibility to pause/resume tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentLessonId = params.lessonId as string;
      const isCurrentLessonCompleted =
        completedLessonIds.includes(currentLessonId);

      if (document.hidden) {
        if (timeTracking.isActive) {
          timeTracking.pause();
        }
      } else {
        // Only resume tracking if lesson is not completed
        if (
          lesson &&
          isEnrolled &&
          !lesson.isFreePreview &&
          !isCurrentLessonCompleted &&
          !timeTracking.isActive
        ) {
          timeTracking.resume();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    timeTracking.isActive,
    lesson,
    isEnrolled,
    completedLessonIds,
    params.lessonId,
  ]);

  // New animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  };

  const slideUp = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  // Tính toán logic trước khi return để tránh hooks order issues
  const currentLessonIndex = allLessons.findIndex(
    (lessonItem) => lessonItem?.id === params.lessonId,
  );

  // Calculate total lessons
  const totalLessons = allLessons.length;

  // Đơn giản hóa - chỉ lấy bài học trước/sau theo index
  const previousLesson =
    currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson =
    currentLessonIndex < allLessons.length - 1
      ? allLessons[currentLessonIndex + 1]
      : null;

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex flex-col min-h-screen relative px-1">
        <div className="flex-1 pr-0 md:pr-[350px] transition-all duration-300">
          <div className="space-y-6 mx-auto">
            {/* Loading breadcrumb */}
            <div className="flex items-center text-sm px-4 pt-4 gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>

            {/* Loading video placeholder */}
            <Skeleton
              className="w-full rounded-lg"
              style={{ aspectRatio: "16/9" }}
            />

            {/* Loading content card */}
            <div className="prose max-w-none">
              <Card className="overflow-hidden border-none shadow-md rounded-xl">
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-48 mb-4" />
                  <div className="flex items-center gap-2 mb-6">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-7 w-64" />
                  </div>

                  <div className="space-y-4 mt-6">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Loading discussion */}
            <div className="mt-8 pb-16">
              <Card className="overflow-hidden border-none shadow-md rounded-xl">
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-32 mb-4" />
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-16 w-full rounded-md" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Loading navigation bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t px-6 py-3 z-1">
          <div className="flex items-center justify-center gap-4">
            <Skeleton className="h-10 w-40 rounded-md" />
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>

          <div className="absolute top-1/4 right-4 flex items-center">
            <Skeleton className="h-6 w-24 mr-2" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>

        {/* Loading sidebar */}
        <div className="fixed right-0 top-0 h-[calc(100vh-73px)] w-[350px] bg-gray-50 border-l hidden md:block">
          <div className="py-4 px-2.5 pr-4 h-full overflow-auto">
            <Skeleton className="h-8 w-48 mb-7" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <div className="pl-4 space-y-2">
                    {Array(i + 1)
                      .fill(0)
                      .map((_, j) => (
                        <Skeleton key={j} className="h-10 w-full rounded-lg" />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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

  // Parse lesson content for BLOG or MIXED types
  let contentBlocks: Block[] = [];
  if (
    lesson?.content &&
    typeof lesson.content === "string" &&
    (lesson.type === LessonType.BLOG || lesson.type === LessonType.MIXED)
  ) {
    try {
      // Kiểm tra xem content có phải định dạng JSON không
      const trimmedContent = lesson.content.trim();
      if (
        trimmedContent &&
        (trimmedContent[0] === "[" || trimmedContent[0] === "{")
      ) {
        contentBlocks = JSON.parse(lesson.content);
      } else {
        console.warn("Lesson content is not in JSON format:", lesson.content);
      }
    } catch (error) {
      console.error("Error parsing lesson content:", error);
    }
  }

  // Handle lesson completion and navigation to next lesson
  const handleLessonCompletion = async () => {
    console.log("🚀 handleLessonCompletion called with: ", {
      enrollmentId,
      lessonId: lesson?.id,
      lessonTitle: lesson?.title,
      nextLessonId: nextLesson?.id,
      nextLessonTitle: nextLesson?.title,
      isEnrolled,
    });
    if (!lesson || !nextLesson) {
      console.log("❌ Missing required data:", {
        lesson: !!lesson,
        nextLesson: !!nextLesson,
      });
      return;
    }

    // If not enrolled, just navigate without updating progress
    if (!enrollmentId) {
      console.log("⏭️ Not enrolled, just navigating to next lesson");
      toast.info("Chuyển sang bài học tiếp theo");
      router.push(`/course/${course ? course.id : ""}/lesson/${nextLesson.id}`);
      return;
    }
    try {
      // Lấy index của bài học hiện tại
      const currentLessonIndex = allLessons.findIndex(
        (lessonItem) => lessonItem?.id === params.lessonId,
      );

      // Lấy thông tin bài học tiếp theo
      const nextLessonIndex = allLessons.findIndex(
        (lessonItem) => lessonItem?.id === nextLesson.id,
      );

      console.log("Progress check:", {
        currentLessonIndex,
        nextLessonIndex,
        currentLessonId: params.lessonId,
        nextLessonId: nextLesson.id,
        lastLessonId,
        progress,
      });

      // Luôn cập nhật tiến trình với thông tin của bài học tiếp theo
      // vì chúng ta đang chuyển đến bài học đó
      const currentProgress = typeof progress === "number" ? progress : 0;
      const newProgressPercentage = Math.max(
        currentProgress, // Current progress from store
        ((nextLessonIndex + 1) / totalLessons) * 100,
      );

      // Lấy currentProgressId từ store
      const currentProgressState = useProgressStore.getState();
      const currentProgressId = currentProgressState.currentProgress?.id;

      console.log("Progress state check:", {
        currentProgress: currentProgressState.currentProgress,
        currentProgressId,
        enrollmentId,
        newProgressPercentage,
        nextLesson: nextLesson.title,
        nextLessonId: nextLesson.id,
      });

      if (!currentProgressId) {
        console.error("No currentProgressId found in progress state");
        toast.error("Không thể lấy thông tin tiến trình hiện tại");
        return;
      }

      // Cập nhật tiến trình với thông tin bài học TIẾP THEO
      await updateLessonProgress({
        progress: newProgressPercentage,
        currentProgressId,
        nextLesson: nextLesson.title, // Sử dụng tên của bài học tiếp theo
        nextLessonId: nextLesson.id, // Sử dụng ID của bài học tiếp theo
        isLessonCompleted: true,
      });

      // Add current lesson to completed list locally for immediate UI update
      const currentLessonId = params.lessonId as string;
      setCompletedLessonIds((prev) => {
        if (!prev.includes(currentLessonId)) {
          const newCompleted = [...prev, currentLessonId];
          // Save to localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem(
              `completed-lessons-${course?.id}`,
              JSON.stringify(newCompleted),
            );
          }
          return newCompleted;
        }
        return prev;
      });

      toast.success("Tiến độ học tập đã được cập nhật!");

      // Navigate to next lesson
      router.push(`/course/${course ? course.id : ""}/lesson/${nextLesson.id}`);
    } catch (err) {
      toast.error("Không thể cập nhật tiến độ học tập");
    }
  };

  // Trong component, thêm đoạn code để lấy thông tin người tạo khóa học
  // const { otherUserData: instructorData } = useOtherUser(course?.ownerId);

  // Thêm hàm xử lý hoàn thành khóa học (gọi API backend và chuyển hướng chứng chỉ)
  const handleCourseCompletion = async () => {
    try {
      if (!enrollmentId) {
        console.log("No enrollmentId available");
        toast.error("Không tìm thấy thông tin ghi danh");
        return;
      }

      console.log("Starting course completion for enrollmentId:", enrollmentId);
      console.log("Course info:", {
        id: course?.id,
        title: course?.title,
        isHasCertificate: course?.isHasCertificate,
      });

      // Gọi action để đánh dấu hoàn thành khóa học
      const result = await markCourseAsCompleted(enrollmentId);
      console.log("Course completion result:", result);

      if (result.success && result.data) {
        const completedEnrollment = result.data.data;
        console.log("Completed enrollment:", completedEnrollment);

        // Kiểm tra xem có certificate được tạo không
        if (completedEnrollment.certificate) {
          console.log(
            "Certificate found in response:",
            completedEnrollment.certificate,
          );
          setHasCertificate(true);
          setCertificateId(completedEnrollment.certificate.id);
          toast.success(
            "Chúc mừng! Bạn đã hoàn thành khóa học và nhận được chứng chỉ!",
          );
          // Chuyển hướng đến trang chứng chỉ
          router.push(`/certificate/${completedEnrollment.certificate.id}`);
          return;
        }

        // Nếu không có certificate trong response, thử fetch lại
        console.log(
          "No certificate in immediate response, fetching enrollment again...",
        );
        const enrollmentResponse = await getEnrollmentByCourse(course!.id);

        console.log(
          "Refetched enrollment after completion:",
          enrollmentResponse,
        );
        if (enrollmentResponse.success && enrollmentResponse.data?.data) {
          const updatedEnrollment = enrollmentResponse.data.data;

          // Kiểm tra xem có certificate được tạo không
          if (updatedEnrollment.certificate) {
            console.log(
              "Certificate found in refetch:",
              updatedEnrollment.certificate,
            );
            setHasCertificate(true);
            setCertificateId(updatedEnrollment.certificate.id);
            toast.success(
              "Chúc mừng! Bạn đã hoàn thành khóa học và nhận được chứng chỉ!",
            );
            // Chuyển hướng đến trang chứng chỉ
            router.push(`/certificate/${updatedEnrollment.certificate.id}`);
          } else {
            console.log(
              "No certificate found in updated enrollment - course may not offer certificate",
            );
            toast.success("Chúc mừng! Bạn đã hoàn thành khóa học");
            router.push(`/course/${course?.id}`);
          }
        } else {
          // Fallback nếu không lấy được enrollment mới
          console.log("Failed to refetch enrollment");
          toast.success("Chúc mừng! Bạn đã hoàn thành khóa học");
          router.push(`/course/${course?.id}`);
        }
      } else {
        throw new Error(result.message || "Không thể hoàn thành khóa học");
      }
    } catch (err: any) {
      console.error("Error completing course:", err);
      toast.error(err.message || "Không thể cập nhật tiến độ học tập");
    }
  };

  return (
    <>
      <div className="w-full flex-1 flex flex-col min-h-screen relative px-1">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className={`flex-1 ${isSidebarOpen ? "pr-[350px]" : ""} transition-all duration-300`}
        >
          <div className="space-y-6 mx-auto ">
            {/* Course Navigation Breadcrumb */}
            <motion.div
              variants={slideUp}
              className="flex items-center text-sm text-gray-500 px-4 pt-4"
            >
              <Link
                href="/"
                className="hover:text-orange-500 transition-colors"
              >
                Khóa học
              </Link>
              <ChevronRight className="h-4 w-4 mx-2" />
              <Link
                href={course ? `/course/${course.id}` : "#"}
                className="hover:text-orange-500 transition-colors"
              >
                {course?.title}
              </Link>
              <ChevronRight className="h-4 w-4 mx-2" />
              <span className="text-gray-700 font-medium truncate">
                {lesson?.title}
              </span>
            </motion.div>

            {/* Video Content for VIDEO or MIXED */}
            {(lesson.type === LessonType.VIDEO ||
              lesson.type === LessonType.MIXED) &&
              lesson.videoUrl && (
                <motion.div
                  variants={slideUp}
                  className="relative rounded-lg overflow-hidden shadow-lg w-full"
                  style={{ aspectRatio: "16/9" }}
                >
                  {isVideoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/30 backdrop-blur-sm">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white mt-4 font-medium">
                          Đang tải video...
                        </p>
                      </div>
                    </div>
                  )}
                  <ReactPlayer
                    url={lesson.videoUrl}
                    controls={true}
                    onReady={() => setIsVideoLoading(false)}
                    onBuffer={() => setIsVideoLoading(true)}
                    onBufferEnd={() => setIsVideoLoading(false)}
                    config={{
                      youtube: {
                        playerVars: { showinfo: 1 },
                      },
                    }}
                    className="react-player"
                    width="100%"
                    height="100%"
                  />
                </motion.div>
              )}

            {/* Lesson Content */}
            {lesson.type !== LessonType.QUIZ && (
              <motion.div variants={slideUp} className="prose max-w-none pb-16">
                <Card className="overflow-hidden border-none shadow-md rounded-xl">
                  <CardContent className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent inline-block mb-4  items-center">
                      <BookOpen className="w-6 h-6 mr-2 text-orange-500" />
                      Nội dung bài học
                    </h1>
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        {lesson.order}
                      </span>
                      <span>{lesson.title}</span>
                    </h2>

                    {/* Time Tracking Component - HIDDEN but still tracking */}
                    {/* Time tracking is running in background via timeTracking hook */}

                    {/* Render Parsed Content for BLOG or MIXED */}
                    {(lesson.type === LessonType.BLOG ||
                      lesson.type === LessonType.MIXED) &&
                      contentBlocks.length > 0 && (
                        <div className="mt-4">
                          {contentBlocks.map((block, index) => (
                            <motion.div
                              key={block.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 * index, duration: 0.3 }}
                            >
                              {renderBlockToHtml(block)}
                            </motion.div>
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
                  </CardContent>
                </Card>
              </motion.div>
            )}
            {/* Quiz Section - Only show for QUIZ type lessons */}
            {lesson.type === LessonType.QUIZ && (
              <motion.div variants={slideUp} className="mt-8 pb-16">
                <Card className="overflow-hidden border-none shadow-md rounded-xl">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-green-500 to-teal-500 bg-clip-text text-transparent inline-block mb-4 items-center">
                      <Play className="w-5 h-5 mr-2 text-green-500 inline-block" />
                      Bài kiểm tra
                    </h2>
                    {/* <QuizSection
                      lessonId={params.lessonId as string}
                      lessonTitle={lesson.title}
                      isEnrolled={isEnrolled}
                    /> */}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Discussion Component */}
            {/* <motion.div variants={slideUp} className="mt-8 pb-16">
              <Card className="overflow-hidden border-none shadow-md rounded-xl">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent inline-block mb-4  items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-blue-500" />
                    Thảo luận
                  </h2>
                  <Discussion threadId={threadId || ""} />
                </CardContent>
              </Card>
            </motion.div> */}
          </div>
        </motion.div>

        {/* Fixed Navigation Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t px-6 py-3 z-1"
        >
          <div className="flex items-center justify-center gap-4">
            {previousLesson ? (
              <Link
                href={
                  course
                    ? `/course/${course.id}/lesson/${previousLesson.id}`
                    : "#"
                }
              >
                <Button
                  variant="outline"
                  className="w-40 group transition-all duration-300 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50"
                >
                  <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Bài trước
                </Button>
              </Link>
            ) : (
              <Button variant="outline" className="w-40 opacity-50" disabled>
                <ChevronLeft className="mr-2 h-4 w-4" /> Bài trước
              </Button>
            )}

            {nextLesson ? (
              isButtonEnabled ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      key={`next-lesson-btn-enabled-${forceRender}`}
                      className="w-40 transition-all duration-300 group bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                      onClick={() => {
                        console.log(
                          "🎯 Next Button clicked! Opening dialog...",
                        );
                      }}
                    >
                      Học tiếp{" "}
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-xl border-none shadow-xl">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                          Xác nhận hoàn thành bài học
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-gray-600 mt-2">
                          {isEnrolled &&
                          timeTracking.isTimeComplete &&
                          lesson.estimatedDurationMinutes ? (
                            <>
                              Bạn đã học{" "}
                              {formatTime(timeTracking.elapsedSeconds)} /{" "}
                              {lesson.estimatedDurationMinutes} phút yêu cầu.
                              <br />
                              Hãy đảm bảo rằng bạn đã nắm vững kiến thức trước
                              khi chuyển sang bài tiếp theo.
                            </>
                          ) : (
                            "Bạn đã hoàn thành bài học này chưa? Hãy đảm bảo rằng bạn đã nắm vững kiến thức trước khi chuyển sang bài tiếp theo."
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex gap-3 mt-4">
                        <AlertDialogCancel className="w-full">
                          Chưa, tôi cần học lại
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleLessonCompletion}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                        >
                          Đã hoàn thành, học tiếp
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </motion.div>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          className="w-40 bg-gray-300 text-gray-500 cursor-not-allowed transition-all duration-300"
                          disabled={true}
                        >
                          Học tiếp <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Bạn cần học ít nhất{" "}
                        {lesson?.estimatedDurationMinutes || 5} phút để hoàn
                        thành bài học này
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            ) : isEnrolled && currentLessonIndex === allLessons.length - 1 ? (
              hasCertificate ? (
                <Button
                  className="w-40 bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 group"
                  onClick={() => router.push(`/certificate/${certificateId}`)}
                >
                  Xem bằng{" "}
                  <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : isButtonEnabled ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      key={`complete-course-btn-enabled-${forceRender}`}
                      className="w-40 transition-all duration-300 group bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                      onClick={() => {
                        console.log(
                          "🎯 Complete Course Button clicked! Opening dialog...",
                        );
                        console.log("isenrolled: ", isEnrolled);
                        console.log(
                          "time tracking.iscomplete: ",
                          timeTracking.isTimeComplete,
                        );
                        console.log("isbuttonenabled: ", isButtonEnabled);
                      }}
                    >
                      Hoàn thành{" "}
                      <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-xl border-none shadow-xl">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                          Chúc mừng bạn đã hoàn thành khóa học!
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-gray-600 mt-2">
                          Bạn đã hoàn thành toàn bộ bài học trong khóa. Bạn có
                          thể quay lại trang khóa học để xem lại nội dung hoặc
                          khám phá các khóa học khác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex gap-3 mt-4">
                        <AlertDialogCancel className="w-full">
                          Ở lại trang này
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCourseCompletion}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                        >
                          Hoàn thành khóa học
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </motion.div>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          className="w-40 bg-gray-300 text-gray-500 cursor-not-allowed transition-all duration-300"
                          disabled={true}
                        >
                          Hoàn thành <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Bạn cần học ít nhất{" "}
                        {lesson?.estimatedDurationMinutes || 5} phút để hoàn
                        thành bài học này
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            ) : (
              <Button variant="outline" className="w-40 opacity-50" disabled>
                Học tiếp
                <ChevronRight className="ml-2 h-4 w-4" />
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
              className="bg-white border shadow-sm hover:bg-orange-50 hover:border-orange-200 transition-colors"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? (
                <ArrowBigRight className="h-4 w-4 text-orange-500" />
              ) : (
                <Menu className="h-4 w-4 text-orange-500" />
              )}
            </Button>
          </div>
        </motion.div>

        {/* Collapsible Sidebar */}
        <div
          className={`fixed right-0 top-0 h-[calc(100vh-73px)] w-[350px] bg-gray-50 border-l transform transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="py-4 px-2.5 pr-4 h-full overflow-auto">
            <h2 className="text-xl font-semibold mb-7">Nội dung khoá học</h2>
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
                      <h4 className="font-semibold text-gray-700">
                        {chapter.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 pl-1">
                      <span className="text-sm text-gray-600 truncate">
                        {chapter.lessons?.length || 0} bài
                      </span>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4">
                    <ul className="mt-2 space-y-2">
                      {chapter.lessons?.map((lesson) => {
                        // Kiểm tra bài học đã hoàn thành - dựa trên dữ liệu từ server
                        if (lesson.status !== "PUBLISHED") {
                          return null;
                        }
                        const isLessonCompleted = completedLessonIds.includes(
                          lesson.id,
                        );

                        // Tính toán index để kiểm tra khả năng truy cập
                        const currentLessonIndex = allLessons.findIndex(
                          (lessonItem) => lessonItem?.id === params.lessonId,
                        );
                        const lessonIndex = allLessons.findIndex(
                          (lessonItem) => lessonItem?.id === lesson.id,
                        );

                        // Kiểm tra xem có được phép truy cập bài học này không
                        const canAccessLesson =
                          !isEnrolled || // Nếu chưa enroll thì cho xem tất cả (để hiển thị preview)
                          lesson.isFreePreview || // Bài preview luôn được phép
                          isLessonCompleted || // Bài học đã hoàn thành luôn được phép truy cập
                          lesson.id === params.lessonId || // Bài hiện tại
                          (lessonIndex === currentLessonIndex + 1 &&
                            isButtonEnabled); // Bài tiếp theo chỉ khi button enabled

                        const linkContent = (
                          <div className="flex items-center gap-2 min-h-[32px]">
                            <div className="flex-shrink-0">
                              {isLessonCompleted ? (
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              ) : lesson.id === params.lessonId ? (
                                <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
                                  <Clock className="w-3 h-3 text-white" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <span
                                className={`block truncate text-[15px] ${
                                  lesson.id === params.lessonId
                                    ? "font-medium"
                                    : ""
                                } ${!canAccessLesson ? "text-gray-400" : ""}`}
                              >
                                {lesson.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {lesson.id === lastLessonId && (
                                <span className="flex-shrink-0 text-xs px-1 py-0.5 rounded bg-orange-100 text-orange-600">
                                  Đang học
                                </span>
                              )}
                              {lesson.isFreePreview && (
                                <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                                  Miễn phí
                                </span>
                              )}
                              {!canAccessLesson && isEnrolled && (
                                <span className="flex-shrink-0 text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded">
                                  Đã khóa
                                </span>
                              )}
                            </div>
                          </div>
                        );

                        return canAccessLesson ? (
                          <Link
                            href={`/course/${course ? course.id : ""}/lesson/${lesson.id}`}
                            key={lesson.id}
                            className={`block p-2 rounded-lg transition-colors ${
                              lesson.id === params.lessonId
                                ? "bg-orange-100"
                                : "hover:bg-gray-200"
                            } cursor-pointer`}
                          >
                            {linkContent}
                          </Link>
                        ) : (
                          <div
                            key={lesson.id}
                            className={`block p-2 rounded-lg transition-colors ${
                              lesson.id === params.lessonId
                                ? "bg-orange-100"
                                : "bg-gray-50"
                            } cursor-not-allowed opacity-60`}
                            title="Bạn cần hoàn thành bài học hiện tại trước khi tiếp tục"
                          >
                            {linkContent}
                          </div>
                        );
                      })}
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
