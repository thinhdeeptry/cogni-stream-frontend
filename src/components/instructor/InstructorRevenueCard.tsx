"use client";

import { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import {
  BookOpen,
  Calendar,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

// Import revenue actions
import {
  RevenueShareSummary,
  formatCurrency,
  getMySummary,
} from "@/actions/revenueShareActions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InstructorRevenueCardProps {
  className?: string;
}

export function InstructorRevenueCard({
  className = "",
}: InstructorRevenueCardProps) {
  const [revenueSummary, setRevenueSummary] =
    useState<RevenueShareSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchRevenueSummary();
  }, []);

  const fetchRevenueSummary = async () => {
    try {
      setIsLoading(true);
      const summary = await getMySummary();
      setRevenueSummary(summary);
    } catch (error) {
      console.error("Error fetching revenue summary:", error);
      // Don't show toast on first load failure - might not have revenue data yet
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchRevenueSummary();
      toast({
        title: "Thành công",
        description: "Dữ liệu doanh thu đã được cập nhật",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật dữ liệu doanh thu",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Tổng quan doanh thu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-3 w-14 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Tổng quan doanh thu
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!revenueSummary ? (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg mb-2">Chưa có doanh thu</p>
            <p className="text-slate-400 text-sm">
              Doanh thu sẽ xuất hiện khi có học viên mua khóa học của bạn
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm text-slate-600">Tổng doanh thu</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatCurrency(revenueSummary.totalRevenue)}
                </p>
                <p className="text-xs text-slate-500">
                  {revenueSummary.totalTransactions} giao dịch
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-slate-600">Hoa hồng</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(revenueSummary.totalInstructorAmount)}
                </p>
                <p className="text-xs text-slate-500">
                  TB: {revenueSummary.averageCommissionRate.toFixed(1)}%
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm text-slate-600">Khóa học</p>
                <p className="text-lg font-bold text-purple-600">
                  {revenueSummary.coursesCount}
                </p>
                <p className="text-xs text-slate-500">có doanh thu</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-sm text-slate-600">Lớp học</p>
                <p className="text-lg font-bold text-orange-600">
                  {revenueSummary.classesCount}
                </p>
                <p className="text-xs text-slate-500">có doanh thu</p>
              </div>
            </div>

            {/* Revenue Split Visualization */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Phân chia doanh thu</span>
                <span className="text-sm text-slate-500">
                  {(
                    (revenueSummary.totalInstructorAmount /
                      revenueSummary.totalRevenue) *
                    100
                  ).toFixed(1)}
                  % cho tôi
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500"
                    style={{
                      width: `${(revenueSummary.totalInstructorAmount / revenueSummary.totalRevenue) * 100}%`,
                    }}
                  ></div>
                  <div
                    className="bg-blue-500"
                    style={{
                      width: `${(revenueSummary.totalPlatformAmount / revenueSummary.totalRevenue) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>
                    Hoa hồng:{" "}
                    {formatCurrency(revenueSummary.totalInstructorAmount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>
                    Phí nền tảng:{" "}
                    {formatCurrency(revenueSummary.totalPlatformAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => (window.location.href = "/instructor/revenue")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Xem chi tiết doanh thu
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default InstructorRevenueCard;
