// src/app/(no-layout)/payment/[id]/PaymentClient.tsx
"use client"

import { useState, useEffect } from "react"
import { ClipboardCopy } from 'lucide-react'
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PaymentClient() {
  const [timeLeft, setTimeLeft] = useState<string>("14:59")
  
  // Static countdown timer for UI preview
  useEffect(() => {
    const timer = setInterval(() => {
      // Just for visual effect in the static UI
      const [minutes, seconds] = timeLeft.split(':').map(Number)
      let newSeconds = seconds - 1
      let newMinutes = minutes
      
      if (newSeconds < 0) {
        newSeconds = 59
        newMinutes -= 1
      }
      
      if (newMinutes < 0) {
        clearInterval(timer)
        setTimeLeft("00:00")
        return
      }
      
      setTimeLeft(`${newMinutes.toString().padStart(2, "0")}:${newSeconds.toString().padStart(2, "0")}`)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Đã sao chép ${label}`)
  }

  return (
    <Card className="w-full border-none shadow-none md:border md:shadow-sm">
      <CardHeader className="text-center border-b bg-white rounded-t-xl">
        <CardTitle className="text-xl font-semibold">
          Quét mã QR để thanh toán
        </CardTitle>
        <div className="flex items-center justify-center gap-2 text-sm text-red-500 font-medium">
          <span>Đơn hàng sẽ bị hủy sau:</span>
          <span className="font-bold">{timeLeft}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-6 bg-white rounded-b-xl">
        <div className="flex flex-col items-center space-y-6">
          {/* QR Code */}
          <div className="w-64 h-64 bg-white p-4 rounded-lg border">
            <img
              src="/placeholder.svg?height=240&width=240"
              alt="QR Code"
              className="w-full h-full"
            />
          </div>

          <p className="text-sm text-center text-muted-foreground">
            Mở app ngân hàng và quét mã QR. Đảm bảo nội dung chuyển khoản là{" "}
            <span className="font-semibold text-red-500">DHG21R</span>
          </p>

          {/* Bank Details */}
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ngân hàng</span>
              <span className="font-medium">Vietcombank</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Số tài khoản
              </span>
              <div className="flex items-center gap-2">
                <span className="font-medium">9353538222</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gray-100"
                  onClick={() =>
                    copyToClipboard("9353538222", "số tài khoản")
                  }
                >
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Tên tài khoản
              </span>
              <span className="font-medium">ĐẶNG NGỌC SƠN</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Số tiền</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  1.399.000đ
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gray-100"
                  onClick={() =>
                    copyToClipboard("1399000", "số tiền")
                  }
                >
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Nội dung</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-red-500">DHG21R</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gray-100"
                  onClick={() =>
                    copyToClipboard("DHG21R", "nội dung chuyển khoản")
                  }
                >
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="w-full pt-4 flex justify-center">
            <div className="flex items-center text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Thanh toán an toàn với SePay</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}