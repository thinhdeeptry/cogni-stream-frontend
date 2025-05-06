"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AxiosFactory } from "@/lib/axios";
import { AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  // Get the orderId from URL params and convert to number
  const orderId = Number.parseInt(params.orderCode as string);

  // Fetch payment data
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        console.log("Fetching payment data for orderId:", orderId);
        const response = await AxiosFactory.getApiInstance("payment").get(
          `/order/${orderId}`,
        );
        console.log("Payment data response:", response.data);

        if (response.data) {
          setPaymentData(response.data);

          // Check if payment is already expired or completed
          if (response.data.status === "EXPIRED") {
            router.push("/payment/expired");
            return;
          } else if (response.data.status === "COMPLETED") {
            setPaymentStatus("success");

            // Redirect to success page with all necessary parameters
            const redirectUrl = new URL(
              response.data.returnUrl || "/payment/success",
              window.location.origin,
            );

            // Add metadata as query parameters
            if (response.data.metadata) {
              Object.entries(response.data.metadata).forEach(([key, value]) => {
                redirectUrl.searchParams.append(key, value as string);
              });
            }

            // Add orderCode
            redirectUrl.searchParams.append("orderCode", orderId.toString());

            // Redirect after a short delay
            setTimeout(() => {
              router.push(redirectUrl.toString());
            }, 1500);

            return;
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch payment data:", error);
        setErrorMessage(
          "Failed to load payment information. Please try again.",
        );
        setPaymentStatus("error");
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [orderId, router]);

  // Countdown timer for payment expiration
  useEffect(() => {
    if (!loading && paymentStatus === "pending") {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            // Mark payment as expired
            handlePaymentExpired();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, paymentStatus]);

  // Format time left as MM:SS
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle payment expiration
  const handlePaymentExpired = async () => {
    try {
      // Update payment status to EXPIRED
      await AxiosFactory.getApiInstance("payment").put(
        `/order/${orderId}/status`,
        {
          status: "EXPIRED",
        },
      );

      // Redirect to expired page
      router.push("/payment/expired");
    } catch (error) {
      console.error("Error marking payment as expired:", error);
      setErrorMessage("Có lỗi xảy ra khi cập nhật trạng thái thanh toán.");
      setPaymentStatus("error");
    }
  };

  // Xử lý khi thanh toán thành công
  const handlePaymentSuccess = async () => {
    try {
      console.log("Payment successful");
      setPaymentStatus("success");

      // Update payment status to COMPLETED
      await AxiosFactory.getApiInstance("payment").put(
        `/order/${orderId}/status`,
        {
          status: "COMPLETED",
        },
      );

      // Hiển thị thông báo thành công
      toast.success("Thanh toán thành công!");

      // Redirect to success page with all necessary parameters
      const redirectUrl = new URL(
        paymentData.returnUrl || "/payment/success",
        window.location.origin,
      );

      // Add all metadata as query parameters
      if (paymentData.metadata) {
        Object.entries(paymentData.metadata).forEach(([key, value]) => {
          redirectUrl.searchParams.append(key, value as string);
        });
      }

      // Thêm orderCode vào URL
      redirectUrl.searchParams.append("orderCode", orderId);

      // Delay redirect để người dùng thấy thông báo thành công
      setTimeout(() => {
        router.push(redirectUrl.toString());
      }, 2000);
    } catch (error) {
      console.error("Error updating payment status:", error);
      setErrorMessage("Có lỗi xảy ra khi cập nhật trạng thái thanh toán");
      setPaymentStatus("error");
      toast.error("Có lỗi xảy ra khi xử lý thanh toán");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
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
              {errorMessage && (
                <p className="text-sm text-red-500 text-center mt-2">
                  {errorMessage}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : paymentStatus === "error" ? (
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <p className="text-lg font-medium">Đã xảy ra lỗi</p>
              <p className="text-sm text-red-500 text-center">{errorMessage}</p>
              <Button onClick={() => router.push("/courses")}>
                Quay lại trang khóa học
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : paymentData ? (
        <Card className="w-full max-w-5xl mx-auto">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left side - Course information */}
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4">
                    Thanh toán khóa học
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-lg">
                        Thông tin khóa học
                      </h3>
                      <div className="space-y-3 p-4 border rounded-md">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Khóa học
                          </p>
                          <p className="font-medium">
                            {paymentData.description}
                          </p>
                        </div>

                        {/* Display instructor, duration, level if available in metadata */}
                        {paymentData.metadata?.instructor && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Giảng viên
                            </p>
                            <p className="font-medium">
                              {paymentData.metadata.instructor}
                            </p>
                          </div>
                        )}

                        {paymentData.metadata?.duration && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Thời lượng
                            </p>
                            <p className="font-medium">
                              {paymentData.metadata.duration}
                            </p>
                          </div>
                        )}

                        {paymentData.metadata?.level && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Trình độ
                            </p>
                            <p className="font-medium">
                              {paymentData.metadata.level}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-sm text-muted-foreground">
                            Số tiền
                          </p>
                          <p className="font-medium">
                            {formatPrice(paymentData.amount)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md bg-blue-50 p-4">
                      <p className="text-sm text-blue-700">
                        Lưu ý: Sau khi thanh toán thành công, vui lòng không
                        đóng trang này cho đến khi hệ thống chuyển hướng tự
                        động.
                      </p>
                    </div>

                    {/* Cancel payment button */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push("/courses")}
                    >
                      Hủy thanh toán
                    </Button>
                  </div>
                </div>
              </div>

              {/* Separator for mobile view */}
              <div className="md:hidden px-6">
                <Separator className="my-4" />
              </div>

              {/* Right side - Payment QR code */}
              <div className="p-6 border-l border-border">
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">
                    Quét mã QR để thanh toán
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sử dụng ứng dụng ngân hàng để quét mã QR bên dưới và hoàn
                    tất thanh toán
                  </p>
                  <div
                    id="embedded-payment-container"
                    className="h-[400px] border rounded-md flex items-center justify-center"
                  >
                    {paymentData.checkoutUrl ? (
                      <iframe
                        src={paymentData.checkoutUrl}
                        className="w-full h-full border-0"
                        onLoad={() => console.log("Payment iframe loaded")}
                      />
                    ) : (
                      <div className="text-center p-4">
                        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p>Không thể tải mã QR thanh toán</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <p className="text-lg font-medium">
                Không tìm thấy thông tin thanh toán
              </p>
              <p className="text-sm text-red-500 text-center">
                Không thể tìm thấy thông tin thanh toán cho mã đơn hàng này. Vui
                lòng thử lại.
              </p>
              <Button onClick={() => router.push("/courses")}>
                Quay lại trang khóa học
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
