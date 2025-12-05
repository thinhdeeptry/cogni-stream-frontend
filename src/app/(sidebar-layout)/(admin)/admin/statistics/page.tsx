"use client";

import { useEffect, useState } from "react";

import {
  CalendarDays,
  ChevronDown,
  Download,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import {
  DashboardStatistics,
  StatisticsParams,
  getDashboardStatistics,
} from "@/actions/statisticsActions";

import { BarChart } from "@/components/chart/bar-chart";
import { LineChart } from "@/components/chart/line-chart";
import { PieChart } from "@/components/chart/pie-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Format number to Vietnamese currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

// Format number with thousand separators
const formatNumber = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value);
};

// Format percentage with sign and color
const formatGrowth = (value: number) => {
  const isPositive = value >= 0;
  const formatted = `${isPositive ? "+" : ""}${value.toFixed(1)}%`;
  return {
    value: formatted,
    isPositive,
    color: isPositive ? "text-green-600" : "text-red-600",
    icon: isPositive ? TrendingUp : TrendingDown,
  };
};

// Overview Card Component
const OverviewCard = ({
  title,
  value,
  growth,
  icon: Icon,
  formatter = formatNumber,
}: {
  title: string;
  value: number;
  growth?: number;
  icon: any;
  formatter?: (value: number) => string;
}) => {
  const growthInfo = growth !== undefined ? formatGrowth(growth) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatter(value)}</div>
        {/* {growthInfo && (
          <div className={`flex items-center text-xs ${growthInfo.color}`}>
            <growthInfo.icon className="h-3 w-3 mr-1" />
            <span>{growthInfo.value} so với kỳ trước</span>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="space-y-6">
    {/* Overview cards skeleton */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Charts skeleton */}
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  </div>
);

