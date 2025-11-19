import { TrendingUp } from "lucide-react";

import {
  RevenueShareSummary,
  formatCurrency,
} from "@/actions/revenueShareActions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueShareBreakdownProps {
  summary: RevenueShareSummary;
}

export default function RevenueShareBreakdown({
  summary,
}: RevenueShareBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Phân chia doanh thu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Phân chia doanh thu</span>
            <span className="text-sm text-slate-500">
              {(
                (summary.totalInstructorAmount / summary.totalRevenue) *
                100
              ).toFixed(1)}
              % cho tôi /{" "}
              {(
                (summary.totalPlatformAmount / summary.totalRevenue) *
                100
              ).toFixed(1)}
              % cho nền tảng
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="flex h-4 rounded-full overflow-hidden">
              <div
                className="bg-green-500"
                style={{
                  width: `${(summary.totalInstructorAmount / summary.totalRevenue) * 100}%`,
                }}
              ></div>
              <div
                className="bg-blue-500"
                style={{
                  width: `${(summary.totalPlatformAmount / summary.totalRevenue) * 100}%`,
                }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>
                Hoa hồng của tôi:{" "}
                {formatCurrency(summary.totalInstructorAmount)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>
                Phí nền tảng: {formatCurrency(summary.totalPlatformAmount)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
