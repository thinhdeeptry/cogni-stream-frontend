"use client";

import Link from "next/link";
import React, { useEffect } from "react";

import { toast } from "@/hooks/use-toast";
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Layers,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  RecentCommissionActivity,
  useCommissionStore,
} from "@/stores/useCommissionStore";

import { Badge } from "@/components/ui/badge";
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

// Recent Activity Component
const RecentActivityCard: React.FC<{
  activities: RecentCommissionActivity[];
}> = ({ activities }) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "header":
        return <Layers className="h-4 w-4" />;
      case "detail":
        return <FileText className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "created":
        return (
          <Badge className="text-xs bg-green-100 text-green-800">
            ✓ Tạo mới
          </Badge>
        );
      case "updated":
        return (
          <Badge className="text-xs bg-blue-100 text-blue-800">
            📝 Cập nhật
          </Badge>
        );
      case "activated":
        return (
          <Badge className="text-xs bg-emerald-100 text-emerald-800">
            🟢 Kích hoạt
          </Badge>
        );
      case "deactivated":
        return (
          <Badge className="text-xs bg-yellow-100 text-yellow-800">
            ⏸️ Tạm dừng
          </Badge>
        );
      case "deleted":
        return (
          <Badge className="text-xs bg-red-100 text-red-800">❌ Xóa</Badge>
        );
      default:
        return (
          <Badge className="text-xs bg-gray-100 text-gray-800">{action}</Badge>
        );
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Vừa xong";
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Hoạt động gần đây
        </CardTitle>
        <CardDescription>Các thay đổi commission mới nhất</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              Chưa có hoạt động nào
            </p>
          ) : (
            activities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-slate-100 rounded-full mt-0.5">
                      {getTypeIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm text-slate-900 leading-tight">
                          {activity.title}
                        </h4>
                        {getActionBadge(activity.action)}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {truncateText(activity.description)}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>{getTimeAgo(activity.timestamp)}</span>
                        {activity.metadata?.headerName && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">
                              {activity.metadata.headerName}
                            </span>
                          </>
                        )}
                        {activity.metadata?.courseName && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">
                              {activity.metadata.courseName}
                            </span>
                          </>
                        )}
                        {activity.metadata?.categoryName && (
                          <>
                            <span>•</span>
                            <span className="text-purple-600">
                              {activity.metadata.categoryName}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Commission Rates */}
                      {activity.metadata?.platformRate &&
                        activity.metadata?.instructorRate && (
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <div className="flex items-center gap-1 text-slate-500">
                              <span>
                                Platform: {activity.metadata.platformRate}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-500">
                              <span>
                                Giảng viên: {activity.metadata.instructorRate}%
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {activities.length > 5 && (
          <div className="mt-3 text-center">
            <Button variant="outline" size="sm">
              Xem thêm ({activities.length - 5})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function CommissionDashboard() {
  const {
    stats,
    recentActivities,
    isLoadingStats,
    fetchStats,
    fetchHeaders,
    fetchDetails,
    fetchRecentActivities,
  } = useCommissionStore();

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchStats(),
          fetchHeaders({ limit: 5 }),
          fetchDetails({ limit: 5 }),
          fetchRecentActivities(),
        ]);
      } catch (error) {
        console.error("Error initializing commission data:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu commission",
          variant: "destructive",
        });
      }
    };

    initializeData();
  }, [fetchStats, fetchHeaders, fetchDetails, fetchRecentActivities]);

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
            💰 Quản Lý Commission
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
          <Button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600">
            <Settings className="h-4 w-4" />
            Cấu hình mới
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Commission Headers"
          count={overviewStats.headers}
          icon={<Layers className="h-5 w-5" />}
          color="blue"
          href="/admin/commission/headers"
          description="Cấu hình hoa hồng chính"
        />

        <StatsCard
          title="Commission Details"
          count={overviewStats.details}
          icon={<FileText className="h-5 w-5" />}
          color="green"
          href="/admin/commission/details"
          description="Chi tiết hoa hồng cụ thể"
        />

        <StatsCard
          title="Headers Đang Áp Dụng"
          count={overviewStats.activeHeaders}
          icon={<CheckCircle className="h-5 w-5" />}
          color="purple"
          description="Cấu hình hoa hồng đang hoạt động"
        />

        <StatsCard
          title="Details Đang Áp Dụng"
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
              Commission Headers
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
                  Quản lý Headers
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Commission Details
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
                  Quản lý Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <RecentActivityCard activities={recentActivities} />

        {/* System Status & Quick Stats */}
        <div className="space-y-6">
          {/* Commission Types Distribution */}
          {stats?.headers && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  Phân bổ loại Commission
                </CardTitle>
                <CardDescription>
                  Thống kê theo loại commission header
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Theo phần trăm:</span>
                    <span className="font-medium text-blue-600">
                      {stats.headers.percentageType} headers
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Cố định:</span>
                    <span className="font-medium text-green-600">
                      {stats.headers.fixedType} headers
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-slate-800 font-medium">
                      Tổng cộng:
                    </span>
                    <span className="font-bold">{stats.headers.total}</span>
                  </div>

                  {/* Percentage Distribution */}
                  <div className="pt-2">
                    <div className="flex gap-1 mb-2">
                      <div
                        className="h-2 bg-blue-500 rounded-l"
                        style={{
                          width: `${(stats.headers.percentageType / stats.headers.total) * 100}%`,
                        }}
                      ></div>
                      <div
                        className="h-2 bg-green-500 rounded-r"
                        style={{
                          width: `${(stats.headers.fixedType / stats.headers.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>
                        Phần trăm (
                        {Math.round(
                          (stats.headers.percentageType / stats.headers.total) *
                            100,
                        )}
                        %)
                      </span>
                      <span>
                        Cố định (
                        {Math.round(
                          (stats.headers.fixedType / stats.headers.total) * 100,
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Details Distribution */}
          {stats?.details && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Phạm vi áp dụng Details
                </CardTitle>
                <CardDescription>
                  Thống kê theo phạm vi áp dụng commission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Khóa học cụ thể:</span>
                    <span className="font-medium text-blue-600">
                      {stats.details.courseSpecific}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Danh mục cụ thể:</span>
                    <span className="font-medium text-green-600">
                      {stats.details.categorySpecific}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tổng quát:</span>
                    <span className="font-medium text-purple-600">
                      {stats.details.general}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-slate-800 font-medium">
                      Tổng cộng:
                    </span>
                    <span className="font-bold">{stats.details.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
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
            Trạng thái hệ thống Commission
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
                Hệ thống Commission hoạt động bình thường!
              </h4>
              <p className="text-sm text-green-700 mt-1">
                {overviewStats.activeHeaders} headers và{" "}
                {overviewStats.activeDetails} details đang hoạt động
              </p>
            </div>
          ) : (
            <div className="text-center py-3">
              <div className="p-2 bg-yellow-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <h4 className="font-medium text-yellow-900">
                Cần cấu hình Commission
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Hãy tạo và kích hoạt các cấu hình commission để hệ thống hoạt
                động
              </p>
              <div className="flex gap-2 justify-center mt-3">
                <Link href="/admin/commission/headers">
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                    Tạo Header
                  </Button>
                </Link>
                <Link href="/admin/commission/details">
                  <Button size="sm" variant="outline">
                    Tạo Detail
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
