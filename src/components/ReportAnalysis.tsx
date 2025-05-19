"use client";

import { useEffect, useState } from "react";

import useAI from "@/hooks/useAI";
import {
  ArrowRight,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

import { Report } from "@/stores/useReportStore";

// Import Shadcn UI Chart components
import { BarChart } from "@/components/chart/bar-chart";
import { LineChart } from "@/components/chart/line-chart";
import { PieChart } from "@/components/chart/pie-chart";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ReportAnalysisProps {
  report: Report;
  onAnalysisComplete?: (analysis: Report["aiAnalysis"]) => void;
}

export function ReportAnalysis({
  report,
  onAnalysisComplete,
}: ReportAnalysisProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  // Sử dụng hook useAI với cấu hình phù hợp cho phân tích báo cáo
  const { processInput, isLoading, lastStructuredOutput, error } = useAI({
    systemPrompt:
      "Bạn là trợ lý AI chuyên phân tích dữ liệu giáo dục. Hãy phân tích dữ liệu báo cáo, đưa ra nhận xét và đề xuất bằng tiếng Việt. Tạo biểu đồ, dự đoán xu hướng và đề xuất cải thiện.",
    structured: true, // Yêu cầu output có cấu trúc JSON
  });

  // Phân tích dữ liệu báo cáo
  const analyzeReport = async () => {
    if (!report.data) return;

    setIsAnalyzing(true);
    try {
      // Tạo dữ liệu biểu đồ từ dữ liệu báo cáo nếu chưa có phân tích AI
      if (!report.aiAnalysis) {
        // Tạo dữ liệu biểu đồ mặc định từ dữ liệu báo cáo
        const defaultAnalysis = generateDefaultAnalysis(report.data);
        if (onAnalysisComplete) {
          onAnalysisComplete(defaultAnalysis);
        }
      }

      // Chuyển đổi dữ liệu báo cáo thành chuỗi để gửi cho AI
      const reportDataString = JSON.stringify(report.data, null, 2);

      // Tạo prompt cho AI
      const prompt = `Phân tích dữ liệu báo cáo sau và tạo dữ liệu biểu đồ, dự đoán xu hướng 3 tháng tới, và đề xuất cải thiện:

${reportDataString}

Vui lòng trả về kết quả dưới dạng JSON với cấu trúc đã định nghĩa, bao gồm:
1. Dữ liệu biểu đồ (chartData) cho doanh thu và số học viên
2. Dự đoán (predictions) cho 3 tháng tiếp theo
3. Các đề xuất cải thiện (recommendations)`;

      // Gửi prompt cho AI và nhận kết quả
      await processInput(prompt, true);
    } catch (err) {
      console.error("Error analyzing report:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Tạo phân tích mặc định từ dữ liệu báo cáo
  const generateDefaultAnalysis = (data: any) => {
    // Dữ liệu biểu đồ doanh thu
    const revenueLabels = Object.keys(data.revenue.byMethod || {});
    const revenueData = Object.values(data.revenue.byMethod || {}) as number[];

    // Dữ liệu biểu đồ học viên
    const studentLabels =
      data.enrollments.popularCourses?.map((course: any) => course.title) || [];
    const studentData =
      data.enrollments.popularCourses?.map(
        (course: any) => course.enrollments,
      ) || [];

    return {
      chartData: {
        revenue: {
          labels: revenueLabels,
          datasets: [
            {
              label: "Doanh thu theo phương thức thanh toán",
              data: revenueData,
              backgroundColor: ["#4C51BF", "#38B2AC", "#ED8936"],
            },
          ],
        },
        students: {
          labels: studentLabels,
          datasets: [
            {
              label: "Số lượng học viên theo khóa học",
              data: studentData,
              backgroundColor: [
                "#4C51BF",
                "#38B2AC",
                "#ED8936",
                "#667EEA",
                "#F6AD55",
              ],
            },
          ],
        },
      },
      predictions: {
        revenue: [
          {
            month: "Tháng tới",
            value: Math.round(data.revenue.last30Days * 1.05),
          },
          {
            month: "Tháng sau",
            value: Math.round(data.revenue.last30Days * 1.1),
          },
          {
            month: "Tháng thứ 3",
            value: Math.round(data.revenue.last30Days * 1.15),
          },
        ],
        students: [
          {
            month: "Tháng tới",
            value: Math.round(data.enrollments.newEnrollmentsLast30Days * 1.05),
          },
          {
            month: "Tháng sau",
            value: Math.round(data.enrollments.newEnrollmentsLast30Days * 1.1),
          },
          {
            month: "Tháng thứ 3",
            value: Math.round(data.enrollments.newEnrollmentsLast30Days * 1.15),
          },
        ],
      },
      recommendations: [
        "Tăng cường marketing cho các khóa học có tỷ lệ đăng ký thấp",
        "Cải thiện trải nghiệm thanh toán để giảm tỷ lệ giao dịch thất bại",
        "Phát triển thêm nội dung cho các khóa học phổ biến",
      ],
    };
  };
  // Khi có kết quả phân tích từ AI, gọi callback để cập nhật store
  const [lastProcessedOutput, setLastProcessedOutput] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (
      lastStructuredOutput &&
      !isLoading &&
      onAnalysisComplete &&
      JSON.stringify(lastStructuredOutput) !== lastProcessedOutput
    ) {
      // Lưu lại output đã xử lý để tránh xử lý lại
      setLastProcessedOutput(JSON.stringify(lastStructuredOutput));

      // Gọi callback để cập nhật store
      onAnalysisComplete(lastStructuredOutput);
    }
  }, [
    lastStructuredOutput,
    isLoading,
    onAnalysisComplete,
    lastProcessedOutput,
  ]);

  // Render biểu đồ doanh thu
  const renderRevenueChart = () => {
    const chartData = report.aiAnalysis?.chartData?.revenue;
    if (!chartData) return null;

    // Format data for Shadcn UI BarChart
    const data = chartData.labels.map((label, index) => ({
      name: label,
      [chartData.datasets[0].label]: chartData.datasets[0].data[index],
    }));

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Biểu đồ doanh thu</h3>
        <div className="h-[300px] w-full">
          <BarChart
            data={data}
            index="name"
            categories={[chartData.datasets[0].label]}
            colors={["blue"]}
            valueFormatter={(value) => `${value.toLocaleString()} VND`}
            className="h-full"
          />
        </div>
      </div>
    );
  };

  // Render biểu đồ số học viên
  const renderStudentsChart = () => {
    const chartData = report.aiAnalysis?.chartData?.students;
    if (!chartData) return null;

    // Format data for Shadcn UI PieChart
    const data = chartData.labels.map((label, index) => ({
      name: label,
      value: chartData.datasets[0].data[index],
    }));

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Biểu đồ số học viên</h3>
        <div className="h-[300px] w-full">
          <PieChart
            data={data}
            index="name"
            valueFormatter={(value) => `${value} học viên`}
            category="value"
            className="h-full"
          />
        </div>
      </div>
    );
  };

  // Render dự đoán
  const renderPredictions = () => {
    const predictions = report.aiAnalysis?.predictions;
    if (!predictions) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Dự đoán 3 tháng tới</h3>

        {predictions.revenue && (
          <div className="space-y-2">
            <h4 className="text-md font-medium">Doanh thu</h4>
            <div className="h-[200px] w-full">
              <LineChart
                data={predictions.revenue.map((item) => ({
                  month: item.month,
                  "Doanh thu": item.value,
                }))}
                index="month"
                categories={["Doanh thu"]}
                colors={["blue"]}
                valueFormatter={(value) => `${value.toLocaleString()} VND`}
                className="h-full"
              />
            </div>
          </div>
        )}

        {predictions.students && (
          <div className="space-y-2">
            <h4 className="text-md font-medium">Số học viên</h4>
            <div className="h-[200px] w-full">
              <LineChart
                data={predictions.students.map((item) => ({
                  month: item.month,
                  "Số học viên": item.value,
                }))}
                index="month"
                categories={["Số học viên"]}
                colors={["green"]}
                valueFormatter={(value) => `${value} học viên`}
                className="h-full"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render đề xuất
  const renderRecommendations = () => {
    const recommendations = report.aiAnalysis?.recommendations;
    if (!recommendations || recommendations.length === 0) return null;

    return (
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Đề xuất cải thiện</h3>
        <ul className="space-y-2">
          {recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start gap-2">
              <ArrowRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span>{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Rest of the component remains the same
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Phân tích báo cáo: {report.title}</span>
          <BarChart2 className="h-5 w-5 text-primary" />
        </CardTitle>
        <CardDescription>
          Phân tích dữ liệu và đề xuất dựa trên AI
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!report.aiAnalysis ? (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4 text-center">
              Chưa có phân tích AI cho báo cáo này. Nhấn nút bên dưới để phân
              tích.
            </p>
            <Button
              onClick={analyzeReport}
              disabled={isAnalyzing || isLoading}
              className="flex items-center gap-2"
            >
              {isAnalyzing || isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart2 className="h-4 w-4" />
              )}
              <span>
                {isAnalyzing || isLoading
                  ? "Đang phân tích..."
                  : "Phân tích báo cáo"}
              </span>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Biểu đồ */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderRevenueChart()}
              {renderStudentsChart()}
            </div> */}

            {/* Dự đoán */}
            {renderPredictions()}

            {/* Đề xuất */}
            {renderRecommendations()}

            {/* Phân tích chi tiết */}
            {report.aiAnalysis.rawAnalysis && (
              <Collapsible
                open={isOpen}
                onOpenChange={setIsOpen}
                className="w-full"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Phân tích chi tiết</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 p-0">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span className="sr-only">Toggle</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="mt-2">
                  <div className="rounded-md bg-muted p-4">
                    <p className="whitespace-pre-wrap text-sm">
                      {report.aiAnalysis.rawAnalysis}
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg mt-4">
            <p>{error}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {report.aiAnalysis && (
          <Button
            variant="outline"
            onClick={analyzeReport}
            disabled={isAnalyzing || isLoading}
            className="flex items-center gap-2"
          >
            {isAnalyzing || isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart2 className="h-4 w-4" />
            )}
            <span>
              {isAnalyzing || isLoading
                ? "Đang phân tích lại..."
                : "Phân tích lại"}
            </span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
