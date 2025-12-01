import {
  RevenueShareSummary,
  formatCurrency,
} from "@/actions/revenueShareActions";

import { Card, CardContent } from "@/components/ui/card";

interface RevenueSummaryCardsProps {
  summary: RevenueShareSummary | null;
  isLoading?: boolean;
}

export default function RevenueSummaryCards({
  summary,
  isLoading,
}: RevenueSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">
                Tổng doanh thu
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {summary ? formatCurrency(summary.totalRevenue) : "0 ₫"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {summary?.totalTransactions || 0} giao dịch
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
                Hoa hồng nhận được
              </p>
              <p className="text-2xl font-bold text-green-600">
                {summary
                  ? formatCurrency(summary.totalInstructorAmount)
                  : "0 ₫"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Tỷ lệ TB: {summary?.averageCommissionRate.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">Khóa học</p>
              <p className="text-2xl font-bold text-purple-600">
                {summary?.coursesCount || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                khóa học có doanh thu
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
