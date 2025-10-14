"use client";

import Link from "next/link";
import React, { useEffect } from "react";

import { toast } from "@/hooks/use-toast";
import { CheckCircle, Clock, DollarSign, FileText, Layers } from "lucide-react";

import { useCommissionStore } from "@/stores/useCommissionStore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Types for pending stats
interface CommissionOverview {
  headers: number;
  details: number;
  activeHeaders: number;
  activeDetails: number;
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: "yellow" | "blue" | "green" | "orange" | "purple";
  href?: string;
  description?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  count,
  icon,
  color,
  href,
  description,
}) => {
  const colorClasses = {
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  };

  const CardWrapper = href
    ? ({ children }: { children: React.ReactNode }) => (
        <Link href={href}>
          <Card
            className={`cursor-pointer hover:shadow-md transition-shadow ${colorClasses[color]} border-2`}
          >
            {children}
          </Card>
        </Link>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <Card className={`${colorClasses[color]} border-2`}>{children}</Card>
      );

  return (
    <CardWrapper>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{count}</div>
        {description && (
          <p className="text-xs opacity-80 mt-1">{description}</p>
        )}
      </CardContent>
    </CardWrapper>
  );
};

export default function CommissionDashboard() {
  const { stats, isLoadingStats, fetchStats, fetchHeaders, fetchDetails } =
    useCommissionStore();

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchStats(),
          fetchHeaders({ limit: 5 }),
          fetchDetails({ limit: 5 }),
        ]);
      } catch (error) {
        console.error("Error initializing commission data:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu hoa hồng",
          variant: "destructive",
        });
      }
    };

    initializeData();
  }, [fetchStats, fetchHeaders, fetchDetails]);

  // Calculate overview stats from store data
  const overviewStats: CommissionOverview = {
    headers: stats?.summary.totalHeaders || 0,
    details: stats?.summary.totalDetails || 0,
    activeHeaders: stats?.summary.activeHeaders || 0,
    activeDetails: stats?.summary.activeDetails || 0,
  };

  if (isLoadingStats) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-500">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6 bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            Quản Lý Hoa Hồng
          </h1>
          <p className="text-slate-500">
            Cấu hình và quản lý hoa hồng cho giảng viên
          </p>
        </div>

        <div className="flex gap-3">
          {stats?.summary.lastUpdated && (
            <div className="text-sm text-slate-500 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Cập nhật:{" "}
              {new Date(stats.summary.lastUpdated).toLocaleString("vi-VN")}
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Cấu Hình Hoa Hồng"
          count={overviewStats.headers}
          icon={<Layers className="h-5 w-5" />}
          color="blue"
          href="/admin/commission/headers"
          description="Cấu hình hoa hồng chính"
        />

        <StatsCard
          title="Chi Tiết Hoa Hồng"
          count={overviewStats.details}
          icon={<FileText className="h-5 w-5" />}
          color="green"
          href="/admin/commission/details"
          description="Chi tiết hoa hồng cụ thể"
        />

        <StatsCard
          title="Cấu Hình Đang Hoạt Động"
          count={overviewStats.activeHeaders}
          icon={<CheckCircle className="h-5 w-5" />}
          color="purple"
          description="Cấu hình hoa hồng đang hoạt động"
        />

        <StatsCard
          title="Chi Tiết Đang Áp Dụng"
          count={overviewStats.activeDetails}
          icon={<DollarSign className="h-5 w-5" />}
          color="yellow"
          description="Chi tiết hoa hồng đang áp dụng"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              Cấu Hình Hoa Hồng
            </CardTitle>
            <CardDescription>
              {overviewStats.headers} cấu hình hoa hồng •{" "}
              {overviewStats.activeHeaders} đang hoạt động
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Đang hoạt động:</span>
                <span className="font-medium text-green-600">
                  {overviewStats.activeHeaders}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tạm dừng:</span>
                <span className="font-medium text-yellow-600">
                  {overviewStats.headers - overviewStats.activeHeaders}
                </span>
              </div>
              <Link href="/admin/commission/headers">
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Quản lý Cấu Hình
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Chi Tiết Hoa Hồng
            </CardTitle>
            <CardDescription>
              {overviewStats.details} chi tiết hoa hồng •{" "}
              {overviewStats.activeDetails} đang áp dụng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Đang áp dụng:</span>
                <span className="font-medium text-green-600">
                  {overviewStats.activeDetails}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tạm dừng:</span>
                <span className="font-medium text-yellow-600">
                  {overviewStats.details - overviewStats.activeDetails}
                </span>
              </div>
              <Link href="/admin/commission/details">
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                  Quản lý Chi Tiết
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Status */}
      <Card
        className={`${
          overviewStats.activeHeaders > 0 && overviewStats.activeDetails > 0
            ? "bg-green-50 border-green-200"
            : "bg-yellow-50 border-yellow-200"
        }`}
      >
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle
              className={`h-5 w-5 ${
                overviewStats.activeHeaders > 0 &&
                overviewStats.activeDetails > 0
                  ? "text-green-600"
                  : "text-yellow-600"
              }`}
            />
            Trạng Thái Hệ Thống Hoa Hồng
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overviewStats.activeHeaders > 0 &&
          overviewStats.activeDetails > 0 ? (
            <div className="text-center py-3">
              <div className="p-2 bg-green-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-green-900">
                Hệ thống hoa hồng hoạt động bình thường!
              </h4>
              <p className="text-sm text-green-700 mt-1">
                {overviewStats.activeHeaders} cấu hình và{" "}
                {overviewStats.activeDetails} chi tiết đang hoạt động
              </p>
            </div>
          ) : (
            <div className="text-center py-3">
              <div className="p-2 bg-yellow-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <h4 className="font-medium text-yellow-900">
                Cần cấu hình hoa hồng
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Hãy tạo và kích hoạt các cấu hình hoa hồng để hệ thống hoạt động
              </p>
              <div className="flex gap-2 justify-center mt-3">
                <Link href="/admin/commission/headers">
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                    Tạo Cấu Hình
                  </Button>
                </Link>
                <Link href="/admin/commission/details">
                  <Button size="sm" variant="outline">
                    Tạo Chi Tiết
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
