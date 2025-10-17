"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { createEnrollment } from "@/actions/enrollmentActions";
import { getPaymentById, handleVnpayReturn } from "@/actions/paymentActions";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading",
  );
  const [message, setMessage] = useState<string>("");
  const [redirectUrl, setRedirectUrl] = useState<string>("");
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        // 1. Lấy tất cả query params từ VNPay return
        const params: Record<string, any> = {};
        searchParams.forEach((value, key) => {
          params[key] = value;
        });

        // 2. Xác thực thanh toán với backend
        const returnResult = await handleVnpayReturn(params);

        if (returnResult.status === "success") {
          // 3. Lấy orderId và lấy thông tin transaction
          const orderId = params.vnp_TxnRef || params.orderId;
          if (!orderId) {
            throw new Error("Không tìm thấy orderId");
          }

          // 4. Lấy thông tin transaction để extract metadata
          const transactionResult = await getPaymentById(orderId);
          if (!transactionResult.data) {
            throw new Error("Không tìm thấy thông tin transaction");
          }

          const transaction = transactionResult.data;
          const metadata =
            typeof transaction.metadata === "string"
              ? JSON.parse(transaction.metadata)
              : transaction.metadata;

          // 5. Extract thông tin cần thiết từ metadata
          const { courseId, classId, courseType, userId } = metadata;
          console.log("Transaction metadata:", metadata);
          console.log("courseId from metadata:", courseId);
          console.log("classId from metadata:", classId);
          console.log("courseType from metadata:", courseType);

          // Validate required fields
          if (
            !courseType ||
            (courseType === "SELF_PACED" && !courseId) ||
            (courseType === "LIVE" && !classId)
          ) {
            throw new Error("Thiếu thông tin cần thiết trong metadata");
          }

          // 6. Tạo enrollment với action có sẵn
          const enrollmentData = {
            transactionId: transaction.id,
            studentId: transaction.studentId || userId,
            type:
              courseType === "SELF_PACED"
                ? ("ONLINE" as const)
                : ("STREAM" as const),
            ...(courseType === "SELF_PACED" ? { courseId } : { classId }),
            // progress: 0,
            // isCompleted: false
          };

          const enrollmentResult = await createEnrollment(enrollmentData);
          console.log("Enrollment created:", enrollmentResult);

          // 7. Lấy courseId để redirect
          const finalCourseId =
            courseId || enrollmentResult.data?.class?.courseId;

          // 8. Success - redirect về course
          setStatus("success");
          setMessage(
            "Thanh toán thành công! Bạn đã được ghi danh vào khóa học.",
          );
          setRedirectUrl(`/course/${finalCourseId}`);
          toast.success("Ghi danh thành công!");
        } else {
          // Thanh toán thất bại
          setStatus("failed");
          setMessage(
            returnResult.message || "Thanh toán thất bại hoặc bị hủy.",
          );

          // Vẫn cố gắng lấy courseId để redirect
          const orderId = params.vnp_TxnRef || params.orderId;
          if (orderId) {
            try {
              const transactionResult = await getPaymentById(orderId);
              if (transactionResult.data?.metadata) {
                const metadata =
                  typeof transactionResult.data.metadata === "string"
                    ? JSON.parse(transactionResult.data.metadata)
                    : transactionResult.data.metadata;
                if (metadata.courseId) {
                  setRedirectUrl(`/course/${metadata.courseId}`);
                }
              }
            } catch (error) {
              console.error(
                "Error getting course for failed transaction:",
                error,
              );
            }
          }

          if (!redirectUrl) {
            setRedirectUrl("/");
          }
          toast.error("Thanh toán thất bại!");
        }
      } catch (error) {
        console.error("Error handling payment success:", error);
        setStatus("failed");
        setMessage("Có lỗi xảy ra khi xử lý thanh toán.");
        setRedirectUrl("/");
        toast.error("Có lỗi xảy ra!");
      }
    };

    handlePaymentSuccess();
  }, [searchParams, redirectUrl]);

  // Đếm ngược và redirect
  useEffect(() => {
    if (status === "loading" || !redirectUrl) return;
    if (countdown === 0) {
      router.push(redirectUrl);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, status, redirectUrl, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center max-w-md w-full mx-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 text-orange-500 animate-spin mb-4" />
            <p className="text-lg font-semibold mb-2">
              Đang xử lý thanh toán...
            </p>
            <p className="text-gray-600 text-center">
              Vui lòng đợi trong giây lát...
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-semibold mb-2 text-center">{message}</p>
            <p className="text-gray-600 mb-2 text-center">
              Bạn sẽ được chuyển về trang khóa học sau {countdown} giây...
            </p>
          </>
        )}
        {status === "failed" && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg font-semibold mb-2 text-center">{message}</p>
            <p className="text-gray-600 mb-2 text-center">
              Bạn sẽ được chuyển hướng sau {countdown} giây...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
