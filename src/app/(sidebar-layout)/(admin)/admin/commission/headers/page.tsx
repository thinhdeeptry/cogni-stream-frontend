"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  DollarSign,
  Edit,
  Eye,
  Layers,
  Pause,
  Play,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";

import {
  CommissionHeader,
  useCommissionStore,
} from "@/stores/useCommissionStore";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";

// Form types
interface HeaderFormData {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

// Create/Edit Header Modal Component
interface HeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  header?: CommissionHeader | null;
  mode: "create" | "edit";
  onSubmit: (data: HeaderFormData) => void;
}

const HeaderModal: React.FC<HeaderModalProps> = ({
  isOpen,
  onClose,
  header,
  mode,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<HeaderFormData>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when header changes
  useEffect(() => {
    if (mode === "edit" && header) {
      setFormData({
        name: header.name || "",
        description: header.description || "",
        startDate: header.startDate
          ? new Date(header.startDate).toISOString().split("T")[0]
          : "",
        endDate: header.endDate
          ? new Date(header.endDate).toISOString().split("T")[0]
          : "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
      });
    }
  }, [mode, header, isOpen]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Cần nhập tên",
        description: "Vui lòng nhập tên cho commission header",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        ...formData,
        description: formData.description?.trim() || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      });

      onClose();
    } catch (error) {
      // Error handled in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {mode === "create"
              ? "Tạo Cấu Hình Hoa Hồng Mới"
              : `Chỉnh sửa: ${header?.name}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Tạo cấu hình hoa hồng mới cho hệ thống"
              : "Cập nhật thông tin cấu hình hoa hồng"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên Cấu Hình Hoa Hồng *</Label>
            <Input
              id="name"
              placeholder="VD: Hoa hồng cơ bản Q4 2025"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              placeholder="Mô tả chi tiết về cấu hình hoa hồng này..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Ngày bắt đầu</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Ngày kết thúc</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="text-blue-700">
              <strong>Lưu ý:</strong> Cấu hình mới sẽ được tạo ở trạng thái
              "INACTIVE". Bạn có thể kích hoạt sau khi tạo và thêm các chi tiết
              cần thiết.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isSubmitting
              ? "Đang xử lý..."
              : mode === "create"
                ? "Tạo Cấu Hình"
                : "Cập nhật"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Header Detail Modal Component
const HeaderDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  header: CommissionHeader | null;
}> = ({ isOpen, onClose, header }) => {
  if (!header) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Chi tiết: {header.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Thông tin cơ bản</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Tên:</strong> {header.name}
                </p>

                <p>
                  <strong>Trạng thái:</strong>
                  <Badge
                    className={`ml-2 ${
                      header.status === "ACTIVE"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {header.status === "ACTIVE" ? "Đang hoạt động" : "Tạm dừng"}
                  </Badge>
                </p>
                <p>
                  <strong>Số details:</strong> {header._count?.details || 0}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Thời gian</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Tạo:</strong>{" "}
                  {new Date(header.createdAt).toLocaleDateString("vi-VN")}
                </p>
                <p>
                  <strong>Cập nhật:</strong>{" "}
                  {new Date(header.updatedAt).toLocaleDateString("vi-VN")}
                </p>
                {header.startDate && (
                  <p>
                    <strong>Bắt đầu:</strong>{" "}
                    {new Date(header.startDate).toLocaleDateString("vi-VN")}
                  </p>
                )}
                {header.endDate && (
                  <p>
                    <strong>Kết thúc:</strong>{" "}
                    {new Date(header.endDate).toLocaleDateString("vi-VN")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {header.description && (
            <div>
              <h4 className="font-semibold mb-2">Mô tả</h4>
              <p className="text-sm bg-slate-50 p-3 rounded">
                {header.description}
              </p>
            </div>
          )}

          {/* Details Preview */}
          {header.details && header.details.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">
                Details ({header.details.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {header.details.map((detail) => (
                  <div
                    key={detail.id}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        {detail.course?.title ||
                          detail.category?.name ||
                          "Tổng quát"}
                      </span>
                      <span className="text-slate-500 ml-2">
                        Platform: {detail.platformRate}% | Giảng viên:{" "}
                        {detail.instructorRate}%
                      </span>
                    </div>
                    <Badge
                      className={
                        detail.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {detail.isActive ? "Hoạt động" : "Tạm dừng"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Link href={`/admin/commission/headers/${header.id}`}>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              Xem Details
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  header: CommissionHeader | null;
  onConfirm: () => void;
}> = ({ isOpen, onClose, header, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Xóa Commission Header
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa commission header này?
          </DialogDescription>
        </DialogHeader>

        {header && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-medium text-red-900">{header.name}</h4>
            <p className="text-sm text-red-700 mt-1">
              {header._count?.details || 0} details sẽ bị xóa cùng
            </p>
            <p className="text-sm text-red-600 mt-2">
              <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác!
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Hủy
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isDeleting ? "Đang xóa..." : "Xóa Header"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main component
export default function CommissionHeadersPage() {
  const {
    headers,
    headersCount,
    headersMeta,
    isLoadingHeaders,
    fetchHeaders,
    createHeader,
    updateHeader,
    deleteHeader,
    activateHeader,
    deactivateHeader,
    isProcessing,
  } = useCommissionStore();

  const [sortBy, setSortBy] = useState("newest");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED"
  >("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedHeader, setSelectedHeader] = useState<CommissionHeader | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Initialize data
  useEffect(() => {
    const params = {
      search: searchQuery || undefined,
      status:
        filterStatus !== "all"
          ? (filterStatus as "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED")
          : undefined,
    };
    fetchHeaders(params);
  }, [fetchHeaders, searchQuery, filterStatus]);

  // Header handlers
  const handleCreateHeader = async (data: HeaderFormData) => {
    try {
      await createHeader(data);
      toast({
        title: "Thành công",
        description: "Đã tạo commission header mới",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo commission header",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUpdateHeader = async (data: HeaderFormData) => {
    if (!selectedHeader) return;

    try {
      await updateHeader(selectedHeader.id, data);
      toast({
        title: "Thành công",
        description: "Đã cập nhật commission header",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật commission header",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteHeader = async () => {
    if (!selectedHeader) return;

    try {
      await deleteHeader(selectedHeader.id);
      toast({
        title: "Thành công",
        description: "Đã xóa commission header",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa commission header",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleToggleStatus = async (header: CommissionHeader) => {
    try {
      if (header.status === "ACTIVE") {
        await deactivateHeader(header.id);
        toast({
          title: "Thành công",
          description: "Đã tạm dừng commission header",
        });
      } else {
        await activateHeader(header.id);
        toast({
          title: "Thành công",
          description: "Đã kích hoạt commission header",
        });
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể thay đổi trạng thái commission header",
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

  if (isLoadingHeaders) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-500">Đang tải danh sách headers...</p>
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
              📋 Cấu Hình Hoa Hồng
            </h1>
            <p className="text-slate-500 text-sm">
              {headersCount} cấu hình hoa hồng • Quản lý các cấu hình chính
            </p>
          </div>
        </div>

        <Button
          className="bg-blue-500 hover:bg-blue-600 text-white"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo Cấu Hình Mới
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Tìm kiếm theo tên hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={(value) =>
            setFilterStatus(value as typeof filterStatus)
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
            <SelectItem value="INACTIVE">Tạm dừng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Header</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headersCount === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-slate-500"
                >
                  {searchQuery || filterStatus !== "all"
                    ? "Không tìm thấy header nào phù hợp"
                    : "🎯 Chưa có commission header nào"}
                </TableCell>
              </TableRow>
            ) : (
              headers.map((header: CommissionHeader) => (
                <TableRow key={header.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">
                        {header.name}
                      </p>
                      {header.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {header.description.slice(0, 100)}...
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={
                        header.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {header.status === "ACTIVE" ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Hoạt động
                        </>
                      ) : (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Tạm dừng
                        </>
                      )}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-4 w-4" />
                        <span>{getTimeAgo(header.updatedAt.toString())}</span>
                      </div>
                      {header.startDate && (
                        <div className="text-xs text-slate-500 mt-1">
                          Từ:{" "}
                          {new Date(header.startDate).toLocaleDateString(
                            "vi-VN",
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {header._count?.details || 0} details
                      </Badge>
                      {(header._count?.details || 0) > 0 && (
                        <Link href={`/admin/commission/headers/${header.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedHeader(header);
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
                          setSelectedHeader(header);
                          setIsEditModalOpen(true);
                        }}
                        className="text-orange-600 hover:bg-orange-50"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(header)}
                        disabled={isProcessing(header.id)}
                        className={
                          header.status === "ACTIVE"
                            ? "text-yellow-600 hover:bg-yellow-50"
                            : "text-green-600 hover:bg-green-50"
                        }
                      >
                        {isProcessing(header.id) ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                        ) : header.status === "ACTIVE" ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedHeader(header);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:bg-red-50"
                        disabled={isProcessing(header.id)}
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

      {/* Pagination would go here if needed */}

      {/* Modals */}
      <HeaderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
        onSubmit={handleCreateHeader}
      />

      <HeaderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        header={selectedHeader}
        mode="edit"
        onSubmit={handleUpdateHeader}
      />

      <HeaderDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        header={selectedHeader}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        header={selectedHeader}
        onConfirm={handleDeleteHeader}
      />
    </div>
  );
}
