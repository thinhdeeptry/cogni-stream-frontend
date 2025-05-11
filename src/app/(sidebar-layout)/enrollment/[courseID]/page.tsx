"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AxiosFactory } from "@/lib/axios";
import { Course } from "@/types/course/types";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { getCourseById } from "@/actions/courseAction";
import { generateOrderCode } from "@/actions/paymentActions";

import { Button } from "@/components/ui/button";

export default function EnrollmentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<
    "idle" | "processing" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [orderId, setOrderId] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    const fetchCourse = async () => {
      try {
        // Try to get courseID from different sources
        const courseId =
          params.courseID || params.courseId || searchParams?.get("courseID");
        console.log("Fetching course with ID:", courseId);

        const courseData = await getCourseById(courseId as string);
        setCourse(courseData);
      } catch (error) {
        console.error("Error fetching course:", error);
        setStatusMessage("Không thể tải thông tin khóa học.");
        setEnrollmentStatus("error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [status, router, params.courseId, params.courseID, searchParams]);

  const handleEnroll = async () => {
    if (!session?.user || !course) return;

    try {
      setIsProcessing(true);
      setEnrollmentStatus("idle");
      setStatusMessage("");

      // Kiểm tra lại một lần nữa xem có phải khóa free không
      if (course.promotionPrice === 0 || course.price === 0) {
        router.push(`/course/${course.id}`); // Quay lại trang course để xử lý đăng ký free
        return;
      }

      // Xử lý thanh toán cho khóa học có phí
      const paymentApi = await AxiosFactory.getApiInstance("payment");
      const orderCode = generateOrderCode();
      setOrderId(orderCode);

      // Cập nhật dữ liệu thanh toán để bao gồm đầy đủ metadata
      const paymentData = {
        amount: course.price,
        method: "VNPAY",
        description: course.title,
        returnUrl: `/course/${course.id}`,
        cancelUrl: `/course/${course.id}`,
        metadata: {
          courseId: course.id,
          userId: session.user.id,
          userName: session.user.name || session.user.email,
          instructor: course.instructor?.name || "Unknown",
          duration: course.duration || "N/A",
          level: course.level || "All levels",
          courseName: course.title,
        },
        serviceName: "Course Enrollment",
        serviceId: course.id,
      };

      const response = await paymentApi.post("/", paymentData);
      if (response.data?.checkoutUrl) {
        router.push(`/payment/${orderCode}`);
      } else {
        throw new Error("Không thể tạo trang thanh toán");
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      setStatusMessage(
        error.response?.data?.message || "Có lỗi xảy ra khi đăng ký khóa học.",
      );
      setEnrollmentStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center min-h-[400px]">
          Đang tải...
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col justify-center items-center min-h-[400px]">
          <p className="text-red-500 text-xl mb-4">Không tìm thấy khóa học</p>
          <p>ID khóa học: {params.courseID || params.courseId}</p>
          <Button onClick={() => router.push("/courses")} className="mt-4">
            Quay lại danh sách khóa học
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Đăng ký khóa học: {course.name}
      </h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Thông tin khóa học</h2>
          <p>Giá: {course.promotionPrice || course.price} VND</p>
          <p>Cấp độ: {course.level}</p>
          {course.description && <p>Mô tả: {course.description}</p>}
        </div>

        {enrollmentStatus === "error" && (
          <div className="text-red-500 mb-4">{statusMessage}</div>
        )}

        <Button
          onClick={handleEnroll}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing
            ? "Đang xử lý..."
            : course?.price === 0
              ? "Đăng ký miễn phí"
              : "Tiến hành thanh toán"}
        </Button>
      </div>
    </div>
  );
}
