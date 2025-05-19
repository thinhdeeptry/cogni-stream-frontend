"use client";

import { useState } from "react";

import { ChevronDown, Download } from "lucide-react";

import type { Report } from "@/stores/useReportStore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { BarChart } from "./bar-chart";
import { LineChart } from "./line-chart";
import { PieChart } from "./pie-chart";

// Thay đổi hàm generateChartData để sử dụng dữ liệu từ DB

// Hàm tạo dữ liệu biểu đồ từ báo cáo
const generateChartData = (report: Report) => {
  if (!report.data) return null;

  // Tạo dữ liệu cho biểu đồ doanh thu
  const revenueOverviewData = [
    {
      name: "Doanh thu",
      "Tổng doanh thu": report.data.revenue.total,
      "30 ngày qua": report.data.revenue.last30Days,
    },
  ];

  // Dữ liệu phương thức thanh toán từ DB
  const paymentMethodsData = Object.entries(
    report.data.revenue.byMethod || {},
  ).map(([name, value]) => ({
    name,
    value,
  }));

  // Dữ liệu đăng ký từ DB
  const enrollmentData = [
    {
      name: "Học viên",
      "Tổng học viên": report.data.enrollments.total,
      "30 ngày qua": report.data.enrollments.last30Days,
    },
  ];

  // Dữ liệu khóa học phổ biến từ DB
  const popularCoursesData = (report.data.enrollments.popularCourses || [])
    .slice(0, 5)
    .map((course: any) => ({
      name: course.title || course.name,
      value: course.enrollments || course.count,
    }))
    .sort((a: { value: number }, b: { value: number }) => b.value - a.value);

  // Dữ liệu trạng thái khóa học
  const activeCourses = report.data.courses.active;
  const inactiveCourses =
    report.data.courses.total - report.data.courses.active;
  const courseStatusData = [
    { name: "Đang hoạt động", value: activeCourses },
    { name: "Không hoạt động", value: inactiveCourses },
  ];

  // Dữ liệu theo tháng cho biểu đồ đường - đã được xử lý từ backend
  const monthlyComparisonData = report.data.monthlyStats || [];

  // Dữ liệu doanh thu theo tháng
  const monthlyRevenueData = report.data.revenue.monthly || [];
  // Chuyển đổi định dạng dữ liệu để phù hợp với BarChart
  const formattedRevenueData = monthlyRevenueData.map(
    (item: { month: string; total: number }) => ({
      month: item.month.split("-")[1].startsWith("0")
        ? `T${item.month.split("-")[1].replace("0", "")}`
        : `T${item.month.split("-")[1]}`,
      value: item.total,
    }),
  );

  return {
    revenueOverview: revenueOverviewData,
    paymentMethods: paymentMethodsData,
    enrollments: enrollmentData,
    popularCourses: popularCoursesData,
    courseStatus: courseStatusData,
    monthlyComparisonData,
    monthlyRevenueData: formattedRevenueData,
  };
};

// Component cho dropdown chọn thời gian
// const TimeRangeSelector = () => {
//     return (
//         <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
//             Tuần này <ChevronDown className="h-3 w-3 opacity-50" />
//         </Button>
//     )
// }

// Component cho nút xuất dữ liệu
const ExportButton = () => {
  return (
    <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
      <Download className="h-3 w-3" /> Xuất
    </Button>
  );
};

// Cập nhật phần renderChartLayout để sử dụng dữ liệu mới

// Render biểu đồ theo bố cục mới
export const ChartLayout = ({ report }: { report: Report }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("week");
  const chartData = generateChartData(report);

  if (!chartData) return null;

  return (
    <div className="space-y-8">
      {/* Hàng 1: Biểu đồ tròn và biểu đồ vòng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Biểu đồ tròn: Phân bổ thanh toán */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium">
                Phân bổ phương thức thanh toán
              </CardTitle>
            </div>
            {/* <TimeRangeSelector /> */}
          </CardHeader>
          <CardContent className="h-[300px]">
            <PieChart
              data={chartData.paymentMethods}
              index="name"
              category="value"
              valueFormatter={(value) => `${value.toLocaleString()} giao dịch`}
            />
          </CardContent>
        </Card>

        {/* Biểu đồ vòng: Trạng thái khóa học */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium">
                Trạng thái khóa học
              </CardTitle>
            </div>
            {/* <TimeRangeSelector /> */}
          </CardHeader>
          <CardContent className="h-[300px]">
            <PieChart
              data={chartData.courseStatus}
              index="name"
              category="value"
              valueFormatter={(value) => `${value.toLocaleString()} khóa học`}
            />
          </CardContent>
        </Card>
      </div>

      {/* Hàng 2: Biểu đồ đường và biểu đồ cột */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Biểu đồ đường: So sánh doanh thu và đăng ký theo tháng */}
        <Card className="shadow-sm md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium">
                So sánh doanh thu và đăng ký
              </CardTitle>
              <CardDescription className="text-xs">
                Theo dõi xu hướng doanh thu và đăng ký học viên theo thời gian
              </CardDescription>
            </div>
            {/* <TimeRangeSelector /> */}
          </CardHeader>
          <CardContent className="h-[300px]">
            <LineChart
              data={chartData.monthlyComparisonData}
              index="name"
              categories={["Doanh_thu", "Học_viên"]}
              valueFormatter={(value) => `${value.toLocaleString()}`}
            />
          </CardContent>
        </Card>

        {/* Biểu đồ khóa học phổ biến */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-medium">
                Khóa học phổ biến
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] pt-2">
            <div className="h-full flex flex-col justify-center space-y-4">
              {chartData.popularCourses.map(
                (course: { name: string; value: number }, index: number) => {
                  const maxValue = chartData.popularCourses[0]?.value || 1;
                  const percentage = (course.value / maxValue) * 100;
                  const colors = [
                    "bg-blue-500",
                    "bg-purple-500",
                    "bg-green-500",
                    "bg-amber-500",
                    "bg-pink-500",
                  ];

                  return (
                    <div key={index} className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className="text-sm font-medium truncate max-w-[70%]"
                          title={course.name}
                        >
                          {course.name}
                        </span>
                        <span className="text-sm font-bold">
                          {course.value}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500 ease-out`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hàng 3: Biểu đồ doanh thu theo tháng */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-medium">
              Doanh thu theo tháng
            </CardTitle>
            <CardDescription className="text-xs">
              Phân tích xu hướng doanh thu trong năm
            </CardDescription>
          </div>
          <ExportButton />
        </CardHeader>
        <CardContent className="h-[300px]">
          <BarChart
            data={chartData.monthlyRevenueData}
            index="month"
            categories={["value"]}
            valueFormatter={(value) =>
              `${new Intl.NumberFormat("vi-VN").format(value)}đ`
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};
