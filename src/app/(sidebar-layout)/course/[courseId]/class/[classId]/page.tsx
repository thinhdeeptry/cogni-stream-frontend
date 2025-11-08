"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { usePopupChatbot } from "@/hooks/usePopupChatbot";
import {
  formatTime,
  formatTimeMinutes,
  useTimeTracking,
} from "@/hooks/useTimeTracking";
import {
  type Course,
  LessonType,
  type SyllabusItem,
  SyllabusItemType,
} from "@/types/course/types";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Menu,
  Pause,
  Play,
  PlayCircle,
  Timer,
  Users,
  Video,
  Volume2,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import ReactPlayer from "react-player";

import { getCourseById } from "@/actions/courseAction";
import { getLessonById } from "@/actions/courseAction";
import {
  checkEnrollmentStatus,
  getEnrollmentByCourse,
  getEnrollmentByCourseAndType,
  markCourseAsCompleted,
} from "@/actions/enrollmentActions";
import {
  completeUnlockRequirement,
  getQuizStatus,
  unlockQuiz,
} from "@/actions/quizAction";
import {
  type GroupedSyllabusItem,
  getSyllabusByClassId,
} from "@/actions/syllabusActions";
import { getYoutubeTranscript } from "@/actions/youtubeTranscript.action";

import { useProgressStore } from "@/stores/useProgressStore";
import useUserStore from "@/stores/useUserStore";

import { extractPlainTextFromBlockNote } from "@/utils/blocknote";

import { AttendanceManager } from "@/components/attendance";
import AttendanceChecker from "@/components/attendance/AttendanceChecker";
import CourseSidebar from "@/components/course/CourseSidebar";
import QuizSection from "@/components/quiz/QuizSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const slideIn = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3 } },
};

// Interface for lesson content blocks
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

// Render block function for lesson content
const renderBlockToHtml = (block: Block): React.ReactElement => {
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
            {contentItem.text}
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
      const level = block.props.level || 1;
      const HeadingComponent =
        level === 1
          ? "h1"
          : level === 2
            ? "h2"
            : level === 3
              ? "h3"
              : level === 4
                ? "h4"
                : level === 5
                  ? "h5"
                  : "h6";
      return React.createElement(
        HeadingComponent,
        {
          className: `mb-4 font-semibold ${level === 1 ? "text-3xl" : level === 2 ? "text-2xl" : "text-xl"}`,
          style: baseStyles,
        },
        renderContent(),
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
                <div key={index}>{renderBlockToHtml(child)}</div>
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
          className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto my-4"
          style={baseStyles}
        >
          <code>{renderContent()}</code>
        </pre>
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
      return (
        <div className="my-4 p-2 bg-yellow-100 text-yellow-800 rounded">
          [Unsupported block type: {block.type}]
        </div>
      );
  }
};

