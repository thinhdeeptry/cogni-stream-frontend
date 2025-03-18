"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AxiosFactory } from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

// Mock course data - in a real app, you would fetch this from an API
const getCourseById = (id: string) => ({
  id,
  name: "React.js Advanced",
  description: "Khóa học nâng cao về React.js, hooks, và state management",
  isFree: false,
  price: 5000,
  instructor: "Nguyễn Trọng Tiến",
  duration: "12 giờ",
  level: "Nâng cao",
})

// Mock user data - in a real app, you would get this from auth context
const mockUser = {
  id: "USER-1",
  name: "Nguyễn Văn A",
  email: "nguyenvana@example.com",
}

export default function EnrollmentPage() {
  const params = useParams()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [enrollmentStatus, setEnrollmentStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [orderId, setOrderId] = useState<number | null>(null)

  // Get the courseId from URL params
  const courseId = params.courseId as string
  const course = getCourseById(courseId)

  const handleEnroll = async () => {
    try {
      setIsProcessing(true)
      setEnrollmentStatus("idle")
      setStatusMessage("")

      if (course.isFree) {
        // Đối với khóa học miễn phí, tạo enrollment trực tiếp
        const enrollmentApi = AxiosFactory.getJwtInstance("enrollment")
        const response = await enrollmentApi.post("/enrollment", {
          courseId: course.id,
          userId: mockUser.id,
          userName: mockUser.name,
          courseName: course.name,
          isFree: true,
        })

        if (response.data) {
          setEnrollmentStatus("success")
          setStatusMessage("Bạn đã đăng ký khóa học miễn phí thành công.")

          // Redirect đến trang learning sau 2 giây
          setTimeout(() => {
            router.push(`/learning/${course.id}`)
          }, 2000)
        }
      } else {
        // Đối với khóa học trả phí, tạo payment
        const paymentApi = AxiosFactory.getApiInstance("payment")

        // Tạo orderCode là tổng của năm + tháng + ngày + giờ + phút + giây
        const now = new Date()
        const year = Number(String(now.getFullYear()).slice(-2))
        const month = Number(String(now.getMonth() + 1).padStart(2, "0"))
        const day = Number(String(now.getDate()).padStart(2, "0"))
        const hours = Number(String(now.getHours()).padStart(2, "0"))
        const minutes = Number(String(now.getMinutes()).padStart(2, "0"))
        const seconds = Number(String(now.getSeconds()).padStart(2, "0"))
        const orderCode = year + month + day + hours + minutes + seconds
        console.log("Generated orderCode:", orderCode)
        setOrderId(orderCode)

        // Tạo returnURL - URL mà người dùng sẽ được chuyển hướng đến sau khi thanh toán thành công
        const returnUrl = `${window.location.origin}/payment/success`
        console.log("returnUrl", returnUrl)

        // Tạo cancelURL - URL mà người dùng sẽ được chuyển hướng đến nếu hủy thanh toán
        const cancelUrl = `${window.location.origin}/course/${course.id}`

        const paymentData = {
          amount: course.price,
          method: "BANK_TRANSFER", // Phương thức thanh toán mặc định
          serviceName: "Enrollment",
          description: `${course.name}`,
          ordercode: orderCode,
          userId: mockUser.id,
          serviceId: course.id, // ID của khóa học
          returnUrl: returnUrl,
          cancelUrl: cancelUrl,
          // Thêm metadata để sử dụng sau khi thanh toán và hiển thị trên trang thanh toán
          metadata: {
            courseId: course.id,
            userId: mockUser.id,
            userName: mockUser.name,
            courseName: course.name,
            serviceType: "COURSE_ENROLLMENT",
            // Thêm thông tin mới theo yêu cầu
            instructor: course.instructor,
            duration: course.duration,
            level: course.level,
          },
        }

        console.log("Sending payment data:", paymentData)

        const response = await paymentApi.post("/payments", paymentData)

        if (response.data && response.data.checkoutUrl) {
          console.log("Payment response:", response.data)

          // Chuyển hướng đến trang thanh toán với QR code nhúng
          router.push(`/payment/${orderCode}`)
        } else {
          throw new Error("Không thể tạo trang thanh toán")
        }
      }
    } catch (error) {
      console.error("Error:", error)

      let errorMessage = "Có lỗi xảy ra. Vui lòng thử lại sau."

      if (error.response) {
        console.error("Error response:", error.response.data)
        errorMessage = error.response.data.message || "Có lỗi xảy ra khi đăng ký khóa học. Vui lòng thử lại sau."
      } else if (error.request) {
        console.error("Network error:", error.request)
        errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng của bạn."
      }

      setStatusMessage(errorMessage)
      setEnrollmentStatus("error")
    } finally {
      setIsProcessing(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Thông tin khóa học</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl">{course.name}</CardTitle>
            <Badge variant={course.isFree ? "secondary" : "default"}>{course.isFree ? "Miễn phí" : "Trả phí"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{course.description}</p>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold">Giảng viên:</span> {course.instructor}
            </div>
            <div>
              <span className="font-semibold">Thời lượng:</span> {course.duration}
            </div>
            <div>
              <span className="font-semibold">Trình độ:</span> {course.level}
            </div>
            {!course.isFree && (
              <div>
                <span className="font-semibold">Giá:</span> {formatPrice(course.price)}
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
                enrollmentStatus === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              {statusMessage}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleEnroll} disabled={isProcessing}>
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
  )
}

