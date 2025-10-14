"use client";

import Link from "next/link";
import React, { useEffect } from "react";

import { toast } from "@/hooks/use-toast";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";

import { RecentActivity, useApprovalStore } from "@/stores/useApprovalStore";

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
interface PendingStats {
  courses: number;
  classes: number;
  lessons: number;
  prices: number;
  total: number;
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
const RecentActivityCard: React.FC<{ activities: RecentActivity[] }> = ({
  activities,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "course":
        return <BookOpen className="h-4 w-4" />;
      case "class":
        return <GraduationCap className="h-4 w-4" />;
      case "lesson":
        return <FileText className="h-4 w-4" />;
      case "price":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionBadge = (action: string, status: string) => {
    switch (action) {
      case "approved":
        return (
          <Badge className="text-xs bg-green-100 text-green-800">
            ✓ Đã duyệt
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="text-xs bg-red-100 text-red-800">
            ✗ Đã từ chối
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="text-xs bg-yellow-100 text-yellow-800">
            ⏳ Chờ duyệt
          </Badge>
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
    if (!text) return "";
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
        <CardDescription>Các hoạt động xét duyệt mới nhất</CardDescription>
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
                        {getActionBadge(activity.action, activity.status)}
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {truncateText(activity.description)}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          {activity.instructor.image ? (
                            <img
                              src={activity.instructor.image}
                              alt={activity.instructor.name}
                              className="w-4 h-4 rounded-full"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-xs text-slate-600">
                              {activity.instructor.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span>{activity.instructor.name}</span>
                        </div>
                        <span>•</span>
                        <span>{getTimeAgo(activity.timestamp)}</span>
                        {activity.course?.category && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">
                              {activity.course.category}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <div className="flex items-center gap-1 text-slate-500">
                          <span>
                            {activity.metadata.counters.chapters} chương
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <span>
                            {activity.metadata.counters.enrollments} học viên
                          </span>
                        </div>
                      </div>

                      {/* Rejection Reason */}
                      {activity.action === "rejected" &&
                        activity.rejectionReason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded text-xs">
                            <span className="text-red-600 font-medium">
                              Lý do từ chối:{" "}
                            </span>
                            <span className="text-red-700">
                              {truncateText(
                                activity.rejectionReason.split("\n")[0],
                                40,
                              )}
                            </span>
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

export default function ApprovalsDashboard() {
  const {
    stats,
    recentActivities,
    isLoadingStats,
    fetchApprovalStats,
    fetchPendingCourses,
    fetchPendingClasses,
    fetchPendingLessons,
  } = useApprovalStore();

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchApprovalStats(),
          fetchPendingCourses(),
          fetchPendingClasses(),
          fetchPendingLessons(),
        ]);
      } catch (error) {
        console.error("Error initializing approval data:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu xét duyệt",
          variant: "destructive",
        });
      }
    };

    initializeData();
  }, [
    fetchApprovalStats,
    fetchPendingCourses,
    fetchPendingClasses,
    fetchPendingLessons,
  ]);

  // Calculate pending stats from store data
  const pendingStats = {
    courses: stats?.summary.totalPendingCourses || 0,
    classes: stats?.summary.totalPendingClasses || 0,
    lessons: stats?.summary.totalPendingLessons || 0,
    prices: stats?.summary.totalPendingPrices || 0,
    total: stats?.summary.totalPendingItems || 0,
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
            🔍 Xét Duyệt Nội Dung
          </h1>
          <p className="text-slate-500">
            Duyệt khóa học, lớp học và bài học từ giảng viên
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatsCard
          title="Khóa học chờ duyệt"
          count={pendingStats.courses}
          icon={<BookOpen className="h-5 w-5" />}
          color="yellow"
          href="/admin/approvals/courses"
          description="Khóa học chờ duyệt"
        />

        <StatsCard
          title="Lớp học chờ duyệt"
          count={pendingStats.classes}
          icon={<GraduationCap className="h-5 w-5" />}
          color="blue"
          href="/admin/approvals/classes"
          description="Lớp học live chờ xuất bản"
        />

        <StatsCard
          title="Bài học chờ duyệt"
          count={pendingStats.lessons}
          icon={<FileText className="h-5 w-5" />}
          color="green"
          href="/admin/approvals/lessons"
          description="Bài học video và tài liệu"
        />

        <StatsCard
          title="Giá chờ duyệt"
          count={pendingStats.prices}
          icon={<DollarSign className="h-5 w-5" />}
          color="purple"
          href="/admin/approvals/prices"
          description="Giá khóa học chờ duyệt"
        />

        <StatsCard
          title="Tổng cần xử lý"
          count={pendingStats.total}
          icon={<Clock className="h-5 w-5" />}
          color="orange"
          description={`${pendingStats.total > 0 ? "Cần xem xét ngay" : "Tất cả đã xử lý"}`}
        />
      </div>

      {/* Quick Actions */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-yellow-600" />
              Khóa học
            </CardTitle>
            <CardDescription>
              {pendingStats.courses} khóa học chờ xét duyệt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Chờ duyệt:</span>
                <span className="font-medium">{pendingStats.courses}</span>
              </div>
              <Link href="/admin/approvals/courses">
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
                  Xem danh sách khóa học
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Lớp học
            </CardTitle>
            <CardDescription>
              {pendingStats.classes} lớp học chờ xét duyệt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Chờ duyệt xuất bản:</span>
                <span className="font-medium">{pendingStats.classes}</span>
              </div>
              <Link href="/admin/approvals/classes">
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Xem danh sách lớp học
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Bài học
            </CardTitle>
            <CardDescription>
              {pendingStats.lessons} bài học chờ xét duyệt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Chờ duyệt:</span>
                <span className="font-medium">{pendingStats.lessons}</span>
              </div>
              <Link href="/admin/approvals/lessons">
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                  Xem danh sách bài học
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Trends & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Daily Submissions Trend + System Insights */}
        <div className="space-y-6">
          {/* Daily Submissions Trend */}
          {stats?.trends && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Xu hướng nộp bài trong 7 ngày qua
                </CardTitle>
                <CardDescription>
                  Số lượng nội dung được nộp mỗi ngày
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.trends.dailySubmissions.map((day) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-600">
                        {new Date(day.date).toLocaleDateString("vi-VN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {day.courses > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-yellow-50 text-yellow-700"
                            >
                              {day.courses}K
                            </Badge>
                          )}
                          {day.classes > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700"
                            >
                              {day.classes}L
                            </Badge>
                          )}
                          {day.lessons > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-50 text-green-700"
                            >
                              {day.lessons}B
                            </Badge>
                          )}
                          {day.prices > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-purple-50 text-purple-700"
                            >
                              {day.prices}P
                            </Badge>
                          )}
                        </div>
                        <span className="font-medium w-8 text-right">
                          {day.total}
                        </span>
                      </div>
                    </div>
                  ))}
                  {stats.trends.dailySubmissions.every(
                    (day) => day.total === 0,
                  ) && (
                    <div className="text-center py-4 text-slate-500">
                      <p className="text-sm">
                        Không có submissions trong 7 ngày qua
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>K: Khóa học, L: Lớp học, B: Bài học, P: Giá</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Insights & Recommendations */}
          {/* {stats?.insights && (
            <Card
              className={
                pendingStats.total > 0
                  ? "bg-orange-50 border-orange-200"
                  : "bg-green-50 border-green-200"
              }
            >
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock
                    className={`h-5 w-5 ${pendingStats.total > 0 ? "text-orange-600" : "text-green-600"}`}
                  />
                  {pendingStats.total > 0
                    ? "Mục ưu tiên cao"
                    : "Trạng thái xét duyệt"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingStats.total > 0 ? (
                  <div className="space-y-3">
                    {stats.courses.oldestPending && (
                      <div className="p-3 bg-white rounded-lg border border-orange-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-sm text-orange-900">
                              {stats.courses.oldestPending.title}
                            </h4>
                            <p className="text-xs text-orange-700 mt-1">
                              Bởi {stats.courses.oldestPending.instructor.name}{" "}
                              • Chờ {stats.courses.oldestPending.daysPending}{" "}
                              ngày
                            </p>
                          </div>
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            Cấp bách
                          </Badge>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white flex-1">
                        Xử lý ngay
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <div className="p-2 bg-green-100 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="font-medium text-green-900">
                      Tất cả đã xử lý xong!
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      Không có nội dung nào chờ xét duyệt
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )} */}
        </div>

        {/* Right Column: Recent Activities */}
        <RecentActivityCard activities={recentActivities} />
      </div>

      {/* Detailed Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Course Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Thống kê khóa học
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Chờ duyệt:</span>
                  <span className="font-medium text-yellow-600">
                    {stats.courses.pendingApproval}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Đã duyệt:</span>
                  <span className="font-medium text-green-600">
                    {stats.courses.approved}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Đã xuất bản:</span>
                  <span className="font-medium text-blue-600">
                    {stats.courses.published}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Bị từ chối:</span>
                  <span className="font-medium text-red-600">
                    {stats.courses.rejected}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-slate-800 font-medium">Tổng cộng:</span>
                  <span className="font-bold">{stats.courses.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Class Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                Thống kê lớp học
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Chờ duyệt:</span>
                  <span className="font-medium text-yellow-600">
                    {stats.classes.pendingApproval}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Đã duyệt:</span>
                  <span className="font-medium text-green-600">
                    {stats.classes.approved}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Đã xuất bản:</span>
                  <span className="font-medium text-blue-600">
                    {stats.classes.published}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Bị từ chối:</span>
                  <span className="font-medium text-red-600">
                    {stats.classes.rejected}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-slate-800 font-medium">Tổng cộng:</span>
                  <span className="font-bold">{stats.classes.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lesson Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Thống kê bài học
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Chờ duyệt:</span>
                  <span className="font-medium text-yellow-600">
                    {stats.lessons.pendingApproval}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Đã duyệt:</span>
                  <span className="font-medium text-green-600">
                    {stats.lessons.approved}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Đã xuất bản:</span>
                  <span className="font-medium text-blue-600">
                    {stats.lessons.published}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Bị từ chối:</span>
                  <span className="font-medium text-red-600">
                    {stats.lessons.rejected}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-slate-800 font-medium">Tổng cộng:</span>
                  <span className="font-bold">{stats.lessons.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                Thống kê giá
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Chờ duyệt:</span>
                  <span className="font-medium text-yellow-600">
                    {stats.prices.pendingApproval}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Đã duyệt:</span>
                  <span className="font-medium text-green-600">
                    {stats.prices.approved}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Đang áp dụng:</span>
                  <span className="font-medium text-blue-600">
                    {stats.prices.active}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Bị từ chối:</span>
                  <span className="font-medium text-red-600">
                    {stats.prices.rejected}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-slate-800 font-medium">Tổng cộng:</span>
                  <span className="font-bold">{stats.prices.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
