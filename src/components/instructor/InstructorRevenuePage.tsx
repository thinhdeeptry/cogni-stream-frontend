"use client";

import { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import {
  BookOpen,
  Calendar,
  Clock,
  DollarSign,
  Download,
  Eye,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";

// Import revenue actions
import {
  PaginatedResponse,
  RevenueShare,
  RevenueShareSummary,
  formatCurrency,
  getMyRevenue,
  getMySummary,
} from "@/actions/revenueShareActions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function InstructorRevenuePage() {
  const [revenueSummary, setRevenueSummary] =
    useState<RevenueShareSummary | null>(null);
  const [revenueShares, setRevenueShares] = useState<RevenueShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");

  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchRevenueShares(currentPage);
  }, [currentPage]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchRevenueSummary(), fetchRevenueShares(1)]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu doanh thu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRevenueSummary = async () => {
    try {
      const summary = await getMySummary();
      setRevenueSummary(summary);
    } catch (error) {
      console.error("Error fetching revenue summary:", error);
      throw error;
    }
  };

  const fetchRevenueShares = async (page: number) => {
    try {
      setIsLoadingShares(true);
      const response: PaginatedResponse<RevenueShare> = await getMyRevenue({
        page,
        limit: 10,
      });
      setRevenueShares(response.data);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
    } catch (error) {
      console.error("Error fetching revenue shares:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách giao dịch",
        variant: "destructive",
      });
    } finally {
      setIsLoadingShares(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await fetchInitialData();
      toast({
        title: "Thành công",
        description: "Dữ liệu đã được cập nhật",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật dữ liệu",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProductTypeBadge = (type: "COURSE" | "CLASS") => {
    return type === "COURSE" ? (
      <Badge className="bg-blue-100 text-blue-800">Khóa học</Badge>
    ) : (
      <Badge className="bg-purple-100 text-purple-800">Lớp học</Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      SUCCESS: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
      PENDING: "bg-yellow-100 text-yellow-800",
    };

    const labels = {
      SUCCESS: "Thành công",
      FAILED: "Thất bại",
      PENDING: "Đang xử lý",
    };

    return (
      <Badge
        className={
          colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
        }
      >
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Doanh thu của tôi
            </h1>
            <p className="text-slate-600">
              Theo dõi doanh thu và hoa hồng từ các khóa học
            </p>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="h-8 w-8 bg-gray-200 animate-pulse rounded mb-4"></div>
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 bg-gray-100 animate-pulse rounded"
                ></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Doanh thu của tôi
          </h1>
          <p className="text-slate-600">
            Theo dõi doanh thu và hoa hồng từ các khóa học và lớp học
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            {/* <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            /> */}
            Làm mới
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            {/* <Download className="h-4 w-4" /> */}
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600">
                  Tổng doanh thu
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {revenueSummary
                    ? formatCurrency(revenueSummary.totalRevenue)
                    : "0 ₫"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {revenueSummary?.totalTransactions || 0} giao dịch
                </p>
              </div>
              {/* <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div> */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600">
                  Hoa hồng nhận được
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {revenueSummary
                    ? formatCurrency(revenueSummary.totalInstructorAmount)
                    : "0 ₫"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Tỷ lệ TB:{" "}
                  {revenueSummary?.averageCommissionRate.toFixed(1) || 0}%
                </p>
              </div>
              {/* <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div> */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600">Khóa học</p>
                <p className="text-2xl font-bold text-purple-600">
                  {revenueSummary?.coursesCount || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  khóa học có doanh thu
                </p>
              </div>
              {/* <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div> */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600">Lớp học</p>
                <p className="text-2xl font-bold text-orange-600">
                  {revenueSummary?.classesCount || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  lớp học có doanh thu
                </p>
              </div>
              {/* <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600" />
              </div> */}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Share Breakdown */}
      {revenueSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {/* <TrendingUp className="h-5 w-5" /> */}
              Phân chia doanh thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Phân chia doanh thu</span>
                <span className="text-sm text-slate-500">
                  {(
                    (revenueSummary.totalInstructorAmount /
                      revenueSummary.totalRevenue) *
                    100
                  ).toFixed(1)}
                  % cho tôi /{" "}
                  {(
                    (revenueSummary.totalPlatformAmount /
                      revenueSummary.totalRevenue) *
                    100
                  ).toFixed(1)}
                  % cho nền tảng
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="flex h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-green-500"
                    style={{
                      width: `${(revenueSummary.totalInstructorAmount / revenueSummary.totalRevenue) * 100}%`,
                    }}
                  ></div>
                  <div
                    className="bg-blue-500"
                    style={{
                      width: `${(revenueSummary.totalPlatformAmount / revenueSummary.totalRevenue) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>
                    Hoa hồng của tôi:{" "}
                    {formatCurrency(revenueSummary.totalInstructorAmount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>
                    Phí nền tảng:{" "}
                    {formatCurrency(revenueSummary.totalPlatformAmount)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lịch sử giao dịch
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingShares ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                >
                  <div className="h-10 w-10 bg-gray-200 animate-pulse rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-3 w-32 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          ) : revenueShares.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg mb-2">
                Chưa có giao dịch nào
              </p>
              <p className="text-slate-400">
                Giao dịch sẽ xuất hiện khi học viên mua khóa học hoặc lớp học
                của bạn
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Giá gốc</TableHead>
                    <TableHead>Giá bán</TableHead>
                    <TableHead>Hoa hồng</TableHead>
                    <TableHead>Tỷ lệ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueShares.map((share) => (
                    <TableRow key={share.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {share.productTitle}
                          </p>
                          <p className="text-sm text-slate-500">
                            ID: {share.productId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getProductTypeBadge(share.productType)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(share.originalPrice)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(share.finalPrice)}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(share.instructorAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{share.instructorRate}%</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(share.transaction.status)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(share.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-slate-500">
                    Trang {currentPage} / {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1 || isLoadingShares}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages || isLoadingShares}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
