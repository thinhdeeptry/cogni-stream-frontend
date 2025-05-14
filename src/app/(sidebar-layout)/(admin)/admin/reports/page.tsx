"use client";

import { useEffect, useState } from "react";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  BarChart2,
  Calendar,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import useReportStore, { Report } from "@/stores/useReportStore";

import { ReportAnalysis } from "@/components/ReportAnalysis";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

// Dữ liệu mẫu cho báo cáo
const sampleReportData = {
  revenue: {
    months: ["Tháng 1", "Tháng 2", "Tháng 3"],
    values: [1500000, 2200000, 1800000],
  },
  students: {
    months: ["Tháng 1", "Tháng 2", "Tháng 3"],
    values: [15, 22, 18],
    categories: {
      "Lập trình": 25,
      "Thiết kế": 18,
      Marketing: 12,
    },
  },
  courses: {
    total: 12,
    active: 8,
    completed: 4,
  },
  completionRate: 0.78,
};

export default function ReportsPage() {
  const {
    reports,
    addReport,
    updateReportAnalysis,
    clearReports,
    getReportById,
  } = useReportStore();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isAddingReport, setIsAddingReport] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Lấy báo cáo đã chọn
  const selectedReport = selectedReportId
    ? getReportById(selectedReportId)
    : null;

  // Thêm báo cáo mẫu khi trang được tải nếu không có báo cáo nào
  useEffect(() => {
    if (reports.length === 0) {
      const sampleReport: Report = {
        id: uuidv4(),
        title: "Báo cáo hoạt động Q1/2024",
        date: format(new Date(), "yyyy-MM-dd"),
        data: sampleReportData,
      };
      addReport(sampleReport);
    }

    // Chọn báo cáo đầu tiên nếu có
    if (reports.length > 0 && !selectedReportId) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, addReport, selectedReportId]);

  // Xử lý thêm báo cáo mới
  const handleAddReport = () => {
    if (!newReportTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề báo cáo");
      return;
    }

    setIsLoading(true);

    try {
      const newReport: Report = {
        id: uuidv4(),
        title: newReportTitle,
        date: format(new Date(), "yyyy-MM-dd"),
        data: sampleReportData, // Sử dụng dữ liệu mẫu
      };

      addReport(newReport);
      setNewReportTitle("");
      setIsAddingReport(false);
      setSelectedReportId(newReport.id);
      toast.success("Đã thêm báo cáo mới");
    } catch (error) {
      console.error("Error adding report:", error);
      toast.error("Có lỗi xảy ra khi thêm báo cáo");
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý khi phân tích báo cáo hoàn tất
  const handleAnalysisComplete = (
    reportId: string,
    aiAnalysis: Report["aiAnalysis"],
  ) => {
    updateReportAnalysis(reportId, {
      ...aiAnalysis,
      rawAnalysis: aiAnalysis
        ? "Phân tích chi tiết từ AI sẽ được hiển thị ở đây."
        : undefined,
    });
    toast.success("Đã cập nhật phân tích báo cáo");
  };

  return (
    <div className="container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Báo cáo</h1>
          <p className="text-muted-foreground">
            Quản lý và phân tích báo cáo với trợ giúp của AI
          </p>
        </div>

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

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chưa có báo cáo nào</h2>
          <p className="text-muted-foreground mb-6">
            Thêm báo cáo mới để bắt đầu phân tích
          </p>
          <Button
            onClick={() => setIsAddingReport(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm báo cáo</span>
          </Button>
        </div>
      ) : (
        <Tabs
          defaultValue={selectedReportId || reports[0].id}
          onValueChange={setSelectedReportId}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid grid-flow-col auto-cols-max gap-2">
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
              className="space-y-6"
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
                    <BarChart2 className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardHeader className="py-4">
                          <CardTitle className="text-sm font-medium">
                            Tổng doanh thu
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {report.data.revenue.values
                              .reduce((sum, value) => sum + value, 0)
                              .toLocaleString("vi-VN")}
                            đ
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {report.data.revenue.months.length} tháng gần nhất
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="py-4">
                          <CardTitle className="text-sm font-medium">
                            Tổng học viên
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {report.data.students.values.reduce(
                              (sum, value) => sum + value,
                              0,
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {report.data.students.months.length} tháng gần nhất
                          </p>
                        </CardContent>
                      </Card>

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
                            {report.data.courses.active} đang hoạt động,{" "}
                            {report.data.courses.completed} đã hoàn thành
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="py-4">
                          <CardTitle className="text-sm font-medium">
                            Tỷ lệ hoàn thành
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {Math.round(report.data.completionRate * 100)}%
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Trung bình các khóa học
                          </p>
                        </CardContent>
                      </Card>
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
