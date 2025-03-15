"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { AxiosFactory } from "@/lib/axios"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [courseId, setCourseId] = useState<string | null>(null)

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Lấy thông tin thanh toán từ URL params
        const orderCodeParam = searchParams.get("orderCode")
        const courseIdParam = searchParams.get("courseId")
        const userId = searchParams.get("userId")
        const userName = searchParams.get("userName")
        const courseName = searchParams.get("courseName")

        if (!orderCodeParam || !courseIdParam || !userId) {
          setErrorMessage("Thiếu thông tin cần thiết để xử lý thanh toán")
          setIsProcessing(false)
          return
        }

        // Convert orderCode to number
        const orderCode = Number.parseInt(orderCodeParam)

        if (isNaN(orderCode)) {
          setErrorMessage("Mã đơn hàng không hợp lệ")
          setIsProcessing(false)
          return
        }

        setCourseId(courseIdParam)

        // 1. Lấy thông tin payment từ DB
        const paymentApi = AxiosFactory.getApiInstance("payment")
        const paymentResponse = await paymentApi.get(`/payments/order/${orderCode}`)

        if (!paymentResponse.data || !paymentResponse.data.id) {
          throw new Error("Không thể lấy thông tin thanh toán")
        }

        // 2. Tạo enrollment với trạng thái ACTIVE
        const enrollmentApi = AxiosFactory.getJwtInstance("enrollment")
        await enrollmentApi.post("/enrollment", {
          courseId: courseIdParam,
          userId,
          userName,
          courseName,
          isFree: false,
          paymentId: paymentResponse.data.id,
          status: "ACTIVE", // Đặt trạng thái là ACTIVE ngay lập tức
        })

        setIsProcessing(false)
      } catch (error) {
        console.error("Error processing payment:", error)
        setErrorMessage("Không thể xử lý thanh toán. Vui lòng liên hệ hỗ trợ.")
        setIsProcessing(false)
      }
    }

    processPayment()
  }, [searchParams])

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
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-green-600 mb-4">Thanh toán thành công!</h1>

              {errorMessage ? (
                <p className="text-red-500 mb-6">{errorMessage}</p>
              ) : (
                <p className="text-gray-600 mb-6">
                  Cảm ơn bạn đã thanh toán. Bạn đã được đăng ký vào khóa học và có thể bắt đầu học ngay bây giờ.
                </p>
              )}

              <div className="flex justify-center">
                <Link href={courseId ? `/learning/${courseId}` : "/courses"}>
                  <Button className="bg-orange-500 hover:bg-orange-600">Bắt đầu học ngay</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

