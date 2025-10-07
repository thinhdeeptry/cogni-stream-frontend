"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { useApprovalData } from "@/hooks/useApprovalData";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  Eye,
  X,
} from "lucide-react";

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

// Common rejection reasons
const commonReasons = [
  "Nội dung không phù hợp với tiêu chuẩn chất lượng",
  "Thiếu thông tin mô tả chi tiết",
  "Cấu trúc khóa học chưa rõ ràng",
  "Không đủ tài liệu học tập",
  "Vi phạm bản quyền hoặc sở hữu trí tuệ",
  "Nội dung trùng lặp với khóa học hiện có",
];

// Reject Modal Component
interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: any;
  onSubmit: (reason: string) => void;
}

const RejectModal: React.FC<RejectModalProps> = ({
  isOpen,
  onClose,
  course,
  onSubmit,
}) => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const allReasons = [...selectedReasons];
    if (customReason.trim()) {
      allReasons.push(customReason.trim());
    }

    if (allReasons.length === 0) {
      toast({
        title: "Cần nhập lý do",
        description: "Vui lòng chọn hoặc nhập lý do từ chối",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const finalReason = allReasons.join("\n• ");
      await onSubmit(finalReason);

      // Reset and close
      setSelectedReasons([]);
      setCustomReason("");
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
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Từ chối khóa học: {course?.title}
          </DialogTitle>
          <DialogDescription>
            Vui lòng chọn hoặc nhập lý do từ chối
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick reasons */}
          <div className="space-y-3">
            <Label>Chọn lý do thường gặp:</Label>
            <div className="grid grid-cols-1 gap-2">
              {commonReasons.map((reason, index) => (
                <label
                  key={index}
                  className="flex items-start space-x-2 p-2 border rounded hover:bg-slate-50 cursor-pointer"
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
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom reason */}
          <div className="space-y-2">
            <Label htmlFor="customReason">Lý do khác:</Label>
            <Textarea
              id="customReason"
              placeholder="Nhập lý do cụ thể..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isSubmitting ? "Đang xử lý..." : "Từ chối khóa học"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Course Detail Modal Component
const CourseDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  course: any;
}> = ({ isOpen, onClose, course }) => {
  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Chi tiết: {course.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Thông tin cơ bản</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Giảng viên:</strong> {course.instructor?.user?.name}
                </p>
                <p>
                  <strong>Email:</strong> {course.instructor?.user?.email}
                </p>
                <p>
                  <strong>Danh mục:</strong> {course.category?.name}
                </p>
                <p>
                  <strong>Loại:</strong>{" "}
                  {course.courseType === "LIVE" ? "Trực tuyến" : "Tự học"}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Thống kê</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Số chương:</strong> {course._count?.chapters || 0}
                </p>
                <p>
                  <strong>Tổng bài học:</strong> {course.totalLessons || 0}
                </p>
                <p>
                  <strong>Ngày gửi:</strong>{" "}
                  {new Date(
                    course.submittedAt || course.createdAt,
                  ).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Mô tả</h4>
            <p className="text-sm bg-slate-50 p-3 rounded">
              {course.description}
            </p>
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

// Main component
export default function ApprovalCoursesPage() {
  const {
    courses,
    coursesCount,
    coursesMeta,
    isLoading,
    refreshCourses,
    approveCourse,
    rejectCourse,
    isProcessing,
  } = useApprovalData();

  const [sortBy, setSortBy] = useState("oldest");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Initialize data
  useEffect(() => {
    refreshCourses();
  }, [refreshCourses]);

  // Course handlers
  const handleApproveCourse = async (courseId: string) => {
    try {
      await approveCourse(courseId);
      toast({
        title: "Thành công",
        description: "Đã duyệt khóa học",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể duyệt khóa học",
        variant: "destructive",
      });
    }
  };

  const handleRejectCourse = async (courseId: string, reason: string) => {
    try {
      await rejectCourse(courseId, reason);
      toast({
        title: "Thành công",
        description: "Đã từ chối khóa học",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể từ chối khóa học",
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-500">Đang tải danh sách khóa học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6 bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/admin/approvals">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              📚 Xét Duyệt Khóa Học
            </h1>
            <p className="text-slate-500 text-sm">
              {coursesCount} khóa học đang chờ xét duyệt
            </p>
          </div>
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="oldest">Cũ nhất trước</SelectItem>
            <SelectItem value="newest">Mới nhất trước</SelectItem>
            <SelectItem value="instructor">Theo giảng viên</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Khóa học</TableHead>
              <TableHead>Giảng viên</TableHead>
              <TableHead>Loại & Danh mục</TableHead>
              <TableHead>Thời gian gửi</TableHead>
              <TableHead>Chi tiết</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coursesCount === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-slate-500"
                >
                  🎉 Không có khóa học nào chờ duyệt
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course: any) => (
                <TableRow key={course.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">
                        {course.title}
                      </p>
                      <div className="text-xs text-slate-500 mt-1">
                        {course._count?.chapters || 0} chương •{" "}
                        {course.totalLessons || 0} bài học
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={course.instructor?.user?.image} />
                        <AvatarFallback>
                          {course.instructor?.user?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {course.instructor?.user?.name || "Không rõ"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {course.instructor?.user?.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-2">
                      <Badge variant="secondary">
                        {course.courseType === "LIVE"
                          ? "📹 Trực tuyến"
                          : "🎥 Tự học"}
                      </Badge>
                      <p className="text-sm text-slate-600">
                        {course.category?.name || "Chưa phân loại"}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {getTimeAgo(course.submittedAt || course.createdAt)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCourse(course);
                        setIsDetailModalOpen(true);
                      }}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Xem
                    </Button>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleApproveCourse(course.id)}
                        disabled={isProcessing(course.id)}
                      >
                        {isProcessing(course.id) ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Duyệt
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedCourse(course);
                          setIsRejectModalOpen(true);
                        }}
                        disabled={isProcessing(course.id)}
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

      {/* Modals */}
      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        course={selectedCourse}
        onSubmit={(reason) =>
          selectedCourse && handleRejectCourse(selectedCourse.id, reason)
        }
      />

      <CourseDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        course={selectedCourse}
      />
    </div>
  );
}