export default function StatisticsPage() {
  const [data, setData] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<StatisticsParams>({
    period: "month",
  });
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use date range from state
      const requestParams: StatisticsParams = {
        ...params,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      const result = await getDashboardStatistics(requestParams);

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || "Không thể tải dữ liệu thống kê");
        toast.error(result.error || "Có lỗi xảy ra khi tải dữ liệu");
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi không xác định");
      toast.error("Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params, dateRange]);
  useEffect(() => {
    if (data?.period.startDate && data?.period.endDate) {
      setDateRange({
        startDate: data.period.startDate,
        endDate: data.period.endDate,
      });
    }
  }, []);
  const handlePeriodChange = (period: string) => {
    setParams((prev) => ({
      ...prev,
      period: period as StatisticsParams["period"],
    }));
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.info("Tính năng xuất dữ liệu đang được phát triển");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Báo cáo Thống kê</h1>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Báo cáo Thống kê</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                {error || "Không thể tải dữ liệu thống kê"}
              </p>
              <Button onClick={fetchData}>Thử lại</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform data for charts
  const revenueChartData = data.charts.revenueByMonth.map((item) => {
    // Handle different month format - extract year-month and convert to readable format
    let monthDisplay = item.month;

    // If month looks like "2024-11" or similar, convert to "Tháng 11/2024"
    if (typeof item.month === "string" && item.month.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = item.month.split("-");
      monthDisplay = `Tháng ${parseInt(month)}/${year}`;
    }
    // If month contains SQL function, extract the year-month part
    else if (typeof item.month === "string" && item.month.includes("YYYY-MM")) {
      // This might be a SQL query result, try to extract meaningful date
      monthDisplay = `Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
    }

    return {
      name: monthDisplay,
      "Doanh thu": item.revenue,
      "Giao dịch": item.transactionCount,
    };
  });

  const categoryChartData = data.charts.revenueByCategory
    .slice(0, 6)
    .map((item) => ({
      name: item.categoryName,
      value: item.revenue,
      percentage: item.percentage,
    }));

  const levelChartData = data.charts.revenueByCourseLevel.map((item) => ({
    name:
      item.level === "BEGINNER"
        ? "Cơ bản"
        : item.level === "INTERMEDIATE"
          ? "Trung cấp"
          : "Nâng cao",
    value: item.revenue,
    courses: item.courseCount,
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Báo cáo Thống kê</h1>
          <p className="text-muted-foreground">
            Tổng quan hoạt động từ {data.period.startDate} đến{" "}
            {data.period.endDate}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          {/* <Select value={params.period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Ngày</SelectItem>
              <SelectItem value="week">Tuần</SelectItem>
              <SelectItem value="month">Tháng</SelectItem>
              <SelectItem value="quarter">Quý</SelectItem>
              <SelectItem value="year">Năm</SelectItem>
            </SelectContent>
          </Select> */}

          {/* Date range inputs */}
          <div className="flex gap-2 items-center">
            <Input
              type="date"
              value={dateRange.startDate || ""}
              onChange={(e) => {
                const value = e.target.value;
                // Only update if user has finished selecting (blur event will handle API call)
                setDateRange((prev) => ({ ...prev, startDate: value }));
              }}
              onBlur={() => {
                // Trigger data fetch when user finishes selecting date
                if (dateRange.startDate) {
                  fetchData();
                }
              }}
              className="w-40"
              placeholder="Từ ngày"
            />
            <Input
              type="date"
              value={dateRange.endDate || ""}
              onChange={(e) => {
                const value = e.target.value;
                setDateRange((prev) => ({ ...prev, endDate: value }));
              }}
              onBlur={() => {
                // Trigger data fetch when user finishes selecting date
                if (dateRange.endDate) {
                  fetchData();
                }
              }}
              className="w-40"
              placeholder="Đến ngày"
            />
          </div>

          {/* Export button */}
          {/* <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Xuất
          </Button> */}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <OverviewCard
          title="Tổng Doanh thu"
          value={data.overview.totalRevenue}
          growth={data.highlights.recentGrowth.revenueGrowth}
          icon={TrendingUp}
          formatter={formatCurrency}
        />
        <OverviewCard
          title="Tổng Học viên"
          value={data.overview.totalStudents}
          growth={data.highlights.recentGrowth.studentGrowth}
          icon={TrendingUp}
        />
        <OverviewCard
          title="Tổng Giảng viên"
          value={data.overview.totalInstructors}
          icon={TrendingUp}
        />
        <OverviewCard
          title="Tổng Khóa học"
          value={data.overview.totalCourses}
          growth={data.highlights.recentGrowth.courseGrowth}
          icon={TrendingUp}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue by Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo Thời gian (Triệu VND)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <BarChart
              data={revenueChartData}
              index="name"
              categories={["Doanh thu"]}
              valueFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            />
          </CardContent>
        </Card>

        {/* Revenue by Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố Doanh thu theo Danh mục</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <PieChart
              data={categoryChartData}
              index="name"
              category="value"
              valueFormatter={formatCurrency}
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Revenue by Level */}
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo Cấp độ</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <PieChart
              data={levelChartData}
              index="name"
              category="value"
              valueFormatter={formatCurrency}
            />
          </CardContent>
        </Card>

        {/* Top Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Khóa học Doanh thu Cao nhất</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.highlights.topCourses.slice(0, 5).map((course, index) => (
              <div
                key={course.id}
                className="flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{course.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.instructor.name} • {course.studentCount} học viên
                  </p>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {formatCurrency(course.revenue)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Instructors */}
        <Card>
          <CardHeader>
            <CardTitle>Giảng viên Nổi bật</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.highlights.topInstructors
              .slice(0, 5)
              .map((instructor, index) => (
                <div
                  key={instructor.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {instructor.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {instructor.totalCourses} khóa học •{" "}
                      {instructor.totalStudents} học viên
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <Badge variant="secondary">
                      {formatCurrency(instructor.totalRevenue)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      ⭐ {instructor.avgRating.toFixed(1)}
                    </p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tỷ lệ Hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.overview.completionRate.toFixed(1)}%
            </div>
            <p className="text-muted-foreground text-sm">
              Tỷ lệ học viên hoàn thành khóa học
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đánh giá Trung bình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center gap-1">
              ⭐ {data.overview.avgCourseRating.toFixed(1)}
            </div>
            <p className="text-muted-foreground text-sm">
              Điểm đánh giá trung bình các khóa học
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tổng Giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatNumber(data.overview.totalTransactions)}
            </div>
            <p className="text-muted-foreground text-sm">
              Số giao dịch thành công
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
