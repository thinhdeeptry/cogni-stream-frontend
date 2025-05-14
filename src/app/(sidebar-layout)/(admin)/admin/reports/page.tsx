"use client";

import { useEffect, useState } from "react";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import useReportStore, { type Report } from "@/stores/useReportStore";

import { ReportAnalysis } from "@/components/ReportAnalysis";
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
  } = useReportStore();

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isAddingReport, setIsAddingReport] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Lấy danh sách báo cáo khi trang được tải
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Chọn báo cáo đầu tiên nếu có và chưa có báo cáo nào được chọn
  useEffect(() => {
    if (reports.length > 0 && !selectedReportId) {
      setSelectedReportId(reports[0].id);
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

  // Lấy báo cáo hiện tại dựa trên selectedReportId
  const selectedReport = reports.find(
    (report) => report.id === selectedReportId,
  );

  return (
    <div className="container space-y-6">
      <div className="flex items-center justify-between">
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
      </div>

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
            <TabsList className="grid grid-flow-col auto-cols-max gap-2 overflow-x-auto">
              {reports.map((report) => (
                <TabsTrigger
                  key={report.id}
                  value={report.id}
                  className="flex items-center gap-2"
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
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div key="revenue" className="card-wrapper">
                        <Card>
                          <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium">
                              Tổng doanh thu
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {report.data.revenue.total.toLocaleString(
                                "vi-VN",
                              )}
                              đ
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {report.data.revenue.last30Days.toLocaleString(
                                "vi-VN",
                              )}
                              đ trong 30 ngày qua
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div key="enrollments" className="card-wrapper">
                        <Card>
                          <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium">
                              Tổng học viên
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {report.data.enrollments.total}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {report.data.enrollments.last30Days} trong 30 ngày
                              qua
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div key="courses" className="card-wrapper">
                        <Card>
                          <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium">
                              Số khóa học
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {report.data.courses.total}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {report.data.courses.active} đang hoạt động
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div key="completion-rate" className="card-wrapper">
                        <Card>
                          <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium">
                              Tỷ lệ hoàn thành
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {Math.round(
                                report.data.courses.completionRate * 100,
                              )}
                              %
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Trung bình các khóa học
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h3 className="text-lg font-medium mb-4">
                        Dữ liệu chi tiết
                      </h3>
                      <Textarea
                        className="font-mono text-sm"
                        value={JSON.stringify(report.data, null, 2)}
                        readOnly
                        rows={10}
                      />
                    </div>
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
