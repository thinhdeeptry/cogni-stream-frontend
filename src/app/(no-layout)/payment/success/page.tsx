// src/app/(no-layout)/payment/success/page.tsx
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { CheckCircle } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            F8
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-green-600 mb-4">
            Thanh toán thành công!
          </h1>
          <p className="text-gray-600 mb-6">
            Cảm ơn bạn đã thanh toán. Bạn có thể bắt đầu khóa học ngay bây giờ.
          </p>
          <div className="flex justify-center">
            <Link href="/courses">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Bắt đầu học ngay
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}