export default function ClassLearningPage() {
  // States
  const [course, setCourse] = useState<Course | null>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [syllabusData, setSyllabusData] = useState<GroupedSyllabusItem[]>([]);
  const [currentItem, setCurrentItem] = useState<SyllabusItem | null>(null);
  const [currentLessonData, setCurrentLessonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(false);
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [hasCertificate, setHasCertificate] = useState<boolean>(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  // Modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] =
    useState<SyllabusItem | null>(null);
  // Chatbot states
  const [timestampedTranscript, setTimestampedTranscript] = useState<
    Array<{
      text: string;
      timestamp: string;
      offset: number;
      duration: number;
    }>
  >([]);

  // Time tracking for current item
  const timeTracking = useTimeTracking({
    itemId: currentItem?.id || "",
    requiredMinutes: getCurrentItemRequiredMinutes(),
    onTimeComplete: () => {
      console.log("Time tracking completed for item:", currentItem?.id);
    },
  });

  // Helper function to get required minutes for current item
  function getCurrentItemRequiredMinutes(): number {
    if (!currentItem) return 5;

    if (currentItem.itemType === SyllabusItemType.LESSON) {
      return currentItem.lesson?.estimatedDurationMinutes || 5;
    } else if (currentItem.itemType === SyllabusItemType.LIVE_SESSION) {
      return currentItem.classSession?.durationMinutes || 30;
    }

    return 5;
  }

  // Hooks
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { user } = useUserStore();

  // Helper function để kiểm tra xem user có phải là instructor/admin của khóa học này không
  const isInstructorOrAdmin = useMemo(() => {
    if (user?.role === "ADMIN") return true;
    return user?.id === course?.instructorId;
  }, [user?.id, user?.role, course?.instructorId]);

  const {
    progress,
    overallProgress,
    createSyllabusProgress,
    fetchInitialProgress,
    currentProgress,
    completedItems,
    enrollmentId,
    isLessonCompleted, // bài học này đã hoàn thành hay chưa
    setEnrollmentId,
    setCurrentCourseId,
  } = useProgressStore();
  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!params.courseId || !params.classId) return;

      try {
        setIsLoading(true);

        // Fetch course data
        const courseData = await getCourseById(params.courseId as string);
        setCourse(courseData);

        // Set course ID in progress store
        setCurrentCourseId(courseData.id);

        // Find class info from course data
        const selectedClass = courseData.classes?.find(
          (c) => c.id === params.classId,
        );
        setClassInfo(selectedClass);

        // Check enrollment status
        if (user?.id) {
          const enrollmentResult = await checkEnrollmentStatus(
            user.id,
            courseData.id,
            params.classId as string,
          );
          if (enrollmentResult.success) setIsEnrolled(true);
        }

        // Fetch syllabus for the class
        await fetchSyllabus();
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Không thể tải thông tin lớp học");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.courseId, params.classId, user?.id, setCurrentCourseId]);
  //fetch progress data
  useEffect(() => {
    if (enrollmentId && !isInstructorOrAdmin) {
      fetchInitialProgress();
    }
  }, [enrollmentId, isInstructorOrAdmin]);
  // Fetch enrollment data to check certificate status and set enrollmentId for progress
  useEffect(() => {
    const fetchEnrollmentData = async () => {
      if (!user?.id || !course?.id || !params.classId) return;

      // If user is instructor or admin, skip enrollment check and enable preview mode
      if (isInstructorOrAdmin) {
        console.log(
          "Instructor/Admin preview mode - skipping enrollment check",
        );
        setIsEnrolled(true); // Enable preview mode
        return;
      }

      try {
        useProgressStore.getState().clearProgress();
        // Lấy STREAM enrollment cho class này
        const response = await getEnrollmentByCourseAndType(
          course.id,
          "STREAM",
          user?.id,
          params.classId as string,
        );

        if (response.success && response.data?.data) {
          const enrollmentData = response.data.data;
          setIsEnrolled(true);
          // Set enrollmentId vào progress store
          setEnrollmentId(enrollmentData.id);

          // Kiểm tra xem có certificate không
          if (enrollmentData.certificate) {
            setHasCertificate(true);
            setCertificateId(enrollmentData.certificate.id);
          }
        } else {
          setIsEnrolled(false);
        }
      } catch (err) {
        console.error("Error fetching enrollment data:", err);
        setIsEnrolled(false);
      }
    };

    fetchEnrollmentData();
  }, [
    user?.id,
    course?.id,
    params.classId,
    setEnrollmentId,
    fetchInitialProgress,
    isInstructorOrAdmin,
  ]);

  // Fetch syllabus data
  const fetchSyllabus = async () => {
    if (!params.classId) return;

    try {
      setIsLoadingSyllabus(true);
      const syllabusResponse = await getSyllabusByClassId(
        params.classId as string,
      );

      if (syllabusResponse && syllabusResponse.groupedItems) {
        setSyllabusData(syllabusResponse.groupedItems);
        // Note: currentItem will be set by separate useEffect that handles lesson parameter and localStorage
      }
    } catch (error) {
      console.error("Error fetching syllabus:", error);
    } finally {
      setIsLoadingSyllabus(false);
    }
  };

  // Restore lesson từ currentProgress hoặc set lesson đầu tiên
  useEffect(() => {
    if (syllabusData.length > 0 && !currentItem && params.classId) {
      const savedSyllabusItemId = currentProgress?.syllabusItemId;
      console.log("savedSyllabusItemId: ", savedSyllabusItemId);
      if (savedSyllabusItemId) {
        // Tìm syllabus item theo syllabusItemId từ currentProgress
        for (const group of syllabusData) {
          const foundItem = group.items.find(
            (item) => item.id === savedSyllabusItemId,
          );
          console.log("📍 Found saved syllabus item:", foundItem);
          if (foundItem) {
            setCurrentItem(foundItem);
            return;
          }
        }
        console.log(
          "⚠️ Saved syllabus item not found, falling back to first item",
        );
      }

      // Nếu không tìm thấy item từ progress, set item đầu tiên
      const firstGroup = syllabusData[0];
      if (firstGroup?.items?.length > 0) {
        console.log("📍 Setting first item as default:", firstGroup.items[0]);
        setCurrentItem(firstGroup.items[0]);
      }
    }
  }, [
    currentProgress,
    completedItems,
    enrollmentId,
    syllabusData,
    currentItem,
    params.classId,
  ]);

  // Fetch lesson data when lesson item is selected
  const fetchLessonData = async (lessonId: string) => {
    try {
      setIsLoadingLesson(true);
      const lessonData = await getLessonById(lessonId);
      setCurrentLessonData(lessonData);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải nội dung bài học",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLesson(false);
    }
  };

  // Effect to fetch lesson data when currentItem changes to a lesson
  useEffect(() => {
    if (
      currentItem?.itemType === SyllabusItemType.LESSON &&
      currentItem.lesson?.id
    ) {
      fetchLessonData(currentItem.lesson.id);
    } else {
      setCurrentLessonData(null);
      setTimestampedTranscript([]); // Clear transcript when not a lesson
    }
  }, [currentItem]);

  // Effect to fetch transcript when lesson data changes
  useEffect(() => {
    const fetchTranscript = async () => {
      if (currentLessonData?.videoUrl) {
        try {
          const result = await getYoutubeTranscript(currentLessonData.videoUrl);

          if ("error" in result) {
            console.warn(
              `Transcript fetch failed: ${result.error}`,
              result.details,
            );
            setTimestampedTranscript([]);
          } else {
            setTimestampedTranscript(result.timestampedTranscript);
            console.log("Transcript fetched successfully for class lesson");
          }
        } catch (error) {
          console.error("Error fetching transcript for class lesson:", error);
          setTimestampedTranscript([]);
        }
      } else {
        setTimestampedTranscript([]);
      }
    };

    fetchTranscript();
  }, [currentLessonData?.videoUrl]);

  // Time tracking effects
  useEffect(() => {
    // Reset and start tracking when currentItem changes, but skip for instructor/admin
    if (currentItem && isEnrolled && !isInstructorOrAdmin) {
      timeTracking.reset();
      timeTracking.start();
    }

    return () => {
      if (timeTracking.isActive) {
        timeTracking.pause();
      }
    };
  }, [currentItem?.id, isEnrolled, isInstructorOrAdmin]);

  // Handle page visibility to pause/resume tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timeTracking.isActive) {
          timeTracking.pause();
        }
      } else {
        if (currentItem && isEnrolled && !timeTracking.isActive) {
          timeTracking.resume();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [timeTracking.isActive, currentItem, isEnrolled]);

  // Effect to handle lesson navigation from URL parameters
  useEffect(() => {
    const targetLessonId = searchParams.get("lesson");

    if (targetLessonId && syllabusData.length > 0) {
      // Find the syllabus item that contains the target lesson
      const targetItem = syllabusData
        .flatMap((group) => group.items)
        .find(
          (item) =>
            item.itemType === SyllabusItemType.LESSON &&
            item.lesson?.id === targetLessonId,
        );

      if (targetItem && targetItem.id !== currentItem?.id) {
        setCurrentItem(targetItem);

        // Clean up URL parameter after navigation
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("lesson");
        router.replace(newUrl.pathname + newUrl.search, { scroll: false });

        toast({
          title: "Đã chuyển đến bài học",
          description: targetItem.lesson?.title || "Bài học được yêu cầu",
        });
      }
    }
  }, [syllabusData, searchParams, currentItem, params.classId, router]);

  // Get all items in order for navigation
  const allItems = useMemo(() => {
    return syllabusData.flatMap((group) => group.items);
  }, [syllabusData]);

  // Find current item index
  const currentItemIndex = useMemo(() => {
    return currentItem
      ? allItems.findIndex((item) => item.id === currentItem.id)
      : -1;
  }, [allItems, currentItem]);
  // Memoize the reference text for chatbot - only for lesson content
  const referenceText = useMemo(() => {
    // Only generate reference text for lessons
    if (
      currentItem?.itemType !== SyllabusItemType.LESSON ||
      !currentLessonData
    ) {
      return "";
    }

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
        transcriptSection = timestampedTranscript
          .map((item, index) => `[Part ${index + 1}] ${item.text}`)
          .join("\n");
      }
    }

    // Extract plain text from lesson content if it exists
    const plainContent = currentLessonData?.content
      ? extractPlainTextFromBlockNote(currentLessonData.content)
      : "No content available";

    return `
    Course Title: ${course?.title} \n
    Class Name: ${classInfo?.name} \n
    Lesson Title: ${currentLessonData?.title} \n
    Lesson Content: ${plainContent} \n
    Lesson Type: ${currentLessonData?.type} \n
    Lesson Video Transcript with Timestamps: \n${transcriptSection} \n
    `;
  }, [
    currentItem?.itemType,
    currentLessonData,
    course?.title,
    classInfo?.name,
    timestampedTranscript,
  ]);

  // Chatbot component - only show for lessons
  const ClassLessonChatbot = usePopupChatbot({
    initialOpen: false,
    position: "bottom-right",
    referenceText,
    title: "Trợ lý học tập CogniStream AI",
    welcomeMessage: "", // Will be auto-generated based on context
    showBalloon: false,
    // Context-aware props
    userName: user?.name || user?.email?.split("@")[0] || "bạn",
    courseName: course?.title,
    lessonName: currentLessonData?.title,
    lessonOrder: currentItemIndex + 1, // Use current item index as order
    totalLessons: syllabusData.reduce(
      (total, group) =>
        total +
        group.items.filter((item) => item.itemType === SyllabusItemType.LESSON)
          .length,
      0,
    ),
    chapterName: `${classInfo?.name} - Ngày ${
      currentItem &&
      syllabusData.find((g) => g.items.some((i) => i.id === currentItem.id))
        ?.day
    }`,
    systemPrompt: `Bạn là trợ lý AI học tập cá nhân của CogniStream, được tối ưu hóa để hỗ trợ quá trình học tập trong lớp học trực tuyến. Hãy tuân thủ các nguyên tắc sau:

1. NỘI DUNG VÀ GIỌNG ĐIỆU
- Trả lời ngắn gọn, đảm bảo thông tin chính xác và có tính giáo dục cao
- Ưu tiên cách giải thích dễ hiểu, sử dụng ví dụ minh họa khi cần thiết
- Sử dụng giọng điệu thân thiện, khuyến khích và tích cực
- Nhấn mạnh tính tương tác và hợp tác trong môi trường lớp học

2. NGUỒN THÔNG TIN
- Phân tích và sử dụng chính xác nội dung từ reference text (bài học trong lớp) được cung cấp
- Nếu câu hỏi nằm ngoài phạm vi bài học, hãy nói rõ và cung cấp kiến thức nền tảng
- Đề xuất tài liệu bổ sung chỉ khi thực sự cần thiết
- Khuyến khích thảo luận và tương tác với giảng viên và bạn học

3. HỖ TRỢ HỌC TẬP
- Giúp người học hiểu sâu hơn về khái niệm, không chỉ ghi nhớ thông tin
- Hướng dẫn người học tư duy phản biện và giải quyết vấn đề
- Điều chỉnh độ phức tạp của câu trả lời phù hợp với ngữ cảnh lớp học
- Gợi ý các hoạt động thực hành và ứng dụng kiến thức

4. ĐỊNH DẠNG
- Sử dụng Markdown để định dạng câu trả lời và đảm bảo dễ đọc
- Dùng đậm, in nghiêng và danh sách để làm nổi bật điểm quan trọng
- Đảm bảo thuật ngữ kỹ thuật được giải thích rõ ràng

Reference text chứa thông tin về khóa học, lớp học và nội dung bài học. Hãy sử dụng thông tin này khi trả lời.`,
  });
  // Helper function to check if an item is completed
  const isItemCompleted = (item: SyllabusItem) => {
    if (!completedItems || !Array.isArray(completedItems)) return false;
    // Check if this item has progress and is completed
    return completedItems.some((p: any) => p.id === item.id);
  };

  // Helper function to check if navigation to an item is allowed
  const canNavigateToItem = (targetItem: SyllabusItem) => {
    const targetIndex = allItems.findIndex((item) => item.id === targetItem.id);
    const currentIndex = currentItemIndex;

    // Allow navigation to current item or previous items
    if (targetIndex <= currentIndex) return true;

    // Allow navigation to immediate next item
    if (targetIndex === currentIndex + 1) return true;

    // Check if all items before the target are completed
    for (let i = currentIndex + 1; i < targetIndex; i++) {
      if (!isItemCompleted(allItems[i])) {
        return false;
      }
    }

    return true;
  };

  // Helper function to find the next available lesson
  const getNextAvailableItem = () => {
    for (let i = currentItemIndex + 1; i < allItems.length; i++) {
      if (canNavigateToItem(allItems[i])) {
        return allItems[i];
      }
    }
    return null;
  };

  // Navigation functions
  const goToPrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItem(allItems[currentItemIndex - 1]);
    }
  };

  const goToNext = () => {
    if (currentItemIndex < allItems.length - 1) {
      setCurrentItem(allItems[currentItemIndex + 1]);
    }
  };
  // Function to handle lesson completion and check unlock requirements
  const handleLessonCompletion = async (completedLessonId: string) => {
    if (!completedLessonId) return;

    try {
      console.log(
        "Processing lesson completion for unlock requirements:",
        completedLessonId,
      );

      // Tìm tất cả quiz lessons để xử lý unlock requirements
      const quizLessons = syllabusData
        .flatMap((group) => group.items)
        .filter(
          (item) =>
            item.itemType === SyllabusItemType.LESSON &&
            item.lesson?.type === LessonType.QUIZ,
        );

      console.log(
        `Found ${quizLessons.length} quiz lessons to check unlock requirements`,
      );

      let totalRequirementsProcessed = 0;
      let successfulUnlocks: any[] = [];

      for (const quizItem of quizLessons) {
        if (!quizItem.lesson?.id) continue;

        try {
          // Gọi API để lấy quiz status và kiểm tra unlock requirements
          const statusResult = await getQuizStatus(quizItem.lesson.id);
          if (statusResult.success && statusResult.data?.unlockRequirements) {
            const requirements = statusResult.data.unlockRequirements;
            // Tìm requirement liên quan đến lesson vừa hoàn thành
            const matchingRequirements = requirements.filter(
              (req: any) =>
                req.type === "WATCH_LESSON" &&
                req.targetLesson.id === completedLessonId &&
                !req.isCompleted,
            );
            matchingRequirements.forEach((requirement: any) => {
              console.log("is check matching requirement: ", {
                type: requirement.type,
                targetLessonId: requirement.targetLesson.id,
                completedLessonId,
                isCompleted: requirement.isCompleted,
              });
            });

            console.log(
              `Found ${matchingRequirements.length} matching requirements for quiz ${quizItem.lesson.title}`,
            );

            // Xử lý từng requirement
            for (const requirement of matchingRequirements) {
              try {
                console.log("currentItem: ", currentItem);
                const completeResult = await completeUnlockRequirement(
                  quizItem.lesson.id,
                  currentItem?.classId ?? "",
                  requirement.id, // Sử dụng đúng requirement ID
                  // {
                  //   completedLessonId: completedLessonId,
                  //   completedAt: new Date().toISOString(),
                  //   progress: 100,
                  // },
                );

                if (completeResult.success) {
                  console.log(
                    `✅ Completed requirement ${requirement.id} for quiz ${quizItem.lesson.title}`,
                  );
                  totalRequirementsProcessed++;

                  // // Thử unlock quiz
                  // const unlockResult = await unlockQuiz(quizItem.lesson.id);
                  // if (unlockResult.success) {
                  //   successfulUnlocks.push({
                  //     lessonId: quizItem.lesson.id,
                  //     lessonTitle: quizItem.lesson.title,
                  //   });
                  // }
                }
              } catch (error) {
                console.log(
                  `Could not complete requirement ${requirement.id}:`,
                  error,
                );
              }
            }
          }
        } catch (error) {
          console.log(
            `Could not check quiz status for ${quizItem.lesson.id}:`,
            error,
          );
        }
      }

      // Hiển thị thông báo cho các quiz đã được unlock
      for (const unlock of successfulUnlocks) {
        toast({
          title: "🎉 Quiz đã được mở khóa!",
          description: `Bạn có thể làm quiz "${unlock.lessonTitle}" ngay bây giờ.`,
          duration: 5000,
        });
      }

      if (totalRequirementsProcessed > 0) {
        console.log(
          `✅ Successfully processed ${totalRequirementsProcessed} unlock requirements`,
        );
      } else {
        console.log("No unlock requirements found for this lesson completion");
      }
    } catch (error) {
      console.error(
        "Error processing lesson completion for unlock requirements:",
        error,
      );
    }
  };

  // Enhanced goToNext with lesson completion handling
  const handleGoToNext = () => {
    const nextItem = allItems[currentItemIndex + 1];
    if (!nextItem) return;

    // If current lesson is not completed, show confirmation modal
    if (
      currentItem?.itemType === SyllabusItemType.LESSON &&
      currentItem.lesson?.type !== LessonType.QUIZ &&
      !isItemCompleted(currentItem)
    ) {
      setPendingNavigation(nextItem);
      setIsConfirmModalOpen(true);
      return;
    }

    // If already completed or is a quiz, navigate directly
    goToNext();
  };

  // Handle confirmed navigation (complete current lesson and go to next)
  const handleConfirmedNavigation = async () => {
    if (!pendingNavigation) return;

    // Complete current lesson if it's not a quiz
    if (
      currentItem?.itemType === SyllabusItemType.LESSON &&
      currentItem.lesson?.id &&
      currentItem.lesson?.type !== LessonType.QUIZ
    ) {
      try {
        // create progress cho lesson hiện tại
        await createSyllabusProgress(currentItem?.id);

        // Xử lý unlock requirements
        await handleLessonCompletion(currentItem.lesson.id);

        toast({
          title: "✅ Đã hoàn thành bài học!",
          description: "Chuyển sang bài học tiếp theo.",
        });
      } catch (error) {
        console.error("Error completing lesson:", error);
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật tiến độ học tập",
          variant: "destructive",
        });
      }
    }

    // Navigate to next item
    setCurrentItem(pendingNavigation);

    // Current lesson is automatically tracked by progress store

    // Close modal
    setIsConfirmModalOpen(false);
    setPendingNavigation(null);
  };

  // Handle cancelled navigation
  const handleCancelledNavigation = () => {
    setIsConfirmModalOpen(false);
    setPendingNavigation(null);
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Handler to navigate to a required lesson to unlock quiz
  const handleNavigateToLesson = (targetLessonId: string) => {
    if (!targetLessonId) {
      toast({
        title: "❌ Lỗi",
        description: "Không tìm thấy bài học cần học",
        variant: "destructive",
      });
      return;
    }

    // Find the syllabus item that contains this lesson
    let targetItem: SyllabusItem | null = null;

    for (const group of syllabusData) {
      const found = group.items.find(
        (item) =>
          item.itemType === SyllabusItemType.LESSON &&
          item.lesson?.id === targetLessonId,
      );
      if (found) {
        targetItem = found;
        break;
      }
    }

    if (!targetItem) {
      toast({
        title: "❌ Không tìm thấy bài học",
        description: "Bài học này không có trong lộ trình của lớp",
        variant: "destructive",
      });
      return;
    }

    // Navigate to the lesson
    setCurrentItem(targetItem);

    toast({
      title: "🎯 Chuyển đến bài học",
      description: `Đang mở bài học: ${targetItem.lesson?.title || "Bài học"}`,
      duration: 3000,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full flex-1 flex flex-col min-h-screen relative px-1">
        <div className="flex-1 pr-0 md:pr-[350px] transition-all duration-300">
          <div className="space-y-6 mx-auto">
            <Skeleton className="h-8 w-1/2 mb-4" />
            <Skeleton
              className="w-full rounded-lg"
              style={{ aspectRatio: "16/9" }}
            />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>

        {/* Loading navigation bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t px-6 py-3 z-1">
          <div className="flex items-center justify-center gap-4">
            <Skeleton className="h-10 w-40 rounded-md" />
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>
        </div>

        {/* Loading sidebar */}
        <div className="fixed right-0 top-0 h-[calc(100vh-73px)] w-[350px] bg-gray-50 border-l hidden md:block">
          <div className="py-4 px-2.5 pr-4 h-full overflow-auto">
            <Skeleton className="h-8 w-48 mb-7" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-2" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <Info className="h-12 w-12 mb-4 text-red-500" />
        <p className="text-lg font-medium text-red-500">{error}</p>
        <Button
          className="mt-4"
          onClick={() => router.push(`/course/${params.courseId}`)}
        >
          Quay về khóa học
        </Button>
      </div>
    );
  }

  // Not enrolled state
  if (!isEnrolled) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <Users className="h-12 w-12 mb-4 text-orange-500" />
        <h1 className="text-2xl font-semibold mb-2">Chưa đăng ký lớp học</h1>
        <p className="text-gray-600 mb-4">
          Bạn cần đăng ký khóa học để tham gia lớp học này.
        </p>
        <Button
          onClick={() => router.push(`/course/${params.courseId}`)}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Đăng ký ngay
        </Button>
      </div>
    );
  }

  // Handler for completing a live session
  const handleCompleteLiveSession = async () => {
    console.log("Enroll: ", enrollmentId);
    console.log("Curr item: ", currentItem);
    if (!enrollmentId || !currentItem) return;
    const nextItem = allItems[currentItemIndex + 1];
    const isLastItem = currentItemIndex === allItems.length - 1;

    try {
      console.log("Handle done session");
      await createSyllabusProgress(currentItem?.id);

      // Nếu là buổi học cuối cùng, xử lý hoàn thành khóa học
      if (isLastItem) {
        await handleCourseCompletion();
      } else {
        toast({
          title: "Đã hoàn thành buổi học!",
          description: nextItem
            ? "Chuyển sang buổi tiếp theo."
            : "Bạn đã hoàn thành tất cả buổi học!",
        });
        // Tự động chuyển sang buổi tiếp theo nếu còn
        if (nextItem) setCurrentItem(nextItem);
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật tiến trình.",
        variant: "destructive",
      });
    }
  };

  // Handler for joining live session
  const handleJoinLiveSession = () => {
    const meetingLink = currentItem?.classSession?.meetingLink;

    if (!meetingLink) {
      toast({
        title: "Thông báo",
        description: "Chưa có link tham gia buổi học",
        variant: "destructive",
      });
      return;
    }

    // Open meeting link in new tab
    window.open(meetingLink, "_blank", "noopener,noreferrer");

    toast({
      title: "Đã mở buổi học",
      description: "Link buổi học đã được mở trong tab mới",
    });
  };

  // Handler for course completion
  const handleCourseCompletion = async () => {
    try {
      if (!enrollmentId) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy thông tin ghi danh",
          variant: "destructive",
        });
        return;
      }

      // Gọi action để đánh dấu hoàn thành khóa học
      const result = await markCourseAsCompleted(enrollmentId);

      if (result.success && result.data?.data) {
        const completedEnrollment = result.data.data;

        // Kiểm tra xem có certificate được tạo không
        if (completedEnrollment.certificate) {
          setHasCertificate(true);
          setCertificateId(completedEnrollment.certificate.id);
          toast({
            title: "Chúc mừng!",
            description: "Bạn đã hoàn thành khóa học và nhận được chứng chỉ!",
          });
          // Chuyển hướng đến trang chứng chỉ
          router.push(`/certificate/${completedEnrollment.certificate.id}`);
        } else {
          toast({
            title: "Chúc mừng!",
            description: "Bạn đã hoàn thành khóa học",
          });
          router.push(`/course/${params.courseId}`);
        }
      } else {
        throw new Error(result.message || "Không thể hoàn thành khóa học");
      }
    } catch (err: any) {
      console.error("Error completing course:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể cập nhật tiến độ học tập",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      className="w-full flex-1 flex flex-col min-h-screen relative px-1"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      {/* Instructor/Admin Preview Banner */}
      {isInstructorOrAdmin && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-300 text-gray-950 p-4 mb-4 rounded-lg shadow-lg mx-2"
        >
          <div className="flex items-center justify-center gap-2">
            <Eye className="h-5 w-5" />
            <span className="font-medium">
              {user?.role === "ADMIN"
                ? "Chế độ xem trước Admin"
                : "Chế độ xem trước Giảng viên"}
            </span>
          </div>
          <p className="text-center text-sm mt-1 opacity-90">
            Bạn đang xem lớp học với quyền{" "}
            {user?.role === "ADMIN" ? "quản trị viên" : "giảng viên"}. Tiến
            trình học tập và thời gian học không được theo dõi.
          </p>
        </motion.div>
      )}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className={`flex-1 ${
          isSidebarOpen &&
          !(currentLessonData && currentLessonData.type === LessonType.QUIZ)
            ? "pr-[350px]"
            : ""
        } transition-all duration-300`}
      >
        <div className="space-y-6 mx-auto">
          {/* Header */}
          <motion.div
            className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between sticky top-0 z-10"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-semibold text-gray-800">
                  {currentItem?.itemType === SyllabusItemType.LESSON
                    ? currentItem.lesson?.title
                    : currentItem?.classSession?.topic}
                </h1>
                <p className="text-sm text-gray-600">
                  {classInfo?.name} - Ngày{" "}
                  {currentItem &&
                    syllabusData.find((g) =>
                      g.items.some((i) => i.id === currentItem.id),
                    )?.day}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/course/${params.courseId}`)}
              >
                Thông tin khóa học
              </Button>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="p-6 -mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {currentItem ? (
              <div className="max-w-full -mt-10">
                {currentItem.itemType === SyllabusItemType.LESSON ? (
                  // Lesson Content - Display inline like lesson page
                  <div>
                    {isLoadingLesson ? (
                      <div className="space-y-4">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="w-full h-64" />
                        <Skeleton className="h-32 w-full" />
                      </div>
                    ) : currentLessonData ? (
                      <div>
                        {/* Lesson Video */}
                        {currentLessonData.videoUrl && (
                          <motion.div
                            className="mb-6"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="relative w-full max-w-5xl mx-auto aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                              {isVideoLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                                </div>
                              )}
                              <ReactPlayer
                                url={currentLessonData.videoUrl}
                                width="100%"
                                height="100%"
                                controls
                                onReady={() => setIsVideoLoading(false)}
                                onError={() => setIsVideoLoading(false)}
                                config={{
                                  youtube: {
                                    playerVars: {
                                      showinfo: 1,
                                      controls: 1,
                                      rel: 0,
                                    },
                                  },
                                }}
                              />
                            </div>
                          </motion.div>
                        )}

                        {/* Time Tracking Component for Lessons */}
                        {/* {currentLessonData.type !== LessonType.QUIZ &&
                          isEnrolled &&
                          currentItem.lesson?.estimatedDurationMinutes && (
                            <motion.div
                              className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg -mt-10"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-blue-800 flex items-center gap-2">
                                  <Timer className="h-5 w-5" />
                                  Thời gian học tập
                                </h3>
                                <div className="flex items-center gap-2">
                                  {timeTracking.isActive ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={timeTracking.pause}
                                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                                    >
                                      <Pause className="h-4 w-4 mr-1" />
                                      Tạm dừng
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={timeTracking.resume}
                                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                                    >
                                      <Play className="h-4 w-4 mr-1" />
                                      Tiếp tục
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-sm text-blue-700">
                                  <span>
                                    Thời gian đã học:{" "}
                                    {formatTime(timeTracking.elapsedSeconds)}
                                  </span>
                                  <span>
                                    Yêu cầu:{" "}
                                    {
                                      currentItem.lesson
                                        .estimatedDurationMinutes
                                    }{" "}
                                    phút
                                  </span>
                                </div>

                                <Progress
                                  value={timeTracking.progress}
                                  className="w-full h-2 bg-blue-200"
                                />

                                {!timeTracking.isTimeComplete && (
                                  <p className="text-sm text-blue-600">
                                    Còn lại: {timeTracking.remainingMinutes}{" "}
                                    phút để hoàn thành bài học
                                  </p>
                                )}

                                {timeTracking.isTimeComplete && (
                                  <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                                    <Check className="h-4 w-4" />
                                    Đã học đủ thời gian yêu cầu
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          )} */}

                        {/* Lesson Completion Button */}
                        {currentLessonData.type !== LessonType.QUIZ &&
                          isEnrolled &&
                          !isInstructorOrAdmin &&
                          !isItemCompleted(currentItem) && (
                            <motion.div
                              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-1">
                                    <CheckCircle className="h-5 w-5" />
                                    Hoàn thành bài học
                                  </h3>
                                  <p className="text-sm text-green-600">
                                    Đánh dấu bài học này đã hoàn thành để mở
                                    khóa các quiz liên quan.
                                  </p>
                                </div>
                                <Button
                                  onClick={async () => {
                                    if (currentItem?.lesson?.id) {
                                      await handleLessonCompletion(
                                        currentItem.lesson.id,
                                      );
                                      await handleGoToNext();
                                    }
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                >
                                  <Check className="h-4 w-4" />
                                  Hoàn thành
                                </Button>
                              </div>
                            </motion.div>
                          )}

                        {/* Already completed indicator */}
                        {currentLessonData.type !== LessonType.QUIZ &&
                          isEnrolled &&
                          !isInstructorOrAdmin &&
                          isItemCompleted(currentItem) && (
                            <motion.div
                              className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                            >
                              <div className="flex items-center gap-2 text-emerald-700">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                                <span className="font-medium">
                                  Bài học đã hoàn thành
                                </span>
                              </div>
                            </motion.div>
                          )}

                        {/* Lesson Content */}
                        <motion.div
                          className="prose prose-lg max-w-none"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          {currentLessonData.type === LessonType.QUIZ ? (
                            // Quiz Content
                            <div className="max-w-none prose-headings:text-gray-900 prose-p:text-gray-700">
                              {enrollmentId || isInstructorOrAdmin ? (
                                <QuizSection
                                  lessonId={currentLessonData.id}
                                  enrollmentId={enrollmentId || ""}
                                  lessonTitle={currentLessonData.title}
                                  isEnrolled={isEnrolled}
                                  classId={params.classId as string}
                                  courseId={params.courseId as string}
                                  isInstructorOrAdmin={isInstructorOrAdmin}
                                  onQuizCompleted={(success: boolean) => {
                                    if (success && currentLessonData?.id) {
                                      // Khi quiz hoàn thành thành công, xử lý unlock requirements
                                      handleLessonCompletion(
                                        currentLessonData.id,
                                      );
                                    }
                                  }}
                                  onNavigateToLesson={handleNavigateToLesson}
                                  onNavigateToNextIncomplete={() => {
                                    const next = getNextAvailableItem();
                                    console.log("Next available item: ", next);
                                    if (!next) {
                                      toast({
                                        title: "Không tìm thấy mục tiếp theo",
                                        description:
                                          "Bạn đã hoàn thành tất cả các mục trong lộ trình.",
                                      });
                                      return;
                                    }

                                    // If the next item is a lesson, navigate via handleNavigateToLesson
                                    if (
                                      next.itemType ===
                                        SyllabusItemType.LESSON &&
                                      next.lesson?.id
                                    ) {
                                      handleNavigateToLesson(next.lesson.id);
                                    } else {
                                      // Otherwise set current item directly
                                      setCurrentItem(next);
                                    }
                                  }}
                                />
                              ) : (
                                <div className="flex items-center justify-center p-8">
                                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                                </div>
                              )}
                            </div>
                          ) : currentLessonData.type === LessonType.BLOG ||
                            currentLessonData.type === LessonType.MIXED ? (
                            <div>
                              {(() => {
                                let contentBlocks: Block[] = [];
                                if (
                                  currentLessonData.content &&
                                  typeof currentLessonData.content === "string"
                                ) {
                                  try {
                                    const trimmedContent =
                                      currentLessonData.content.trim();
                                    if (
                                      trimmedContent &&
                                      (trimmedContent[0] === "[" ||
                                        trimmedContent[0] === "{")
                                    ) {
                                      contentBlocks = JSON.parse(
                                        currentLessonData.content,
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Error parsing lesson content:",
                                      error,
                                    );
                                  }
                                }

                                return contentBlocks.length > 0 ? (
                                  <div className="space-y-4 mb-10">
                                    {contentBlocks.map((block, index) => (
                                      <div key={index}>
                                        {renderBlockToHtml(block)}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                    <p className="text-gray-600">
                                      Nội dung bài học đang được cập nhật...
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="bg-blue-50 p-6 rounded-lg">
                              {/* <div className="flex items-center gap-3 mb-3">
                                <Video className="h-6 w-6 text-blue-500" />
                                <h3 className="text-lg font-semibold text-blue-800">
                                  Bài học video
                                </h3>
                              </div>
                              <p className="text-blue-700">
                                Xem video bên trên để học nội dung bài học này.
                              </p> */}
                            </div>
                          )}
                        </motion.div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-lg text-center">
                        <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-gray-600">
                          Không thể tải nội dung bài học
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Live Session Content
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Video className="h-6 w-6 text-red-500" />
                        <div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                              Thời lượng:{" "}
                              {currentItem.classSession?.durationMinutes} phút
                            </span>
                            {currentItem.classSession?.scheduledAt && (
                              <span>
                                Lịch học:{" "}
                                {new Date(
                                  currentItem.classSession.scheduledAt,
                                ).toLocaleString("vi-VN")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border border-red-100">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <Users className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-1">
                              Buổi học trực tuyến
                            </h3>
                            <p className="text-gray-600 text-sm">
                              Tham gia cùng giảng viên và các học viên khác
                              trong lớp
                            </p>
                          </div>
                        </div>

                        {currentItem.classSession?.meetingDetail && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-800">
                                Thông tin buổi học:
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {currentItem.classSession.meetingDetail}
                            </p>
                          </div>
                        )}

                        {/* Time Tracking Component for Live Sessions */}
                        {/* {isEnrolled &&
                          currentItem.classSession?.durationMinutes && (
                            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-orange-800 flex items-center gap-2">
                                  <Timer className="h-5 w-5" />
                                  Thời gian tham gia buổi học
                                </h3>
                                <div className="flex items-center gap-2">
                                  {timeTracking.isActive ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={timeTracking.pause}
                                      className="text-orange-600 border-orange-300 hover:bg-orange-100"
                                    >
                                      <Pause className="h-4 w-4 mr-1" />
                                      Tạm dừng
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={timeTracking.resume}
                                      className="text-orange-600 border-orange-300 hover:bg-orange-100"
                                    >
                                      <Play className="h-4 w-4 mr-1" />
                                      Tiếp tục
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-sm text-orange-700">
                                  <span>
                                    Thời gian đã tham gia:{" "}
                                    {formatTime(timeTracking.elapsedSeconds)}
                                  </span>
                                  <span>
                                    Yêu cầu:{" "}
                                    {currentItem.classSession.durationMinutes}{" "}
                                    phút
                                  </span>
                                </div>

                                <Progress
                                  value={timeTracking.progress}
                                  className="w-full h-2 bg-orange-200"
                                />

                                {!timeTracking.isTimeComplete && (
                                  <p className="text-sm text-orange-600">
                                    Còn lại: {timeTracking.remainingMinutes}{" "}
                                    phút để hoàn thành buổi học
                                  </p>
                                )}

                                {timeTracking.isTimeComplete && (
                                  <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                                    <Check className="h-4 w-4" />
                                    Đã tham gia đủ thời gian yêu cầu
                                  </p>
                                )}
                              </div>
                            </div>
                          )} */}

                        {/* Meeting Actions */}
                        <div className="flex flex-col gap-3">
                          {/* Join Meeting Button */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              className={`font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex-1 min-h-[48px] group ${
                                currentItem.classSession?.meetingLink &&
                                currentItem.classSession?.scheduledAt &&
                                new Date(
                                  currentItem.classSession.scheduledAt,
                                ) <= new Date()
                                  ? "bg-red-500 hover:bg-red-600 text-white hover:scale-105"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                              }`}
                              onClick={handleJoinLiveSession}
                              disabled={
                                !currentItem.classSession?.meetingLink ||
                                !currentItem.classSession?.scheduledAt ||
                                new Date(currentItem.classSession.scheduledAt) >
                                  new Date()
                              }
                            >
                              <Video className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                              {!currentItem.classSession?.meetingLink
                                ? "Chưa có link tham gia"
                                : new Date(
                                      currentItem.classSession.scheduledAt ||
                                        "",
                                    ) > new Date()
                                  ? "Chưa đến giờ học"
                                  : "Tham gia buổi học"}
                              {currentItem.classSession?.meetingLink &&
                                new Date(
                                  currentItem.classSession.scheduledAt || "",
                                ) <= new Date() && (
                                  <ExternalLink className="h-4 w-4 ml-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                                )}
                            </Button>

                            {/* Meeting Status Indicator */}
                            <div
                              className={`flex items-center text-sm px-3 py-2 rounded-lg border transition-all duration-200 ${
                                currentItem.classSession?.meetingLink
                                  ? "text-green-600 bg-green-50 border-green-200"
                                  : "text-orange-600 bg-orange-50 border-orange-200"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full mr-2 ${
                                  currentItem.classSession?.meetingLink
                                    ? "bg-green-500 animate-pulse"
                                    : "bg-orange-500"
                                }`}
                              ></div>
                              <span className="whitespace-nowrap">
                                {currentItem.classSession?.meetingLink
                                  ? "Link sẵn sàng"
                                  : "Đang chuẩn bị"}
                              </span>
                            </div>
                          </div>

                          {/* Session Status Info */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2 text-blue-700">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">Thời gian</span>
                              </div>
                              <p className="text-blue-600 mt-1">
                                {currentItem.classSession?.scheduledAt
                                  ? new Date(
                                      currentItem.classSession.scheduledAt,
                                    ).toLocaleString("vi-VN")
                                  : "Chưa xác định"}
                              </p>
                            </div>

                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                              <div className="flex items-center gap-2 text-purple-700">
                                <Timer className="h-4 w-4" />
                                <span className="font-medium">Thời lượng</span>
                              </div>
                              <p className="text-purple-600 mt-1">
                                {currentItem.classSession?.durationMinutes} phút
                              </p>
                            </div>

                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                              <div className="flex items-center gap-2 text-orange-700">
                                <Users className="h-4 w-4" />
                                <span className="font-medium">Trạng thái</span>
                              </div>
                              <p className="text-orange-600 mt-1">
                                {new Date(
                                  currentItem.classSession?.scheduledAt || "",
                                ) > new Date()
                                  ? "Sắp diễn ra"
                                  : "Đang diễn ra"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Recording Video Section */}
                        {currentItem.classSession?.recordingUrl && (
                          <div className="mt-6 border-t border-gray-200 pt-6">
                            <div className="mb-4">
                              <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-2">
                                <PlayCircle className="h-6 w-6 text-blue-600" />
                                Bản ghi buổi học
                              </div>
                              <p className="text-gray-600 text-sm">
                                Xem lại nội dung buổi học đã được ghi lại
                              </p>
                            </div>

                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm">
                              <div className="relative w-full max-w-4xl mx-auto aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                                <ReactPlayer
                                  url={currentItem.classSession.recordingUrl}
                                  width="100%"
                                  height="100%"
                                  controls
                                  pip={true}
                                  stopOnUnmount={false}
                                  config={{
                                    file: {
                                      attributes: {
                                        controlsList: "nodownload",
                                        disablePictureInPicture: false,
                                      },
                                    },
                                  }}
                                  light={
                                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-900 to-purple-900 text-white">
                                      <div className="text-center">
                                        <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-80" />
                                        <h3 className="text-xl font-semibold mb-2">
                                          {currentItem.classSession?.topic}
                                        </h3>
                                        <p className="text-blue-200">
                                          Nhấn để phát video bài học
                                        </p>
                                      </div>
                                    </div>
                                  }
                                />
                              </div>

                              {/* Video Controls Info */}
                              <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <Volume2 className="h-4 w-4" />
                                    <span>Có âm thanh</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Video className="h-4 w-4" />
                                    <span>Chất lượng HD</span>
                                  </div>
                                </div>

                                <div className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                                  Bản ghi chính thức
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Nút hoàn thành buổi học */}
                        {currentItemIndex === allItems.length - 1 &&
                        hasCertificate ? (
                          <Button
                            className="mt-4 ml-4 bg-purple-600 hover:bg-purple-700"
                            onClick={() =>
                              router.push(`/certificate/${certificateId}`)
                            }
                          >
                            Xem bằng
                          </Button>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Button
                                    className={`mt-4 ml-4 transition-all duration-300 ${
                                      timeTracking.isTimeComplete
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                                    onClick={handleCompleteLiveSession}
                                    disabled={
                                      !currentProgress?.id ||
                                      !timeTracking.isTimeComplete
                                    }
                                  >
                                    {currentItemIndex === allItems.length - 1
                                      ? "Hoàn thành khóa học"
                                      : "Đánh dấu hoàn thành buổi học"}
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              {!timeTracking.isTimeComplete && (
                                <TooltipContent>
                                  <p>
                                    Bạn cần tham gia ít nhất{" "}
                                    {getCurrentItemRequiredMinutes()} phút để
                                    hoàn thành buổi học này
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Attendance System - Chỉ hiển thị cho LIVE_SESSION */}
                        <div className="mt-6">
                          <AttendanceManager
                            syllabusItemId={currentItem.id}
                            instructorId={course?.instructorId || ""}
                            isLiveSession={
                              currentItem.itemType ===
                              SyllabusItemType.LIVE_SESSION
                            }
                            sessionTopic={currentItem.classSession?.topic || ""}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-64 text-gray-500">
                <BookOpen className="h-12 w-12 mb-4" />
                <p>Chọn một mục từ lộ trình để bắt đầu học</p>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Navigation Footer */}
      {!(currentLessonData && currentLessonData.type === LessonType.QUIZ) && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t px-6 py-3 z-1"
        >
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={currentItemIndex <= 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Trước
            </Button>

            <span className="text-sm text-gray-600">
              {currentItemIndex + 1} / {allItems.length}
            </span>

            <Button
              onClick={handleGoToNext}
              disabled={currentItemIndex >= allItems.length - 1}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Tiếp theo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Sidebar toggle button */}
          <div className="absolute top-1/2 -translate-y-1/2 right-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-2"
            >
              {isSidebarOpen ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span className="hidden sm:inline">Ẩn</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Hiện</span>
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Sidebar */}
      {!(currentLessonData && currentLessonData.type === LessonType.QUIZ) && (
        <CourseSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          course={course}
          classInfo={classInfo}
          progress={progress || 0}
          syllabusData={syllabusData}
          isLoadingSyllabus={isLoadingSyllabus}
          currentItem={currentItem}
          completedItems={completedItems}
          allItems={allItems}
          isItemCompleted={isItemCompleted}
          canNavigateToItem={canNavigateToItem}
          getNextAvailableItem={getNextAvailableItem}
          onItemSelect={(item: SyllabusItem) => {
            setCurrentItem(item);
          }}
        />
      )}

      {/* Confirmation Modal for lesson completion */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-orange-500" />
              Xác nhận hoàn thành bài học
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hoàn thành bài học hiện tại và chuyển sang
              bài học tiếp theo không?
            </DialogDescription>
          </DialogHeader>

          {currentItem && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">
                Bài học hiện tại:{" "}
                {currentItem.itemType === SyllabusItemType.LESSON
                  ? currentItem.lesson?.title
                  : currentItem.classSession?.topic}
              </p>
              {pendingNavigation && (
                <p className="text-sm text-gray-600 mt-1">
                  Bài học tiếp theo:{" "}
                  {pendingNavigation.itemType === SyllabusItemType.LESSON
                    ? pendingNavigation.lesson?.title
                    : pendingNavigation.classSession?.topic}
                </p>
              )}
            </div>
          )}
          <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button variant="outline" onClick={handleCancelledNavigation}>
              Hủy
            </Button>
            <Button
              onClick={handleConfirmedNavigation}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Xác nhận hoàn thành
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chatbot - Only show for lesson items */}
      {currentItem?.itemType === SyllabusItemType.LESSON &&
        currentLessonData &&
        isEnrolled && <ClassLessonChatbot />}
    </motion.div>
  );
}
