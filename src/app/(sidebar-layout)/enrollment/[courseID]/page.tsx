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

// Mock course data
const getCourseById = (id: string) => ({
  id: "FREE-COURSE-31",
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

  const courseId = params.courseId as string;
  const course = getCourseById(courseId);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const handleEnroll = async () => {
    if (status !== "authenticated" || !session) {
      setStatusMessage("Vui lòng đăng nhập để đăng ký khóa học.");
      setEnrollmentStatus("error");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
      return;
    }

    try {
      setIsProcessing(true);
      setEnrollmentStatus("idle");
      setStatusMessage("");

      if (course.isFree) {
        // Sử dụng AxiosFactory mà không cần thêm token thủ công
        const enrollmentApi = AxiosFactory.getApiInstance("enrollment");

        const response = await enrollmentApi.post("/enrollment", {
          courseId: course.id,
          userName: session.user.name,
          courseName: course.name,
          isFree: true,
        });

        if (response.data) {
          setEnrollmentStatus("success");
          setStatusMessage("Bạn đã đăng ký khóa học miễn phí thành công.");
          setTimeout(() => {
            router.push(`/dashboard`);
          }, 2000);
        } else {
          setEnrollmentStatus("error");
          setStatusMessage("Có lỗi xảy ra khi đăng ký khóa học miễn phí.");
        }
      } else {
        // Sử dụng AxiosFactory mà không cần thêm token thủ công
        const paymentApi = AxiosFactory.getApiInstance("payment");

        const now = new Date();
        const year = Number(String(now.getFullYear()).slice(-2));
        const month = Number(String(now.getMonth() + 1).padStart(2, "0"));
        const day = Number(String(now.getDate()).padStart(2, "0"));
        const hours = Number(String(now.getHours()).padStart(2, "0"));
        const minutes = Number(String(now.getMinutes()).padStart(2, "0"));
        const seconds = Number(String(now.getSeconds()).padStart(2, "0"));
        const orderCode = year + month + day + hours + minutes + seconds;
        setOrderId(orderCode);

        const returnUrl = `${window.location.origin}/payment/success`;
        const cancelUrl = `${window.location.origin}/course/${course.id}`;

        const paymentData = {
          amount: course.price,
          method: "BANK_TRANSFER",
          serviceName: "Enrollment",
          description: `${course.name}`,
          ordercode: orderCode,
          userId: session.user.id,
          serviceId: course.id,
          returnUrl: returnUrl,
          cancelUrl: cancelUrl,
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

        if (response.data && response.data.checkoutUrl) {
          router.push(`/payment/${orderCode}`);
        } else {
          throw new Error("Không thể tạo trang thanh toán");
        }
      }
    } catch (error) {
      console.error("Error:", error);

      let errorMessage = "Có lỗi xảy ra. Vui lòng thử lại sau.";

      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
          setTimeout(() => {
            router.push("/auth/login");
          }, 2000);
        } else {
          errorMessage =
            error.response.data.message ||
            "Có lỗi xảy ra khi đăng ký khóa học. Vui lòng thử lại sau.";
        }
      } else if (error.request) {
        errorMessage =
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.";
      }

      setStatusMessage(errorMessage);
      setEnrollmentStatus("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Thông tin khóa học</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl">{course.name}</CardTitle>
            <Badge variant={course.isFree ? "secondary" : "default"}>
              {course.isFree ? "Miễn phí" : "Trả phí"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{course.description}</p>

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
                {formatPrice(course.price)}
              </div>
            )}
            {orderId && (
              <div>
                <span className="font-semibold">Order Code:</span> {orderId}
              </div>
            )}
          </div>

          {enrollmentStatus !== "idle" && (
            <div
              className={`p-4 rounded-md ${
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
