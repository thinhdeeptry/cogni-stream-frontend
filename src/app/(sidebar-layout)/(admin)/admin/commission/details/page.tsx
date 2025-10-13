"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Edit,
  Eye,
  FileText,
  Filter,
  Layers,
  Plus,
  RotateCcw,
  Target,
  Trash2,
  Users,
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
  instructorRate: number;
  priority: number;
}

// Create/Edit Detail Modal Component
interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail?: CommissionDetail | null;
  mode: "create" | "edit";
  onSubmit: (data: DetailFormData) => void;
  headers: CommissionHeader[];
}

const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  detail,
  mode,
  onSubmit,
  headers,
}) => {
  const [formData, setFormData] = useState<DetailFormData>({
    headerId: "",
    courseId: undefined,
    categoryId: undefined,
    platformRate: 30,
    instructorRate: 70,
    priority: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationType, setApplicationType] = useState<
    "general" | "course" | "category"
  >("general");

  // Initialize form data when detail changes
  useEffect(() => {
    if (mode === "edit" && detail) {
      setFormData({
        headerId: detail.headerId,
        courseId: detail.courseId || undefined,
        categoryId: detail.categoryId || undefined,
        platformRate: detail.platformRate,
        instructorRate: detail.instructorRate,
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
        headerId: "",
        courseId: undefined,
        categoryId: undefined,
        platformRate: 30,
        instructorRate: 70,
        priority: 1,
      });
      setApplicationType("general");
    }
  }, [mode, detail, isOpen]);

  const handleSubmit = async () => {
    if (!formData.headerId) {
      toast({
        title: "Cần chọn Header",
        description: "Vui lòng chọn commission header",
        variant: "destructive",
      });
      return;
    }

    if (formData.platformRate + formData.instructorRate !== 100) {
      toast({
        title: "Tỷ lệ không hợp lệ",
        description: "Tổng phần trăm phải bằng 100%",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const submitData = {
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

  const handlePlatformRateChange = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      platformRate: value,
      instructorRate: 100 - value,
    }));
  };

  const handleInstructorRateChange = (value: number) => {
    setFormData((prev) => ({
      ...prev,
      instructorRate: value,
      platformRate: 100 - value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {mode === "create"
              ? "Tạo Commission Detail Mới"
              : `Chỉnh sửa Commission Detail`}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Tạo chi tiết hoa hồng cụ thể cho khóa học, danh mục hoặc toàn hệ thống"
              : "Cập nhật thông tin commission detail"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Selection */}
          <div className="space-y-2">
            <Label htmlFor="headerId">Commission Header *</Label>
            <Select
              value={formData.headerId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, headerId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn commission header..." />
              </SelectTrigger>
              <SelectContent>
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
          </div>

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
                    <Target className="h-4 w-4" />
                    Tổng quát (Toàn hệ thống)
                  </div>
                </SelectItem>
                <SelectItem value="course">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Khóa học cụ thể
                  </div>
                </SelectItem>
                <SelectItem value="category">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Danh mục cụ thể
                  </div>
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

          {/* Commission Rates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platformRate">Tỷ lệ Platform (%)</Label>
              <Input
                id="platformRate"
                type="number"
                min="0"
                max="100"
                value={formData.platformRate}
                onChange={(e) =>
                  handlePlatformRateChange(Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructorRate">Tỷ lệ Giảng viên (%)</Label>
              <Input
                id="instructorRate"
                type="number"
                min="0"
                max="100"
                value={formData.instructorRate}
                onChange={(e) =>
                  handleInstructorRateChange(Number(e.target.value))
                }
              />
            </div>
          </div>

          {/* Rate Validation */}
          <div
            className={`p-3 rounded text-sm ${
              formData.platformRate + formData.instructorRate === 100
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            <p>
              <strong>Tổng:</strong>{" "}
              {formData.platformRate + formData.instructorRate}%
              {formData.platformRate + formData.instructorRate === 100
                ? " ✓"
                : " (Phải bằng 100%)"}
            </p>
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
              "active". Hệ thống sẽ tự động chọn detail phù hợp nhất khi tính
              hoa hồng.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              formData.platformRate + formData.instructorRate !== 100
            }
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {isSubmitting
              ? "Đang xử lý..."
              : mode === "create"
                ? "Tạo Detail"
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chi tiết Commission Detail
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Thông tin cơ bản</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Header:</strong> {detail.header?.name}
                </p>
                <p>
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
                </p>
                <p>
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
                </p>
                <p>
                  <strong>Độ ưu tiên:</strong> {detail.priority}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Tỷ lệ hoa hồng</h4>
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
                    {detail.platformRate + detail.instructorRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Thời gian</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Tạo:</strong>{" "}
                  {new Date(detail.createdAt).toLocaleString("vi-VN")}
                </p>
                <p>
                  <strong>Cập nhật:</strong>{" "}
                  {new Date(detail.updatedAt).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Thông tin ID</h4>
              <div className="space-y-1 text-sm text-slate-500">
                <p>
                  <strong>Detail ID:</strong> {detail.id}
                </p>
                <p>
                  <strong>Header ID:</strong> {detail.headerId}
                </p>
                {detail.courseId && (
                  <p>
                    <strong>Course ID:</strong> {detail.courseId}
                  </p>
                )}
                {detail.categoryId && (
                  <p>
                    <strong>Category ID:</strong> {detail.categoryId}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Visual Rate Breakdown */}
          <div>
            <h4 className="font-semibold mb-2">Phân chia hoa hồng</h4>
            <div className="space-y-2">
              <div className="flex h-8 rounded overflow-hidden border">
                <div
                  className="bg-blue-500 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${detail.platformRate}%` }}
                >
                  Platform {detail.platformRate}%
                </div>
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${detail.instructorRate}%` }}
                >
                  Giảng viên {detail.instructorRate}%
                </div>
              </div>
              <div className="text-xs text-slate-500 text-center">
                Tỷ lệ phân chia cho mỗi giao dịch
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Xóa Commission Detail
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa commission detail này?
          </DialogDescription>
        </DialogHeader>

        {detail && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <div className="space-y-2">
              <h4 className="font-medium text-red-900">
                {detail.course?.title ||
                  detail.category?.name ||
                  "Commission tổng quát"}
              </h4>
              <p className="text-sm text-red-700">
                Platform: {detail.platformRate}% | Giảng viên:{" "}
                {detail.instructorRate}%
              </p>
              <p className="text-sm text-red-700">
                Header: {detail.header?.name}
              </p>
            </div>
            <p className="text-sm text-red-600 mt-3">
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
            {isDeleting ? "Đang xóa..." : "Xóa Detail"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main component
export default function CommissionDetailsPage() {
  const searchParams = useSearchParams();
  const headerIdFromUrl = searchParams.get("headerId");

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
      await createDetail(data);
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
        instructorRate: data.instructorRate,
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
              📄 Commission Details
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
          Tạo Detail Mới
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
      />

      <DetailModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        detail={selectedDetail}
        mode="edit"
        onSubmit={handleUpdateDetail}
        headers={headers}
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
