"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Pause,
  Play,
  Timer,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";

import {
  type CertificateData,
  issueCertificate,
} from "@/actions/certificateActions";
import { getCourseById } from "@/actions/courseAction";
import { getLessonById } from "@/actions/courseAction";
import {
  checkEnrollmentStatus,
  getEnrollmentByCourse,
  getEnrollmentByCourseAndType,
  markCourseAsCompleted,
} from "@/actions/enrollmentActions";
import {
  type QuizStatus,
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

import { AttendanceManager } from "@/components/attendance";
import CourseSidebar from "@/components/course/CourseSidebar";
import QuizSection from "@/components/quiz/QuizSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// Import extracted components
import {
  ClassHeader,
  ConfirmationModal,
  InstructorPreviewBanner,
  LessonCompletionCard,
  LessonContentRenderer,
  LiveSessionCard,
  NavigationFooter,
  TimeTrackingCard,
  VideoPlayer,
  extractPlainTextFromBlockNote,
} from "./components";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const slideIn = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3 } },
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
  const [isQuizActivelyTaking, setIsQuizActivelyTaking] = useState(false);

  // Quiz statuses for filtering completed items
  const [quizStatuses, setQuizStatuses] = useState<Map<string, QuizStatus>>(
    new Map(),
  );

  // Requirement tracking states (moved from QuizSection)
  const [currentRequirementIndex, setCurrentRequirementIndex] =
    useState<number>(-1);
  const [requirementTimeSpent, setRequirementTimeSpent] = useState<number>(0);
  const [requirementTimeNeeded, setRequirementTimeNeeded] = useState<number>(0);
  const [isTrackingRequirement, setIsTrackingRequirement] = useState(false);
  const [completedRequirements, setCompletedRequirements] = useState<
    Set<string>
  >(new Set());
  const [requirementQuizLessonId, setRequirementQuizLessonId] = useState<
    string | null
  >(null);
  const requirementTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    isLessonCompleted,
    setEnrollmentId,
    setCurrentCourseId,
  } = useProgressStore();

  // Filter completed items to exclude unpassed quizzes
  const filteredCompletedItems = useMemo(() => {
    if (!completedItems || !Array.isArray(completedItems)) return [];

    return completedItems.filter((item: any) => {
      // Find the corresponding syllabus item
      const syllabusItem = syllabusData
        .flatMap((group) => group.items)
        .find((sItem) => sItem.id === item.id);

      // If it's a quiz lesson, check if it's passed
      if (
        syllabusItem?.itemType === SyllabusItemType.LESSON &&
        syllabusItem?.lesson?.type === LessonType.QUIZ &&
        syllabusItem?.lesson?.id
      ) {
        const quizStatus = quizStatuses.get(syllabusItem.lesson.id);
        if (quizStatus) {
          return quizStatus.isPassed; // Only include if quiz is passed
        }
        // If quiz status not loaded yet, exclude from completed (conservative approach)
        return false;
      }

      // For non-quiz items, include as normal
      return true;
    });
  }, [completedItems, syllabusData, quizStatuses]);

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
    if (!filteredCompletedItems || !Array.isArray(filteredCompletedItems))
      return false;
    return filteredCompletedItems.some((p: any) => p.id === item.id);
  };

  // Helper function to check if navigation to an item is allowed
  const canNavigateToItem = (targetItem: SyllabusItem) => {
    if (isInstructorOrAdmin) return true;
    const targetIndex = allItems.findIndex((item) => item.id === targetItem.id);
    const currentIndex = currentItemIndex;

    if (targetIndex <= currentIndex) return true;
    if (targetIndex === currentIndex + 1) return true;

    for (let i = currentIndex + 1; i < targetIndex; i++) {
      if (!isItemCompleted(allItems[i])) {
        return false;
      }
    }

    return true;
  };

  // Helper function to check if all items are completed
  const allItemsCompleted = useMemo(() => {
    if (!allItems.length || !filteredCompletedItems.length) return false;
    return allItems.every((item) => isItemCompleted(item));
  }, [allItems, filteredCompletedItems]);

  // Handler for certificate click
  const handleCertificateClick = useCallback(() => {
    if (certificateId) {
      router.push(`/certificate/${certificateId}`);
    } else {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin chứng chỉ",
        variant: "destructive",
      });
    }
  }, [certificateId, router]);

  // Helper function to find the next available lesson
  const getNextAvailableItem = () => {
    if (isInstructorOrAdmin) {
      return currentItemIndex + 1 < allItems.length
        ? allItems[currentItemIndex + 1]
        : null;
    }
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

  // Enhanced goToNext with lesson completion handling
  const handleGoToNext = () => {
    const nextItem = allItems[currentItemIndex + 1];
    if (!nextItem) return;

    if (!isInstructorOrAdmin) {
      if (
        currentItem?.itemType === SyllabusItemType.LESSON &&
        currentItem.lesson?.type !== LessonType.QUIZ &&
        !isItemCompleted(currentItem)
      ) {
        setPendingNavigation(nextItem);
        setIsConfirmModalOpen(true);
        return;
      }
    }

    goToNext();
  };

  // Handle confirmed navigation
  const handleConfirmedNavigation = async () => {
    if (!pendingNavigation) return;

    if (!isInstructorOrAdmin) {
      if (
        currentItem?.itemType === SyllabusItemType.LESSON &&
        currentItem.lesson?.id &&
        currentItem.lesson?.type !== LessonType.QUIZ
      ) {
        try {
          await createSyllabusProgress(currentItem?.id);
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
    }

    setCurrentItem(pendingNavigation);
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

  // Handler for course completion
  const handleCourseCompletion = async () => {
    if (isInstructorOrAdmin) {
      console.log("[PreviewMode] Skipping real course completion.");
      return;
    }

    try {
      if (!enrollmentId) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy thông tin ghi danh",
          variant: "destructive",
        });
        return;
      }

      console.log(
        "🎓 [CourseCompletion] Starting course completion process...",
      );

      const result = await markCourseAsCompleted(enrollmentId);

      if (result.success && result.data?.data) {
        const completedEnrollment = result.data.data;
        console.log(
          "✅ [CourseCompletion] Course marked as completed successfully",
        );

        // Check if certificate was already created by backend
        if (completedEnrollment.certificate) {
          console.log(
            "🏆 [Certificate] Certificate already exists from backend:",
            completedEnrollment.certificate.id,
          );
          setHasCertificate(true);
          setCertificateId(completedEnrollment.certificate.id);
          toast({
            title: "🎉 Chúc mừng!",
            description: "Bạn đã hoàn thành khóa học và nhận được chứng chỉ!",
          });
          router.push(`/certificate/${completedEnrollment.certificate.id}`);
        } else {
          // Try to issue certificate manually if not created by backend
          try {
            console.log(
              "🏆 [Certificate] Attempting to issue certificate manually...",
            );
            const certificateResult = await issueCertificate(enrollmentId);

            if (certificateResult.success && certificateResult.data) {
              console.log(
                "🎉 [Certificate] Certificate issued successfully:",
                certificateResult.data.id,
              );

              setHasCertificate(true);
              setCertificateId(certificateResult.data.id);
              toast({
                title: "🎉 Chúc mừng!",
                description:
                  "Bạn đã hoàn thành khóa học và nhận được chứng chỉ!",
              });
              router.push(`/certificate/${certificateResult.data.id}`);
            } else {
              console.warn(
                "⚠️ [Certificate] Failed to issue certificate:",
                certificateResult.message,
              );

              // Still show success for course completion even if certificate fails
              toast({
                title: "🎉 Chúc mừng!",
                description: "Bạn đã hoàn thành khóa học thành công!",
              });
              router.push(`/course/${params.courseId}`);
            }
          } catch (certError: any) {
            console.error(
              "❌ [Certificate] Certificate issuance error:",
              certError,
            );

            // Still show success for course completion
            toast({
              title: "🎉 Chúc mừng!",
              description: "Bạn đã hoàn thành khóa học thành công!",
            });
            router.push(`/course/${params.courseId}`);
          }
        }
      } else {
        throw new Error(result.message || "Không thể hoàn thành khóa học");
      }
    } catch (err: any) {
      console.error("❌ [CourseCompletion] Error completing course:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể cập nhật tiến độ học tập",
        variant: "destructive",
      });
    }
  };

  // Handler for lesson completion
  const handleLessonCompletion = async (completedLessonId: string) => {
    if (!completedLessonId) return;

    try {
      console.log(
        "Processing lesson completion for unlock requirements:",
        completedLessonId,
      );

      const quizLessons = syllabusData
        .flatMap((group) => group.items)
        .filter(
          (item) =>
            item.itemType === SyllabusItemType.LESSON &&
            item.lesson?.type === LessonType.QUIZ,
        );

      for (const quizItem of quizLessons) {
        if (!quizItem.lesson?.id) continue;

        try {
          const statusResult = await getQuizStatus(quizItem.lesson.id);
          if (statusResult.success && statusResult.data?.unlockRequirements) {
            const requirements = statusResult.data.unlockRequirements;
            const matchingRequirements = requirements.filter(
              (req: any) =>
                req.type === "WATCH_LESSON" &&
                req.targetLesson.id === completedLessonId &&
                !req.isCompleted,
            );

            for (const requirement of matchingRequirements) {
              try {
                const completeResult = await completeUnlockRequirement(
                  quizItem.lesson.id,
                  currentItem?.classId ?? "",
                  requirement.id,
                );

                if (completeResult.success) {
                  console.log(
                    `✅ Completed requirement ${requirement.id} for quiz ${quizItem.lesson.title}`,
                  );
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
    } catch (error) {
      console.error(
        "Error processing lesson completion for unlock requirements:",
        error,
      );
    }
  };

  // Handle quiz state changes
  const handleQuizStateChange = useCallback((isActivelyTaking: boolean) => {
    setIsQuizActivelyTaking(isActivelyTaking);
  }, []);

  // Handle course completion after quiz completion
  const handleQuizCourseCompletion = useCallback(async () => {
    if (isInstructorOrAdmin) {
      console.log("[PreviewMode] Skipping quiz-triggered course completion.");
      return;
    }

    if (allItems.length === completedItems.length) {
      console.log(
        "🎉 [ClassQuizCompletion] All conditions met - completing course!",
      );
      setTimeout(async () => {
        try {
          await handleCourseCompletion();
        } catch (error) {
          console.error("Error in course completion:", error);
          toast({
            title: "Có lỗi khi cấp chứng chỉ hoàn thành khóa học",
            variant: "destructive",
          });
        }
      }, 1000);
    }
  }, [
    currentItem,
    course,
    enrollmentId,
    currentLessonData,
    allItems,
    completedItems,
    handleCourseCompletion,
  ]);

  // Handler for completing a live session
  const handleCompleteLiveSession = async () => {
    if (!enrollmentId || !currentItem) return;
    const nextItem = allItems[currentItemIndex + 1];
    const isLastItem = currentItemIndex === allItems.length - 1;

    try {
      await createSyllabusProgress(currentItem?.id);

      if (isLastItem) {
        await handleCourseCompletion();
      } else {
        toast({
          title: "Đã hoàn thành buổi học!",
          description: nextItem
            ? "Chuyển sang buổi tiếp theo."
            : "Bạn đã hoàn thành tất cả buổi học!",
        });
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

    window.open(meetingLink, "_blank", "noopener,noreferrer");

    toast({
      title: "Đã mở buổi học",
      description: "Link buổi học đã được mở trong tab mới",
    });
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!params.courseId || !params.classId) return;

      try {
        setIsLoading(true);

        const courseData = await getCourseById(params.courseId as string);
        setCourse(courseData);

        setCurrentCourseId(courseData.id);

        const selectedClass = courseData.classes?.find(
          (c) => c.id === params.classId,
        );
        setClassInfo(selectedClass);

        if (user?.id) {
          const enrollmentResult = await checkEnrollmentStatus(
            user.id,
            courseData.id,
            params.classId as string,
          );
          if (enrollmentResult.success) setIsEnrolled(true);
        }

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

  // Fetch progress data
  useEffect(() => {
    if (enrollmentId && !isInstructorOrAdmin) {
      fetchInitialProgress();
    }
  }, [enrollmentId, isInstructorOrAdmin]);

  // Fetch enrollment data
  useEffect(() => {
    const fetchEnrollmentData = async () => {
      if (!user?.id || !course?.id || !params.classId) return;

      if (isInstructorOrAdmin) {
        console.log(
          "Instructor/Admin preview mode - skipping enrollment check",
        );
        setIsEnrolled(true);
        return;
      }

      try {
        useProgressStore.getState().clearProgress();

        const response = await getEnrollmentByCourseAndType(
          course.id,
          "STREAM",
          user?.id,
          params.classId as string,
        );

        if (response.success && response.data?.data) {
          const enrollmentData = response.data.data;
          setIsEnrolled(true);
          setEnrollmentId(enrollmentData.id);

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
      }
    } catch (error) {
      console.error("Error fetching syllabus:", error);
    } finally {
      setIsLoadingSyllabus(false);
    }
  };

  // Load quiz statuses for filtering completed items
  useEffect(() => {
    if (syllabusData.length === 0 || isInstructorOrAdmin) return;

    const loadQuizStatuses = async () => {
      const quizLessons = syllabusData
        .flatMap((group) => group.items)
        .filter(
          (item) =>
            item.itemType === SyllabusItemType.LESSON &&
            item.lesson?.type === LessonType.QUIZ &&
            item.lesson?.id,
        );

      if (quizLessons.length === 0) return;

      const newQuizStatuses = new Map<string, QuizStatus>();

      // Load quiz statuses in parallel
      const statusPromises = quizLessons.map(async (item) => {
        if (!item.lesson?.id) return;

        try {
          const result = await getQuizStatus(
            item.lesson.id,
            isInstructorOrAdmin,
          );
          if (result.success && result.data) {
            newQuizStatuses.set(item.lesson.id, result.data);
          }
        } catch (error) {
          console.error(
            `Failed to load quiz status for lesson ${item.lesson.id}:`,
            error,
          );
        }
      });

      await Promise.all(statusPromises);
      setQuizStatuses(newQuizStatuses);
      console.log("Loaded quiz statuses:", newQuizStatuses);
    };

    loadQuizStatuses();
  }, [syllabusData, isInstructorOrAdmin]);

  // Restore lesson from currentProgress
  useEffect(() => {
    if (syllabusData.length > 0 && !currentItem && params.classId) {
      const savedSyllabusItemId = currentProgress?.syllabusItemId;

      if (savedSyllabusItemId) {
        for (const group of syllabusData) {
          const foundItem = group.items.find(
            (item) => item.id === savedSyllabusItemId,
          );
          if (foundItem) {
            setCurrentItem(foundItem);
            return;
          }
        }
      }

      const firstGroup = syllabusData[0];
      if (firstGroup?.items?.length > 0) {
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

  // Effect to handle UI changes when currentItem changes
  useEffect(() => {
    if (
      currentItem?.itemType === SyllabusItemType.LESSON &&
      currentItem.lesson?.type === LessonType.QUIZ
    ) {
      setIsSidebarOpen(false);
    }
  }, [currentItem]);

  // Fetch lesson data when lesson item is selected
  const fetchLessonData = async (lessonId: string) => {
    try {
      setIsLoadingLesson(true);
      const lessonData = await getLessonById(lessonId);
      setCurrentLessonData(lessonData);
      return lessonData; // Return data for use in QuizSection
    } catch (error) {
      console.error("Error fetching lesson:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải nội dung bài học",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoadingLesson(false);
    }
  };

  // Effect to fetch lesson data when currentItem changes
  useEffect(() => {
    if (
      currentItem?.itemType === SyllabusItemType.LESSON &&
      currentItem.lessonId
    ) {
      fetchLessonData(currentItem.lessonId);
    } else {
      setCurrentLessonData(null);
      setTimestampedTranscript([]);
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

  // Requirement tracking effect - tracks time when viewing required lessons
  useEffect(() => {
    if (!isTrackingRequirement || !currentLessonData || isInstructorOrAdmin) {
      return;
    }

    // Only track if we're viewing the lesson we need to complete
    if (currentLessonData.id !== currentItem?.lesson?.id) {
      return;
    }

    console.log(
      "Starting requirement time tracking for lesson:",
      currentLessonData.id,
    );

    // Start timer
    requirementTimerRef.current = setInterval(() => {
      setRequirementTimeSpent((prev) => {
        const newTime = prev + 1;

        // Check if requirement is completed
        if (newTime >= requirementTimeNeeded) {
          handleRequirementCompleted();
          return requirementTimeNeeded;
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (requirementTimerRef.current) {
        clearInterval(requirementTimerRef.current);
      }
    };
  }, [
    isTrackingRequirement,
    currentLessonData,
    requirementTimeNeeded,
    currentItem,
    isInstructorOrAdmin,
  ]);

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
      const targetItem = syllabusData
        .flatMap((group) => group.items)
        .find(
          (item) =>
            item.itemType === SyllabusItemType.LESSON &&
            item.lesson?.id === targetLessonId,
        );

      if (targetItem && targetItem.id !== currentItem?.id) {
        setCurrentItem(targetItem);

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

  // Reference text for chatbot
  const referenceText = useMemo(() => {
    if (
      currentItem?.itemType !== SyllabusItemType.LESSON ||
      !currentLessonData ||
      currentLessonData.type === LessonType.QUIZ
    ) {
      return "";
    }

    let transcriptSection = "No video transcript available";

    if (timestampedTranscript.length > 0) {
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

  // Chatbot component
  const ClassLessonChatbot = usePopupChatbot({
    initialOpen: false,
    position: "bottom-right",
    referenceText,
    title: "Trợ lý học tập CogniStream AI",
    welcomeMessage: "",
    showBalloon: false,
    userName: user?.name || user?.email?.split("@")[0] || "bạn",
    courseName: course?.title,
    lessonName: currentLessonData?.title,
    lessonOrder: currentItemIndex + 1,
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
    systemPrompt: `Bạn là trợ lý AI học tập cá nhân của CogniStream...`,
  });

  // Handle requirement completion
  const handleRequirementCompleted = useCallback(async () => {
    if (requirementTimerRef.current) {
      clearInterval(requirementTimerRef.current);
      requirementTimerRef.current = null;
    }

    if (!requirementQuizLessonId || currentRequirementIndex < 0) return;

    try {
      // Get quiz status to find the completed requirement
      const { getQuizStatus } = await import("@/actions/quizAction");
      const statusResult = await getQuizStatus(
        requirementQuizLessonId,
        isInstructorOrAdmin,
      );

      if (!statusResult.success || !statusResult.data?.unlockRequirements)
        return;

      const currentReq =
        statusResult.data.unlockRequirements[currentRequirementIndex];
      if (!currentReq) return;

      // Mark requirement as completed
      setCompletedRequirements((prev) => new Set([...prev, currentReq.id]));
      setIsTrackingRequirement(false);

      console.log("Requirement completed:", currentReq);

      // Show success toast
      toast({
        title: `✅ Hoàn thành yêu cầu: ${currentReq.title || currentReq.description}`,
        description: "Bạn đã học đủ thời gian yêu cầu!",
        duration: 5000,
      });

      // Check if there are more requirements
      const nextIndex = currentRequirementIndex + 1;
      if (nextIndex < statusResult.data.unlockRequirements.length) {
        const nextReq = statusResult.data.unlockRequirements[nextIndex];

        // Show toast with option to navigate to next requirement
        toast({
          title: `📚 Yêu cầu tiếp theo: ${nextReq.title || nextReq.description}`,
          description: "Nhấn nút bên dưới để học tiếp",
          duration: 0,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (nextReq.targetLesson?.id) {
                  handleNavigateToRequirement(
                    nextIndex,
                    nextReq.targetLesson.id,
                    requirementQuizLessonId,
                  );
                }
              }}
            >
              Học tiếp
            </Button>
          ),
        });
      } else {
        // All requirements completed - navigate back to quiz
        const quizItem = allItems.find(
          (item) =>
            item.itemType === SyllabusItemType.LESSON &&
            item.lesson?.id === requirementQuizLessonId,
        );

        toast({
          title: "🎉 Hoàn thành tất cả yêu cầu!",
          description: "Bạn có thể làm lại quiz ngay bây giờ",
          duration: 5000,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (quizItem) {
                  setCurrentItem(quizItem);
                } else {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              Quay lại Quiz
            </Button>
          ),
        });
      }
    } catch (error) {
      console.error("Error completing requirement:", error);
    }
  }, [
    currentRequirementIndex,
    requirementQuizLessonId,
    isInstructorOrAdmin,
    allItems,
  ]);

  // Handler to navigate to a required lesson to unlock quiz
  const handleNavigateToLesson = (targetLessonId: string, silent = false) => {
    if (!targetLessonId) {
      if (!silent) {
        toast({
          title: "❌ Lỗi",
          description: "Không tìm thấy bài học cần học",
          variant: "destructive",
        });
      }
      return;
    }

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
      if (!silent) {
        toast({
          title: "❌ Không tìm thấy bài học",
          description: "Bài học này không có trong lộ trình của lớp",
          variant: "destructive",
        });
      }
      return;
    }

    setCurrentItem(targetItem);

    if (!silent) {
      toast({
        title: "🎯 Chuyển đến bài học",
        description: `Đang mở bài học: ${targetItem.lesson?.title || "Bài học"}`,
        duration: 3000,
      });
    }
  };

  // Handle navigation to a requirement lesson
  const handleNavigateToRequirement = useCallback(
    async (reqIndex: number, targetLessonId: string, quizLessonId: string) => {
      try {
        // Get lesson data to determine time needed
        const lessonData = await fetchLessonData(targetLessonId);

        // Set time needed (use estimatedDurationMinutes or default to 5 minutes)
        const timeNeeded = (lessonData?.estimatedDurationMinutes || 5) * 60; // Convert to seconds

        setCurrentRequirementIndex(reqIndex);
        setRequirementTimeNeeded(timeNeeded);
        setRequirementTimeSpent(0);
        setIsTrackingRequirement(true);
        setRequirementQuizLessonId(quizLessonId);

        // Navigate to the lesson
        handleNavigateToLesson(targetLessonId, true);

        // Show toast after a small delay to ensure it appears after navigation
        setTimeout(() => {
          // Get requirement info for toast
          const getRequirementInfo = async () => {
            const { getQuizStatus } = await import("@/actions/quizAction");
            const statusResult = await getQuizStatus(
              quizLessonId,
              isInstructorOrAdmin,
            );
            const requirement =
              statusResult.data?.unlockRequirements?.[reqIndex];

            toast({
              title: `📖 Bắt đầu học: ${requirement?.title || requirement?.description || "Bài học"}`,
              description: `Cần học tối thiểu ${Math.ceil(timeNeeded / 60)} phút`,
              duration: 5000,
            });
          };

          getRequirementInfo();
        }, 100);
      } catch (error) {
        console.error("Error navigating to requirement:", error);
        toast({
          title: "Lỗi",
          description: "Không thể chuyển đến bài học",
          variant: "destructive",
        });
      }
    },
    [fetchLessonData, handleNavigateToLesson, isInstructorOrAdmin],
  );

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

        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t px-6 py-3 z-1">
          <div className="flex items-center justify-center gap-4">
            <Skeleton className="h-10 w-40 rounded-md" />
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>
        </div>

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

  return (
    <motion.div
      className="w-full flex-1 flex flex-col min-h-screen relative px-1"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      {/* Instructor/Admin Preview Banner */}
      {isInstructorOrAdmin && <InstructorPreviewBanner userRole={user?.role} />}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className={`flex-1 ${
          isSidebarOpen &&
          !(
            currentLessonData &&
            currentLessonData.type === LessonType.QUIZ &&
            isQuizActivelyTaking
          )
            ? "pr-[350px]"
            : ""
        } transition-all duration-300`}
      >
        <div className="space-y-6 mx-auto">
          {/* Header */}
          <ClassHeader
            currentItemTitle={
              currentItem?.itemType === SyllabusItemType.LESSON
                ? currentItem.lesson?.title
                : currentItem?.classSession?.topic
            }
            className={classInfo?.name || ""}
            day={
              (currentItem &&
                syllabusData.find((g) =>
                  g.items.some((i) => i.id === currentItem.id),
                )?.day) ||
              undefined
            }
            courseId={params.courseId as string}
          />

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
                  // Lesson Content
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
                          <VideoPlayer
                            videoUrl={currentLessonData.videoUrl}
                            title={currentLessonData.title}
                          />
                        )}

                        {/* Lesson Completion Card */}
                        {currentLessonData.type !== LessonType.QUIZ &&
                          isEnrolled &&
                          !isInstructorOrAdmin && (
                            <LessonCompletionCard
                              isCompleted={isItemCompleted(currentItem)}
                              onComplete={async () => {
                                if (currentItem?.lesson?.id) {
                                  await handleLessonCompletion(
                                    currentItem.lesson.id,
                                  );
                                  await handleGoToNext();
                                }
                              }}
                            />
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
                                    if (success) {
                                      console.log(
                                        "Quiz completed successfully",
                                      );
                                    }
                                  }}
                                  onNavigateToLesson={(lessonId) =>
                                    handleNavigateToLesson(lessonId, true)
                                  }
                                  onNavigateToNextIncomplete={() => {
                                    const nextIncompleteItem = allItems.find(
                                      (item, index) =>
                                        index > currentItemIndex &&
                                        !isItemCompleted(item),
                                    );
                                    if (nextIncompleteItem) {
                                      setCurrentItem(nextIncompleteItem);
                                      toast({
                                        title: "🎯 Chuyển đến mục tiếp theo",
                                        description: `Đang mở: ${
                                          nextIncompleteItem.itemType ===
                                          SyllabusItemType.LESSON
                                            ? nextIncompleteItem.lesson?.title
                                            : nextIncompleteItem.classSession
                                                ?.topic
                                        }`,
                                        duration: 3000,
                                      });
                                    } else {
                                      toast({
                                        title: "🎉 Hoàn thành!",
                                        description:
                                          "Bạn đã hoàn thành tất cả nội dung của lớp học",
                                        duration: 5000,
                                      });
                                    }
                                  }}
                                  onQuizStateChange={handleQuizStateChange}
                                  onCourseCompletion={
                                    handleQuizCourseCompletion
                                  }
                                  currentLessonData={currentLessonData}
                                  onGetLessonData={fetchLessonData}
                                  onNavigateToRequirement={
                                    handleNavigateToRequirement
                                  }
                                  requirementTrackingState={{
                                    isTrackingRequirement,
                                    requirementTimeSpent,
                                    requirementTimeNeeded,
                                    currentRequirementIndex,
                                    completedRequirements,
                                  }}
                                />
                              ) : (
                                <div className="flex items-center justify-center p-8">
                                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                                </div>
                              )}
                            </div>
                          ) : currentLessonData.type === LessonType.BLOG ||
                            currentLessonData.type === LessonType.MIXED ||
                            currentLessonData.type === LessonType.VIDEO ? (
                            <div>
                              {(() => {
                                let contentBlocks: any[] = [];
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
                                    <LessonContentRenderer
                                      content={contentBlocks}
                                    />
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
                              <div className="text-center">
                                <BookOpen className="h-12 w-12 mx-auto mb-3 text-blue-400" />
                                <h3 className="text-lg font-medium text-blue-900 mb-2">
                                  Loại bài học không được hỗ trợ
                                </h3>
                                <p className="text-blue-700">
                                  Loại bài học này chưa được hỗ trợ trong hệ
                                  thống.
                                </p>
                              </div>
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
                  <LiveSessionCard
                    classSession={currentItem.classSession!}
                    instructorId={course?.instructorId || ""}
                    syllabusItemId={currentItem.id}
                    currentItemIndex={currentItemIndex}
                    totalItems={allItems.length}
                    isLast={currentItemIndex === allItems.length - 1}
                    hasCertificate={hasCertificate}
                    certificateId={certificateId || undefined}
                    onJoinSession={handleJoinLiveSession}
                    onCompleteSession={handleCompleteLiveSession}
                    onViewCertificate={() => {
                      if (certificateId) {
                        router.push(`/certificate/${certificateId}`);
                      }
                    }}
                  />
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
      <NavigationFooter
        currentIndex={currentItemIndex}
        totalItems={allItems.length}
        canGoPrevious={currentItemIndex > 0}
        canGoNext={currentItemIndex < allItems.length - 1}
        isSidebarOpen={isSidebarOpen}
        onPrevious={goToPrevious}
        onNext={handleGoToNext}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isVisible={
          !(
            currentLessonData &&
            currentLessonData.type === LessonType.QUIZ &&
            isQuizActivelyTaking
          )
        }
        // Certificate props
        hasCertificate={hasCertificate}
        certificateId={certificateId}
        onCertificateClick={handleCertificateClick}
        allItemsCompleted={allItemsCompleted}
      />

      {/* Sidebar */}
      {!(
        currentLessonData &&
        currentLessonData.type === LessonType.QUIZ &&
        isQuizActivelyTaking
      ) && (
        <CourseSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          course={course}
          classInfo={classInfo}
          progress={progress || 0}
          syllabusData={syllabusData}
          isLoadingSyllabus={isLoadingSyllabus}
          currentItem={currentItem}
          completedItems={filteredCompletedItems}
          allItems={allItems}
          isItemCompleted={isItemCompleted}
          canNavigateToItem={canNavigateToItem}
          getNextAvailableItem={getNextAvailableItem}
          onItemSelect={(item: SyllabusItem) => {
            setCurrentItem(item);
          }}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCancelledNavigation}
        onConfirm={handleConfirmedNavigation}
        currentItem={currentItem}
        pendingNavigation={pendingNavigation}
      />

      {/* Chatbot */}
      {currentItem?.itemType === SyllabusItemType.LESSON &&
        currentLessonData &&
        currentLessonData.type !== LessonType.QUIZ &&
        isEnrolled && <ClassLessonChatbot />}
    </motion.div>
  );
}
