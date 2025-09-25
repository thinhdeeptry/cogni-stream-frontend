"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { toast } from "@/hooks/use-toast";
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
  Eye,
  EyeOff,
  Info,
  Loader2,
  Menu,
  Pause,
  Play,
  Timer,
  Users,
  Video,
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

import { useProgressStore } from "@/stores/useProgressStore";
import useUserStore from "@/stores/useUserStore";

import AttendanceChecker from "@/components/attendance/AttendanceChecker";
import AttendanceManager from "@/components/attendance/AttendanceManager";
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
    if (enrollmentId) {
      fetchInitialProgress();
    }
  }, [enrollmentId]);
  // Fetch enrollment data to check certificate status and set enrollmentId for progress
  useEffect(() => {
    const fetchEnrollmentData = async () => {
      if (!user?.id || !course?.id || !params.classId) return;

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
          // Set enrollmentId vào progress store
          setEnrollmentId(enrollmentData.id);

          // Kiểm tra xem có certificate không
          if (enrollmentData.certificate) {
            setHasCertificate(true);
            setCertificateId(enrollmentData.certificate.id);
          }
        }
      } catch (err) {
        console.error("Error fetching enrollment data:", err);
      }
    };

    fetchEnrollmentData();
  }, [
    user?.id,
    course?.id,
    params.classId,
    setEnrollmentId,
    fetchInitialProgress,
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
      if (savedSyllabusItemId) {
        // Tìm syllabus item theo syllabusItemId từ currentProgress
        for (const group of syllabusData) {
          const foundItem = group.items.find(
            (item) => item.id === savedSyllabusItemId,
          );
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
    }
  }, [currentItem]);

  // Time tracking effects
  useEffect(() => {
    // Reset and start tracking when currentItem changes
    if (currentItem && isEnrolled) {
      timeTracking.reset();
      timeTracking.start();
    }

    return () => {
      if (timeTracking.isActive) {
        timeTracking.pause();
      }
    };
  }, [currentItem?.id, isEnrolled]);

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
                const completeResult = await completeUnlockRequirement(
                  quizItem.lesson.id,
                  requirement.id, // Sử dụng đúng requirement ID
                  {
                    completedLessonId: completedLessonId,
                    completedAt: new Date().toISOString(),
                    progress: 100,
                  },
                );

                if (completeResult.success) {
                  console.log(
                    `✅ Completed requirement ${requirement.id} for quiz ${quizItem.lesson.title}`,
                  );
                  totalRequirementsProcessed++;

                  // Thử unlock quiz
                  const unlockResult = await unlockQuiz(quizItem.lesson.id);
                  if (unlockResult.success) {
                    successfulUnlocks.push({
                      lessonId: quizItem.lesson.id,
                      lessonTitle: quizItem.lesson.title,
                    });
                  }
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
                            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
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
                          isItemCompleted(currentItem) && (
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
                              <QuizSection
                                lessonId={currentLessonData.id}
                                lessonTitle={currentLessonData.title}
                                isEnrolled={isEnrolled}
                                classId={params.classId as string}
                                courseId={params.courseId as string}
                                onQuizCompleted={(success: boolean) => {
                                  if (success && currentLessonData?.id) {
                                    // Khi quiz hoàn thành thành công, xử lý unlock requirements
                                    handleLessonCompletion(
                                      currentLessonData.id,
                                    );
                                  }
                                }}
                              />
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
                                  <div className="space-y-4">
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
                              <div className="flex items-center gap-3 mb-3">
                                <Video className="h-6 w-6 text-blue-500" />
                                <h3 className="text-lg font-semibold text-blue-800">
                                  Bài học video
                                </h3>
                              </div>
                              <p className="text-blue-700">
                                Xem video bên trên để học nội dung bài học này.
                              </p>
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
                          <h2 className="text-xl font-semibold text-gray-800">
                            {currentItem.classSession?.topic}
                          </h2>
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

                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-gray-700 mb-4">
                          Buổi học trực tuyến - Tham gia cùng giảng viên và học
                          viên khác.
                        </p>

                        {currentItem.classSession?.meetingDetail && (
                          <div className="bg-white p-3 rounded border">
                            <p className="text-sm font-medium text-gray-800 mb-1">
                              Thông tin buổi học:
                            </p>
                            <p className="text-sm text-gray-600">
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

                        <Button
                          className="mt-4 bg-red-500 hover:bg-red-600"
                          disabled={
                            !currentItem.classSession?.scheduledAt ||
                            new Date(currentItem.classSession.scheduledAt) >
                              new Date()
                          }
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Tham gia buổi học
                        </Button>
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
                        {user?.role === "INSTRUCTOR" ? (
                          // Giao diện cho giảng viên
                          <div className="mt-6">
                            <AttendanceManager
                              syllabusItemId={currentItem.id}
                              instructorId={user.id}
                              isLiveSession={true}
                              sessionTopic={
                                currentItem.classSession?.topic ||
                                "Buổi học live"
                              }
                            />
                          </div>
                        ) : enrollmentId ? (
                          // Giao diện cho học viên
                          <div className="mt-6">
                            <AttendanceChecker
                              syllabusItemId={currentItem.id}
                              enrollmentId={enrollmentId}
                              isLiveSession={true}
                              sessionTopic={
                                currentItem.classSession?.topic ||
                                "Buổi học live"
                              }
                              attendanceEnabled={
                                currentItem.attendanceEnabled || false
                              }
                            />
                          </div>
                        ) : null}
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
        <div
          className={`fixed right-0 top-0 h-[calc(100vh-73px)] w-[350px] bg-gray-50 border-l transform transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-800 truncate">
                  {course?.title}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Class Information */}
              {classInfo && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      {classInfo.name}
                    </span>
                  </div>
                  <div className="text-xs text-orange-600">
                    {formatDate(classInfo.startDate)}
                  </div>
                </div>
              )}

              {/* Progress Display */}
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">
                    Tiến độ học tập
                  </span>
                  <span className="text-sm text-blue-600">
                    {Math.round(progress || 0)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress || 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Syllabus Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-orange-500" />
                  Lộ trình học tập
                </h3>

                {isLoadingSyllabus ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {syllabusData.map((group) => (
                      <div key={group.day} className="space-y-2">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Ngày {group.day}
                        </div>
                        {group.items.map((item) => {
                          const isCompleted = isItemCompleted(item);
                          return (
                            <Card
                              key={item.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                currentItem?.id === item.id
                                  ? "ring-2 ring-orange-500 bg-orange-50"
                                  : "hover:bg-gray-50"
                              }`}
                              onClick={() => {
                                // Check if navigation to this item is allowed
                                if (!canNavigateToItem(item)) {
                                  const targetIndex = allItems.findIndex(
                                    (i) => i.id === item.id,
                                  );
                                  const nextAvailable = getNextAvailableItem();

                                  toast({
                                    title: "❌ Không thể bỏ qua bài học",
                                    description: nextAvailable
                                      ? `Bạn cần hoàn thành các bài học trước đó. Bài học tiếp theo: "${
                                          nextAvailable.itemType ===
                                          SyllabusItemType.LESSON
                                            ? nextAvailable.lesson?.title
                                            : nextAvailable.classSession?.topic
                                        }"`
                                      : "Bạn cần hoàn thành tất cả các bài học trước đó.",
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                setCurrentItem(item);
                                // Progress is automatically tracked when lesson changes
                              }}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex-shrink-0 flex items-center gap-2">
                                    {item.itemType ===
                                    SyllabusItemType.LESSON ? (
                                      <BookOpen className="h-4 w-4 text-blue-500" />
                                    ) : (
                                      <Video className="h-4 w-4 text-red-500" />
                                    )}
                                    {isLessonCompleted && (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-sm font-medium truncate ${
                                        isCompleted
                                          ? "text-green-700"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      {item.itemType === SyllabusItemType.LESSON
                                        ? item.lesson?.title
                                        : item.classSession?.topic}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge
                                        variant="secondary"
                                        className={`text-xs ${
                                          isCompleted
                                            ? "bg-green-100 text-green-700"
                                            : ""
                                        }`}
                                      >
                                        {item.itemType ===
                                        SyllabusItemType.LESSON
                                          ? "Bài học"
                                          : "Buổi học"}
                                      </Badge>
                                      {isCompleted && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs bg-green-100 text-green-700"
                                        >
                                          Đã hoàn thành
                                        </Badge>
                                      )}
                                      {item.itemType ===
                                        SyllabusItemType.LIVE_SESSION &&
                                        item.classSession && (
                                          <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Clock className="h-3 w-3" />
                                            <span>
                                              {
                                                item.classSession
                                                  .durationMinutes
                                              }{" "}
                                              phút
                                            </span>
                                          </div>
                                        )}
                                      {item.itemType ===
                                        SyllabusItemType.LESSON &&
                                        item.lesson && (
                                          <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Clock className="h-3 w-3" />
                                            <span>
                                              {
                                                item.lesson
                                                  .estimatedDurationMinutes
                                              }{" "}
                                              phút
                                            </span>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
    </motion.div>
  );
}
