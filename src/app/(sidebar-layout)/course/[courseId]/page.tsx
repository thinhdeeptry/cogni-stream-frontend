"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import {
  Class,
  Course,
  CoursePrice,
  CourseType,
  SyllabusItem,
} from "@/types/course/types";
import { motion } from "framer-motion";
import {
  Award,
  Book,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  Info,
  ListChecks,
  Loader2,
  MessageSquare,
  Plus,
  Star,
  Target,
  Users,
  Video,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { getCourseById } from "@/actions/courseAction";
import { getThreadByResourceId } from "@/actions/discussion.action";
import {
  checkEnrollmentStatus,
  enrollCourse,
  getEnrollmentByCourse,
} from "@/actions/enrollmentActions";
import { createPaymentVnpay } from "@/actions/paymentActions";
import { getCourseCurrentPrice } from "@/actions/pricingActions";
import {
  GroupedSyllabusItem,
  getSyllabusByClassId,
} from "@/actions/syllabusActions";

import { useProgressStore } from "@/stores/useProgressStore";
import useUserStore from "@/stores/useUserStore";

import ClassSelector from "@/components/course/ClassSelector";
import ClassSessionsModal from "@/components/course/ClassSessionsModal";
import SyllabusDisplay from "@/components/course/SyllabusDisplay";
import Discussion from "@/components/discussion";
import { DiscussionType } from "@/components/discussion/type";
import { RatingModal } from "@/components/rating/RatingModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariant = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

export default function CourseDetail() {
  const [course, setCourse] = useState<Course | null>(null);
  const { user } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [firstLessonId, setFirstLessonId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<Record<string, boolean>>({});
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Syllabus state
  const [syllabusData, setSyllabusData] = useState<GroupedSyllabusItem[]>([]);
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(false);

  // State for class schedule modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [viewingClass, setViewingClass] = useState<Class | null>(null);

  // Pricing state
  const [pricing, setPricing] = useState<CoursePrice | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  // Rating modal state
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Progress store
  const {
    lessonId: lastStudiedLessonId,
    setEnrollmentId: setProgressEnrollmentId,
    fetchInitialProgress,
  } = useProgressStore();

  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const router = useRouter();

  // Helper functions for class management
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      month: "short",
      day: "numeric",
    });
  };

  const getAvailableClasses = () => {
    if (!course?.classes) return [];
    return course.classes
      .filter(
        (classItem) =>
          classItem.statusActive === "PUBLISHED" &&
          classItem.isPublished &&
          classItem.currentStudents < classItem.maxStudents &&
          new Date(classItem.startDate) > new Date(),
      )
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
  };

  const getSelectedClass = () => {
    if (!selectedClassId || !course?.classes) return null;
    return course.classes.find((c) => c.id === selectedClassId) || null;
  };

  // Handler for viewing class schedule details
  const handleViewClassSchedule = (classItem: Class) => {
    setViewingClass(classItem);
    setIsScheduleModalOpen(true);
  };

  // Handler for selecting class from modal
  const handleSelectClassFromModal = (classId: string) => {
    setSelectedClassId(classId);
    setIsScheduleModalOpen(false);
  };

  // Fetch enrollment ID and lesson progress
  const fetchEnrollmentId = async () => {
    if (user?.id && course?.id) {
      try {
        const result = await getEnrollmentByCourse(course.id);
        if (result.success && result.data?.id) {
          setEnrollmentId(result.data.id);
          setProgressEnrollmentId(result.data.id);
          await fetchInitialProgress();
        }
      } catch (err) {
        console.error("Error fetching enrollment ID:", err);
      }
    }
  };

  // Fetch syllabus data for the selected class
  const fetchSyllabus = async () => {
    if (!selectedClassId) {
      setSyllabusData([]);
      return;
    }

    setIsLoadingSyllabus(true);
    try {
      const syllabusResponse = await getSyllabusByClassId(selectedClassId);
      if (syllabusResponse && syllabusResponse.groupedItems) {
        console.log("syllabusResponse: ", syllabusResponse);
        setSyllabusData(syllabusResponse.groupedItems);
      } else {
        setSyllabusData([]);
      }
    } catch (error) {
      console.error("Error fetching syllabus:", error);
      setSyllabusData([]);
    } finally {
      setIsLoadingSyllabus(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkStatusOnce = async () => {
      if (!user?.id || !course?.id) return;

      const orderCode = searchParams.get("orderCode");
      const hasOrderCode = !!orderCode;

      if (hasOrderCode && isMounted) {
        setIsCheckingPayment(true);
      }

      try {
        console.log("id user: ", user?.id);
        console.log("id course: ", course?.id);
        console.log("selectedClassId: ", selectedClassId);

        const { success, isEnrolled } = await checkEnrollmentStatus(
          user.id,
          course.id,
          selectedClassId || undefined,
        );
        if (isMounted) setIsEnrolled(!!(success && isEnrolled));
        if (success && isEnrolled && isMounted) {
          await fetchEnrollmentId();
          if (hasOrderCode) {
            toast.success("Bạn đã đăng ký khóa học thành công!");
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }
        }
      } catch (error) {
        console.error("Error checking enrollment status:", error);
      } finally {
        if (isMounted) {
          setIsCheckingPayment(false);
        }
      }
    };

    checkStatusOnce();
    return () => {
      isMounted = false;
    };
  }, [params.courseId, user?.id, course?.id, selectedClassId]);
  // Fetch pricing data
  useEffect(() => {
    const fetchPricing = async () => {
      if (!params.courseId) return;

      try {
        setLoadingPrice(true);
        const priceData = await getCourseCurrentPrice(
          params.courseId as string,
        );
        console.log("Fetched pricing data:", priceData);
        setPricing(priceData);
      } catch (error) {
        console.error("Error fetching course pricing:", error);
        // Set default pricing if API fails
        setPricing({
          currentPrice: 0,
          priceType: "base",
          hasPromotion: false,
        });
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPricing();
  }, [params.courseId]);

  // Fetch course data function
  const fetchCourseData = async () => {
    try {
      setIsLoading(true);
      const data = await getCourseById(params.courseId as string);
      setCourse(data);
      console.log("data: ", data);
      // Find the first lesson ID
      if (data.chapters && data.chapters.length > 0) {
        const firstChapter = data.chapters[0];
        if (firstChapter.lessons && firstChapter.lessons.length > 0) {
          setFirstLessonId(firstChapter.lessons[0].id);
        }
      }

      // Initialize collapsed state for chapters
      if (data.chapters) {
        const initialCollapsedState: Record<string, boolean> = {};
        data.chapters.forEach((chapter) => {
          initialCollapsedState[chapter.id] = true; // Default to collapsed
        });
        setIsCollapsed(initialCollapsedState);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch course data
  useEffect(() => {
    if (params.courseId) {
      fetchCourseData();
    }
  }, [params.courseId]);

  // Auto-select class if only one available
  useEffect(() => {
    if (course?.courseType === CourseType.LIVE && !selectedClassId) {
      const availableClasses = getAvailableClasses();
      if (availableClasses.length === 1) {
        setSelectedClassId(availableClasses[0].id);
      }
    }
  }, [course, selectedClassId]);

  // Fetch syllabus when selectedClassId changes
  useEffect(() => {
    if (selectedClassId) {
      fetchSyllabus();
    }
  }, [selectedClassId]);

  // Handle discussion thread
  // useEffect(() => {
  //   const fetchThread = async () => {
  //     if (!params.courseId || !user) return;

  //     try {
  //       const thread = await getThreadByResourceId(
  //         params.courseId as string,
  //         DiscussionType.COURSE_REVIEW,
  //       );

  //       if (thread) {
  //         setThreadId(thread.id);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching discussion thread:", err);
  //     }
  //   };

  //   fetchThread();
  // }, [params.courseId, user]);

  const handleEnrollClick = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đăng ký khóa học");
      router.push("/auth/login");
      return;
    }

    if (!course || !pricing) return;

    // Check if this is a LIVE course and user needs to select a class
    if (course.courseType === CourseType.LIVE) {
      if (!selectedClassId) {
        toast.error("Vui lòng chọn lớp học trước khi đăng ký");
        return;
      }

      const selectedClass = getSelectedClass();
      if (!selectedClass) {
        toast.error("Lớp học được chọn không hợp lệ");
        return;
      }

      if (selectedClass.currentStudents >= selectedClass.maxStudents) {
        toast.error("Lớp học này đã đầy, vui lòng chọn lớp khác");
        return;
      }
    }

    setIsLoading(true); // Bắt đầu loading

    // Kiểm tra xem có phải khóa miễn phí không - convert về number để so sánh
    const currentPriceNumber = Number(pricing.currentPrice);
    const isFree =
      !pricing.currentPrice ||
      pricing.currentPrice === null ||
      isNaN(currentPriceNumber) ||
      currentPriceNumber === 0;

    console.log("Pricing info:", {
      currentPrice: pricing.currentPrice,
      type: typeof pricing.currentPrice,
      isFree: isFree,
    });

    // Nếu là khóa miễn phí
    if (isFree) {
      try {
        const loadingToast = toast.loading("Đang đăng ký khóa học...");
        const result = await enrollCourse({
          studentId: user.id,
          type: course.courseType === CourseType.LIVE ? "STREAM" : "ONLINE",
          courseId:
            course.courseType === CourseType.SELF_PACED ? course.id : undefined,
          classId:
            course.courseType === CourseType.LIVE
              ? selectedClassId || undefined
              : undefined,
          progress: 0,
          isCompleted: false,
        });
        toast.dismiss(loadingToast);
        if (result.success) {
          toast.success("Bạn đã đăng ký khóa học thành công!");
          setIsEnrolled(true);
          if (result.data?.id) {
            setEnrollmentId(result.data.id);
            setProgressEnrollmentId(result.data.id);
          }
          await fetchCourseData();
          await fetchEnrollmentId();
        } else {
          toast.error(result.message || "Có lỗi xảy ra khi đăng ký khóa học");
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra khi đăng ký khóa học");
        console.error("Error enrolling in free course:", error);
      } finally {
        setIsLoading(false);
      }
      return;
    } else {
      // Nếu là khóa có phí
      try {
        const loadingToast = toast.loading("Đang tạo đơn thanh toán...");
        // Chuẩn bị dữ liệu cho payment
        const paymentData = {
          amount: Number(pricing.currentPrice),
          orderId: `${course.id}-${user.id}-${Date.now()}`,
          orderDescription: course.title,
          orderType: "course",
          studentId: user.id,
          metadata: {
            courseId: course.id,
            userId: user.id,
            userName: user.name || user.email,
            courseName: course.title,
            courseType: course.courseType,
            classId:
              course.courseType === CourseType.LIVE
                ? selectedClassId || undefined
                : undefined,
          },
        };
        console.log("paymentData: ", paymentData);
        const paymentResponse = await createPaymentVnpay(paymentData);
        toast.dismiss(loadingToast);
        if (paymentResponse && paymentResponse.paymentUrl) {
          window.location.href = paymentResponse.paymentUrl;
        } else {
          toast.error(
            paymentResponse.message || "Không thể tạo trang thanh toán",
          );
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra khi tạo đơn thanh toán");
        console.error("Error creating payment:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleStartLearningClick = () => {
    if (!course) return;
    console.log("đã bấm vào nút");

    // Handle LIVE courses - navigate to class learning page
    if (course.courseType === CourseType.LIVE) {
      if (!selectedClassId) {
        toast.error("Vui lòng chọn lớp học trước khi bắt đầu");
        return;
      }

      router.push(`/course/${course.id}/class/${selectedClassId}`);
      console.log("Điều hướng đến trang lớp học LIVE");
      return;
    }

    // Handle SELF_PACED courses - navigate to lesson
    console.log("lastStudiedLessonId: ", lastStudiedLessonId);
    console.log("firstLessonId: ", firstLessonId);
    if (lastStudiedLessonId) {
      router.push(`/course/${course.id}/lesson/${lastStudiedLessonId}`);
      console.log("Đã có học bài ");
    }
    // Otherwise, start from the first lesson
    else if (firstLessonId) {
      router.push(`/course/${course.id}/lesson/${firstLessonId}`);
      console.log("Chưa học bài nào");
    }
  };

  // Toggle chapter collapse state
  const toggleCollapse = (chapterId: string) => {
    setIsCollapsed((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex gap-8 justify-center min-h-screen p-5">
        <div className="w-2/3 space-y-8">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
        <div className="w-1/3">
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-red-500">
        <Info className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">{error}</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <Info className="h-12 w-12 mb-4 text-orange-500" />
        <p className="text-lg font-medium">Course not found</p>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full flex-1 flex gap-8 justify-center min-h-screen p-5 mb-16"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      {/* Left Column */}
      <div className="w-2/3 space-y-8 pb-6">
        <motion.div
          className="bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md"
          whileHover={{ y: -5 }}
          variants={itemVariant}
        >
          <h1 className="text-3xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-orange-500" />
            {course.title}
          </h1>
          <p className="text-gray-600 leading-relaxed mb-6">
            {course.description}
          </p>

          {/* Instructor Information */}
          {course.instructor && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Giảng viên
              </h3>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Image
                    src={
                      course.instructor.user?.image || "/placeholder-avatar.jpg"
                    }
                    alt="Instructor"
                    width={80}
                    height={80}
                    className="rounded-full object-cover border-2 border-orange-100"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-lg mb-1">
                    {course.instructor.headline || "Giảng viên"}
                  </h4>
                  {course.instructor.specialization && (
                    <p className="text-orange-600 font-medium mb-2">
                      {course.instructor.specialization}
                    </p>
                  )}
                  {course.instructor.bio && (
                    <p className="text-gray-600 text-sm mb-3">
                      {course.instructor.bio}
                    </p>
                  )}
                  {course.instructor.avgRating &&
                    course.instructor.totalRatings && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < Math.floor(course.instructor!.avgRating!)
                                    ? "text-yellow-500 fill-current"
                                    : "text-gray-300",
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {course.instructor.avgRating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          ({course.instructor.totalRatings} đánh giá giảng viên)
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Course Rating Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              {/* <Star className="h-5 w-5 text-orange-500" /> */}
              Đánh giá khóa học
            </h3>
            {course &&
            (course.avgRating ?? 0) > 0 &&
            (course.totalRatings ?? 0) > 0 ? (
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className="flex items-center gap-3 hover:bg-gray-50 p-3 rounded-md transition-colors border border-gray-200 hover:border-gray-300"
              >
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-5 w-5",
                          i < Math.floor(course.avgRating ?? 0)
                            ? "text-yellow-500 fill-current"
                            : "text-gray-300",
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-gray-800">
                    {(course.avgRating ?? 0).toFixed(1)}
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-700">
                    {course.totalRatings} đánh giá
                  </span>
                  {/* <span className="text-xs text-gray-500">
                    Xem chi tiết và viết đánh giá
                  </span> */}
                </div>
              </button>
            ) : (
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className="flex items-center gap-3 hover:bg-gray-50 p-3 rounded-md transition-colors border border-gray-200 hover:border-gray-300"
              >
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-gray-300" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    Chưa có đánh giá
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-orange-600">
                    Hãy là người đầu tiên đánh giá!
                  </span>
                  <span className="text-xs text-gray-500">
                    Chia sẻ trải nghiệm của bạn
                  </span>
                </div>
              </button>
            )}
          </div>
        </motion.div>

        {/* Learning Outcomes */}
        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
          <motion.div
            className="bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md"
            whileHover={{ y: -5 }}
            variants={itemVariant}
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              {/* <Target className="h-6 w-6 text-orange-500" /> */}
              Bạn sẽ học được gì?
            </h2>
            <motion.ul
              className="grid grid-cols-2 gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {course.learningOutcomes.map((outcome, index) => (
                <motion.li
                  key={index}
                  className="flex text-start gap-3 items-start group"
                  variants={itemVariant}
                  whileHover={{ x: 5 }}
                >
                  <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 transition-transform group-hover:scale-110" />
                  <span className="text-gray-700">{outcome}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}

        {/* Course Content */}
        {course.courseType === CourseType.LIVE ? (
          <motion.div
            className="bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md"
            whileHover={{ y: -5 }}
            variants={itemVariant}
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-orange-500" />
              Lộ trình học tập
            </h2>

            {/* Class Selector */}
            <div className="mb-6">
              <ClassSelector
                classes={getAvailableClasses() || []}
                selectedClassId={selectedClassId}
                onClassSelect={(classId: string) => setSelectedClassId(classId)}
              />
            </div>

            {/* Syllabus Display */}
            {selectedClassId && (
              <SyllabusDisplay
                syllabusData={syllabusData}
                isLoading={isLoadingSyllabus}
                selectedClassId={selectedClassId}
                courseId={course.id}
                isEnrolled={isEnrolled}
              />
            )}
          </motion.div>
        ) : (
          // Original chapters/lessons display for SELF_PACED courses
          course.chapters &&
          course.chapters.length > 0 && (
            <motion.div
              className="bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md"
              whileHover={{ y: -5 }}
              variants={itemVariant}
            >
              <h2 className="text-2xl font-semibold mb-2 text-gray-800 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-orange-500" />
                Nội dung khoá học
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <Badge
                  variant="outline"
                  className="text-xs py-1 px-2 bg-slate-50"
                >
                  <span className="font-semibold mr-1">Số chương:</span>
                  {course.chapters?.length || 0}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs py-1 px-2 bg-slate-50"
                >
                  <span className="font-semibold mr-1">Số bài:</span>
                  {course.totalLessons || 0}
                </Badge>
              </div>

              <motion.div
                className="space-y-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {course.chapters?.map((chapter) => (
                  <motion.div key={chapter.id} variants={itemVariant}>
                    <Collapsible
                      open={!isCollapsed[chapter.id]}
                      onOpenChange={() => toggleCollapse(chapter.id)}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all duration-200">
                        <div className="flex items-center gap-2">
                          <Plus
                            className={cn(
                              "h-4 w-4 text-orange-500 transition-transform duration-200",
                              !isCollapsed[chapter.id] && "rotate-45",
                            )}
                          />
                          <h3 className="font-semibold text-gray-700">
                            {chapter.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {chapter.lessons?.length || 0} bài
                          </span>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-4">
                        <motion.ul
                          className="mt-2 space-y-2"
                          variants={staggerContainer}
                          initial="hidden"
                          animate="visible"
                        >
                          {chapter.lessons?.map((lesson) => (
                            <motion.li key={lesson.id} variants={itemVariant}>
                              <Link
                                href={
                                  isEnrolled || lesson.isFreePreview
                                    ? `/course/${course.id}/lesson/${lesson.id}`
                                    : "#"
                                }
                                className={`flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-all duration-200 ${
                                  isEnrolled || lesson.isFreePreview
                                    ? "cursor-pointer"
                                    : "cursor-not-allowed opacity-50"
                                }`}
                                onClick={(e) => {
                                  if (!isEnrolled && !lesson.isFreePreview) {
                                    e.preventDefault();
                                    toast.error(
                                      "Vui lòng đăng ký khóa học để xem bài học này",
                                    );
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <Book className="h-4 w-4 text-orange-500" />
                                  <span className="text-gray-700">
                                    {lesson.title}
                                  </span>
                                </div>
                                {lesson.isFreePreview && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-orange-100 text-orange-600 hover:bg-orange-200"
                                  >
                                    Preview
                                  </Badge>
                                )}
                              </Link>
                            </motion.li>
                          ))}
                        </motion.ul>
                      </CollapsibleContent>
                    </Collapsible>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )
        )}
        {/* Requirements */}
        {course.requirements && course.requirements.length > 0 && (
          <motion.div
            className="bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md"
            whileHover={{ y: -5 }}
            variants={itemVariant}
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <ListChecks className="h-6 w-6 text-orange-500" />
              Yêu cầu
            </h2>
            <motion.ul
              className="space-y-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {course.requirements.map((requirement, index) => (
                <motion.li
                  key={index}
                  className="flex items-start gap-3 group"
                  variants={itemVariant}
                  whileHover={{ x: 5 }}
                >
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-500 group-hover:scale-150 transition-transform"></div>
                  <span className="text-gray-700">{requirement}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </div>

      {/* Right Column - Course Card */}
      <div className="w-1/3">
        <motion.div
          className="fixed top-20 right-8 w-[calc(30%-2rem)] z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Bỏ component SandboxInfo */}

          <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
            <motion.div
              className="relative aspect-video w-full overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Image
                src={course.thumbnailUrl || "/placeholder-course.jpg"}
                alt={course.title}
                fill
                className="object-cover"
              />
              {pricing && pricing.currentPrice && pricing.currentPrice > 0 && (
                <motion.div
                  className="absolute top-2 right-2 rounded-lg px-2 py-1.5 bg-black/35 backdrop-blur-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, delay: 0.5 }}
                >
                  <Crown size={18} color="gold" />
                </motion.div>
              )}
            </motion.div>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Price Display - Only show if not enrolled */}
                {!isEnrolled && (
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {loadingPrice ? (
                      <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                      (() => {
                        const currentPriceNumber = Number(
                          pricing?.currentPrice,
                        );
                        const isFree =
                          !pricing?.currentPrice ||
                          pricing?.currentPrice === null ||
                          isNaN(currentPriceNumber) ||
                          currentPriceNumber === 0;
                        // console.log("Price display check:", {
                        //   currentPrice: pricing?.currentPrice,
                        //   type: typeof pricing?.currentPrice,
                        //   isFree: isFree,
                        // });

                        if (isFree) {
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <p className="text-green-600 text-2xl font-semibold">
                                  Miễn phí
                                </p>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <p className="text-red-600 text-2xl font-semibold">
                                {Number(pricing?.currentPrice).toLocaleString()}{" "}
                                VND
                              </p>
                              {pricing.hasPromotion &&
                                pricing.promotionName && (
                                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                    {pricing.priceType === "promotion"
                                      ? "🎉 Khuyến mãi"
                                      : "Giá gốc"}
                                  </span>
                                )}
                            </div>
                            {pricing.hasPromotion && pricing.promotionName && (
                              <div className="bg-red-50 p-2 rounded-md">
                                <p className="text-sm text-red-700 font-medium">
                                  🎉 {pricing.promotionName}
                                </p>
                                {pricing.promotionEndDate && (
                                  <p className="text-xs text-red-600">
                                    Hết hạn:{" "}
                                    {new Date(
                                      pricing.promotionEndDate,
                                    ).toLocaleDateString("vi-VN")}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </motion.div>
                )}

                {/* Course Stats */}
                <motion.div
                  className="space-y-2 border-t border-b border-gray-100 py-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {course.courseType === CourseType.LIVE ? (
                    <>
                      {/* Compact grid layout for LIVE course stats */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Video className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                          <span className="text-xs">Trực tuyến</span>
                        </div>

                        {course.chapters && course.chapters.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Book className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                              <span className="text-xs">
                                {course.totalLessons || 0} bài
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <ListChecks className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                              <span className="text-xs">
                                {course.chapters?.length || 0} chương
                              </span>
                            </div>
                          </>
                        )}

                        <div className="flex items-center gap-2 text-gray-700">
                          <Target className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                          <span className="text-xs">
                            {course.learningOutcomes?.length || 0} mục tiêu
                          </span>
                        </div>
                      </div>

                      {/* Compact selected class info */}
                      {selectedClassId && getSelectedClass() && (
                        <div className="bg-orange-50 p-2 rounded-md mt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-orange-800 truncate">
                                {getSelectedClass()?.name}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Calendar className="h-3 w-3 text-orange-600 flex-shrink-0" />
                                <span className="text-xs text-orange-600">
                                  {formatDateShort(
                                    getSelectedClass()!.startDate,
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-gray-700">
                        <Book className="h-4 w-4 text-orange-500" />
                        <span>{course.totalLessons || 0} bài học</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <ListChecks className="h-4 w-4 text-orange-500" />
                        <span>{course.chapters?.length || 0} chương</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <Target className="h-4 w-4 text-orange-500" />
                        <span>
                          {course.learningOutcomes?.length || 0} mục tiêu học
                          tập
                        </span>
                      </div>
                    </>
                  )}
                </motion.div>

                {/* Enroll/Start Learning Button */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {!isEnrolled ? (
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white transition-colors relative overflow-hidden group"
                      size="lg"
                      onClick={handleEnrollClick}
                      disabled={
                        isLoading ||
                        isCheckingPayment ||
                        (course.courseType === CourseType.LIVE &&
                          !selectedClassId)
                      }
                    >
                      {isLoading || isCheckingPayment ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          <span>
                            {isCheckingPayment
                              ? "Đang kiểm tra thanh toán..."
                              : "Đang xử lý..."}
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className="relative z-10">
                            {course.courseType === CourseType.LIVE &&
                            !selectedClassId
                              ? "Chọn lớp học để đăng ký"
                              : (() => {
                                  const currentPriceNumber = Number(
                                    pricing?.currentPrice,
                                  );
                                  const isFree =
                                    !pricing?.currentPrice ||
                                    pricing?.currentPrice === null ||
                                    isNaN(currentPriceNumber) ||
                                    currentPriceNumber === 0;
                                  return isFree
                                    ? "Đăng ký ngay"
                                    : "Mua khóa học";
                                })()}
                          </span>
                          <span className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                          <span className="absolute -inset-1 rounded-lg bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300 animate-pulse"></span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white transition-colors relative overflow-hidden group"
                      size="lg"
                      onClick={handleStartLearningClick}
                      disabled={
                        course.courseType === CourseType.LIVE &&
                        !selectedClassId
                      }
                    >
                      <span className="relative z-10">
                        {course.courseType === CourseType.LIVE
                          ? selectedClassId
                            ? "Vào lớp học"
                            : "Chọn lớp để bắt đầu"
                          : lastStudiedLessonId
                            ? "Tiếp tục học"
                            : "Bắt đầu học"}
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      <span className="absolute -inset-1 rounded-lg bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300 animate-pulse"></span>
                    </Button>
                  )}
                </motion.div>

                {/* Class selection hint for LIVE courses */}
                {course.courseType === CourseType.LIVE && (
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.85 }}
                  >
                    {!isEnrolled ? (
                      !selectedClassId ? (
                        <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-md">
                          💡 Vui lòng chọn lớp học phù hợp trước khi đăng ký
                        </p>
                      ) : (
                        <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-md">
                          ✓ Đã chọn lớp: {getSelectedClass()?.name}
                        </p>
                      )
                    ) : !selectedClassId ? (
                      <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-md">
                        💡 Vui lòng chọn lớp học để vào học
                      </p>
                    ) : (
                      <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-md">
                        ✓ Sẵn sàng vào lớp: {getSelectedClass()?.name}
                      </p>
                    )}
                  </motion.div>
                )}

                {/* {course.requirements && course.requirements.length > 0 && (
                  <motion.div
                    className="pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Info className="h-3.5 w-3.5 text-orange-500" />
                      Yêu cầu trước khi học
                    </h3>
                    <p className="text-xs text-gray-600">
                      {course.requirements[0]}
                      {course.requirements.length > 1 ? "..." : ""}
                    </p>
                  </motion.div>
                )} */}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      {/* <Discussion threadId={threadId || ""} /> */}

      {/* Class Sessions Modal */}
      <ClassSessionsModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        classItem={viewingClass}
        onSelectClass={handleSelectClassFromModal}
      />

      {/* Rating Modal */}
      {course && (
        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          courseId={course.id}
          courseName={course.title}
          classId={selectedClassId || undefined}
          isEnrolled={isEnrolled}
          onRatingUpdate={fetchCourseData} // Refresh course data sau khi rating
        />
      )}
    </motion.div>
  );
}
