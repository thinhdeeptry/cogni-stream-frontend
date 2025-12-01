"use client";

import React, { useState } from "react";

import {
  BookOpen,
  Calendar as CalendarIcon,
  DollarSign,
  Download,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

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

// Mock data for demonstration
const mockData = {
  overview: {
    totalRevenue: 125000000,
    totalStudents: 1250,
    totalInstructors: 85,
    totalCourses: 342,
    totalEnrollments: 3456,
    totalTransactions: 2890,
    avgCourseRating: 4.2,
    completionRate: 68.5,
  },
  charts: {
    revenueByMonth: [
      { month: "2024-01", year: 2024, revenue: 8500000, transactionCount: 245 },
      {
        month: "2024-02",
        year: 2024,
        revenue: 12300000,
        transactionCount: 298,
      },
      {
        month: "2024-03",
        year: 2024,
        revenue: 15600000,
        transactionCount: 356,
      },
      {
        month: "2024-04",
        year: 2024,
        revenue: 11200000,
        transactionCount: 287,
      },
      {
        month: "2024-05",
        year: 2024,
        revenue: 13800000,
        transactionCount: 334,
      },
      {
        month: "2024-06",
        year: 2024,
        revenue: 16900000,
        transactionCount: 401,
      },
      {
        month: "2024-07",
        year: 2024,
        revenue: 14300000,
        transactionCount: 367,
      },
      {
        month: "2024-08",
        year: 2024,
        revenue: 17500000,
        transactionCount: 425,
      },
      {
        month: "2024-09",
        year: 2024,
        revenue: 19200000,
        transactionCount: 478,
      },
      {
        month: "2024-10",
        year: 2024,
        revenue: 16800000,
        transactionCount: 389,
      },
      {
        month: "2024-11",
        year: 2024,
        revenue: 18400000,
        transactionCount: 445,
      },
      {
        month: "2024-12",
        year: 2024,
        revenue: 21000000,
        transactionCount: 512,
      },
    ],
    revenueByCourseLevel: [
      {
        level: "BEGINNER",
        revenue: 65000000,
        courseCount: 180,
        percentage: 52.0,
      },
      {
        level: "INTERMEDIATE",
        revenue: 42000000,
        courseCount: 120,
        percentage: 33.6,
      },
      {
        level: "ADVANCED",
        revenue: 18000000,
        courseCount: 42,
        percentage: 14.4,
      },
    ],
    revenueByCategory: [
      {
        categoryId: "cat-1",
        categoryName: "Lập trình Web",
        revenue: 45000000,
        courseCount: 120,
        percentage: 36.0,
      },
      {
        categoryId: "cat-2",
        categoryName: "Data Science",
        revenue: 32000000,
        courseCount: 85,
        percentage: 25.6,
      },
      {
        categoryId: "cat-3",
        categoryName: "Mobile Development",
        revenue: 18000000,
        courseCount: 67,
        percentage: 14.4,
      },
      {
        categoryId: "cat-4",
        categoryName: "DevOps",
        revenue: 15000000,
        courseCount: 45,
        percentage: 12.0,
      },
      {
        categoryId: "cat-5",
        categoryName: "Machine Learning",
        revenue: 10000000,
        courseCount: 38,
        percentage: 8.0,
      },
      {
        categoryId: "cat-6",
        categoryName: "UI/UX Design",
        revenue: 5000000,
        courseCount: 22,
        percentage: 4.0,
      },
    ],
  },
  highlights: {
    topCourses: [
      {
        id: "course-1",
        title: "Full-stack JavaScript Development",
        revenue: 15000000,
        studentCount: 450,
        avgRating: 4.8,
        instructor: {
          id: "instructor-1",
          name: "Nguyễn Văn A",
          email: "instructor@example.com",
        },
        category: { id: "cat-1", name: "Lập trình Web" },
      },
      {
        id: "course-2",
        title: "React & Node.js Masterclass",
        revenue: 12500000,
        studentCount: 380,
        avgRating: 4.7,
        instructor: {
          id: "instructor-2",
          name: "Trần Thị B",
          email: "instructor2@example.com",
        },
        category: { id: "cat-1", name: "Lập trình Web" },
      },
      {
        id: "course-3",
        title: "Data Science với Python",
        revenue: 11000000,
        studentCount: 320,
        avgRating: 4.6,
        instructor: {
          id: "instructor-3",
          name: "Lê Văn C",
          email: "instructor3@example.com",
        },
        category: { id: "cat-2", name: "Data Science" },
      },
      {
        id: "course-4",
        title: "Machine Learning cơ bản",
        revenue: 9800000,
        studentCount: 280,
        avgRating: 4.5,
        instructor: {
          id: "instructor-4",
          name: "Phạm Thị D",
          email: "instructor4@example.com",
        },
        category: { id: "cat-5", name: "Machine Learning" },
      },
      {
        id: "course-5",
        title: "Flutter Mobile Development",
        revenue: 8500000,
        studentCount: 250,
        avgRating: 4.4,
        instructor: {
          id: "instructor-5",
          name: "Hoàng Văn E",
          email: "instructor5@example.com",
        },
        category: { id: "cat-3", name: "Mobile Development" },
      },
    ],
    topInstructors: [
      {
        id: "instructor-1",
        name: "Nguyễn Văn A",
        email: "instructor@example.com",
        image: "https://example.com/avatar.jpg",
        totalRevenue: 25000000,
        totalCourses: 8,
        totalStudents: 890,
        avgRating: 4.6,
        completionRate: 78.5,
      },
      {
        id: "instructor-2",
        name: "Trần Thị B",
        email: "instructor2@example.com",
        totalRevenue: 22000000,
        totalCourses: 6,
        totalStudents: 780,
        avgRating: 4.7,
        completionRate: 82.1,
      },
      {
        id: "instructor-3",
        name: "Lê Văn C",
        email: "instructor3@example.com",
        totalRevenue: 18500000,
        totalCourses: 5,
        totalStudents: 650,
        avgRating: 4.5,
        completionRate: 75.3,
      },
      {
        id: "instructor-4",
        name: "Phạm Thị D",
        email: "instructor4@example.com",
        totalRevenue: 16000000,
        totalCourses: 4,
        totalStudents: 580,
        avgRating: 4.4,
        completionRate: 70.8,
      },
      {
        id: "instructor-5",
        name: "Hoàng Văn E",
        email: "instructor5@example.com",
        totalRevenue: 14200000,
        totalCourses: 3,
        totalStudents: 520,
        avgRating: 4.6,
        completionRate: 79.2,
      },
    ],
    recentGrowth: {
      revenueGrowth: 15.8,
      studentGrowth: 23.4,
      courseGrowth: 12.1,
    },
  },
  period: {
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    totalDays: 366,
  },
};

// Format functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value);
};

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
        {growthInfo && (
          <div className={`flex items-center text-xs ${growthInfo.color} mt-1`}>
            <growthInfo.icon className="h-3 w-3 mr-1" />
            <span>{growthInfo.value} so với kỳ trước</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function StatisticsDemoPage() {
  const [period, setPeriod] = useState("month");
  const [dateRange, setDateRange] = useState({
    startDate: "2024-01-01",
    endDate: "2024-12-31",
  });

  const data = mockData;

  // Transform data for charts
  const revenueChartData = data.charts.revenueByMonth.map((item) => ({
    name: item.month.split("-")[1],
    "Doanh thu": item.revenue,
    "Giao dịch": item.transactionCount,
  }));

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
          <Select value={period} onValueChange={setPeriod}>
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
          </Select>

          {/* Date range inputs */}
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="w-40"
            />
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="w-40"
            />
          </div>

          {/* Export button */}
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Xuất
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <OverviewCard
          title="Tổng Doanh thu"
          value={data.overview.totalRevenue}
          growth={data.highlights.recentGrowth.revenueGrowth}
          icon={DollarSign}
          formatter={formatCurrency}
        />
        <OverviewCard
          title="Tổng Học viên"
          value={data.overview.totalStudents}
          growth={data.highlights.recentGrowth.studentGrowth}
          icon={Users}
        />
        <OverviewCard
          title="Tổng Giảng viên"
          value={data.overview.totalInstructors}
          icon={GraduationCap}
        />
        <OverviewCard
          title="Tổng Khóa học"
          value={data.overview.totalCourses}
          growth={data.highlights.recentGrowth.courseGrowth}
          icon={BookOpen}
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
