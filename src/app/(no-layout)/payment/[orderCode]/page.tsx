"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { usePayOS } from "@payos/payos-checkout";
import { AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  createEnrollmentAfterPayment,
  getOrderByCode,
  updateOrderStatus,
} from "@/actions/paymentActions";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "success" | "error"
  >("pending");
  const [errorMessage, setErrorMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(900); // 15 phút (900 giây)
  const [isPayOSOpen, setIsPayOSOpen] = useState(false);

  // Get the orderId from URL params and convert to number
  const orderId = Number.parseInt(params.orderCode as string);

  // PayOS configuration
  const [payOSConfig, setPayOSConfig] = useState({
    RETURN_URL: window.location.href,
    ELEMENT_ID: "embedded-payment-container",
    CHECKOUT_URL: null,
    embedded: true,
    onSuccess: (event) => {
      handlePaymentSuccess();
    },
  });

  const { open, exit } = usePayOS(payOSConfig);

  // Fetch payment data
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        console.log("Fetching payment data for orderCode:", params.orderCode);
        const response = await getOrderByCode(params.orderCode);

        // In toàn bộ dữ liệu trả về để debug
        console.log(
          "FULL PAYMENT RESPONSE:",
          JSON.stringify(response, null, 2),
        );

        if (response.success && response.data) {
          console.log(
            "FULL PAYMENT DATA:",
            JSON.stringify(response.data, null, 2),
          );
          setPaymentData(response.data);

          // Set PayOS checkout URL
          if (response.data.checkoutUrl) {
            setPayOSConfig((prev) => ({
              ...prev,
              CHECKOUT_URL: response.data.checkoutUrl,
            }));
          }

          // Check if payment is already expired or completed
          if (response.data.status === "EXPIRED") {
            router.push(
              `/course/${response.data.metadata?.courseId || "/courses"}`,
            );
            return;
          } else if (response.data.status === "COMPLETED") {
            setPaymentStatus("success");

            // Redirect to course detail page
            setTimeout(() => {
              router.push(
                `/course/${response.data.metadata?.courseId || "/courses"}`,
              );
            }, 1500);

            return;
          }
        } else {
          setErrorMessage(
            response.message || "Không thể tải thông tin thanh toán",
          );
          setPaymentStatus("error");
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch payment data:", error);
        console.error("Error details:", error.response?.data || error.message);
        setErrorMessage(
          "Không thể tải thông tin thanh toán. Vui lòng thử lại.",
        );
        setPaymentStatus("error");
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [orderId, router]);

  // Open PayOS when checkout URL is available
  useEffect(() => {
    if (payOSConfig.CHECKOUT_URL && !isPayOSOpen) {
      open();
      setIsPayOSOpen(true);
    }
  }, [payOSConfig.CHECKOUT_URL, isPayOSOpen, open]);

  // Countdown timer for payment expiration
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && paymentStatus === "pending") {
      handlePaymentExpired();
    }
  }, [timeLeft, paymentStatus]);

  // Format time left as MM:SS
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle payment expiration
  const handlePaymentExpired = async () => {
    try {
      // Close PayOS if open
      if (isPayOSOpen) {
        exit();
        setIsPayOSOpen(false);
      }

      // Update payment status to EXPIRED
      const response = await updateOrderStatus(orderId, "EXPIRED");

      if (response.success) {
        toast.error("Thanh toán đã hết hạn");
      } else {
        setErrorMessage(
          response.message || "Lỗi cập nhật trạng thái thanh toán",
        );
        toast.error(response.message || "Lỗi cập nhật trạng thái thanh toán");
      }

      // Redirect to course detail page
      if (paymentData?.metadata?.courseId) {
        router.push(`/course/${paymentData.metadata.courseId}`);
      } else {
        router.push("/courses");
      }
    } catch (error) {
      console.error("Error marking payment as expired:", error);
      setErrorMessage("Có lỗi xảy ra khi cập nhật trạng thái thanh toán.");
      setPaymentStatus("error");

      // Still redirect to course detail page in case of error
      if (paymentData?.metadata?.courseId) {
        router.push(`/course/${paymentData.metadata.courseId}`);
      } else {
        router.push("/courses");
      }
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async () => {
    try {
      console.log("Payment successful");
      setPaymentStatus("success");

      // Update payment status to COMPLETED
      const updateResponse = await updateOrderStatus(orderId, "COMPLETED");

      if (updateResponse.success) {
        toast.success("Thanh toán thành công!");

        // Create enrollment
        if (paymentData) {
          const enrollResponse =
            await createEnrollmentAfterPayment(paymentData);

          if (!enrollResponse.success) {
            console.error("Error creating enrollment:", enrollResponse.message);
          }
        }
      } else {
        setErrorMessage(
          updateResponse.message || "Lỗi cập nhật trạng thái thanh toán",
        );
        toast.error(
          updateResponse.message || "Lỗi cập nhật trạng thái thanh toán",
        );
      }

      // Redirect to course detail page
      if (paymentData?.metadata?.courseId) {
        router.push(`/course/${paymentData.metadata.courseId}`);
      } else {
        router.push("/courses");
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      setErrorMessage("Có lỗi xảy ra khi cập nhật trạng thái thanh toán");
      setPaymentStatus("error");
      toast.error("Có lỗi xảy ra khi xử lý thanh toán");

      // Still redirect to course detail page in case of error
      if (paymentData?.metadata?.courseId) {
        router.push(`/course/${paymentData.metadata.courseId}`);
      } else {
        router.push("/courses");
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Handle opening PayOS manually
  const handleOpenPayOS = () => {
    if (payOSConfig.CHECKOUT_URL) {
      open();
      setIsPayOSOpen(true);
    } else {
      // Fallback to opening checkout URL in new tab
      if (paymentData?.checkoutUrl) {
        window.open(paymentData.checkoutUrl, "_blank");
      } else {
        toast.error("Không tìm thấy liên kết thanh toán");
      }
    }
  };

  // Handle closing PayOS
  const handleClosePayOS = () => {
    exit();
    setIsPayOSOpen(false);
  };

  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col justify-center">
      {/* Countdown timer at the top center */}
      {paymentStatus === "pending" && paymentData && (
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full font-bold">
            <Clock className="h-5 w-5" />
            <span>Thời gian còn lại: {formatTimeLeft()}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : paymentStatus === "success" ? (
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-lg font-medium">Thanh toán thành công!</p>
              <p className="text-sm text-muted-foreground text-center">
                Đang chuyển hướng đến trang khóa học của bạn...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : paymentStatus === "error" ? (
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <p className="text-lg font-medium">Đã xảy ra lỗi</p>
              <p className="text-sm text-muted-foreground text-center">
                {errorMessage}
              </p>
              <Button
                onClick={() => {
                  if (paymentData?.metadata?.courseId) {
                    router.push(`/course/${paymentData.metadata.courseId}`);
                  } else {
                    router.push("/courses");
                  }
                }}
              >
                Quay lại trang khóa học
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : paymentData ? (
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6">
              Thanh toán khóa học
            </h2>

            {/* Payment info - Simplified */}
            <div className="mb-6">
              <h3 className="font-medium text-lg mb-2">Thông tin thanh toán</h3>
              <div className="flex justify-between items-center mb-2">
                <span>Mã đơn hàng:</span>
                <span className="font-medium">{paymentData.id}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Số tiền:</span>
                <span className="font-medium text-lg text-primary">
                  {formatPrice(paymentData.amount)}
                </span>
              </div>
            </div>

            <Separator className="my-4" />

            {/* PayOS Embedded Container */}
            <div className="flex flex-col items-center mb-6">
              <h3 className="font-medium text-lg mb-4">Thanh toán</h3>

              {!isPayOSOpen ? (
                <Button className="w-full mb-4" onClick={handleOpenPayOS}>
                  Mở cổng thanh toán
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full mb-4"
                  onClick={handleClosePayOS}
                >
                  Đóng cổng thanh toán
                </Button>
              )}

              <div
                id="embedded-payment-container"
                className="w-full h-[350px] border rounded-md"
              ></div>

              {isPayOSOpen && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Sau khi thanh toán thành công, vui lòng đợi 5-10 giây để hệ
                  thống cập nhật.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (paymentData?.metadata?.courseId) {
                    router.push(`/course/${paymentData.metadata.courseId}`);
                  } else {
                    router.push("/courses");
                  }
                }}
              >
                Hủy thanh toán
              </Button>
            </div>

            {/* Debug section - Chỉ hiển thị trong môi trường development */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-8 p-4 bg-gray-100 rounded-md">
                <h4 className="font-medium mb-2">Debug Info:</h4>
                <div className="text-xs overflow-auto max-h-40">
                  <pre>
                    {JSON.stringify(
                      {
                        qrUrl: paymentData.qrUrl,
                        qrCode: paymentData.qrCode,
                        checkoutUrl: paymentData.checkoutUrl,
                        paymentFields: Object.keys(paymentData),
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">
            Không tìm thấy thông tin thanh toán
          </p>
        </div>
      )}
    </div>
  );
}
