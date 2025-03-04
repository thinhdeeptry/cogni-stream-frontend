// src/app/(no-layout)/payment/[id]/page.tsx
import { SonnerProvider } from './SonnerProvider'
import { PaymentClient } from './PaymentClient'

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            F8
          </div>
        </div>
        <SonnerProvider>
          <PaymentClient />
        </SonnerProvider>
      </div>
    </div>
  )
}