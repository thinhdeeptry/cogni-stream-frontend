"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  checkEnrollmentStatus,
  createEnrollmentAfterPayment,
  getOrderByCode,
  updateOrderStatus,
} from "@/actions/paymentActions";

import { Button } from "@/components/ui/button";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Lấy thông tin thanh toán từ URL params
        const orderCode = searchParams.get("orderCode");
        const courseId = searchParams.get("courseId");
        const userId = searchParams.get("userId");
        console.log("orderCOde:", orderCode);
        console.log("courseId:", courseId);
        console.log("userId:", userId);

        if (!orderCode || !courseId || !userId) {
          setErrorMessage("Thiếu thông tin cần thiết để xử lý thanh toán");
          setIsProcessing(false);
          return;
        }

        setCourseId(courseId);

        // 1. Cập nhật trạng thái thanh toán thành COMPLETED
        console.log("Updating payment status to COMPLETED");
        const updateResponse = await updateOrderStatus(
          Number(orderCode),
          "COMPLETED",
        );

        if (!updateResponse.success) {
          throw new Error(
            updateResponse.message ||
              "Không thể cập nhật trạng thái thanh toán",
          );
        }

        // 2. Lấy thông tin đơn hàng sau khi cập nhật
        console.log("Getting order details");
        const orderResponse = await getOrderByCode(orderCode);
        console.log(orderResponse.data);

        if (!orderResponse.success || !orderResponse.data) {
          throw new Error("Không thể lấy thông tin đơn hàng");
        }

        // 3. Kiểm tra trạng thái sau khi cập nhật
        if (orderResponse.data.status !== "COMPLETED") {
          throw new Error(
            `Trạng thái thanh toán không được cập nhật đúng. Trạng thái hiện tại: ${orderResponse.data.status}`,
          );
        }

        // 4. Tạo hoặc cập nhật enrollment
        console.log("Processing enrollment after payment");
        const enrollResponse = await createEnrollmentAfterPayment(
          orderResponse.data,
        );
        console.log("Enrollment processing response:", enrollResponse);

        if (!enrollResponse.success) {
          throw new Error(
            enrollResponse.message || "Không thể xử lý đăng ký khóa học",
          );
        }

        // 5. Kiểm tra lại trạng thái enrollment
        console.log("Verifying enrollment status");
        let retryCount = 0;
        let isEnrolled = false;

        // Thử kiểm tra trạng thái enrollment tối đa 3 lần, mỗi lần cách nhau 1 giây
        while (retryCount < 3 && !isEnrolled) {
          const verifyResponse = await checkEnrollmentStatus(userId, courseId);
          console.log(
            `Verification attempt ${retryCount + 1}:`,
            verifyResponse,
          );

          if (verifyResponse.success && verifyResponse.isEnrolled) {
            isEnrolled = true;
            break;
          }

          retryCount++;
          if (retryCount < 3) {
            // Đợi 1 giây trước khi thử lại
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (!isEnrolled) {
          console.warn(
            "Enrollment verification failed after multiple attempts",
          );
          // Không throw error, vẫn tiếp tục xử lý
        }

        console.log("Payment processing completed successfully");

        // 6. Chuyển hướng về trang khóa học sau 2 giây
        setTimeout(() => {
          // Sử dụng window.location thay vì router.push để đảm bảo trang được tải lại hoàn toàn
          window.location.href = `/course/${courseId}`;
        }, 2000000);
      } catch (error) {
        console.error("Error processing payment:", error);
        setErrorMessage(
          error.message ||
            "Không thể xử lý thanh toán. Vui lòng liên hệ hỗ trợ.",
        );
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            F8
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 text-center">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-16 h-16 text-orange-500 animate-spin mb-4" />
              <p className="text-gray-600">Đang xử lý đăng ký khóa học...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                {errorMessage ? (
                  <Loader2 className="w-16 h-16 text-red-500 animate-spin" />
                ) : (
                  <CheckCircle className="w-16 h-16 text-green-500" />
                )}
              </div>

              {errorMessage ? (
                <>
                  <h1 className="text-2xl font-bold text-red-600 mb-4">
                    Có lỗi xảy ra
                  </h1>
                  <p className="text-red-500 mb-6">{errorMessage}</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-green-600 mb-4">
                    Thanh toán thành công!
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Cảm ơn bạn đã thanh toán. Bạn đã được đăng ký vào khóa học
                    và sẽ được chuyển hướng đến trang khóa học trong giây lát.
                  </p>
                </>
              )}

              <div className="flex justify-center">
                <Link href={courseId ? `/course/${courseId}` : "/courses"}>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    {errorMessage ? "Thử lại" : "Xem khóa học ngay"}
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
