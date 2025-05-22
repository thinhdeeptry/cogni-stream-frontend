"use client";

import { useEffect, useState } from "react";

import useAI from "@/hooks/useAI";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertTriangle,
  Award,
  BarChart2,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import useReportStore, { type Report } from "@/stores/useReportStore";

import { ReportAnalysis } from "@/components/ReportAnalysis";
import { BarChart } from "@/components/chart/bar-chart";
import { ChartLayout } from "@/components/chart/chart-layout";
import { PieChart } from "@/components/chart/pie-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Dữ liệu mẫu cho báo cáo mới
const sampleReportData = {
  revenue: {
    total: 5500000,
    last30Days: 1800000,
    averageTransaction: 55,
    failedRate: 0.04,
    byMethod: {
      creditCard: 650,
      paypal: 350,
      bankTransfer: 120,
    },
  },
  enrollments: {
    total: 1100,
    last30Days: 320,
    dropoutRate: 0.14,
    byCourse: [
      { courseId: 1, enrollments: 220 },
      { courseId: 2, enrollments: 170 },
    ],
    averageTimeToComplete: 43,
    completionRate: 0.68,
  },
  courses: {
    total: 52,
    active: 42,
    completionRate: 0.67,
    popular: [
      { courseId: 1, title: "Introduction to Programming", enrollments: 220 },
      { courseId: 2, title: "Web Development Basics", enrollments: 170 },
    ],
    viewsLast30Days: 5500,
  },
};

