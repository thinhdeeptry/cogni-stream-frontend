import {
  TeacherPaymentSummary,
  formatCurrency,
} from "@/actions/paymentActions";

import { Card, CardContent } from "@/components/ui/card";

interface PaymentSummaryCardsProps {
  summary: TeacherPaymentSummary | null;
  isLoading?: boolean;
}

export default function PaymentSummaryCards({
  summary,
  isLoading,
}: PaymentSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="h-8 w-8 bg-gray-200 animate-pulse rounded mb-4"></div>
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mb-2"></div>
              <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">
                Tổng doanh thu
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {summary?.teacher?.totalRevenue
                  ? formatCurrency(summary.teacher.totalRevenue)
                  : "0 ₫"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">
                Đã thanh toán
              </p>
              <p className="text-2xl font-bold text-green-600">
                {summary?.teacher?.totalPaidOut
                  ? formatCurrency(summary.teacher.totalPaidOut)
                  : "0 ₫"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">
                Chờ thanh toán
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {summary?.teacher?.pendingPayout
                  ? formatCurrency(summary.teacher.pendingPayout)
                  : "0 ₫"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">
                Số lần thanh toán
              </p>
              <p className="text-2xl font-bold text-blue-600">
                {summary?.paymentHistory?.totalPayments || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
