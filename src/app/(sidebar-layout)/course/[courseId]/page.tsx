"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AxiosFactory } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Class, Course, CoursePrice, CourseType } from "@/types/course/types";
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
  Target,
  Users,
  Video,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { getCourseById } from "@/actions/courseAction";
import { getThreadByResourceId } from "@/actions/discussion.action";
import { enrollCourse } from "@/actions/enrollmentActions";
import {
  checkEnrollmentStatus,
  createEnrollmentAfterPayment,
  createPayment,
  generateOrderCode,
  getOrderByCode,
  updateEnrollmentStatus,
  updateOrderStatus,
} from "@/actions/paymentActions";
import { getCourseCurrentPrice } from "@/actions/pricingActions";

import { useProgressStore } from "@/stores/useProgressStore";
import useUserStore from "@/stores/useUserStore";

import Discussion from "@/components/discussion";
import { DiscussionType } from "@/components/discussion/type";
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

  // Pricing state
  const [pricing, setPricing] = useState<CoursePrice | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

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

  // Fetch enrollment ID and lesson progress
  const fetchEnrollmentId = async () => {
    if (user?.id && course?.id) {
      try {
        const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
        const response = await enrollmentApi.get(`/find/${course.id}`);

        if (response.data?.id) {
          setEnrollmentId(response.data.id);
          setProgressEnrollmentId(response.data.id);

          // Fetch progress data to get the last studied lesson
          await fetchInitialProgress();
        }
      } catch (err) {
        console.error("Error fetching enrollment ID:", err);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkStatusOnce = async () => {
      // Only proceed if we have the necessary data
      if (!user?.id || !course?.id) return;

      const orderCode = searchParams.get("orderCode");
      const hasOrderCode = !!orderCode;

      if (hasOrderCode && isMounted) {
        setIsCheckingPayment(true);
      }

      try {
        console.log("Checking enrollment status for course:", course.id);

        // Single API call to check enrollment status
        const timestamp = new Date().getTime();
        const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
        const response = await enrollmentApi.get(
          `/check/${user.id}/${course.id}?_t=${timestamp}`,
        );

        console.log("Enrollment check response:", response.data);
        const isUserEnrolled = response.data.enrolled === true;

        if (isMounted) {
          setIsEnrolled(isUserEnrolled);
        }

        // If enrolled, update enrollment ID
        if (isUserEnrolled && isMounted) {
          await fetchEnrollmentId();

          // Show success message if coming from payment
          if (hasOrderCode) {
            toast.success("Bạn đã đăng ký khóa học thành công!");

            // Remove query parameter after processing
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

    // Only run once when component mounts or when critical dependencies change
    checkStatusOnce();

    // Cleanup function
    return () => {
      isMounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.courseId, user?.id, course?.id]);

  // Fetch pricing data
  useEffect(() => {
    const fetchPricing = async () => {
      if (!params.courseId) return;

      try {
        setLoadingPrice(true);
        const priceData = await getCourseCurrentPrice(
          params.courseId as string,
        );
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

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        const data = await getCourseById(params.courseId as string);
        setCourse(data);

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

    if (params.courseId) {
      fetchCourse();
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

    // Handle free courses directly
    if (!pricing.currentPrice || pricing.currentPrice === 0) {
      try {
        // Show loading toast
        const loadingToast = toast.loading("Đang đăng ký khóa học...");

        // Enroll in the free course
        const result = await enrollCourse({
          courseId: course.id,
          userId: user.id,
          userName: user.name,
          courseName: course.title,
          isFree: true,
          classId:
            course.courseType === CourseType.LIVE
              ? selectedClassId || undefined
              : undefined,
        });

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        if (result.success) {
          toast.success("Bạn đã đăng ký khóa học thành công!");
          // Refresh enrollment status
          setIsEnrolled(true);
        } else {
          toast.error(result.message || "Có lỗi xảy ra khi đăng ký khóa học");
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra khi đăng ký khóa học");
        console.error("Error enrolling in free course:", error);
      } finally {
        setIsLoading(false); // Kết thúc loading
      }
    } else {
      // Xử lý thanh toán cho khóa học có phí - trực tiếp mở link checkout
      try {
        // Trước tiên, kiểm tra xem đã có enrollment nào chưa và cập nhật nếu cần
        const updateResult = await updateEnrollmentStatus(user.id, course.id);
        console.log("Update enrollment result:", updateResult);

        // Nếu cập nhật thành công, kiểm tra lại trạng thái enrollment
        if (updateResult.success) {
          const checkResult = await checkEnrollmentStatus(user.id, course.id);
          if (checkResult.success && checkResult.isEnrolled) {
            setIsEnrolled(true);
            toast.success("Bạn đã được đăng ký vào khóa học!");
            setIsLoading(false);
            return;
          }
        }

        // Nếu không có enrollment hoặc cập nhật không thành công, tiếp tục với thanh toán
        // Show loading toast
        const loadingToast = toast.loading("Đang tạo đơn thanh toán...");

        const orderCode = await generateOrderCode(); // Trả về số nguyên
        console.log("Order code lay dc o trang course: ", orderCode);
        // Cập nhật dữ liệu thanh toán với metadata phù hợp và returnUrl trỏ về trang success
        const paymentData = {
          amount: pricing.currentPrice,
          method: "BANK_TRANSFER",
          description: course.title.substring(0, 25), // Giới hạn 25 ký tự
          orderCode: orderCode.toString(), // Chuyển đổi thành chuỗi
          returnUrl: `${window.location.origin}/payment/success?orderCode=${orderCode}&courseId=${course.id}&userId=${user.id}&userName=${encodeURIComponent(user.name || user.email || "")}&courseName=${encodeURIComponent(course.title)}${course.courseType === CourseType.LIVE && selectedClassId ? `&classId=${selectedClassId}` : ""}`,
          cancelUrl: `${window.location.origin}/course/${course.id}`,
          metadata: {
            courseId: course.id,
            userId: user.id,
            userName: user.name || user.email,
            courseName: course.title,
            level: course.level || "BEGINNER",
            categoryName: course.category?.name || "",
            serviceType: "Course",
            classId:
              course.courseType === CourseType.LIVE
                ? selectedClassId || undefined
                : undefined,
          },
          serviceName: "Course Enrollment",
          serviceId: course.id,
          userId: user.id,
        };

        // Sử dụng hàm createPayment từ paymentActions
        const paymentResponse = await createPayment(paymentData);

        // Dismiss loading toast
        toast.dismiss(loadingToast);

        if (paymentResponse.success && paymentResponse.checkoutUrl) {
          // Chuyển hướng trực tiếp đến trang thanh toán
          window.location.href = paymentResponse.checkoutUrl;
        } else {
          toast.error(
            paymentResponse.message || "Không thể tạo trang thanh toán",
          );
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra khi tạo đơn thanh toán");
        console.error("Error creating payment:", error);
      } finally {
        setIsLoading(false); // Kết thúc loading
      }
    }
  };

  const handleStartLearningClick = () => {
    if (!course) return;

    // If the user has started the course before, navigate to the last lesson they were studying
    if (lastStudiedLessonId) {
      router.push(`/course/${course.id}/lesson/${lastStudiedLessonId}`);
    }
    // Otherwise, start from the first lesson
    else if (firstLessonId) {
      router.push(`/course/${course.id}/lesson/${firstLessonId}`);
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
          <p className="text-gray-600 leading-relaxed">{course.description}</p>
        </motion.div>

        {/* Learning Outcomes */}
        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
          <motion.div
            className="bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md"
            whileHover={{ y: -5 }}
            variants={itemVariant}
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <Target className="h-6 w-6 text-orange-500" />
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

        {/* Classes for LIVE courses */}
        {course.courseType === CourseType.LIVE && (
          <motion.div
            className="bg-white rounded-lg shadow-sm p-6 transition-all hover:shadow-md"
            whileHover={{ y: -5 }}
            variants={itemVariant}
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <Video className="h-6 w-6 text-orange-500" />
              Lớp học trực tuyến
            </h2>

            {getAvailableClasses().length > 0 ? (
              <motion.div
                className="space-y-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <p className="text-gray-600 mb-4">
                  Chọn lớp học phù hợp với lịch trình của bạn:
                </p>

                {getAvailableClasses().map((classItem) => (
                  <motion.div
                    key={classItem.id}
                    variants={itemVariant}
                    className={cn(
                      "border-2 rounded-lg p-4 cursor-pointer transition-all duration-200",
                      selectedClassId === classItem.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300 hover:bg-orange-25",
                    )}
                    onClick={() => setSelectedClassId(classItem.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-2">
                          {classItem.name}
                        </h3>
                        {classItem.description && (
                          <p className="text-gray-600 text-sm mb-3">
                            {classItem.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Bắt đầu: {formatDate(classItem.startDate)}
                            </span>
                          </div>

                          {classItem.endDate && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Kết thúc: {formatDate(classItem.endDate)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1 text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>
                              {classItem.currentStudents}/
                              {classItem.maxStudents} học viên
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 text-right">
                        <Badge
                          variant={
                            selectedClassId === classItem.id
                              ? "default"
                              : "outline"
                          }
                          className={cn(
                            "mb-2",
                            selectedClassId === classItem.id && "bg-orange-500",
                          )}
                        >
                          {selectedClassId === classItem.id
                            ? "Đã chọn"
                            : "Chọn lớp"}
                        </Badge>

                        {classItem.currentStudents >=
                          classItem.maxStudents * 0.8 && (
                          <div className="text-xs text-red-600 font-medium">
                            Sắp đầy!
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  Hiện tại chưa có lớp học nào mở đăng ký
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Vui lòng quay lại sau hoặc liên hệ để được thông báo khi có
                  lớp mới
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Course Content */}
        {course.chapters && course.chapters.length > 0 && (
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
          className="sticky top-8"
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
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Price Display */}
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {loadingPrice ? (
                    <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
                  ) : !pricing ||
                    !pricing.currentPrice ||
                    pricing.currentPrice === 0 ? (
                    <p className="text-green-600 text-2xl font-semibold">
                      Miễn phí
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-red-600 text-2xl font-semibold">
                          {pricing.currentPrice.toLocaleString()} VND
                        </p>
                        {pricing.hasPromotion && pricing.promotionName && (
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
                  )}
                </motion.div>

                {/* Course Stats */}
                <motion.div
                  className="space-y-3 border-t border-b border-gray-100 py-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {course.courseType === CourseType.LIVE ? (
                    <>
                      <div className="flex items-center gap-3 text-gray-700">
                        <Video className="h-4 w-4 text-orange-500" />
                        <span>Khóa học trực tuyến</span>
                      </div>

                      {/* Show course content stats for LIVE courses too */}
                      {course.chapters && course.chapters.length > 0 && (
                        <>
                          <div className="flex items-center gap-3 text-gray-700">
                            <Book className="h-4 w-4 text-orange-500" />
                            <span>{course.totalLessons || 0} bài học</span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-700">
                            <ListChecks className="h-4 w-4 text-orange-500" />
                            <span>{course.chapters?.length || 0} chương</span>
                          </div>
                        </>
                      )}

                      {selectedClassId && getSelectedClass() && (
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-orange-800 mb-1">
                            Lớp học đã chọn:
                          </p>
                          <p className="text-sm text-orange-700">
                            {getSelectedClass()?.name}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-orange-600">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Bắt đầu:{" "}
                              {formatDateShort(getSelectedClass()!.startDate)}
                            </span>
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
                    </>
                  )}

                  <div className="flex items-center gap-3 text-gray-700">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span>
                      {course.learningOutcomes?.length || 0} mục tiêu học tập
                    </span>
                  </div>
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
                              : !pricing ||
                                  !pricing.currentPrice ||
                                  pricing.currentPrice === 0
                                ? "Đăng ký ngay"
                                : "Mua khóa học"}
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
                    >
                      <span className="relative z-10">Bắt đầu học</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                      <span className="absolute -inset-1 rounded-lg bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300 animate-pulse"></span>
                    </Button>
                  )}
                </motion.div>

                {/* Class selection hint for LIVE courses */}
                {course.courseType === CourseType.LIVE && !isEnrolled && (
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.85 }}
                  >
                    {!selectedClassId ? (
                      <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-md">
                        💡 Vui lòng chọn lớp học phù hợp trước khi đăng ký
                      </p>
                    ) : (
                      <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-md">
                        ✓ Đã chọn lớp: {getSelectedClass()?.name}
                      </p>
                    )}
                  </motion.div>
                )}

                {course.requirements && course.requirements.length > 0 && (
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
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      {/* <Discussion threadId={threadId || ""} /> */}
    </motion.div>
  );
}
