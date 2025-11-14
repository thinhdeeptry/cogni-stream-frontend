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
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { getCourseById, getLessonById } from "@/actions/courseAction";
import { getThreadByResourceId } from "@/actions/discussion.action";
import {
  checkEnrollmentStatus,
  createCertificate,
  getEnrollmentByCourse,
  markCourseAsCompleted,
} from "@/actions/enrollmentActions";
import {
  createStudentProgress,
  getCompletedItems,
} from "@/actions/progressActions";
import { getYoutubeTranscript } from "@/actions/youtubeTranscript.action";

import { useProgressStore } from "@/stores/useProgressStore";
import useUserStore from "@/stores/useUserStore";

import { extractPlainTextFromBlockNote } from "@/utils/blocknote";

import { LessonContent } from "@/components/lesson/LessonContent";
// Import new components
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { LessonNavigationBar } from "@/components/lesson/LessonNavigationBar";
import { LessonSidebar } from "@/components/lesson/LessonSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mặc định đóng trên mobile
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
  const [isQuizActivelyTaking, setIsQuizActivelyTaking] = useState(false); // Track if user is actively taking quiz

  // console.log("🔍 Component render - Current states:", {
  //   isButtonEnabled,
  //   forceRender,
  //   timeCompleteNotified,
  // });

  const { user } = useUserStore();
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  // Helper function để kiểm tra xem user có phải là instructor/admin của khóa học này không
  const isInstructorOrAdmin = useMemo(() => {
    if (user?.role === "ADMIN") return true;
    return user?.id === course?.instructorId;
  }, [user?.id, user?.role, course?.instructorId]);

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
    const requiredMinutes = lesson?.estimatedDurationMinutes || 5;
    // console.log("Hoàn thành thời gian tracking:", {
    //   "Thời gian yêu cầu": `${requiredMinutes} phút`,
    //   "Đã thông báo trước đó": timeCompleteNotified ? "chưa" : "rồi",
    //   "Lesson ID": (params.lessonId as string)?.substring(0, 8) + "...",
    // });

    if (!timeCompleteNotified) {
      setTimeCompleteNotified(true);
      setForceRender((prev) => prev + 1); // Force re-render
    } else {
      // console.log("⏭️ [TimeComplete] Đã thông báo rồi - bỏ qua");
    }
  }, [lesson?.estimatedDurationMinutes, timeCompleteNotified, params.lessonId]);

  // Time tracking state - Moved after params declaration
  const timeTracking = useTimeTracking({
    itemId: lesson ? `lesson-${params.lessonId}` : "",
    requiredMinutes: lesson?.estimatedDurationMinutes || 5,
    onTimeComplete: handleTimeComplete,
  });
  // Debug time tracking state
  useEffect(() => {
    const requiredMinutes = lesson?.estimatedDurationMinutes || 5;
    const elapsedMinutes = Math.floor(timeTracking.elapsedSeconds / 60);
    const remainingSeconds = timeTracking.elapsedSeconds % 60;

    // console.log("Chi tiết thời gian:", {
    //   "Yêu cầu": requiredMinutes,
    //   "Đã học": `${elapsedMinutes}p${remainingSeconds}s(${timeTracking.elapsedSeconds}total)`,
    //   "Tiến độ": `${timeTracking.progress.toFixed(1)}%`,
    //   "Đã hoàn thành": timeTracking.isTimeComplete ? "ok" : "no",
    //   "Đang tracking": timeTracking.isActive ? "ok" : "no",
    // });
  }, [
    timeTracking.isTimeComplete,
    timeTracking.elapsedSeconds,
    timeTracking.isActive,
    timeTracking.progress,
    lesson?.estimatedDurationMinutes,
  ]);

  // Force re-render when time tracking completes
  useEffect(() => {
    if (timeTracking.isTimeComplete) {
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
        "Synced completed lessons from store:",
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

    // Update time complete notification status
    if (timeTracking.isTimeComplete && !timeCompleteNotified) {
      setTimeCompleteNotified(true);
    }

    // Force re-render để đảm bảo UI update
    if (shouldEnable !== isButtonEnabled) {
      setForceRender((prev) => prev + 1);
    }
  }, [
    timeTracking.isTimeComplete,
    timeTracking.elapsedSeconds,
    completedLessonIds,
    params.lessonId,
    isButtonEnabled,
    timeCompleteNotified,
    lesson?.estimatedDurationMinutes,
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

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // Mobile: sidebar should be closed by default
        setIsSidebarOpen(false);
      } else {
        // Desktop: sidebar should be open by default (unless it's a quiz or quiz is actively being taken)
        if (lesson?.type !== LessonType.QUIZ && !isQuizActivelyTaking) {
          setIsSidebarOpen(true);
        } else if (lesson?.type === LessonType.QUIZ || isQuizActivelyTaking) {
          // Force close sidebar when taking quiz for better focus
          setIsSidebarOpen(false);
        }
      }
    };

    // Set initial state based on screen size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [lesson?.type, isQuizActivelyTaking]);

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

        // If user is instructor or admin, skip enrollment check and enable preview mode
        if (isInstructorOrAdmin) {
          console.log(
            "Instructor/Admin preview mode - skipping enrollment check",
          );
          setIsEnrolled(true); // Enable preview mode
          return;
        }

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
  }, [course?.id, session?.user?.id, isInstructorOrAdmin]);

  // Memoize the reference text to prevent unnecessary re-renders
  const referenceText = useMemo(() => {
    let content = `Course Title: ${course?.title}\nLesson Title: ${lesson?.title}\nLesson Type: ${lesson?.type}\n\n`;

    // Handle different lesson types with enhanced content extraction
    switch (lesson?.type) {
      case LessonType.VIDEO:
      case LessonType.MIXED:
        // For video lessons, prioritize transcript content
        if (timestampedTranscript.length > 0) {
          const hasValidTimestamps = timestampedTranscript.some(
            (item) => item.timestamp !== "0:00",
          );

          if (hasValidTimestamps) {
            content += `Video Transcript/Subtitles with Timestamps:\n${timestampedTranscript
              .map((item) => `[${item.timestamp}] ${item.text}`)
              .join("\n")}\n\n`;
          } else {
            content += `Video Transcript/Subtitles:\n${timestampedTranscript
              .map((item, index) => `[Part ${index + 1}] ${item.text}`)
              .join("\n")}\n\n`;
          }
        } else {
          content += `Video URL: ${lesson?.videoUrl || "Not available"}\n`;
          content += `Note: Video transcript and subtitles are not available for this lesson. AI should inform users that detailed video content cannot be analyzed, but can provide general guidance based on lesson title and any written content.\n\n`;
        }

        // Add written content for MIXED type
        if (lesson.type === LessonType.MIXED && lesson?.content) {
          const plainContent = extractPlainTextFromBlockNote(lesson.content);
          if (plainContent && plainContent !== "No content available") {
            content += `Written Content:\n${plainContent}\n\n`;
          }
        }
        break;

      case LessonType.BLOG:
        // For blog/reading lessons, extract and structure the written content
        if (lesson?.content) {
          const plainContent = extractPlainTextFromBlockNote(lesson.content);
          if (plainContent && plainContent !== "No content available") {
            content += `Reading Content:\n${plainContent}\n\n`;
            content += `Note: This is a reading lesson with structured content. AI can help explain concepts, provide examples, and answer questions about the material.\n\n`;
          } else {
            content += `Note: This reading lesson content could not be extracted. AI should provide general educational support based on lesson title.\n\n`;
          }
        } else {
          content += `Note: No written content available for this reading lesson.\n\n`;
        }
        break;

      case LessonType.QUIZ:
        // For quiz lessons, provide context but avoid revealing answers
        content += `QUIZ LESSON - SPECIAL INSTRUCTIONS:\n`;
        content += `- This is a quiz/assessment lesson\n`;
        content += `- DO NOT provide direct answers to quiz questions\n`;
        content += `- Help with understanding concepts but encourage thinking\n`;
        content += `- Can provide study tips and general explanations\n`;
        content += `- Can help clarify question meanings if student is confused\n`;
        content += `- Should motivate and guide learning process\n\n`;
        break;

      default:
        // Fallback for unknown lesson types
        if (lesson?.content) {
          const plainContent = extractPlainTextFromBlockNote(lesson.content);
          content += `Lesson Content:\n${plainContent || "No content available"}\n\n`;
        }
    }

    // Add estimated duration for time management tips
    if (lesson?.estimatedDurationMinutes) {
      content += `Estimated Study Time: ${lesson.estimatedDurationMinutes} minutes\n\n`;
    }

    return content;
  }, [
    course?.title,
    lesson?.title,
    lesson?.content,
    lesson?.type,
    lesson?.videoUrl,
    lesson?.estimatedDurationMinutes,
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

2. NGUỒN THÔNG TIN VÀ LOẠI BÀI HỌC
- Phân tích và sử dụng chính xác nội dung từ reference text (bài học) được cung cấp
- **BÀI HỌC VIDEO**: Nếu có transcript/subtitles, hãy tham chiếu cụ thể đến timestamp. Nếu không có transcript/subtitles, thông báo rằng không thể phân tích chi tiết nội dung video và đưa ra hướng dẫn chung
- **BÀI ĐỌC/BLOG**: Phân tích và giải thích từng phần của nội dung văn bản, tạo summary, và đưa ra câu hỏi ôn tập
- **BÀI QUIZ**: ⚠️ TUYỆT ĐỐI không đưa ra đáp án trực tiếp! Chỉ giải thích khái niệm, gợi ý cách tư duy, và khuyến khích học sinh tự suy nghĩ
- Nếu câu hỏi nằm ngoài phạm vi bài học, hãy nói rõ và cung cấp kiến thức nền tảng

3. HỖ TRỢ HỌC TẬP THEO LOẠI BÀI
- **Video không có transcript/subtitles**: "Mình không thể xem chi tiết video này, nhưng dựa trên tiêu đề bài học, mình có thể hỗ trợ bạn về [topic]. Bạn có thể mô tả phần nào trong video mà bạn cần hỗ trợ không?"
- **Bài đọc**: Giúp phân tích cấu trúc, tóm tắt từng phần, tạo mindmap khái niệm
- **Quiz**: "Đây là bài kiểm tra, mình sẽ không đưa đáp án nhưng có thể giúp bạn hiểu khái niệm. Bạn nghĩ câu này đang hỏi về điều gì?"
- Điều chỉnh độ phức tạp của câu trả lời phù hợp với ngữ cảnh

4. PHƯƠNG PHÁP HỖ TRỢ THÔNG MINH
- Khi video không có transcript/subtitles: Yêu cầu học sinh mô tả nội dung hoặc câu hỏi cụ thể từ video
- Đối với quiz: Sử dụng phương pháp Socratic questioning để dẫn dắt tư duy
- Khuyến khích ghi chú, tóm tắt, và tạo câu hỏi ôn tập
- Đưa ra gợi ý học tập hiệu quả cho từng loại bài học

5. ĐỊNH DẠNG
- Sử dụng Markdown để định dạng câu trả lời và đảm bảo dễ đọc
- Dùng đậm, in nghiêng và danh sách để làm nổi bật điểm quan trọng
- Đảm bảo thuật ngữ kỹ thuật được giải thích rõ ràng

Reference text chứa thông tin về khóa học, bài học và nội dung. Hãy sử dụng thông tin này khi trả lời và luôn chú ý đến loại bài học để đưa ra hỗ trợ phù hợp.`,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Reset states when lesson changes
        setTimeCompleteNotified(false);
        setForceRender(0);

        // Auto close sidebar on mobile when lesson changes
        if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
        }

        // KHÔNG XÓA time tracking data khi chuyển bài học
        // Time tracking hook sẽ tự động load data từ localStorage
        // và tiếp tục từ thời gian đã lưu
        const currentLessonId = params.lessonId as string;
        const isCurrentLessonCompleted =
          completedLessonIds.includes(currentLessonId);

        // console.log("📚 [LessonChange] Switching to lesson:", {
        //   lessonId: currentLessonId,
        //   isCompleted: isCurrentLessonCompleted,
        //   action: "Keeping time tracking data intact"
        // });

        const [courseData, lessonData] = await Promise.all([
          getCourseById(params.courseId as string),
          getLessonById(params.lessonId as string),
        ]);
        setCourse(courseData);
        setLesson(lessonData);
        if (lessonData?.lessonType === LessonType.QUIZ) {
          setIsSidebarOpen(true);
        }
        if (lessonData?.videoUrl) {
          try {
            // Use the improved server action to fetch the transcript/subtitles
            const result = await getYoutubeTranscript(lessonData.videoUrl);

            if ("error" in result) {
              console.warn(
                `Transcript/Subtitle fetch failed: ${result.error}`,
                result.details,
              );
              setTimestampedTranscript([]);
            } else {
              setTimestampedTranscript(result.timestampedTranscript);
              console.log("Transcript/Subtitles fetched successfully:", {
                totalItems: result.timestampedTranscript.length,
                videoId: result.videoId,
                source: result.source || "transcript",
                hasTimestamps: result.timestampedTranscript.some(
                  (item) => item.timestamp !== "0:00",
                ),
              });
            }
          } catch (error) {
            console.error("Error fetching transcript/subtitles:", error);
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
  // Add new useEffect for fetching enrollment ID
  useEffect(() => {
    const fetchEnrollmentId = async () => {
      if (session?.user?.id && course?.id) {
        // If user is instructor or admin, skip enrollment and progress tracking
        if (isInstructorOrAdmin) {
          console.log(
            "Instructor/Admin preview mode - skipping enrollment and progress tracking",
          );
          return;
        }

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
            console.log("Fetched enrollment ID:", response.data.data.id);
            // Kiểm tra xem có certificate không
            if (response.data.data.certificate) {
              setHasCertificate(true);
              setCertificateId(response.data.data.certificate.id);
            } else {
              setHasCertificate(false);
              setCertificateId(null);
            }

            // Fetch initial progress
            await fetchInitialProgress();

            // Try to get completed lessons from progress store first
            const currentStore = useProgressStore.getState();
            let completedIds = currentStore.completedLessonIds || [];

            // If store doesn't have completedLessonIds, try API call as fallback
            if (completedIds.length === 0) {
              try {
                console.log(
                  "Calling completed items API for enrollment:",
                  response.data.data.id,
                );
                const completedItemsResponse = await getCompletedItems(
                  response.data.data.id,
                );

                console.log(
                  "Completed items API response:",
                  completedItemsResponse,
                );

                if (
                  completedItemsResponse.success &&
                  completedItemsResponse.data?.data?.completedItems
                ) {
                  completedIds = completedItemsResponse.data.data.completedItems
                    .filter((item: any) => item.lessonId || item.lesson?.id)
                    .map((item: any) => item.lessonId || item.lesson?.id)
                    .filter(Boolean);

                  console.log(
                    "Fetched completed lesson IDs from backend API:",
                    completedIds,
                  );
                } else {
                  console.log(
                    "No completedItems in API response or request failed:",
                    completedItemsResponse.message,
                  );
                }
              } catch (completedError: any) {
                console.log(
                  "Could not fetch completed items from API:",
                  completedError.message || completedError,
                );
                console.log("Will use progress-based fallback logic...");
              }
            } else {
              console.log(
                "Using completed lessons from progress store:",
                completedIds,
              );
            }

            // Final fallback: generate from progress percentage
            if (
              completedIds.length === 0 &&
              course?.chapters &&
              currentStore.progress > 0
            ) {
              console.log("Using progress percentage fallback logic");
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

              console.log("Generated completed lesson IDs from progress:", {
                progressPercentage,
                totalLessons,
                completedLessonsCount,
                completedIds,
              });
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
    isInstructorOrAdmin,
  ]);

  // New state for video loading
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  // Auto start time tracking when lesson loads and user is enrolled
  useEffect(() => {
    const currentLessonId = params.lessonId as string;
    const isCurrentLessonCompleted =
      completedLessonIds.includes(currentLessonId);

    // console.log("⏰ [AutoStart] Kiểm tra điều kiện auto-start:", {
    //   "Có lesson": !!lesson,
    //   "Đã enrolled": isEnrolled,
    //   "Là bài miễn phí": lesson?.isFreePreview ? "✅" : "❌",
    //   "Bài học đã hoàn thành": isCurrentLessonCompleted ? "✅" : "❌",
    //   "ID bài học": currentLessonId,
    //   "Tracking đang active": timeTracking.isActive ? "✅" : "❌",
    //   "Thời gian đã track": `${Math.floor(timeTracking.elapsedSeconds / 60)}:${(timeTracking.elapsedSeconds % 60).toString().padStart(2, "0")}`,
    // });

    // Start/Resume tracking if lesson is not completed yet (regardless of free preview status for enrolled users)
    if (lesson && isEnrolled && !isCurrentLessonCompleted) {
      // Nếu chưa tracking và chưa hoàn thành thời gian required
      if (!timeTracking.isActive && !timeTracking.isTimeComplete) {
        console.log("Bắt đầu/tiếp tục tracking cho bài chưa hoàn thành");
        timeTracking.start();
      } else if (timeTracking.isTimeComplete && !timeCompleteNotified) {
        console.log("Thời gian đã đủ nhưng chưa thông báo - update state");
        setTimeCompleteNotified(true);
        setForceRender((prev) => prev + 1);
      }
    } else if (isCurrentLessonCompleted) {
      console.log("Bài đã hoàn thành - không cần tracking");
      // Stop tracking if it's currently active
      if (timeTracking.isActive) {
        timeTracking.pause();
      }
    } else {
      console.log("Không đủ điều kiện để bắt đầu tracking - Lý do:", {
        "Không có lesson": !lesson,
        "Chưa enrolled": !isEnrolled,
        "Bài đã hoàn thành": isCurrentLessonCompleted,
      });
    }

    return () => {
      // Chỉ pause tracking khi component unmount, KHÔNG reset
      if (timeTracking.isActive) {
        console.log("");
        timeTracking.pause();
      }
    };
  }, [
    lesson,
    isEnrolled,
    completedLessonIds,
    params.lessonId,
    timeTracking.isTimeComplete,
    timeCompleteNotified,
  ]);

  // Handle page visibility to pause/resume tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentLessonId = params.lessonId as string;
      const isCurrentLessonCompleted =
        completedLessonIds.includes(currentLessonId);

      if (document.hidden) {
        // Tạm dừng tracking khi không nhìn thấy trang
        if (timeTracking.isActive) {
          console.log("Tạm dừng tracking - trang ẩn");
          timeTracking.pause();
        }
      } else {
        // Tiếp tục tracking khi trang hiển thị lại
        // Chỉ resume nếu lesson chưa hoàn thành và user đã enrolled
        if (
          lesson &&
          isEnrolled &&
          !isCurrentLessonCompleted &&
          !timeTracking.isActive &&
          !timeTracking.isTimeComplete
        ) {
          console.log("Tiếp tục tracking - trang hiển thị lại");
          timeTracking.resume();
        } else {
          console.log("Không tiếp tục tracking - Lý do:", {
            "Không có lesson": !lesson,
            "Chưa enrolled": !isEnrolled,
            "Bài đã hoàn thành": isCurrentLessonCompleted,
            "Tracking đã active": timeTracking.isActive,
            "Thời gian đã đủ": timeTracking.isTimeComplete,
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    timeTracking.isActive,
    timeTracking.isTimeComplete,
    lesson,
    isEnrolled,
    completedLessonIds,
    params.lessonId,
  ]);

  // Handle quiz state changes
  const handleQuizStateChange = useCallback((isActivelyTaking: boolean) => {
    setIsQuizActivelyTaking(isActivelyTaking);
  }, []);

  // Auto close sidebar when quiz is actively being taken
  useEffect(() => {
    if (isQuizActivelyTaking) {
      setIsSidebarOpen(false);
    } else if (lesson?.type !== LessonType.QUIZ && window.innerWidth >= 768) {
      // Reopen sidebar when quiz is finished (only on desktop)
      setIsSidebarOpen(true);
    }
  }, [isQuizActivelyTaking, lesson?.type]);
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
  // Trong component, thêm đoạn code để lấy thông tin người tạo khóa học
  // const { otherUserData: instructorData } = useOtherUser(course?.ownerId);

  // Thêm hàm xử lý hoàn thành khóa học (gọi API backend và chuyển hướng chứng chỉ)
  // Handle lesson completion and navigation to next lesson
  const handleLessonCompletion = async () => {
    if (!lesson || !nextLesson) {
      return;
    }

    // If not enrolled, just navigate without updating progress
    if (!enrollmentId) {
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
      const currentProgress = typeof progress === "number" ? progress : 0;
      const newProgressPercentage = Math.max(
        currentProgress,
        ((nextLessonIndex + 1) / totalLessons) * 100,
      );

      // Lấy currentProgressId từ store hoặc tạo mới nếu chưa có
      const currentProgressState = useProgressStore.getState();
      let currentProgressId = currentProgressState.currentProgress?.id;

      console.log("Progress state check:", {
        currentProgress: currentProgressState.currentProgress,
        currentProgressId,
        enrollmentId,
        newProgressPercentage,
        nextLesson: nextLesson.title,
        nextLessonId: nextLesson.id,
      });

      // Nếu chưa có currentProgressId, thử tạo progress record mới
      if (!currentProgressId) {
        console.log(
          "No currentProgressId found, trying to create initial progress...",
        );
        try {
          // Thử tạo progress cho lesson hiện tại trước
          const createData = {
            enrollmentId,
            lessonId: params.lessonId as string,
            status: "ATTENDED" as const,
          };

          console.log("Creating progress with data:", createData);
          const createResult = await createStudentProgress(createData);

          console.log("Create progress result:", createResult);

          if (!createResult.success) {
            throw new Error(createResult.message);
          }

          // Refresh state sau khi tạo
          await useProgressStore.getState().fetchInitialProgress();
          const updatedState = useProgressStore.getState();
          currentProgressId = updatedState.currentProgress?.id;

          console.log(
            "After creating progress, currentProgressId:",
            currentProgressId,
          );

          if (!currentProgressId) {
            console.error("Still no currentProgressId after creating progress");
            console.error("Debug info:", {
              enrollmentId,
              lessonId: params.lessonId,
              currentProgressState: currentProgressState.currentProgress,
              hasEnrollmentId: !!enrollmentId,
              error: currentProgressState.error,
            });
            toast.error(
              "Không thể khởi tạo tiến trình học tập. Vui lòng refresh trang và thử lại.",
            );
            return;
          }
        } catch (error: any) {
          console.error("Error creating progress:", error);
          console.error("Debug info:", {
            enrollmentId,
            lessonId: params.lessonId,
            error: error,
          });
          toast.error(
            "Không thể tạo thông tin tiến trình. Vui lòng kiểm tra kết nối và thử lại.",
          );
          return;
        }
      }

      // Cập nhật tiến trình với thông tin bài học TIẾP THEO
      await updateLessonProgress({
        progress: newProgressPercentage,
        currentProgressId,
        nextLesson: nextLesson.title,
        nextLessonId: nextLesson.id,
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

  // Handle course completion after quiz completion
  const handleQuizCourseCompletion = useCallback(async () => {
    if (!lesson || !course || !enrollmentId) return;

    const currentLessonId = params.lessonId as string;
    const isCurrentLessonLast = currentLessonIndex === allLessons.length - 1;

    console.log("🎯 [QuizCompletion] Checking course completion conditions:", {
      currentLessonId,
      isCurrentLessonLast,
      currentLessonIndex,
      totalLessons: allLessons.length,
      completedLessonsCount: completedLessonIds.length,
      allLessonsExceptCurrent: allLessons.length - 1,
    });

    // Check if this is the last lesson in the course
    if (!isCurrentLessonLast) {
      console.log(
        "🎯 [QuizCompletion] Not the final lesson, skipping course completion",
      );
      return;
    }

    // Get all lesson IDs except the current one (which was just completed)
    const otherLessonIds = allLessons
      .filter((l): l is NonNullable<typeof l> => l != null && l.id != null) // Type guard for undefined lessons
      .map((l) => l.id)
      .filter((id) => id !== currentLessonId);

    // Check if all other lessons are completed
    const allOtherLessonsCompleted = otherLessonIds.every((id) =>
      completedLessonIds.includes(id),
    );

    console.log("🎯 [QuizCompletion] All other lessons completion check:", {
      otherLessonIds,
      completedLessonIds,
      allOtherLessonsCompleted,
    });

    if (allOtherLessonsCompleted) {
      console.log(
        "🎉 [QuizCompletion] All conditions met - completing course!",
      );

      // Add a small delay to ensure the quiz completion is processed
      setTimeout(async () => {
        try {
          await handleCourseCompletion();
        } catch (error) {
          console.error("Error in course completion:", error);
          toast.error("Có lỗi khi cấp chứng chỉ hoàn thành khóa học");
        }
      }, 1000);
    } else {
      console.log("🎯 [QuizCompletion] Not all lessons completed yet");
    }
  }, [
    lesson,
    course,
    enrollmentId,
    params.lessonId,
    currentLessonIndex,
    allLessons,
    completedLessonIds,
    handleCourseCompletion,
  ]);

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex flex-col min-h-screen relative px-2 sm:px-4 md:pr-[350px] md:pl-4">
        <div className="flex-1 transition-all duration-300 w-full max-w-full">
          <div className="space-y-4 sm:space-y-6 mx-auto w-full max-w-full">
            {/* Loading breadcrumb */}
            <div className="flex items-center text-sm px-0 pt-4 gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>

            {/* Loading video placeholder */}
            <Skeleton
              className="w-full max-w-full rounded-lg"
              style={{ aspectRatio: "16/9" }}
            />

            {/* Loading content card */}
            <div className="prose max-w-none w-full">
              <Card className="overflow-hidden border-none shadow-md rounded-xl w-full">
                <CardContent className="p-4 sm:p-6">
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
            <div className="mt-6 sm:mt-8 pb-16 w-full">
              <Card className="overflow-hidden border-none shadow-md rounded-xl w-full">
                <CardContent className="p-4 sm:p-6">
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
            <Skeleton className="h-6 w-24 mr-2 hidden sm:block" />
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

  return (
    <>
      {/* Mobile Overlay - Enhanced for Quiz */}
      {isSidebarOpen && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-30 ${
            lesson?.type === LessonType.QUIZ || isQuizActivelyTaking
              ? "block"
              : "md:hidden"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`w-full flex-1 flex flex-col min-h-screen relative px-2 sm:px-4 transition-all duration-300 ease-in-out ${
          isSidebarOpen && !isQuizActivelyTaking ? "md:pr-[350px]" : "md:pr-4"
        } md:pl-4`}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex-1 transition-all duration-300 w-full max-w-full"
        >
          <div className="space-y-4 sm:space-y-6 mx-auto w-full max-w-full">
            {/* Lesson Header Component */}
            <LessonHeader
              course={course}
              lesson={lesson}
              isInstructorOrAdmin={isInstructorOrAdmin}
              userRole={user?.role}
            />

            {/* Lesson Content Component */}
            <LessonContent
              lesson={lesson}
              enrollmentId={enrollmentId}
              isEnrolled={isEnrolled}
              isInstructorOrAdmin={isInstructorOrAdmin}
              courseId={params.courseId as string}
              onQuizCompleted={(success: boolean) => {
                if (success && lesson?.id) {
                  handleLessonCompletion();
                }
              }}
              onNavigateToLesson={(targetLessonId: string) => {
                router.push(
                  `/course/${params.courseId}/lesson/${targetLessonId}`,
                );
              }}
              onNavigateToNextIncomplete={() => {
                if (nextLesson) {
                  router.push(
                    `/course/${params.courseId}/lesson/${nextLesson.id}`,
                  );
                } else {
                  useToast({
                    title: "Không tìm thấy bài học tiếp theo",
                    description:
                      "Bạn đã hoàn thành tất cả các bài học trong khóa học.",
                  });
                }
              }}
              onQuizStateChange={handleQuizStateChange}
              onCourseCompletion={handleQuizCourseCompletion}
            />
          </div>
        </motion.div>

        {/* Lesson Navigation Bar Component */}
        <LessonNavigationBar
          lesson={lesson}
          course={course}
          previousLesson={previousLesson}
          nextLesson={nextLesson}
          isButtonEnabled={isButtonEnabled}
          isEnrolled={isEnrolled}
          currentLessonIndex={currentLessonIndex}
          allLessons={allLessons}
          hasCertificate={hasCertificate}
          certificateId={certificateId}
          timeTracking={timeTracking}
          forceRender={forceRender}
          isQuizActivelyTaking={isQuizActivelyTaking}
          onLessonCompletion={handleLessonCompletion}
          onCourseCompletion={handleCourseCompletion}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          router={router}
        />

        {/* Lesson Sidebar Component */}
        <LessonSidebar
          course={course}
          lesson={lesson}
          isSidebarOpen={isSidebarOpen && !isQuizActivelyTaking}
          setIsSidebarOpen={setIsSidebarOpen}
          expandedChapters={expandedChapters}
          toggleChapter={toggleChapter}
          completedLessonIds={completedLessonIds}
          allLessons={allLessons}
          params={{
            lessonId: params.lessonId as string,
            courseId: params.courseId as string,
          }}
          lastLessonId={lastLessonId}
          isEnrolled={isEnrolled}
          isInstructorOrAdmin={isInstructorOrAdmin}
          isButtonEnabled={isButtonEnabled}
          isQuizActivelyTaking={isQuizActivelyTaking}
        />
      </div>

      <LessonChatbot />
    </>
  );
}
