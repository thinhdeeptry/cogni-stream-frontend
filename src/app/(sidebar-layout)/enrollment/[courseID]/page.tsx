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

// Giữ lại mock data
const getCourseById = (id: string) => ({
  id: "FREE-COURSE-32",
  name: "React.js Advanced",
  description: "Khóa học nâng cao về React.js, hooks, và state management",
  isFree: true,
  instructor: "Nguyễn Trọng Tiến",
  duration: "12 giờ",
  level: "Nâng cao",
  price: 5000,
});

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

  // Sử dụng mock data
  const course = getCourseById(params.courseId as string);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const handleEnroll = async () => {
    if (status !== "authenticated" || !session) {
      console.log("Session status:", status);
      console.log("Session data:", session);
      setStatusMessage("Vui lòng đăng nhập để đăng ký khóa học.");
      setEnrollmentStatus("error");
      setTimeout(() => router.push("/auth/login"), 2000);
      return;
    }

    try {
      setIsProcessing(true);
      setEnrollmentStatus("idle");
      setStatusMessage("");

      console.log("Current session:", session);
      console.log("User data:", session.user);

      if (course.isFree) {
        const enrollmentApi = await AxiosFactory.getApiInstance("gateway");
        console.log("Enrollment API instance:", enrollmentApi.defaults.baseURL);

        const enrollmentData = {
          courseId: course.id,
          userId: session.user.id,
          userName: session.user.name,
          courseName: course.name,
          isFree: true,
        };
        console.log("Sending enrollment request:", enrollmentData);

        const response = await enrollmentApi.post(
          "/enrollment/enrollment",
          enrollmentData,
        );
        console.log("Enrollment response:", response.data);

        if (response.data) {
          setEnrollmentStatus("success");
          setStatusMessage("Đăng ký khóa học miễn phí thành công!");
          setTimeout(() => router.push("/dashboard"), 2000);
        }
      } else {
        const paymentApi = await AxiosFactory.getApiInstance("gateway");
        console.log("Payment API instance:", paymentApi.defaults.baseURL);

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
        console.log("Sending payment request:", paymentData);

        const response = await paymentApi.post(
          "/payment/payments",
          paymentData,
        );
        console.log("Payment response:", response.data);

        if (response.data?.checkoutUrl) {
          router.push(`/payment/${orderCode}`);
        } else {
          throw new Error("Không thể tạo trang thanh toán");
        }
      }
    } catch (error) {
      console.error("API call error:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setStatusMessage("Có lỗi xảy ra khi đăng ký khóa học.");
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
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {statusMessage}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleEnroll}
            disabled={isProcessing || status !== "authenticated"}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : course.isFree ? (
              "Đăng ký ngay"
            ) : (
              "Mua khóa học"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
