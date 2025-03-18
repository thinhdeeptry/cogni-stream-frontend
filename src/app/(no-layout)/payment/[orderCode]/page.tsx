"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { AxiosFactory } from "@/lib/axios"
import { usePayOS } from "@payos/payos-checkout"

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success" | "error">("pending")
  const [errorMessage, setErrorMessage] = useState("")
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds

  // Get the orderId from URL params and convert to number
  const orderId = Number.parseInt(params.orderCode as string)

  // PayOS configuration
  const [payOSConfig, setPayOSConfig] = useState({
    RETURN_URL: "http://localhost:3000/payment/success", // required
    ELEMENT_ID: "embedded-payment-container", // required
    CHECKOUT_URL: "", // required
    embedded: true, // Use embedded UI
    onSuccess: (event: any) => {
      handlePaymentSuccess()
    },
  })

  const { open, exit } = usePayOS(payOSConfig)

  // Fetch payment data
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        console.log("Fetching payment data for orderId:", orderId)
        const response = await AxiosFactory.getApiInstance("payment").get(`/payments/order/${orderId}`)
        console.log("Payment data response:", response.data)

        if (response.data) {
          setPaymentData(response.data)

          // Set the checkout URL for PayOS
          setPayOSConfig((oldConfig) => ({
            ...oldConfig,
            CHECKOUT_URL: response.data.checkoutUrl,
          }))

          // Check if payment is already expired or completed
          if (response.data.status === "EXPIRED") {
            router.push("/payment/expired")
            return
          } else if (response.data.status === "COMPLETED") {
            setPaymentStatus("success")

            // Redirect to success page with all necessary parameters
            const redirectUrl = new URL(response.data.returnUrl || "/payment/success", window.location.origin)

            // Add metadata as query parameters
            if (response.data.metadata) {
              Object.entries(response.data.metadata).forEach(([key, value]) => {
                redirectUrl.searchParams.append(key, value as string)
              })
            }

            // Add orderCode
            redirectUrl.searchParams.append("orderCode", orderId.toString())

            // Redirect after a short delay
            setTimeout(() => {
              router.push(redirectUrl.toString())
            }, 1500)

            return
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch payment data:", error)
        setErrorMessage("Failed to load payment information. Please try again.")
        setPaymentStatus("error")
        setLoading(false)
      }
    }

    fetchPaymentData()
  }, [orderId, router])

  // Open PayOS when checkout URL is available
  useEffect(() => {
    if (payOSConfig.CHECKOUT_URL) {
      open()
    }
  }, [payOSConfig, open])

  // Countdown timer for payment expiration
  useEffect(() => {
    if (!loading && paymentStatus === "pending") {
      const timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer)
            // Mark payment as expired
            handlePaymentExpired()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [loading, paymentStatus])

  // Format time left as MM:SS
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Handle payment expiration
  const handlePaymentExpired = async () => {
    try {
      exit() // Close PayOS QR code
      // Update payment status to EXPIRED
      await AxiosFactory.getApiInstance("payment").put(`/payments/order/${orderId}/status`, {
        status: "EXPIRED",
      })

      // Redirect to expired page
      router.push("/payment/expired")
    } catch (error) {
      console.error("Error marking payment as expired:", error)
      setErrorMessage("Có lỗi xảy ra khi cập nhật trạng thái thanh toán.")
      setPaymentStatus("error")
    }
  }

  // Xử lý khi thanh toán thành công
  const handlePaymentSuccess = async () => {
    try {
      console.log("Payment successful")
      setPaymentStatus("success")
      exit() // Close PayOS QR code

      // Update payment status to COMPLETED
      await AxiosFactory.getApiInstance("payment").put(`/payments/order/${orderId}/status`, {
        status: "COMPLETED",
      })

      // Redirect to success page with all necessary parameters
      const redirectUrl = new URL(paymentData.returnUrl || "/payment/success", window.location.origin)

      // Add all metadata as query parameters
      if (paymentData.metadata) {
        Object.entries(paymentData.metadata).forEach(([key, value]) => {
          redirectUrl.searchParams.append(key, value as string)
        })
      }

      // Add orderCode
      redirectUrl.searchParams.append("orderCode", orderId.toString())

      // Redirect after a short delay
      setTimeout(() => {
        router.push(redirectUrl.toString())
      }, 1500)
    } catch (error) {
      console.error("Error updating payment status:", error)
      setErrorMessage("Có lỗi xảy ra khi cập nhật trạng thái thanh toán.")
      setPaymentStatus("error")
    }
  }

  // Close PayOS QR code
  const handleClosePayOS = () => {
    exit()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  return (
    <div className="container max-w-3xl mx-auto p-4 space-y-6 min-h-screen flex flex-col justify-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Thanh toán khóa học</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : paymentStatus === "success" ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-lg font-medium">Thanh toán thành công!</p>
              <p className="text-sm text-muted-foreground text-center">
                Đang chuyển hướng đến trang khóa học của bạn...
              </p>
              {errorMessage && <p className="text-sm text-red-500 text-center mt-2">{errorMessage}</p>}
            </div>
          ) : paymentStatus === "error" ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <p className="text-lg font-medium">Đã xảy ra lỗi</p>
              <p className="text-sm text-red-500 text-center">{errorMessage}</p>
              <Button onClick={() => router.push("/courses")}>Quay lại trang khóa học</Button>
            </div>
          ) : paymentData ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-medium">Thông tin đơn hàng</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
                  <div>
                    <p className="text-sm text-muted-foreground">Khóa học</p>
                    <p className="font-medium">{paymentData.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
                    <p className="font-medium">{orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Số tiền</p>
                    <p className="font-medium">{formatPrice(paymentData.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Thời gian còn lại</p>
                    <p className="font-medium text-red-500">{formatTimeLeft()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Quét mã QR để thanh toán</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sử dụng ứng dụng ngân hàng để quét mã QR bên dưới và hoàn tất thanh toán
                </p>

                <div id="embedded-payment-container" className="w-full h-96"></div>
              </div>

              <div className="rounded-md bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                  Lưu ý: Sau khi thanh toán thành công, vui lòng không đóng trang này cho đến khi hệ thống chuyển hướng
                  tự động. Đơn hàng sẽ hết hạn sau {formatTimeLeft()}.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <p className="text-lg font-medium">Không tìm thấy thông tin thanh toán</p>
              <p className="text-sm text-red-500 text-center">
                Không thể tìm thấy thông tin thanh toán cho mã đơn hàng này. Vui lòng thử lại.
              </p>
              <Button onClick={() => router.push("/courses")}>Quay lại trang khóa học</Button>
            </div>
          )}
        </CardContent>

        {paymentStatus === "pending" && paymentData && (
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => router.push("/courses")}>
              Hủy thanh toán
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

