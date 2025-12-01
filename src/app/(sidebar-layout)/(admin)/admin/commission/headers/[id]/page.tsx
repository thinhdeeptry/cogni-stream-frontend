"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Edit,
  Eye,
  FileText,
  Layers,
  Plus,
  Target,
  Trash2,
  X,
} from "lucide-react";

import {
  CommissionDetail,
  CommissionHeader,
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

// Mock data for courses and categories (in real app, these would come from API)
const mockCourses = [
  { id: "course-1", title: "React Advanced" },
  { id: "course-2", title: "Node.js Fundamentals" },
  { id: "course-3", title: "Python for Data Science" },
];

const mockCategories = [
  { id: "cat-1", name: "Lập trình Web" },
  { id: "cat-2", name: "Data Science" },
  { id: "cat-3", name: "Mobile Development" },
];

// Form types
interface DetailFormData {
  headerId: string;
  courseId?: string;
  categoryId?: string;
  platformRate: number;
  priority: number;
}

// Create/Edit Detail Modal Component
interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail?: CommissionDetail | null;
  mode: "create" | "edit";
  onSubmit: (data: DetailFormData) => void;
  headerId: string;
}

const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  detail,
  mode,
  onSubmit,
  headerId,
}) => {
  const [formData, setFormData] = useState<DetailFormData>({
    headerId: headerId,
    courseId: undefined,
    categoryId: undefined,
    platformRate: 30,
    priority: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationType, setApplicationType] = useState<
    "general" | "course" | "category"
  >("general");

  // Calculate instructor rate automatically
  const instructorRate = 100 - formData.platformRate;

  // Initialize form data when detail changes
  useEffect(() => {
    if (mode === "edit" && detail) {
      setFormData({
        headerId: detail.headerId,
        courseId: detail.courseId || undefined,
        categoryId: detail.categoryId || undefined,
        platformRate: detail.platformRate,
        priority: detail.priority,
      });

      // Determine application type
      if (detail.courseId) {
        setApplicationType("course");
      } else if (detail.categoryId) {
        setApplicationType("category");
      } else {
        setApplicationType("general");
      }
    } else {
      setFormData({
        headerId: headerId,
        courseId: undefined,
        categoryId: undefined,
        platformRate: 30,
        priority: 1,
      });
      setApplicationType("general");
    }
  }, [mode, detail, isOpen, headerId]);

  const handleSubmit = async () => {
    if (formData.platformRate <= 0 || formData.platformRate >= 100) {
      toast({
        title: "Tỷ lệ không hợp lệ",
        description: "Tỷ lệ platform phải từ 1% đến 99%",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const submitData: DetailFormData = {
        ...formData,
        courseId: applicationType === "course" ? formData.courseId : undefined,
        categoryId:
          applicationType === "category" ? formData.categoryId : undefined,
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      // Error handled in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            {mode === "create"
              ? "Tạo Chi Tiết Hoa Hồng Mới"
              : `Chỉnh sửa Chi Tiết Hoa Hồng`}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {mode === "create"
              ? "Tạo chi tiết hoa hồng cụ thể cho khóa học, danh mục hoặc toàn hệ thống"
              : "Cập nhật thông tin chi tiết hoa hồng"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Application Type */}
          <div className="space-y-2">
            <Label>Phạm vi áp dụng *</Label>
            <Select
              value={applicationType}
              onValueChange={(value: "general" | "course" | "category") =>
                setApplicationType(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">
                  <div className="flex items-center gap-2">
                    Tổng quát (Toàn hệ thống)
                  </div>
                </SelectItem>
                <SelectItem value="course">
                  <div className="flex items-center gap-2">Khóa học cụ thể</div>
                </SelectItem>
                <SelectItem value="category">
                  <div className="flex items-center gap-2">Danh mục cụ thể</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Course Selection (if course type) */}
          {applicationType === "course" && (
            <div className="space-y-2">
              <Label htmlFor="courseId">Khóa học *</Label>
              <Select
                value={formData.courseId || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, courseId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khóa học..." />
                </SelectTrigger>
                <SelectContent>
                  {mockCourses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category Selection (if category type) */}
          {applicationType === "category" && (
            <div className="space-y-2">
              <Label htmlFor="categoryId">Danh mục *</Label>
              <Select
                value={formData.categoryId || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, categoryId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục..." />
                </SelectTrigger>
                <SelectContent>
                  {mockCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Platform Rate - Only this field is editable */}
          <div className="space-y-2">
            <Label htmlFor="platformRate">
              Tỷ lệ hoa hồng cho Nền tảng (%)
            </Label>
            <Input
              id="platformRate"
              type="number"
              min="1"
              max="99"
              value={formData.platformRate}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  platformRate: Number(e.target.value),
                }))
              }
            />
            <p className="text-xs text-slate-500">
              Nhập tỷ lệ hoa hồng mà nền tảng sẽ nhận (1-99%)
            </p>
          </div>

          {/* Auto-calculated Instructor Rate - Read only */}
          <div className="space-y-2">
            <Label>Tỷ lệ hoa hồng cho Giảng viên (%) - Tự động tính</Label>
            <Input
              type="number"
              value={instructorRate}
              disabled
              className="bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500">
              Tự động tính = 100% - Tỷ lệ nền tảng
            </p>
          </div>

          {/* Rate Preview */}
          <div className="p-3 sm:p-4 bg-slate-50 rounded-lg">
            <div className="text-sm font-medium mb-2">Xem trước phân chia:</div>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="p-2 bg-blue-100 rounded text-center">
                <div className="text-blue-800 font-bold text-sm sm:text-base">
                  {formData.platformRate}%
                </div>
                <div className="text-blue-600 text-xs">Nền tảng</div>
              </div>
              <div className="p-2 bg-green-100 rounded text-center">
                <div className="text-green-800 font-bold text-sm sm:text-base">
                  {instructorRate}%
                </div>
                <div className="text-green-600 text-xs">Giảng viên</div>
              </div>
            </div>
            <div className="flex h-2 rounded mt-2 overflow-hidden">
              <div
                className="bg-blue-500"
                style={{ width: `${formData.platformRate}%` }}
              ></div>
              <div
                className="bg-green-500"
                style={{ width: `${instructorRate}%` }}
              ></div>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Độ ưu tiên</Label>
            <Input
              id="priority"
              type="number"
              min="1"
              max="10"
              value={formData.priority}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  priority: Number(e.target.value),
                }))
              }
            />
            <p className="text-xs text-slate-500">
              Số càng cao, độ ưu tiên càng cao khi có nhiều rule áp dụng
            </p>
          </div>

          {/* Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="text-blue-700">
              <strong>Lưu ý:</strong> Detail mới sẽ được tạo ở trạng thái
              "active". Hệ thống sẽ tự động tính hoa hồng cho giảng viên dựa
              trên tỷ lệ nền tảng.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              formData.platformRate <= 0 ||
              formData.platformRate >= 100
            }
            className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
          >
            {isSubmitting
              ? "Đang xử lý..."
              : mode === "create"
                ? "Tạo Chi Tiết"
                : "Cập nhật"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Detail Detail Modal Component
const DetailDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  detail: CommissionDetail | null;
}> = ({ isOpen, onClose, detail }) => {
  if (!detail) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            Chi Tiết Hoa Hồng
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 text-sm sm:text-base">
                Thông tin cơ bản
              </h4>
              <div className="space-y-1 text-xs sm:text-sm">
                <div>
                  <strong>Phạm vi:</strong>
                  {detail.course ? (
                    <Badge className="ml-2 bg-blue-100 text-blue-800">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {detail.course.title}
                    </Badge>
                  ) : detail.category ? (
                    <Badge className="ml-2 bg-purple-100 text-purple-800">
                      <Layers className="h-3 w-3 mr-1" />
                      {detail.category.name}
                    </Badge>
                  ) : (
                    <Badge className="ml-2 bg-gray-100 text-gray-800">
                      <Target className="h-3 w-3 mr-1" />
                      Tổng quát
                    </Badge>
                  )}
                </div>
                <div>
                  <strong>Trạng thái:</strong>
                  <Badge
                    className={`ml-2 ${
                      detail.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {detail.isActive ? "Đang áp dụng" : "Tạm dừng"}
                  </Badge>
                </div>
                <div>
                  <strong>Độ ưu tiên:</strong> {detail.priority}
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-sm sm:text-base">
                Tỷ lệ hoa hồng
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm text-blue-700">Platform</span>
                  <span className="font-bold text-blue-800">
                    {detail.platformRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm text-green-700">Giảng viên</span>
                  <span className="font-bold text-green-800">
                    {detail.instructorRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-100 rounded">
                  <span className="text-sm text-slate-700">Tổng cộng</span>
                  <span className="font-bold">
                    {+detail.platformRate + +detail.instructorRate + "%"}{" "}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Rate Breakdown */}
          <div>
            <h4 className="font-semibold mb-2 text-sm sm:text-base">
              Phân chia hoa hồng
            </h4>
            <div className="space-y-2">
              <div className="flex h-6 sm:h-8 rounded overflow-hidden border">
                <div
                  className="bg-blue-500 flex items-center justify-center text-white text-xs sm:text-sm font-medium"
                  style={{ width: `${detail.platformRate}%` }}
                >
                  <span className="hidden sm:inline">Platform</span>{" "}
                  {detail.platformRate}%
                </div>
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-xs sm:text-sm font-medium"
                  style={{ width: `${detail.instructorRate}%` }}
                >
                  <span className="hidden sm:inline">Giảng viên</span>{" "}
                  {detail.instructorRate}%
                </div>
              </div>
              <div className="text-xs text-slate-500 text-center">
                Tỷ lệ phân chia cho mỗi giao dịch
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  detail: CommissionDetail | null;
  onConfirm: () => void;
}> = ({ isOpen, onClose, detail, onConfirm }) => {
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
      <DialogContent className="mx-4 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-sm sm:text-base">
            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            Xóa Chi Tiết Hoa Hồng
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Bạn có chắc chắn muốn xóa chi tiết hoa hồng này?
          </DialogDescription>
        </DialogHeader>

        {detail && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <div className="space-y-2">
              <h4 className="font-medium text-red-900">
                {detail.course?.title ||
                  detail.category?.name ||
                  "Hoa hồng tổng quát"}
              </h4>
              <p className="text-sm text-red-700">
                Platform: {detail.platformRate}% | Giảng viên:{" "}
                {detail.instructorRate}%
              </p>
            </div>
            <p className="text-sm text-red-600 mt-3">
              <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác!
            </p>
          </div>
        )}

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Hủy
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
          >
            {isDeleting ? "Đang xóa..." : "Xóa Chi Tiết"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main component
export default function HeaderDetailsPage() {
  const params = useParams();
  const headerId = params?.id as string;

  const {
    details,
    detailsCount,
    headers,
    isLoadingDetails,
    isLoadingHeaders,
    fetchDetails,
    fetchHeaders,
    createDetail,
    updateDetail,
    deleteDetail,
    isProcessing,
  } = useCommissionStore();

  const [selectedDetail, setSelectedDetail] = useState<CommissionDetail | null>(
    null,
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Get current header info
  const currentHeader = headers.find((h) => h.id === headerId);

  // Initialize data
  useEffect(() => {
    if (headerId) {
      fetchDetails({ headerId });
      fetchHeaders({ limit: 100 });
    }
  }, [fetchDetails, fetchHeaders, headerId]);

  // Detail handlers
  const handleCreateDetail = async (data: DetailFormData) => {
    try {
      await createDetail({
        ...data,
        instructorRate: 100 - data.platformRate, // Auto-calculate instructor rate
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

  if (isLoadingDetails || isLoadingHeaders) {
    return (
      <div className="flex justify-center items-center min-h-[400px] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-500 text-sm sm:text-base">
            Đang tải chi tiết...
          </p>
        </div>
      </div>
    );
  }

  if (!currentHeader) {
    return (
      <div className="flex justify-center items-center min-h-[400px] p-4">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
            Không tìm thấy Header
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mb-4">
            Header với ID "{headerId}" không tồn tại.
          </p>
          <Link href="/admin/commission/headers">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách Headers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 p-4 sm:p-6 bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/commission/headers">
            <Button variant="outline" size="icon" className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">
              Chi Tiết: {currentHeader.name}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-slate-500">
              <span>{detailsCount} chi tiết hoa hồng</span>
              <Badge
                className={
                  currentHeader.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }
              >
                {currentHeader.status === "ACTIVE"
                  ? "Đang hoạt động"
                  : "Tạm dừng"}
              </Badge>
            </div>
          </div>
        </div>

        <Button
          className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto"
          onClick={() => setIsCreateModalOpen(true)}
          disabled={currentHeader.status !== "ACTIVE"}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Tạo Chi Tiết Mới</span>
          <span className="sm:hidden">Tạo Mới</span>
        </Button>
      </div>

      {/* Header Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            {/* <Layers className="h-5 w-5 text-blue-600" /> */}
            Thông tin Cấu hình
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              {currentHeader.description && (
                <div className="mb-3">
                  <h4 className="font-medium text-slate-700 mb-1 text-sm">
                    Mô tả:
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600">
                    {currentHeader.description}
                  </p>
                </div>
              )}
              <div className="space-y-1 text-xs sm:text-sm">
                <p>
                  <strong>Tạo:</strong>{" "}
                  {new Date(currentHeader.createdAt).toLocaleDateString(
                    "vi-VN",
                  )}
                </p>
                <p>
                  <strong>Cập nhật:</strong>{" "}
                  {new Date(currentHeader.updatedAt).toLocaleDateString(
                    "vi-VN",
                  )}
                </p>
              </div>
            </div>
            <div>
              <div className="space-y-1 text-xs sm:text-sm">
                {currentHeader.startDate && (
                  <p>
                    <strong>Bắt đầu:</strong>{" "}
                    {new Date(currentHeader.startDate).toLocaleDateString(
                      "vi-VN",
                    )}
                  </p>
                )}
                {currentHeader.endDate && (
                  <p>
                    <strong>Kết thúc:</strong>{" "}
                    {new Date(currentHeader.endDate).toLocaleDateString(
                      "vi-VN",
                    )}
                  </p>
                )}
                <p>
                  <strong>Tổng chi tiết:</strong> {detailsCount}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            Danh sách Chi Tiết Hoa Hồng
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Các chi tiết hoa hồng được áp dụng cho cấu hình này
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="rounded-lg border border-slate-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Phạm vi áp dụng</TableHead>
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
                        colSpan={6}
                        className="text-center py-8 text-slate-500"
                      >
                        Chưa có chi tiết hoa hồng nào cho cấu hình này
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
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden">
            {detailsCount === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-white rounded-lg border">
                <div className="text-xs sm:text-sm">
                  Chưa có chi tiết hoa hồng nào cho cấu hình này
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {details.map((detail: CommissionDetail) => (
                  <div
                    key={detail.id}
                    className="bg-white rounded-lg border border-slate-200 p-4 space-y-3"
                  >
                    {/* Phạm vi áp dụng */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        {detail.course ? (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {detail.course.title}
                          </Badge>
                        ) : detail.category ? (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            <Layers className="h-3 w-3 mr-1" />
                            {detail.category.name}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 text-xs">
                            <Target className="h-3 w-3 mr-1" />
                            Tổng quát
                          </Badge>
                        )}
                      </div>
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
                            <span className="text-xs">Áp dụng</span>
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            <span className="text-xs">Tạm dừng</span>
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Tỷ lệ hoa hồng */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-slate-600">
                        Tỷ lệ hoa hồng:
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-blue-600">
                          Platform: {detail.platformRate}%
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="text-green-600">
                          GV: {detail.instructorRate}%
                        </span>
                      </div>
                      <div className="flex h-2 rounded overflow-hidden border">
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

                    {/* Độ ưu tiên và thời gian cập nhật */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span>
                          <strong>Độ ưu tiên:</strong> Mức {detail.priority}
                        </span>
                      </div>
                      <span>{getTimeAgo(detail.updatedAt.toString())}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDetail(detail);
                          setIsDetailModalOpen(true);
                        }}
                        className="text-blue-600 hover:bg-blue-50 px-2"
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
                        className="text-orange-600 hover:bg-orange-50 px-2"
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
                            ? "text-yellow-600 hover:bg-yellow-50 px-2"
                            : "text-green-600 hover:bg-green-50 px-2"
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
                        className="text-red-600 hover:bg-red-50 px-2"
                        disabled={isProcessing(detail.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <DetailModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
        onSubmit={handleCreateDetail}
        headerId={headerId}
      />

      <DetailModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        detail={selectedDetail}
        mode="edit"
        onSubmit={handleUpdateDetail}
        headerId={headerId}
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