export default function ReportsPage() {
  const {
    reports,
    isLoading,
    error,
    fetchReports,
    addReport,
    updateReportAnalysis,
    deleteReport,
    generateReport,
    clearReports,
    updateFormattedData,
  } = useReportStore();
  const { processInput, isLoading: isAILoading } = useAI({
    systemPrompt:
      "Bạn là trợ lý AI chuyên phân tích dữ liệu giáo dục. Hãy chuyển đổi dữ liệu JSON thành văn bản có định dạng HTML dễ đọc. Tổ chức thông tin theo các mục chính: Doanh thu, Học viên, và Khóa học. Sử dụng định dạng tiền tệ VND cho các giá trị tiền. Sử dụng định dạng phần trăm cho các tỷ lệ.",
    structured: false, // We want HTML output, not JSON
  });

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isAddingReport, setIsAddingReport] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  // State để kiểm soát animation
  const [animate, setAnimate] = useState(false);

  // Kích hoạt animation sau khi component được render
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  // Lấy danh sách báo cáo khi trang được tải
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);
  // Reset và kích hoạt lại animation khi chọn báo cáo khác
  useEffect(() => {
    if (selectedReportId) {
      setAnimate(false);
      const timer = setTimeout(() => {
        setAnimate(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedReportId]);
  // Chọn báo cáo đầu tiên nếu có và chưa có báo cáo nào được chọn
  useEffect(() => {
    if (reports.length > 0 && !selectedReportId) {
      setSelectedReportId(reports[0].id);
      const selectedReport = reports.find(
        (report) => report.id === selectedReportId,
      );
      if (
        selectedReport &&
        selectedReport.data &&
        !selectedReport.formattedData
      ) {
        // Chỉ format dữ liệu nếu báo cáo chưa được format
        if (selectedReportId) {
          handleFormatData(selectedReportId, selectedReport.data);
        }
      }
    }
  }, [reports, selectedReportId]);

  // Xử lý thêm báo cáo mới
  const handleAddReport = async () => {
    if (!newReportTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề báo cáo");
      return;
    }

    try {
      const now = new Date();
      const newReport = await addReport({
        title: newReportTitle,
        date: now.toISOString(),
        data: sampleReportData,
      });

      setNewReportTitle("");
      setIsAddingReport(false);
      setSelectedReportId(newReport.id);
      toast.success("Đã thêm báo cáo mới");
    } catch (error) {
      console.error("Error adding report:", error);
      toast.error("Có lỗi xảy ra khi thêm báo cáo");
    }
  };

  // Xử lý tạo báo cáo tự động
  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      const newReport = await generateReport();
      setSelectedReportId(newReport.id);
      toast.success("Đã tạo báo cáo tự động");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Có lỗi xảy ra khi tạo báo cáo tự động");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Xử lý xóa báo cáo
  const handleDeleteReport = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa báo cáo này?")) return;

    try {
      await deleteReport(id);

      // Nếu báo cáo đang được chọn bị xóa, chọn báo cáo đầu tiên trong danh sách
      if (selectedReportId === id) {
        setSelectedReportId(reports.length > 1 ? reports[0].id : null);
      }

      toast.success("Đã xóa báo cáo");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Có lỗi xảy ra khi xóa báo cáo");
    }
  };

  // Xử lý khi phân tích báo cáo hoàn tất
  const handleAnalysisComplete = async (
    reportId: string,
    aiAnalysis: Report["aiAnalysis"],
  ) => {
    try {
      await updateReportAnalysis(reportId, {
        ...aiAnalysis,
        rawAnalysis: aiAnalysis
          ? "Phân tích chi tiết từ AI sẽ được hiển thị ở đây."
          : undefined,
      });
      toast.success("Đã cập nhật phân tích báo cáo");
    } catch (error) {
      console.error("Error updating report analysis:", error);
      toast.error("Có lỗi xảy ra khi cập nhật phân tích báo cáo");
    }
  };

  // Render thông tin tổng quan của báo cáo
  const renderReportOverview = (report: Report) => {
    if (!report.data) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Thông tin doanh thu */}
        <Card
          className={`overflow-hidden border-0 shadow-md transform transition-all duration-500 ${
            animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "0ms" }}
        >
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-3 transform transition-transform duration-300 hover:rotate-12">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Doanh thu</h3>
              </div>
              <div className="bg-white/20 p-1.5 rounded-md transform transition-transform duration-300 hover:scale-110">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <CardContent className="p-5 bg-white">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center">
                  <span className="text-gray-600 text-sm">Tổng doanh thu</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {new Intl.NumberFormat("vi-VN").format(
                    report.data.revenue.total,
                  )}
                  đ
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">30 ngày qua</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("vi-VN").format(
                    report.data.revenue.last30Days,
                  )}
                  đ
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">
                  Giá trị giao dịch TB
                </span>
                <span className="font-medium">
                  {new Intl.NumberFormat("vi-VN").format(
                    report.data.revenue.averageTransaction,
                  )}
                  đ
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-1.5" />
                  <span className="text-gray-500 text-sm">Tỷ lệ thất bại</span>
                </div>
                <span className="font-medium text-amber-600">
                  {(report.data.revenue.failedRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thông tin học viên */}
        <Card
          className={`overflow-hidden border-0 shadow-md transform transition-all duration-500 ${
            animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "150ms" }}
        >
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-3 transform transition-transform duration-300 hover:rotate-12">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Học viên</h3>
              </div>
              <div className="bg-white/20 p-1.5 rounded-md transform transition-transform duration-300 hover:scale-110">
                <BarChart2 className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <CardContent className="p-5 bg-white">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center">
                  <span className="text-gray-600 text-sm">Tổng số đăng ký</span>
                </div>
                <span className="text-lg font-bold text-purple-600">
                  {report.data.enrollments.total.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">30 ngày qua</span>
                <span className="font-medium">
                  {report.data.enrollments.last30Days.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-1.5" />
                  <span className="text-gray-500 text-sm">Tỷ lệ bỏ học</span>
                </div>
                <span className="font-medium text-amber-600">
                  {(report.data.enrollments.dropoutRate * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                  <span className="text-gray-500 text-sm">
                    Tỷ lệ hoàn thành
                  </span>
                </div>
                <span className="font-medium text-green-600">
                  {(report.data.enrollments.completionRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thông tin khóa học */}
        <Card
          className={`overflow-hidden border-0 shadow-md transform transition-all duration-500 ${
            animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "300ms" }}
        >
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-3 transform transition-transform duration-300 hover:rotate-12">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Khóa học</h3>
              </div>
              <div className="bg-white/20 p-1.5 rounded-md transform transition-transform duration-300 hover:scale-110">
                <BarChart2 className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <CardContent className="p-5 bg-white">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center">
                  <span className="text-gray-600 text-sm">
                    Tổng số khóa học
                  </span>
                </div>
                <span className="text-lg font-bold text-amber-600">
                  {report.data.courses.total}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                  <span className="text-gray-500 text-sm">Đang hoạt động</span>
                </div>
                <span className="font-medium text-green-600">
                  {report.data.courses.active}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-blue-500 mr-1.5" />
                  <span className="text-gray-500 text-sm">
                    Thời gian hoàn thành TB
                  </span>
                </div>
                <span className="font-medium">
                  {report.data.enrollments.averageTimeToComplete} ngày
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-blue-500 mr-1.5" />
                  <span className="text-gray-500 text-sm">
                    Lượt xem (30 ngày)
                  </span>
                </div>
                <span className="font-medium">
                  {report.data.enrollments.last30Days.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render khóa học phổ biến
  const renderPopularCourses = (report: Report) => {
    if (!report.data?.enrollments?.popularCourses?.length) return null;

    // Tính toán giá trị lớn nhất để làm cơ sở cho thanh tiến trình
    const maxEnrollments = Math.max(
      ...report.data.enrollments.popularCourses.map(
        (course: { enrollments: number }) => course.enrollments,
      ),
    );

    return (
      <Card className="mb-6 border-0 shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-lg">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-2 rounded-lg mr-3 transform transition-transform duration-500 hover:rotate-12">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Khóa học phổ biến
                </h3>
                <p className="text-indigo-100 text-sm mt-1">
                  Các khóa học có số lượng đăng ký cao nhất
                </p>
              </div>
            </div>
            <div className="bg-white/20 p-1.5 rounded-md transform transition-transform duration-300 hover:scale-110">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
        <CardContent className="p-6 bg-white">
          <div className="space-y-6">
            {report.data.enrollments.popularCourses.map(
              (course: any, index: number) => {
                // Tính toán phần trăm cho thanh tiến trình
                const progressPercent =
                  (course.enrollments / maxEnrollments) * 100;

                // Xác định màu sắc dựa trên thứ hạng
                const colors = {
                  0: {
                    badge: "bg-yellow-500",
                    progress: "bg-yellow-500",
                    text: "text-yellow-700",
                    light: "bg-yellow-50",
                  },
                  1: {
                    badge: "bg-gray-400",
                    progress: "bg-gray-400",
                    text: "text-gray-700",
                    light: "bg-gray-50",
                  },
                  2: {
                    badge: "bg-amber-600",
                    progress: "bg-amber-600",
                    text: "text-amber-700",
                    light: "bg-amber-50",
                  },
                  default: {
                    badge: "bg-blue-500",
                    progress: "bg-blue-500",
                    text: "text-blue-700",
                    light: "bg-blue-50",
                  },
                };

                const color =
                  colors[index as keyof typeof colors] || colors.default;

                return (
                  <div
                    key={course.courseId}
                    className="relative transform transition-all duration-300 hover:translate-x-1 hover:shadow-sm rounded-lg p-2 -mx-2"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center ${color.badge} text-white font-bold shadow-sm transform transition-transform duration-300 hover:scale-110`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {course.title}
                          </h4>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <BookOpen className="h-3.5 w-3.5 mr-1" />
                            <span>ID: {course.courseId}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center">
                          <Users className={`h-4 w-4 mr-1.5 ${color.text}`} />
                          <span className="font-semibold text-gray-900">
                            {course.enrollments}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 mt-0.5">
                          học viên
                        </span>
                      </div>
                    </div>

                    {/* Thanh tiến trình với animation */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color.progress} rounded-full transition-all duration-1000 ease-out`}
                        style={{
                          width: animate ? `${progressPercent}%` : "0%",
                          transitionDelay: `${index * 150}ms`,
                        }}
                      ></div>
                    </div>

                    {/* Thẻ xếp hạng với animation */}
                    {index < 3 && (
                      <div
                        className={`absolute -left-2 -top-2 ${
                          color.light
                        } ${color.text} text-xs font-medium px-2 py-0.5 rounded-full border border-white shadow-sm transform transition-all duration-500 ${
                          animate
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 -translate-y-4"
                        }`}
                        style={{ transitionDelay: `${300 + index * 100}ms` }}
                      >
                        {index === 0
                          ? "Top #1"
                          : index === 1
                            ? "Top #2"
                            : "Top #3"}
                      </div>
                    )}
                  </div>
                );
              },
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  // Xử lý định dạng dữ liệu bằng AI
  const handleFormatData = async (reportId: string, data: any) => {
    try {
      toast.info("Đang xử lý dữ liệu...");

      // Tạo prompt cho AI
      const prompt = `
      Hãy chuyển đổi dữ liệu JSON thành HTML có định dạng đẹp và dễ đọc.
      
      Yêu cầu:
      - Sử dụng thẻ HTML (h1, h2, h3, ul, li, p, strong, span) để tạo cấu trúc rõ ràng
      - Tổ chức theo 3 mục: Doanh thu, Học viên, và Khóa học
      - Định dạng tiền tệ: thêm dấu phẩy ngăn cách hàng nghìn và đơn vị "VND"
      - Định dạng phần trăm với ký hiệu %
      - Chỉ hiển thị 5 khóa học phổ biến nhất, sắp xếp theo số lượng học viên
      - Sử dụng màu sắc phù hợp cho các tiêu đề và số liệu quan trọng
      - Tạo giao diện sạch sẽ, chuyên nghiệp
      
      Dữ liệu JSON: ${JSON.stringify(data, null, 2)}
      `;

      // Gọi API AI để xử lý dữ liệu
      // Giả định có một hàm callAI trong useReportStore
      const formattedData = await processInput(prompt);

      // Cập nhật báo cáo với dữ liệu đã định dạng
      // toast.success("Đã định dạng dữ liệu thành công");
      useReportStore.getState().updateFormattedData(reportId, formattedData);
    } catch (error) {
      console.error("Error formatting data:", error);
      toast.error("Có lỗi xảy ra khi định dạng dữ liệu");
    }
  };
  const generateChartData = (report: Report) => {
    if (!report.data) return null;

    // 1. Bar Chart: Tổng quan doanh thu
    const revenueOverviewData = [
      {
        name: "Doanh thu",
        "Tổng doanh thu": report.data.revenue.total,
        "30 ngày qua": report.data.revenue.last30Days,
      },
    ];

    // 2. Pie Chart: Phân tích phương thức thanh toán
    const paymentMethodsData = [
      {
        name: "Thẻ tín dụng",
        value: report.data.revenue.byMethod.creditCard || 0,
      },
      { name: "PayPal", value: report.data.revenue.byMethod.paypal || 0 },
      {
        name: "Chuyển khoản",
        value: report.data.revenue.byMethod.bankTransfer || 0,
      },
    ];

    // 3. Bar Chart: Số lượt đăng ký theo thời gian
    const enrollmentData = [
      {
        name: "Học viên",
        "Tổng học viên": report.data.enrollments.total,
        "30 ngày qua": report.data.enrollments.last30Days,
      },
    ];

    // 4. Horizontal Bar Chart: Khóa học phổ biến
    // Lấy 5 khóa học phổ biến nhất
    const popularCoursesData = report.data.enrollments.popularCourses
      .slice(0, 5)
      .map((course: { title: string; enrollments: number }) => ({
        name: course.title,
        value: course.enrollments,
      }))
      .sort((a: { value: number }, b: { value: number }) => b.value - a.value); // Sắp xếp giảm dần theo số lượng học viên

    // 5. Pie Chart: Tỷ lệ khóa học đang hoạt động
    const activeCourses = report.data.courses.active;
    const inactiveCourses =
      report.data.courses.total - report.data.courses.active;
    const courseStatusData = [
      { name: "Đang hoạt động", value: activeCourses },
      { name: "Không hoạt động", value: inactiveCourses },
    ];

    return {
      revenueOverview: revenueOverviewData,
      paymentMethods: paymentMethodsData,
      enrollments: enrollmentData,
      popularCourses: popularCoursesData,
      courseStatus: courseStatusData,
    };
  };

  // Add this function to render charts
  const renderReportCharts = (report: Report) => {
    if (!report.data) return null;

    const chartData = generateChartData(report);
    if (!chartData) return null;

    return (
      <div className="space-y-8 mt-8">
        <h2 className="text-2xl font-bold">Biểu đồ phân tích</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Revenue Overview Bar Chart */}
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle>Tổng quan doanh thu</CardTitle>
              <CardDescription className="text-blue-100">
                So sánh tổng doanh thu với doanh thu 30 ngày qua
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 h-[350px]">
              <BarChart
                data={chartData.revenueOverview}
                index="name"
                categories={["Tổng doanh thu", "30 ngày qua"]}
                valueFormatter={(value) =>
                  `${new Intl.NumberFormat("vi-VN").format(value)}đ`
                }
                title="Phân tích doanh thu"
              />
            </CardContent>
          </Card>

          {/* 2. Payment Methods Pie Chart */}
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardTitle>Phương thức thanh toán</CardTitle>
              <CardDescription className="text-purple-100">
                Phân bổ theo phương thức thanh toán
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 h-[350px]">
              <PieChart
                data={chartData.paymentMethods}
                index="name"
                category="value"
                valueFormatter={(value) =>
                  `${new Intl.NumberFormat("vi-VN").format(value)}đ`
                }
              />
            </CardContent>
          </Card>

          {/* 3. Enrollments Bar Chart */}
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
              <CardTitle>Số lượt đăng ký</CardTitle>
              <CardDescription className="text-amber-100">
                So sánh tổng số lượt đăng ký với số lượt đăng ký mới
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 h-[350px]">
              <BarChart
                data={chartData.enrollments}
                index="name"
                categories={["Tổng học viên", "30 ngày qua"]}
                valueFormatter={(value) => value.toLocaleString()}
                title="Số lượng học viên"
              />
            </CardContent>
          </Card>

          {/* 4. Popular Courses Horizontal Bar Chart */}
          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardTitle>Khóa học phổ biến</CardTitle>
              <CardDescription className="text-green-100">
                Top 5 khóa học có nhiều học viên nhất
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 h-[350px]">
              <div className="h-full flex flex-col justify-center">
                {chartData.popularCourses.map(
                  (course: { name: string; value: number }, index: number) => (
                    <div key={index} className="mb-4">
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
                          className="h-full bg-green-500 rounded-full"
                          style={{
                            width: `${(course.value / chartData.popularCourses[0].value) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          {/* 5. Course Status Pie Chart */}
          <Card className="border-0 shadow-md overflow-hidden md:col-span-2">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <CardTitle>Trạng thái khóa học</CardTitle>
              <CardDescription className="text-indigo-100">
                Tỷ lệ khóa học đang hoạt động và không hoạt động
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 h-[350px]">
              <PieChart
                data={chartData.courseStatus}
                index="name"
                category="value"
                valueFormatter={(value) => `${value} khóa học`}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  return (
    <div className="container mx-auto py-6 overflow-visible">
      {/* <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Báo cáo</h1>
          <p className="text-muted-foreground">
            Quản lý và phân tích báo cáo với trợ giúp của AI
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateReport}
            disabled={isGeneratingReport || isLoading}
            className="flex items-center gap-2"
          >
            {isGeneratingReport ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>
              {isGeneratingReport ? "Đang tạo..." : "Tạo báo cáo tự động"}
            </span>
          </Button>

          <Dialog open={isAddingReport} onOpenChange={setIsAddingReport}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Thêm báo cáo</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm báo cáo mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin cho báo cáo mới. Dữ liệu mẫu sẽ được sử dụng.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề báo cáo</Label>
                  <Input
                    id="title"
                    placeholder="Nhập tiêu đề báo cáo"
                    value={newReportTitle}
                    onChange={(e) => setNewReportTitle(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingReport(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleAddReport}
                  disabled={isLoading || !newReportTitle.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang thêm...
                    </>
                  ) : (
                    "Thêm báo cáo"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div> */}

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p>{error}</p>
          <Button
            onClick={() => fetchReports()}
            className="mt-4 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Thử lại</span>
          </Button>
        </div>
      )}

      {isLoading && reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chưa có báo cáo nào</h2>
          <p className="text-muted-foreground mb-6">
            Thêm báo cáo mới hoặc tạo báo cáo tự động để bắt đầu phân tích
          </p>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsAddingReport(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm báo cáo</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="flex items-center gap-2"
            >
              {isGeneratingReport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>
                {isGeneratingReport ? "Đang tạo..." : "Tạo báo cáo tự động"}
              </span>
            </Button>
          </div>
        </div>
      ) : (
        <Tabs
          value={selectedReportId || (reports.length > 0 ? reports[0].id : "")}
          onValueChange={setSelectedReportId}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList className="flex flex-nowrap gap-2 overflow-x-auto">
              {reports.map((report) => (
                <TabsTrigger
                  key={report.id}
                  value={report.id}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <FileText className="h-4 w-4" />
                  <span>{report.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("Bạn có chắc chắn muốn xóa tất cả báo cáo?")) {
                  clearReports();
                  setSelectedReportId(null);
                  toast.success("Đã xóa tất cả báo cáo");
                }
              }}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Xóa tất cả</span>
            </Button>
          </div>

          {reports.map((report) => (
            <TabsContent
              key={report.id}
              value={report.id}
              className="mt-0 space-y-6"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{report.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(report.date), "dd MMMM yyyy", {
                            locale: vi,
                          })}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteReport(report.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Xóa</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Thêm phần tổng quan báo cáo */}
                  {renderReportOverview(report)}

                  {/* Thêm phần khóa học phổ biến */}
                  {/* {renderPopularCourses(report)} */}
                  {/* Add charts directly from report data */}
                  <ChartLayout report={report} />
                  <div className="space-y-4">
                    {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div key="revenue" className="card-wrapper">
                        <div className="rounded-lg overflow-hidden bg-purple-100 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                              {format(new Date(), "dd/MM/yy")}
                            </span>
                            <button className="text-gray-400 hover:text-gray-600">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M8 3.5C7.58579 3.5 7.25 3.16421 7.25 2.75C7.25 2.33579 7.58579 2 8 2C8.41421 2 8.75 2.33579 8.75 2.75C8.75 3.16421 8.41421 3.5 8 3.5Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M8 8.5C7.58579 8.5 7.25 8.16421 7.25 7.75C7.25 7.33579 7.58579 7 8 7C8.41421 7 8.75 7.33579 8.75 7.75C8.75 8.16421 8.41421 8.5 8 8.5Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M8 13.5C7.58579 13.5 7.25 13.1642 7.25 12.75C7.25 12.3358 7.58579 12 8 12C8.41421 12 8.75 12.3358 8.75 12.75C8.75 13.1642 8.41421 13.5 8 13.5Z"
                                  fill="currentColor"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="text-3xl font-bold mb-1">
                            {report.data.revenue.total.toLocaleString("vi-VN")}đ
                          </div>
                          <p className="text-sm text-gray-600">
                            Tổng doanh thu
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {report.data.revenue.last30Days.toLocaleString(
                              "vi-VN",
                            )}
                            đ trong 30 ngày qua
                          </p>
                        </div>
                      </div>

                      <div key="enrollments" className="card-wrapper">
                        <div className="rounded-lg overflow-hidden bg-yellow-100 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                              {format(new Date(), "dd/MM/yy")}
                            </span>
                            <button className="text-gray-400 hover:text-gray-600">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M8 3.5C7.58579 3.5 7.25 3.16421 7.25 2.75C7.25 2.33579 7.58579 2 8 2C8.41421 2 8.75 2.33579 8.75 2.75C8.75 3.16421 8.41421 3.5 8 3.5Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M8 8.5C7.58579 8.5 7.25 8.16421 7.25 7.75C7.25 7.33579 7.58579 7 8 7C8.41421 7 8.75 7.33579 8.75 7.75C8.75 8.16421 8.41421 8.5 8 8.5Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M8 13.5C7.58579 13.5 7.25 13.1642 7.25 12.75C7.25 12.3358 7.58579 12 8 12C8.41421 12 8.75 12.3358 8.75 12.75C8.75 13.1642 8.41421 13.5 8 13.5Z"
                                  fill="currentColor"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="text-3xl font-bold mb-1">
                            {report.data.enrollments.total}
                          </div>
                          <p className="text-sm text-gray-600">Tổng học viên</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {report.data.enrollments.last30Days} trong 30 ngày
                            qua
                          </p>
                        </div>
                      </div>

                      <div key="courses" className="card-wrapper">
                        <div className="rounded-lg overflow-hidden bg-purple-100 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                              {format(new Date(), "dd/MM/yy")}
                            </span>
                            <button className="text-gray-400 hover:text-gray-600">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M8 3.5C7.58579 3.5 7.25 3.16421 7.25 2.75C7.25 2.33579 7.58579 2 8 2C8.41421 2 8.75 2.33579 8.75 2.75C8.75 3.16421 8.41421 3.5 8 3.5Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M8 8.5C7.58579 8.5 7.25 8.16421 7.25 7.75C7.25 7.33579 7.58579 7 8 7C8.41421 7 8.75 7.33579 8.75 7.75C8.75 8.16421 8.41421 8.5 8 8.5Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M8 13.5C7.58579 13.5 7.25 13.1642 7.25 12.75C7.25 12.3358 7.58579 12 8 12C8.41421 12 8.75 12.3358 8.75 12.75C8.75 13.1642 8.41421 13.5 8 13.5Z"
                                  fill="currentColor"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="text-3xl font-bold mb-1">
                            {report.data.courses.total}
                          </div>
                          <p className="text-sm text-gray-600">Số khóa học</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {report.data.courses.active} đang hoạt động
                          </p>
                        </div>
                      </div>

                      <div key="completion-rate" className="card-wrapper">
                        <div className="rounded-lg overflow-hidden bg-yellow-100 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
                              {format(new Date(), "dd/MM/yy")}
                            </span>
                            <button className="text-gray-400 hover:text-gray-600">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M8 3.5C7.58579 3.5 7.25 3.16421 7.25 2.75C7.25 2.33579 7.58579 2 8 2C8.41421 2 8.75 2.33579 8.75 2.75C8.75 3.16421 8.41421 3.5 8 3.5Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M8 8.5C7.58579 8.5 7.25 8.16421 7.25 7.75C7.25 7.33579 7.58579 7 8 7C8.41421 7 8.75 7.33579 8.75 7.75C8.75 8.16421 8.41421 8.5 8 8.5Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M8 13.5C7.58579 13.5 7.25 13.1642 7.25 12.75C7.25 12.3358 7.58579 12 8 12C8.41421 12 8.75 12.3358 8.75 12.75C8.75 13.1642 8.41421 13.5 8 13.5Z"
                                  fill="currentColor"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="text-3xl font-bold mb-1">
                            {Math.round(
                              report.data.courses.completionRate * 100,
                            )}
                            %
                          </div>
                          <p className="text-sm text-gray-600">
                            Tỷ lệ hoàn thành
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Trung bình các khóa học
                          </p>
                        </div>
                      </div>
                    </div> */}

                    {/* <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">
                        Dữ liệu chi tiết
                      </h3>
                      <div className="space-y-4">
                        <Tabs defaultValue="formatted" className="w-full">
                          <TabsList>
                            <TabsTrigger value="formatted">Định dạng văn bản</TabsTrigger>
                            <TabsTrigger value="json">JSON gốc</TabsTrigger>
                          </TabsList>
                          <TabsContent value="formatted">
                            <Card>
                              <CardContent className="pt-6">
                                {report.formattedData ? (
                                  <div className="prose max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: report.formattedData }} />
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                    <Button
                                      onClick={() => handleFormatData(report.id, report.data)}
                                      className="flex items-center gap-2"
                                      disabled={isAILoading}
                                    >
                                      {isAILoading ? (
                                        <>
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <span>Đang xử lý...</span>
                                        </>
                                      ) : (
                                        <>
                                          <RefreshCw className="h-4 w-4" />
                                          <span>{report.formattedData ? "Cập nhật định dạng" : "Định dạng dữ liệu bằng AI"}</span>
                                        </>
                                      )}
                                    </Button>
                                    <p className="text-sm text-muted-foreground">
                                      Sử dụng AI để chuyển đổi dữ liệu JSON sang định dạng văn bản dễ đọc
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </TabsContent>
                          <TabsContent value="json">
                            <Textarea
                              className="font-mono text-sm"
                              value={JSON.stringify(report.data, null, 2)}
                              readOnly
                              rows={10}
                            />
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div> */}
                  </div>
                </CardContent>
              </Card>

              <ReportAnalysis
                report={report}
                onAnalysisComplete={(aiAnalysis) =>
                  handleAnalysisComplete(report.id, aiAnalysis)
                }
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
