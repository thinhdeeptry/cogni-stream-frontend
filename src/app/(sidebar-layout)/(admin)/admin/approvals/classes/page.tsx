"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { Class, ClassStatus, ClassStatusActive } from "@/types/course/types";
import { set } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  GraduationCap,
  MapPin,
  User,
  Users,
  X,
} from "lucide-react";

import { approveClass, getPendingClasses } from "@/actions/approvalActions";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

// Extended Class interface for pending approval
type PendingClass = Omit<Class, "course" | "instructor"> & {
  submittedAt?: string;
  currentStudents?: number;
  course?: {
    id: string;
    title: string;
    thumbnailUrl?: string;
    instructor?: {
      user: {
        id: string;
        name: string;
        email: string;
        image?: string;
      };
    };
  };
  _count?: {
    enrollments: number;
    sessions: number;
  };
};

// Reject Modal for Classes
interface ClassRejectModalProps {
  classItem: PendingClass | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (classId: string, reason: string) => Promise<void>;
}

const ClassRejectModal: React.FC<ClassRejectModalProps> = ({
  classItem,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common rejection reasons for classes
  const commonReasons = [
    "Lịch học không hợp lý hoặc xung đột",
    "Thông tin lớp học chưa đầy đủ",
    "Số lượng học viên tối đa không phù hợp",
    "Thiếu thông tin về platform học trực tuyến",
    "Thời gian bắt đầu/kết thúc chưa rõ ràng",
    "Mô tả lớp học chưa chi tiết",
    "Lịch trình không phù hợp với nội dung khóa học",
    "Thiếu thông tin liên hệ hoặc hỗ trợ",
  ];

  const handleReject = async () => {
    if (!classItem) return;

    let finalReason = "";
    if (selectedReasons.length > 0) {
      finalReason =
        selectedReasons.join("; ") +
        (rejectionReason ? `\n\nChi tiết: ${rejectionReason}` : "");
    } else {
      finalReason = rejectionReason;
    }

    if (!finalReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(classItem.id, finalReason);

      setSelectedReasons([]);
      setRejectionReason("");
      onClose();

      toast({
        title: "Thành công",
        description: `Đã từ chối lớp học "${classItem.name}"`,
      });
    } catch (error) {
      console.error("Error rejecting class:", error);
      toast({
        title: "Lỗi",
        description: "Không thể từ chối lớp học",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReasons([]);
      setRejectionReason("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Từ chối xuất bản lớp học: {classItem?.name}
          </DialogTitle>
          <DialogDescription>
            Vui lòng chọn hoặc nhập lý do từ chối để giúp giảng viên cải thiện
            lớp học
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Class Info */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-2">
              Thông tin lớp học:
            </h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Khóa học:</strong> {classItem?.course?.title}
              </p>
              <p>
                <strong>Giảng viên:</strong>{" "}
                {classItem?.course?.instructor?.user.name}
              </p>
              <p>
                <strong>Số học viên tối đa:</strong> {classItem?.maxStudents}
              </p>
              <p>
                <strong>Hiện tại:</strong> {classItem?.currentStudents} học viên
              </p>
              <p>
                <strong>Trạng thái lớp:</strong>{" "}
                {classItem?.status === "UPCOMING"
                  ? "Sắp diễn ra"
                  : classItem?.status === "IN_PROGRESS"
                    ? "Đang diễn ra"
                    : classItem?.status === "FINISHED"
                      ? "Đã hoàn thành"
                      : "Đã hủy"}
              </p>
            </div>
          </div>

          {/* Quick reasons */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Chọn lý do thường gặp:
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {commonReasons.map((reason, index) => (
                <label
                  key={index}
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedReasons.includes(reason)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedReasons([...selectedReasons, reason]);
                      } else {
                        setSelectedReasons(
                          selectedReasons.filter((r) => r !== reason),
                        );
                      }
                    }}
                  />
                  <span className="text-sm leading-5">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom reason */}
          <div className="space-y-3">
            <Label htmlFor="customReason" className="text-base font-medium">
              Lý do chi tiết hoặc hướng dẫn cải thiện:
            </Label>
            <Textarea
              id="customReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Nhập lý do cụ thể hoặc hướng dẫn sửa chữa cho giảng viên..."
              className="min-h-[100px]"
              rows={4}
            />
          </div>

          {/* Preview */}
          {(selectedReasons.length > 0 || rejectionReason.trim()) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-3">
                📝 Nội dung sẽ gửi cho giảng viên:
              </p>
              <div className="text-sm text-red-700 space-y-2">
                {selectedReasons.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">
                      Các vấn đề cần khắc phục:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-2">
                      {selectedReasons.map((reason, index) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {rejectionReason.trim() && (
                  <div>
                    <p className="font-medium mb-1">Hướng dẫn chi tiết:</p>
                    <p className="italic bg-white p-2 rounded border">
                      {rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            className="bg-red-500 hover:bg-red-600 text-white"
            onClick={handleReject}
            disabled={
              isSubmitting ||
              (selectedReasons.length === 0 && !rejectionReason.trim())
            }
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận từ chối"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Class Detail Modal
interface ClassDetailModalProps {
  classItem: PendingClass | null;
  isOpen: boolean;
  onClose: () => void;
}

const ClassDetailModal: React.FC<ClassDetailModalProps> = ({
  classItem,
  isOpen,
  onClose,
}) => {
  if (!classItem) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Chi tiết lớp học: {classItem.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Thông tin cơ bản</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Tên lớp:</strong> {classItem.name}
                </p>
                <p>
                  <strong>Khóa học:</strong> {classItem.course?.title}
                </p>
                <p>
                  <strong>Ngày bắt đầu:</strong>{" "}
                  {formatDate(classItem.startDate)}
                </p>
                {classItem.endDate && (
                  <p>
                    <strong>Ngày kết thúc:</strong>{" "}
                    {formatDate(classItem.endDate)}
                  </p>
                )}
                <p>
                  <strong>Trạng thái lớp:</strong>
                  <Badge
                    className={`ml-2 ${
                      classItem.status === "UPCOMING"
                        ? "bg-cyan-100 text-cyan-800"
                        : classItem.status === "IN_PROGRESS"
                          ? "bg-orange-100 text-orange-800"
                          : classItem.status === "FINISHED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {classItem.status === "UPCOMING"
                      ? "📅 Sắp diễn ra"
                      : classItem.status === "IN_PROGRESS"
                        ? "🏃 Đang diễn ra"
                        : classItem.status === "FINISHED"
                          ? "🏁 Hoàn thành"
                          : "❌ Đã hủy"}
                  </Badge>
                </p>
                <p>
                  <strong>Trạng thái xuất bản:</strong>
                  <Badge
                    className={`ml-2 ${
                      classItem.statusActive === "PENDING_APPROVAL"
                        ? "bg-yellow-100 text-yellow-800"
                        : classItem.statusActive === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : classItem.statusActive === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {classItem.statusActive === "PENDING_APPROVAL"
                      ? "⏳ Chờ duyệt"
                      : classItem.statusActive === "APPROVED"
                        ? "✅ Đã duyệt"
                        : classItem.statusActive === "REJECTED"
                          ? "❌ Bị từ chối"
                          : "🌐 Đã xuất bản"}
                  </Badge>
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Giảng viên</h4>
              <div className="flex items-center gap-3 mb-3">
                <Avatar>
                  <AvatarImage src={classItem.course?.instructor?.user.image} />
                  <AvatarFallback>
                    {classItem.course?.instructor?.user.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {classItem.course?.instructor?.user.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {classItem.course?.instructor?.user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Enrollment Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {classItem.maxStudents}
              </p>
              <p className="text-sm text-slate-500">Tối đa</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {classItem.currentStudents}
              </p>
              <p className="text-sm text-slate-500">Hiện tại</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {Math.max(0, classItem.maxStudents - classItem.currentStudents)}
              </p>
              <p className="text-sm text-slate-500">Còn lại</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-600">
                {Math.round(
                  (classItem.currentStudents / classItem.maxStudents) * 100,
                )}
                %
              </p>
              <p className="text-sm text-slate-500">Đã đăng ký</p>
            </div>
          </div>

          {/* Description */}
          {classItem.description && (
            <div>
              <h4 className="font-medium mb-3">Mô tả lớp học</h4>
              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg">
                {classItem.description}
              </p>
            </div>
          )}

          {/* Schedules */}
          {classItem.schedules && classItem.schedules.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Lịch học</h4>
              <div className="space-y-3">
                {classItem.schedules.map((schedule, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">{schedule.name}</h5>
                      <Badge variant="outline">
                        {formatDate(schedule.startDate)} -{" "}
                        {formatDate(schedule.endDate)}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>
                        <strong>Các ngày:</strong> {schedule.days.join(", ")}
                      </p>
                      <p>
                        <strong>Thời gian:</strong> {schedule.startTime}
                        {schedule.endTime && ` - ${schedule.endTime}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ApprovalClassesPage() {
  const [classes, setClasses] = useState<PendingClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("oldest");
  const [selectedClass, setSelectedClass] = useState<PendingClass | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const fetchPendingClasses = async (page = 1, limit = 10, sort = "oldest") => {
    try {
      setIsLoading(true);

      // Mock data for demo - replace with actual API
      // const mockClasses: PendingClass[] = [
      //   {
      //     id: "1",
      //     courseId: "course-1",
      //     course: {
      //       id: "course-1",
      //       title: "React Advanced: Hooks và Context API",
      //     },
      //     name: "Lớp React K11 - Buổi tối",
      //     description:
      //       "Lớp học trực tuyến buổi tối dành cho những người đi làm",
      //     maxStudents: 25,
      //     currentStudents: 8,
      //     startDate: "2025-02-01",
      //     endDate: "2025-04-30",
      //     isPublished: false,
      //     status: "UPCOMING" as ClassStatus,
      //     statusActive: "PENDING_APPROVAL" as ClassStatusActive,
      //     submittedAt: "2025-01-20T14:30:00Z",
      //     instructor: {
      //       userId: "instructor-1",
      //       user: {
      //         id: "instructor-1",
      //         name: "Nguyễn Văn An",
      //         email: "an.nguyen@example.com",
      //         image:
      //           "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
      //       },
      //     },
      //     schedules: [
      //       {
      //         name: "Lịch học chính",
      //         days: ["monday", "wednesday", "friday"],
      //         startDate: "2025-02-01",
      //         endDate: "2025-04-30",
      //         startTime: "19:00",
      //         endTime: "21:00",
      //       },
      //     ],
      //     createdAt: new Date(),
      //     updatedAt: new Date(),
      //   },
      //   {
      //     id: "2",
      //     courseId: "course-2",
      //     course: {
      //       id: "course-2",
      //       title: "Node.js Backend Fundamentals",
      //     },
      //     name: "Lớp Node.js K05 - Cuối tuần",
      //     description: "Lớp học cuối tuần phù hợp với học sinh, sinh viên",
      //     maxStudents: 20,
      //     currentStudents: 12,
      //     startDate: "2025-02-15",
      //     endDate: "2025-05-15",
      //     isPublished: false,
      //     status: "UPCOMING" as ClassStatus,
      //     statusActive: "PENDING_APPROVAL" as ClassStatusActive,
      //     submittedAt: "2025-01-19T09:15:00Z",
      //     instructor: {
      //       userId: "instructor-2",
      //       user: {
      //         id: "instructor-2",
      //         name: "Trần Thị Bình",
      //         email: "binh.tran@example.com",
      //         image:
      //           "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100",
      //       },
      //     },
      //     schedules: [
      //       {
      //         name: "Lịch cuối tuần",
      //         days: ["saturday", "sunday"],
      //         startDate: "2025-02-15",
      //         endDate: "2025-05-15",
      //         startTime: "09:00",
      //         endTime: "12:00",
      //       },
      //     ],
      //     createdAt: new Date(),
      //     updatedAt: new Date(),
      //   },
      // ];
      const response = await getPendingClasses({
        page,
        limit,
      });
      setClasses(response.data);
      setPagination({
        page: page,
        limit: limit,
        total: response.meta.totalCount,
        totalPages: Math.ceil(response.meta.totalPages),
      });
    } catch (error) {
      console.error("Error fetching pending classes:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách lớp học chờ duyệt",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveClass = async (classId: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(classId));

      // Mock API call - replace with actual implementation
      const response = await approveClass(classId);
      if (!response.ok) {
        toast({
          title: "Lỗi",
          description: "Không thể duyệt lớp học",
          variant: "destructive",
        });
        throw new Error("Failed to approve class");
      }
      // Remove approved class from the list
      setClasses((prev) => prev.filter((cls) => cls.id !== classId));
      toast({
        title: "Thành công",
        description: "Đã duyệt lớp học để xuất bản",
      });
    } catch (error) {
      console.error("Error approving class:", error);
      toast({
        title: "Lỗi",
        description: "Không thể duyệt lớp học",
        variant: "destructive",
      });
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(classId);
        return newSet;
      });
    }
  };

  const handleRejectClass = async (classId: string, reason: string) => {
    // Mock API call - replace with actual implementation
    // await rejectClass(classId, { rejectionReason: reason });

    setClasses((prev) => prev.filter((cls) => cls.id !== classId));
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Vừa xong";
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  const openRejectModal = (classItem: PendingClass) => {
    setSelectedClass(classItem);
    setIsRejectModalOpen(true);
  };

  const openDetailModal = (classItem: PendingClass) => {
    setSelectedClass(classItem);
    setIsDetailModalOpen(true);
  };

  useEffect(() => {
    fetchPendingClasses(pagination.page, pagination.limit, sortBy);
  }, [pagination.page, sortBy]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-500">Đang tải danh sách lớp học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6 bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/admin/approvals">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                🏫 Xét Duyệt Lớp Học
              </h1>
              <p className="text-slate-500 text-sm">
                {classes.length} lớp học đang chờ xét duyệt xuất bản
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oldest">Cũ nhất trước</SelectItem>
              <SelectItem value="newest">Mới nhất trước</SelectItem>
              <SelectItem value="instructor">Theo giảng viên</SelectItem>
              <SelectItem value="enrollment">Theo số đăng ký</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <GraduationCap className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-1">
              Lưu ý về Hệ thống Dual Status của Lớp học
            </h3>
            <p className="text-sm text-blue-700 mb-2">
              Mỗi lớp học có 2 trạng thái độc lập:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • <strong>Trạng thái lớp:</strong> UPCOMING → ONGOING →
                COMPLETED (vòng đời tự nhiên)
              </li>
              <li>
                • <strong>Trạng thái xuất bản:</strong> PENDING → APPROVED →
                PUBLISHED (cần admin duyệt)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-slate-700">Lớp học</TableHead>
              <TableHead className="text-slate-700">Khóa học</TableHead>
              <TableHead className="text-slate-700">Giảng viên</TableHead>
              <TableHead className="text-slate-700">Trạng thái</TableHead>
              <TableHead className="text-slate-700">Đăng ký</TableHead>
              <TableHead className="text-slate-700">Thời gian gửi</TableHead>
              <TableHead className="text-right text-slate-700">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-slate-500"
                >
                  🎉 Không có lớp học nào chờ duyệt xuất bản
                </TableCell>
              </TableRow>
            ) : (
              classes.map((classItem) => (
                <TableRow key={classItem.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">
                        {classItem.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Bắt đầu:{" "}
                        {new Date(classItem.startDate).toLocaleDateString(
                          "vi-VN",
                        )}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <p className="text-sm text-slate-700">
                      {classItem.course?.title}
                    </p>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={classItem.course?.instructor?.user.image}
                        />
                        <AvatarFallback className="text-xs">
                          {classItem.course?.instructor?.user.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {classItem.course?.instructor?.user.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {classItem.course?.instructor?.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {/* Lifecycle Status */}
                      <Badge
                        className={`text-xs ${
                          classItem.status === "UPCOMING"
                            ? "bg-cyan-100 text-cyan-800"
                            : classItem.status === "IN_PROGRESS"
                              ? "bg-orange-100 text-orange-800"
                              : classItem.status === "FINISHED"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {classItem.status === "UPCOMING"
                          ? "📅 Sắp diễn ra"
                          : classItem.status === "IN_PROGRESS"
                            ? "🏃 Đang diễn ra"
                            : classItem.status === "FINISHED"
                              ? "🏁 Hoàn thành"
                              : "❌ Đã hủy"}
                      </Badge>
                      {/* Approval Status */}
                      <Badge
                        className={`text-xs ${
                          classItem.statusActive === "PENDING_APPROVAL"
                            ? "bg-yellow-100 text-yellow-800"
                            : classItem.statusActive === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : classItem.statusActive === "REJECTED"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {classItem.statusActive === "PENDING_APPROVAL"
                          ? "⏳ Chờ duyệt xuất bản"
                          : classItem.statusActive === "APPROVED"
                            ? "✅ Đã duyệt xuất bản"
                            : classItem.statusActive === "REJECTED"
                              ? "❌ Bị từ chối xuất bản"
                              : "🌐 Đã xuất bản"}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span>
                          {classItem.currentStudents}/{classItem.maxStudents}
                        </span>
                      </div>
                      <div className="w-16 bg-slate-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (classItem.currentStudents / classItem.maxStudents) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">
                        {getTimeAgo(classItem.submittedAt!)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailModal(classItem)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Chi tiết
                      </Button>

                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleApproveClass(classItem.id)}
                        disabled={processingIds.has(classItem.id)}
                      >
                        {processingIds.has(classItem.id) ? (
                          <div className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                            Đang duyệt...
                          </div>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Duyệt xuất bản
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => openRejectModal(classItem)}
                        disabled={processingIds.has(classItem.id)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Từ chối
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {classes.length > 0 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  className={
                    pagination.page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1,
              ).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === pagination.page}
                    onClick={() => setPagination((prev) => ({ ...prev, page }))}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.totalPages, prev.page + 1),
                    }))
                  }
                  className={
                    pagination.page >= pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Modals */}
      <ClassRejectModal
        classItem={selectedClass}
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleRejectClass}
      />

      <ClassDetailModal
        classItem={selectedClass}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
}
