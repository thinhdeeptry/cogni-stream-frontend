"use client";

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { AxiosFactory } from "@/lib/axios";
import { useState, useEffect } from "react";
import { usePayOS } from "@payos/payos-checkout";

export default function PaymentTestPage() {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  

  // Cấu hình PayOS
  const payOSConfig = {
    RETURN_URL: "http://localhost:3000/payment/success",
    ELEMENT_ID: "embeded-payment-container",
    CHECKOUT_URL: checkoutUrl,
    embedded: true,
    onSuccess: () => {
      console.log("Payment successful");
      setPaymentStatus("success");
    },
    onExit: () => {
      console.log("Payment interface exited");
    },
  };

  // Kiểm tra môi trường client-side
  const isClient = typeof window !== "undefined";
  const { open, exit } =  usePayOS(payOSConfig)

  // Hàm tạo thanh toán
  const createPayment = async (
    amount: number,
    description: string,
    method: string,
    serviceId: string,
    serviceType: string,
    returnUrl: string,
    cancelUrl: string
  ) => {
    try {
      const orderCode = Math.floor(Math.random() * 1000000);
      const response = await AxiosFactory.getApiInstance('payment').post('/payments', {
        orderCode,
        amount,
        description,
        method,
        serviceId,
        serviceType,
        returnUrl,
        cancelUrl,
      });
      console.log("Checkout URL:", response.data.checkoutUrl);
      setCheckoutUrl(response.data.checkoutUrl);
      setPaymentStatus(null);
    } catch (error) {
      console.error("Failed to create payment:", error);
    }
  };

  // Reset để tạo thanh toán mới
  const handleReset = () => {
    setCheckoutUrl(null);
    setPaymentStatus(null);
    exit();
  };

  // Tự động tạo thanh toán và mở giao diện khi trang load
  useEffect(() => {
    const loadPayment = async () => {
      if (!checkoutUrl && paymentStatus !== "success") {
        console.log("Creating payment...");
        await createPayment(
          5000,
          "Thanh toán học phí",
          "BANK_TRANSFER",
          "",
          "Enrollment",
          "http://localhost:3000/payment/success",
          "http://localhost:3000/payment/expired"
        );
      }

      if (checkoutUrl && paymentStatus !== "success" && isClient) {
        if (checkoutUrl.startsWith("https://")) {
          console.log("Opening payment with checkoutUrl:", checkoutUrl);
          open();
        } else {
          console.error("Invalid checkoutUrl:", checkoutUrl);
        }
      }
    };

    loadPayment();
  }, [checkoutUrl, paymentStatus, open, isClient]);

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Payment Test Page</h1>

      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Payment UI</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Giao diện thanh toán nhúng
          </p>

          {paymentStatus !== "success" && (
            <div className="mb-4">
              <p><strong>Tên sản phẩm:</strong> Thanh toán học phí</p>
              <p><strong>Giá tiền:</strong> 5000 VNĐ</p>
              <p><strong>Số lượng:</strong> 1</p>
              {checkoutUrl && !paymentStatus && (
                <div className="mt-4">
                  <p className="text-center">Quét mã QR để thanh toán</p>
                  <p className="text-center text-sm text-gray-500">
                    Sau khi thanh toán, vui lòng đợi 5-10 giây để hệ thống cập nhật.
                  </p>
                </div>
              )}
            </div>
          )}

          {paymentStatus === "success" && (
            <div className="mt-4">
              <p className="text-green-600 font-semibold">Thanh toán thành công!</p>
              <Button
                className="bg-blue-500 hover:bg-blue-600 mt-2"
                onClick={handleReset}
              >
                Quay lại trang thanh toán
              </Button>
            </div>
          )}
        </div>

        <div id="embeded-payment-container" className="h-[350px] border border-red-500">
          {checkoutUrl && !paymentStatus && !payOSConfig.CHECKOUT_URL && (
            <p className="text-center">Đang tải mã QR...</p>
          )}
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Success Page</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Xem trang thanh toán thành công
          </p>
          <Link href="/payment/success">
            <Button className="bg-green-500 hover:bg-green-600">Xem Success</Button>
          </Link>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Expired Page</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Xem trang đơn hàng hết hạn
          </p>
          <Link href="/payment/expired">
            <Button className="bg-red-500 hover:bg-red-600">Xem Expired</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}