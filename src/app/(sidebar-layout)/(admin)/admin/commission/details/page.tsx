"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Edit,
  Eye,
  Layers,
  Plus,
  RotateCcw,
  Target,
  Trash2,
  X,
} from "lucide-react";

import {
  CommissionDetail,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { DetailDetailModal } from "./components/DetailDetailModal";
// Components
import { type DetailFormData, DetailModal } from "./components/DetailModal";
// Hooks
import { useCommissionPageData } from "./hooks/useCommissionPageData";

// Content component that uses useSearchParams
function CommissionDetailsContent() {
  const searchParams = useSearchParams();
  const headerIdFromUrl = searchParams.get("headerId");

  // Load courses and categories data
  const { courses, categories, isLoadingCourses, isLoadingCategories } =
    useCommissionPageData();
  console.log("CommissionDetailsPage - courses:", courses);
  // If headerId is provided, redirect to the new header details page
  useEffect(() => {
    if (headerIdFromUrl) {
      window.location.href = `/admin/commission/headers/${headerIdFromUrl}`;
      return;
    }
  }, [headerIdFromUrl]);

  const {
    details,
    detailsCount,
    detailsMeta,
    headers,
    isLoadingDetails,
    fetchDetails,
    fetchHeaders,
    createDetail,
    updateDetail,
    deleteDetail,
    isProcessing,
  } = useCommissionStore();

  const [filterHeaderId, setFilterHeaderId] = useState<string>(
    headerIdFromUrl || "all",
  );
  const [filterActive, setFilterActive] = useState<string>("all");
  const [filterScope, setFilterScope] = useState<string>("all");

  const [selectedDetail, setSelectedDetail] = useState<CommissionDetail | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Initialize data
  useEffect(() => {
    fetchHeaders({ limit: 100 }); // Get all headers for dropdown
  }, [fetchHeaders]);

  useEffect(() => {
    const params: any = {};
    if (filterHeaderId !== "all") params.headerId = filterHeaderId;
    if (filterActive !== "all") params.isActive = filterActive === "true";

    fetchDetails(params);
  }, [fetchDetails, filterHeaderId, filterActive]);

  // Detail handlers
  const handleCreateDetail = async (data: DetailFormData) => {
    try {
      await createDetail({
        ...data,
        instructorRate: 100 - data.platformRate, // Auto-calculate
      });
      toast({
        title: "Thành công",
        description: "Đã tạo commission detail mới",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo commission detail",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateDetail = async (data: DetailFormData) => {
    if (!selectedDetail) return;

    try {
      await updateDetail(selectedDetail.id, {
        platformRate: data.platformRate,
        instructorRate: 100 - data.platformRate, // Auto-calculate
        priority: data.priority,
      });
      toast({
        title: "Thành công",
        description: "Đã cập nhật commission detail",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật commission detail",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteDetail = async () => {
    if (!selectedDetail) return;

    try {
      await deleteDetail(selectedDetail.id);
      toast({
        title: "Thành công",
        description: "Đã xóa commission detail",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa commission detail",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleToggleActive = async (detail: CommissionDetail) => {
    try {
      await updateDetail(detail.id, { isActive: !detail.isActive });
      toast({
        title: "Thành công",
        description: detail.isActive
          ? "Đã tạm dừng detail"
          : "Đã kích hoạt detail",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi trạng thái detail",
        variant: "destructive",
      });
    }
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return "Không rõ";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Vừa xong";
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  if (isLoadingDetails) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-500">Đang tải danh sách details...</p>
        </div>
      </div>
    );
  }

  const selectedHeaderName = headers.find((h) => h.id === filterHeaderId)?.name;

  // If no headerId is provided, show info about new workflow
  if (!headerIdFromUrl) {
    return (
      <div className="w-full space-y-6 p-6 bg-slate-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/admin/commission">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Quản Lý Chi Tiết Hoa Hồng
              </h1>
              <p className="text-slate-500 text-sm">
                Luồng làm việc mới đã được cập nhật
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Layers className="h-5 w-5" />
                Luồng Làm Việc Mới
              </CardTitle>
              <CardDescription className="text-blue-700">
                Chúng tôi đã cập nhật cách quản lý chi tiết hoa hồng để trải
                nghiệm tốt hơn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">
                      Vào Cấu Hình Headers
                    </h4>
                    <p className="text-sm text-blue-700">
                      Bắt đầu bằng cách vào trang quản lý cấu hình hoa hồng
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">
                      Chọn Header cụ thể
                    </h4>
                    <p className="text-sm text-blue-700">
                      Click vào một header để xem và quản lý các chi tiết của nó
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900">
                      Quản lý Chi Tiết
                    </h4>
                    <p className="text-sm text-blue-700">
                      Tạo và chỉnh sửa các chi tiết hoa hồng cho header đó
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-blue-200">
                <div className="flex gap-3">
                  <Link href="/admin/commission/headers">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Layers className="h-4 w-4 mr-2" />
                      Đi đến Cấu Hình Headers
                    </Button>
                  </Link>
                  <Link href="/admin/commission">
                    <Button
                      variant="outline"
                      className="text-blue-600 border-blue-300"
                    >
                      Quay lại Trang Chính
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6 bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/admin/commission">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Chi Tiết Hoa Hồng
            </h1>
            <p className="text-slate-500 text-sm">
              {detailsCount} chi tiết hoa hồng
              {selectedHeaderName && ` • ${selectedHeaderName}`}
            </p>
          </div>
        </div>

        <Button
          className="bg-green-500 hover:bg-green-600 text-white"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo Chi Tiết Mới
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={filterHeaderId} onValueChange={setFilterHeaderId}>
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả Headers</SelectItem>
            {headers.map((header) => (
              <SelectItem key={header.id} value={header.id}>
                <div className="flex items-center gap-2">
                  <span>{header.name}</span>
                  <Badge
                    className={
                      header.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {header.status}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterActive} onValueChange={setFilterActive}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="true">Đang áp dụng</SelectItem>
            <SelectItem value="false">Tạm dừng</SelectItem>
          </SelectContent>
        </Select>

        {filterHeaderId !== "all" && (
          <Button
            variant="outline"
            onClick={() => setFilterHeaderId("all")}
            className="text-slate-600"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Phạm vi áp dụng</TableHead>
              <TableHead>Header</TableHead>
              <TableHead>Tỷ lệ hoa hồng</TableHead>
              <TableHead>Độ ưu tiên</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Cập nhật</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detailsCount === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-slate-500"
                >
                  {filterHeaderId !== "all" || filterActive !== "all"
                    ? "Không tìm thấy detail nào phù hợp"
                    : "🎯 Chưa có commission detail nào"}
                </TableCell>
              </TableRow>
            ) : (
              details.map((detail: CommissionDetail) => (
                <TableRow key={detail.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="space-y-1">
                      {detail.course ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {detail.course.title}
                        </Badge>
                      ) : detail.category ? (
                        <Badge className="bg-purple-100 text-purple-800">
                          <Layers className="h-3 w-3 mr-1" />
                          {detail.category.name}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          <Target className="h-3 w-3 mr-1" />
                          Tổng quát
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {detail.header?.name}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-blue-600">
                          Platform: {detail.platformRate}%
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="text-green-600">
                          GV: {detail.instructorRate}%
                        </span>
                      </div>
                      <div className="flex h-1.5 rounded overflow-hidden border w-24">
                        <div
                          className="bg-blue-500"
                          style={{ width: `${detail.platformRate}%` }}
                        ></div>
                        <div
                          className="bg-green-500"
                          style={{ width: `${detail.instructorRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">Mức {detail.priority}</Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={
                        detail.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {detail.isActive ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Áp dụng
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Tạm dừng
                        </>
                      )}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-slate-600">
                      {getTimeAgo(detail.updatedAt.toString())}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDetail(detail);
                          setIsDetailModalOpen(true);
                        }}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDetail(detail);
                          setIsEditModalOpen(true);
                        }}
                        className="text-orange-600 hover:bg-orange-50"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(detail)}
                        disabled={isProcessing(detail.id)}
                        className={
                          detail.isActive
                            ? "text-yellow-600 hover:bg-yellow-50"
                            : "text-green-600 hover:bg-green-50"
                        }
                      >
                        {isProcessing(detail.id) ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                        ) : detail.isActive ? (
                          <X className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDetail(detail);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:bg-red-50"
                        disabled={isProcessing(detail.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <DetailModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
        onSubmit={handleCreateDetail}
        headers={headers.filter((h) => h.status === "ACTIVE")}
        currentHeaderId={filterHeaderId}
        courses={courses}
        categories={categories}
        isLoadingCourses={isLoadingCourses}
        isLoadingCategories={isLoadingCategories}
      />

      <DetailModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        detail={selectedDetail}
        mode="edit"
        onSubmit={handleUpdateDetail}
        headers={headers}
        currentHeaderId={filterHeaderId}
        courses={courses}
        categories={categories}
        isLoadingCourses={isLoadingCourses}
        isLoadingCategories={isLoadingCategories}
      />

      <DetailDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        detail={selectedDetail}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        detail={selectedDetail}
        onConfirm={handleDeleteDetail}
      />
    </div>
  );
}

// Main component with Suspense boundary
export default function CommissionDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-slate-500">Đang tải trang...</p>
          </div>
        </div>
      }
    >
      <CommissionDetailsContent />
    </Suspense>
  );
}
