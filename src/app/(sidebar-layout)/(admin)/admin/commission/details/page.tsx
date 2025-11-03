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
  headers: CommissionHeader[];
  currentHeaderId?: string;
}

const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  detail,
  mode,
  onSubmit,
  headers,
  currentHeaderId,
}) => {
  const [formData, setFormData] = useState<DetailFormData>({
    headerId: "",
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
      // For create mode, use the current header ID from URL or first active header
      const defaultHeaderId =
        currentHeaderId && currentHeaderId !== "all"
          ? currentHeaderId
          : headers.find((h) => h.status === "ACTIVE")?.id || "";

      setFormData({
        headerId: defaultHeaderId,
        courseId: undefined,
        categoryId: undefined,
        platformRate: 30,
        priority: 1,
      });
      setApplicationType("general");
    }
  }, [mode, detail, isOpen, currentHeaderId, headers]);

  const handleSubmit = async () => {
    if (formData.platformRate + instructorRate !== 100) {
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
      <DialogContent className="max-w-2xl mx-4 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create"
              ? "Tạo Chi Tiết Hoa Hồng Mới"
              : `Chỉnh sửa Chi Tiết Hoa Hồng`}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Tạo chi tiết hoa hồng cụ thể cho khóa học, danh mục hoặc toàn hệ thống trong cấu hình hiện tại"
              : "Cập nhật thông tin chi tiết hoa hồng"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Header Display
          {mode === "create" && formData.headerId && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <Label className="text-sm font-medium text-blue-900">
                Cấu hình hoa hồng hiện tại:
              </Label>
              <div className="mt-1">
                <span className="text-blue-800 font-medium">
                  {headers.find(h => h.id === formData.headerId)?.name}
                </span>
              </div>
            </div>
          )} */}

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
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-sm font-medium mb-2">Xem trước phân chia:</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-2 bg-blue-100 rounded text-center">
                <div className="text-blue-800 font-bold">
                  {formData.platformRate}%
                </div>
                <div className="text-blue-600 text-xs">Nền tảng</div>
              </div>
              <div className="p-2 bg-green-100 rounded text-center">
                <div className="text-green-800 font-bold">
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
              <strong>Lưu ý:</strong> Chi tiết hoa hồng mới sẽ được tạo ở trạng
              thái "active" và thuộc về cấu hình hoa hồng hiện tại. Hệ thống sẽ
              tự động chọn chi tiết phù hợp nhất khi tính hoa hồng.
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
              formData.platformRate <= 0 ||
              formData.platformRate >= 100
            }
            className="bg-green-500 hover:bg-green-600 text-white"
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
      <DialogContent className="max-w-3xl mx-4 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chi Tiết Hoa Hồng
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Thông tin cơ bản</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Header:</strong> {detail.header?.name}
                </div>
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
      <DialogContent className="mx-4 max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Xóa Chi Tiết Hoa Hồng
          </DialogTitle>
          <DialogDescription>
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
              <div className="text-sm text-red-700">
                Platform: {detail.platformRate}% | Giảng viên:{" "}
                {detail.instructorRate}%
              </div>
              <div className="text-sm text-red-700">
                Header: {detail.header?.name}
              </div>
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
            {isDeleting ? "Đang xóa..." : "Xóa Chi Tiết"}
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
                📄 Quản Lý Chi Tiết Hoa Hồng
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
      />

      <DetailModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        detail={selectedDetail}
        mode="edit"
        onSubmit={handleUpdateDetail}
        headers={headers}
        currentHeaderId={filterHeaderId}
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
