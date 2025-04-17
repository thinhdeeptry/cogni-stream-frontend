"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AxiosFactory } from "@/lib/axios";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Course {
  id: string;
  name: string;
  description: string;
  isFree: boolean;
  instructor: string;
  duration: string;
  level: string;
  price: number;
}

export default function EnrollmentPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    const fetchCourse = async () => {
      try {
        // Sử dụng mock data thay vì gọi API
        const mockCourse = getCourseById(params.courseId as string);
        setCourse(mockCourse);
      } catch (error) {
        console.error("Error fetching course:", error);
        setStatusMessage("Không thể tải thông tin khóa học.");
        setEnrollmentStatus("error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [status, router, params.courseId]);

  const handleEnroll = async () => {
    if (!session?.user?.id || !course) {
      setStatusMessage("Vui lòng đăng nhập để đăng ký khóa học.");
      setEnrollmentStatus("error");
      router.push("/auth/login");
      return;
    }

    try {
      setIsProcessing(true);
      setEnrollmentStatus("idle");
      setStatusMessage("");

      if (course.isFree) {
        const enrollmentApi = await AxiosFactory.getApiInstance("gateway");
        const enrollmentData = {
          courseId: course.id,
          userId: session.user.id,
          userName: session.user.name,
          courseName: course.name,
          isFree: true,
        };

        // fix api post enroll
        const response = await enrollmentApi.post("/", enrollmentData);
        if (response.data) {
          setEnrollmentStatus("success");
          setStatusMessage("Đăng ký khóa học miễn phí thành công!");
          setTimeout(() => router.push("/dashboard"), 2000);
        }
      } else {
        const paymentApi = await AxiosFactory.getApiInstance("payment");
        const orderCode = generateOrderCode();
        setOrderId(orderCode);

        const paymentData = {
          amount: course.price,
          method: "BANK_TRANSFER",
          serviceName: "Enrollment",
          description: course.name,
          orderCode: orderCode,
          userId: session.user.id,
          serviceId: course.id,
          returnUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/course/${course.id}`,
          metadata: {
            courseId: course.id,
            userId: session.user.id,
            userName: session.user.name,
            courseName: course.name,
            serviceType: "COURSE_ENROLLMENT",
            instructor: course.instructor,
            duration: course.duration,
            level: course.level,
          },
        };

        const response = await paymentApi.post("/payments", paymentData);

        if (response.data?.checkoutUrl) {
          router.push(`/payment/${orderCode}`);
        } else {
          throw new Error("Không thể tạo trang thanh toán");
        }
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

  const generateOrderCode = () => {
    const now = new Date();
    return parseInt(
      String(now.getFullYear()).slice(-2) +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") +
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0") +
        String(now.getSeconds()).padStart(2, "0"),
    );
  };

  const fetchAllEnrollments = async () => {
    try {
      const enrollmentApi = await AxiosFactory.getApiInstance("gateway");
      const response = await enrollmentApi.get("/enrollment");
      console.log("Enrollments response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      throw error;
    }
  };

  // Thêm hàm xử lý click với async/await
  const handleViewEnrollments = async () => {
    try {
      const enrollments = await fetchAllEnrollments();
      // Xử lý data enrollments ở đây (ví dụ: hiển thị trong modal hoặc chuyển trang)
      console.log("Fetched enrollments:", enrollments);
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
      // Hiển thị thông báo lỗi cho user
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto p-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6">
            <p className="text-center text-red-500">Không tìm thấy khóa học</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Đăng ký khóa học: {course.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold">Giảng viên:</span>{" "}
              {course.instructor}
            </div>
            <div>
              <span className="font-semibold">Thời lượng:</span>{" "}
              {course.duration}
            </div>
            <div>
              <span className="font-semibold">Trình độ:</span> {course.level}
            </div>
            {!course.isFree && (
              <div>
                <span className="font-semibold">Giá:</span>{" "}
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(course.price)}
              </div>
            )}
            {orderId && (
              <div>
                <span className="font-semibold">Mã đơn hàng:</span> {orderId}
              </div>
            )}
          </div>

          {enrollmentStatus !== "idle" && (
            <div
              className={`mt-4 p-4 rounded-md ${
                enrollmentStatus === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {statusMessage}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            onClick={handleViewEnrollments} // Sử dụng hàm mới
            variant="outline"
            className="w-full sm:w-auto mr-2"
          >
            Xem tất cả khóa học đã đăng ký
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {course.isFree ? "Đăng ký miễn phí" : "Thanh toán và đăng ký"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Giữ lại mock data ban đầu
const getCourseById = (id: string) => ({
  id: "FREE-COURSE-33",
  name: "React.js Advanced",
  description: "Khóa học nâng cao về React.js, hooks, và state management",
  isFree: true,
  instructor: "Nguyễn Trọng Tiến",
  duration: "12 giờ",
  level: "Nâng cao",
  price: 5000,
});
