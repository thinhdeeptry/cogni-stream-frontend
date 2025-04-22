import Link from "next/link";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ExpiredPage() {
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
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Đơn hàng đã hết hạn
          </h1>
          <p className="text-gray-600 mb-6">
            Đơn hàng của bạn đã hết hạn thanh toán. Vui lòng thử lại.
          </p>
          <div className="flex justify-center">
            <Link href="/courses">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Quay lại khóa học
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
