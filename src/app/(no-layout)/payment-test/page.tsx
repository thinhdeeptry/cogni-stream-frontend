// src/app/(no-layout)/payment-test/page.tsx
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function PaymentTestPage() {
  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Payment Test Page</h1>
      
      <div className="grid gap-4">
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Payment UI</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Xem giao diện thanh toán
          </p>
          <Link href="/payment/test-id">
            <Button className="bg-orange-500 hover:bg-orange-600">Xem Payment</Button>
          </Link>
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
  )
}