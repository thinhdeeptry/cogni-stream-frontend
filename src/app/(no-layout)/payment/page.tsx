// app/payment/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { ClipboardCopy } from 'lucide-react'
import { Sonner, toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface PaymentDetails {
  amount: number
  bankAccount: string
  bankName: string
  accountName: string
  reference: string
  qrCode: string
  expiresAt: string
}

export default function PaymentPage({ params }: { params: { id: string } }) {
  const [timeLeft, setTimeLeft] = useState<string>("")
  const [payment, setPayment] = useState<PaymentDetails>({
    amount: 1399000,
    bankAccount: "9353538222",
    bankName: "Vietcombank",
    accountName: "ĐẶNG NGỌC SƠN",
    reference: "DHG21R",
    qrCode: "/qr-code.png",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const expires = new Date(payment.expiresAt).getTime()
      const distance = expires - now

      if (distance < 0) {
        clearInterval(timer)
        setTimeLeft("00:00:00")
        return
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)
      setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
    }, 1000)

    return () => clearInterval(timer)
  }, [payment.expiresAt])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Đã sao chép ${label}`)
  }

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <Sonner position="top-right" />
      <Card className="w-full">
        <CardHeader className="text-center border-b">
          <CardTitle className="text-xl font-semibold">
            Quét mã QR để thanh toán
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Đơn hàng sẽ bị hủy sau: {timeLeft}
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6">
            {/* QR Code */}
            <div className="w-64 h-64 bg-white p-4 rounded-lg">
              <img
                src={payment.qrCode || "/placeholder.svg"}
                alt="QR Code"
                className="w-full h-full"
              />
            </div>

            <p className="text-sm text-center text-muted-foreground">
              Mở app ngân hàng và quét mã QR. Đảm bảo nội dung chuyển khoản là{" "}
              <span className="font-semibold">{payment.reference}</span>
            </p>

            {/* Bank Details */}
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ngân hàng</span>
                <span className="font-medium">{payment.bankName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Số tài khoản
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{payment.bankAccount}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      copyToClipboard(payment.bankAccount, "số tài khoản")
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
                <span className="font-medium">{payment.accountName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Số tiền</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {payment.amount.toLocaleString()}đ
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      copyToClipboard(payment.amount.toString(), "số tiền")
                    }
                  >
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Nội dung</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{payment.reference}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      copyToClipboard(payment.reference, "nội dung chuyển khoản")
                    }
                  >
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}