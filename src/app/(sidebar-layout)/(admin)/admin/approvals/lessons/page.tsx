"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { Lesson, LessonStatus, LessonType } from "@/types/course/types";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Play,
  Timer,
  User,
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

// Extended Lesson interface for pending approval
interface PendingLesson
  extends Omit<Lesson, "course" | "chapter" | "instructor"> {
  submittedAt?: string;
  course?: {
    id: string;
    title: string;
  };
  chapter?: {
    id: string;
    title: string;
    order: number;
  };
  instructor?: {
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
  };
}

// Reject Modal for Lessons
interface LessonRejectModalProps {
  lesson: PendingLesson | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (lessonId: string, reason: string) => Promise<void>;
}

const LessonRejectModal: React.FC<LessonRejectModalProps> = ({
  lesson,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common rejection reasons for lessons
  const getCommonReasons = (lessonType: LessonType) => {
    const common = [
      "Tiêu đề bài học chưa rõ ràng hoặc không phù hợp",
      "Nội dung chưa đầy đủ hoặc thiếu chi tiết",
      "Cần bổ sung thêm tài liệu học tập",
      "Thứ tự bài học trong chương chưa logic",
    ];

    const specific = {
      [LessonType.VIDEO]: [
        "Video chất lượng âm thanh kém",
        "Video bị mờ hoặc không rõ nét",
        "Thời lượng video quá ngắn (dưới 5 phút)",
        "Nội dung video không khớp với tiêu đề",
        "Thiếu phụ đề hoặc transcript",
      ],
      [LessonType.BLOG]: [
        "Nội dung bài viết quá ngắn gọn",
        "Thiếu hình ảnh minh họa",
        "Định dạng văn bản chưa chuyên nghiệp",
        "Chưa có ví dụ thực tế hoặc code demo",
      ],
      [LessonType.QUIZ]: [
        "Số lượng câu hỏi quá ít (dưới 5 câu)",
        "Câu hỏi chất lượng kém hoặc mơ hồ",
        "Đáp án chưa chính xác",
        "Thiếu câu giải thích cho đáp án",
        "Thời gian làm bài không hợp lý",
      ],
      [LessonType.MIXED]: [
        "Sự kết hợp giữa video và text chưa logic",
        "Thiếu liên kết giữa các phần nội dung",
        "Chưa có bài tập thực hành",
      ],
    };

    return [...common, ...(specific[lessonType] || [])];
  };

  const handleReject = async () => {
    if (!lesson) return;

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
      await onConfirm(lesson.id, finalReason);

      setSelectedReasons([]);
      setRejectionReason("");
      onClose();

      toast({
        title: "Thành công",
        description: `Đã từ chối bài học "${lesson.title}"`,
      });
    } catch (error) {
      console.error("Error rejecting lesson:", error);
      toast({
        title: "Lỗi",
        description: "Không thể từ chối bài học",
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
            Từ chối bài học: {lesson?.title}
          </DialogTitle>
          <DialogDescription>
            Vui lòng chọn hoặc nhập lý do từ chối để giúp giảng viên cải thiện
            nội dung bài học
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lesson Info */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-2">
              Thông tin bài học:
            </h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Khóa học:</strong> {lesson?.course?.title}
              </p>
              <p>
                <strong>Chương:</strong> {lesson?.chapter?.title}
              </p>
              <p>
                <strong>Thứ tự:</strong> Bài {lesson?.order}
              </p>
              <p>
                <strong>Loại:</strong>{" "}
                {lesson?.type === "VIDEO"
                  ? "🎥 Video"
                  : lesson?.type === "BLOG"
                    ? "📝 Blog/Text"
                    : lesson?.type === "QUIZ"
                      ? "❓ Quiz"
                      : lesson?.type === "MIXED"
                        ? "🔀 Hỗn hợp"
                        : "Khác"}
              </p>
              <p>
                <strong>Giảng viên:</strong> {lesson?.instructor?.user.name}
              </p>
              {lesson?.estimatedDurationMinutes && (
                <p>
                  <strong>Thời lượng:</strong> {lesson.estimatedDurationMinutes}{" "}
                  phút
                </p>
              )}
            </div>
          </div>

          {/* Quick reasons based on lesson type */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Chọn lý do từ chối cho bài học{" "}
              {lesson?.type === "VIDEO"
                ? "Video"
                : lesson?.type === "BLOG"
                  ? "Blog"
                  : lesson?.type === "QUIZ"
                    ? "Quiz"
                    : "Hỗn hợp"}
              :
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {lesson &&
                getCommonReasons(lesson.type).map((reason, index) => (
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

// Lesson Detail Modal
interface LessonDetailModalProps {
  lesson: PendingLesson | null;
  isOpen: boolean;
  onClose: () => void;
}

const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  lesson,
  isOpen,
  onClose,
}) => {
  if (!lesson) return null;

  const getLessonTypeIcon = (type: LessonType) => {
    switch (type) {
      case LessonType.VIDEO:
        return <Play className="h-5 w-5 text-red-500" />;
      case LessonType.BLOG:
        return <FileText className="h-5 w-5 text-blue-500" />;
      case LessonType.QUIZ:
        return <Award className="h-5 w-5 text-green-500" />;
      case LessonType.MIXED:
        return <BookOpen className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getLessonTypeIcon(lesson.type)}
            Chi tiết bài học: {lesson.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Thông tin cơ bản</h4>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Tiêu đề:</strong> {lesson.title}
                </p>
                <p>
                  <strong>Khóa học:</strong> {lesson.course?.title}
                </p>
                <p>
                  <strong>Chương:</strong> {lesson.chapter?.title} (Chương{" "}
                  {lesson.chapter?.order})
                </p>
                <p>
                  <strong>Thứ tự:</strong> Bài {lesson.order}
                </p>
                <p>
                  <strong>Loại bài học:</strong>
                  <Badge
                    className={`ml-2 ${
                      lesson.type === "VIDEO"
                        ? "bg-red-100 text-red-800"
                        : lesson.type === "BLOG"
                          ? "bg-blue-100 text-blue-800"
                          : lesson.type === "QUIZ"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {lesson.type === "VIDEO"
                      ? "🎥 Video"
                      : lesson.type === "BLOG"
                        ? "📝 Blog/Text"
                        : lesson.type === "QUIZ"
                          ? "❓ Quiz"
                          : "🔀 Hỗn hợp"}
                  </Badge>
                </p>
                {lesson.estimatedDurationMinutes && (
                  <p>
                    <strong>Thời lượng ước tính:</strong>{" "}
                    {lesson.estimatedDurationMinutes} phút
                  </p>
                )}
                <p>
                  <strong>Miễn phí xem trước:</strong>{" "}
                  {lesson.isFreePreview ? "Có" : "Không"}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Giảng viên</h4>
              <div className="flex items-center gap-3 mb-3">
                <Avatar>
                  <AvatarImage src={lesson.instructor?.user.image} />
                  <AvatarFallback>
                    {lesson.instructor?.user.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{lesson.instructor?.user.name}</p>
                  <p className="text-sm text-slate-500">
                    {lesson.instructor?.user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          {lesson.content && (
            <div>
              <h4 className="font-medium mb-3">Nội dung bài học</h4>
              <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg max-h-[300px] overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              </div>
            </div>
          )}

          {/* Video URL */}
          {lesson.videoUrl && lesson.type !== LessonType.BLOG && (
            <div>
              <h4 className="font-medium mb-3">Video URL</h4>
              <div className="p-3 bg-slate-50 rounded-lg">
                <a
                  href={lesson.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm break-all"
                >
                  {lesson.videoUrl}
                </a>
              </div>
            </div>
          )}

          {/* Quiz Settings (if type is QUIZ) */}
          {lesson.type === LessonType.QUIZ && (
            <div>
              <h4 className="font-medium mb-3">Cài đặt Quiz</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>
                    <strong>Điểm đậu:</strong> {lesson.passPercent || 80}%
                  </p>
                  {lesson.timeLimit && (
                    <p>
                      <strong>Thời gian làm bài:</strong> {lesson.timeLimit}{" "}
                      phút
                    </p>
                  )}
                  {lesson.maxAttempts && (
                    <p>
                      <strong>Số lần thử tối đa:</strong> {lesson.maxAttempts}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  {lesson.retryDelay && (
                    <p>
                      <strong>Thời gian chờ giữa các lần thử:</strong>{" "}
                      {lesson.retryDelay} phút
                    </p>
                  )}
                  <p>
                    <strong>Khóa sau khi hết lượt:</strong>{" "}
                    {lesson.blockAfterMaxAttempts ? "Có" : "Không"}
                  </p>
                  {lesson.blockDuration && (
                    <p>
                      <strong>Thời gian khóa:</strong> {lesson.blockDuration}{" "}
                      phút
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Unlock Requirements */}
          {lesson.unlockRequirements &&
            lesson.unlockRequirements.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Điều kiện mở khóa</h4>
                <div className="space-y-2">
                  {lesson.unlockRequirements.map((requirement, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">
                          {requirement.title}
                        </p>
                        <Badge
                          variant={
                            requirement.isRequired ? "default" : "secondary"
                          }
                        >
                          {requirement.isRequired ? "Bắt buộc" : "Tùy chọn"}
                        </Badge>
                      </div>
                      {requirement.description && (
                        <p className="text-xs text-slate-600">
                          {requirement.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg text-sm">
            <div>
              <p className="font-medium text-slate-700 mb-1">Ngày tạo</p>
              <p className="text-slate-600">
                {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-700 mb-1">Cập nhật cuối</p>
              <p className="text-slate-600">
                {new Date(lesson.updatedAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
            {lesson.submittedAt && (
              <div>
                <p className="font-medium text-slate-700 mb-1">Gửi duyệt</p>
                <p className="text-slate-600">
                  {new Date(lesson.submittedAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ApprovalLessonsPage() {
  const [lessons, setLessons] = useState<PendingLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("oldest");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedLesson, setSelectedLesson] = useState<PendingLesson | null>(
    null,
  );
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  const fetchPendingLessons = async (
    page = 1,
    limit = 15,
    sort = "oldest",
    type = "all",
  ) => {
    try {
      setIsLoading(true);

      // Mock data for demo - replace with actual API
      const mockLessons: PendingLesson[] = [
        {
          id: "1",
          title: "Giới thiệu về React Hooks",
          content:
            "<p>Bài học này sẽ giới thiệu các khái niệm cơ bản về React Hooks, bao gồm useState, useEffect và custom hooks...</p>",
          type: LessonType.VIDEO,
          status: LessonStatus.PENDING_APPROVAL,
          videoUrl: "https://youtube.com/watch?v=example1",
          estimatedDurationMinutes: 25,
          order: 1,
          chapterId: "chapter-1",
          isPublished: false,
          isFreePreview: true,
          passPercent: 80,
          submittedAt: "2025-01-20T15:30:00Z",
          course: {
            id: "course-1",
            title: "React Advanced: Hooks và Context API",
          },
          chapter: {
            id: "chapter-1",
            title: "Chương 1: React Hooks Cơ Bản",
            order: 1,
          },
          instructor: {
            userId: "instructor-1",
            user: {
              id: "instructor-1",
              name: "Nguyễn Văn An",
              email: "an.nguyen@example.com",
              image:
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
            },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          title: "Bài tập: Tạo Custom Hook",
          content:
            "<p>Trong bài tập này, học viên sẽ tự tay tạo một custom hook để quản lý local storage...</p>",
          type: LessonType.BLOG,
          status: LessonStatus.PENDING_APPROVAL,
          estimatedDurationMinutes: 15,
          order: 5,
          chapterId: "chapter-2",
          isPublished: false,
          isFreePreview: false,
          submittedAt: "2025-01-20T11:20:00Z",
          course: {
            id: "course-1",
            title: "React Advanced: Hooks và Context API",
          },
          chapter: {
            id: "chapter-2",
            title: "Chương 2: Custom Hooks",
            order: 2,
          },
          instructor: {
            userId: "instructor-1",
            user: {
              id: "instructor-1",
              name: "Nguyễn Văn An",
              email: "an.nguyen@example.com",
              image:
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
            },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "3",
          title: "Kiểm tra kiến thức về useState",
          content: "Quiz gồm 10 câu hỏi về useState hook",
          type: LessonType.QUIZ,
          status: LessonStatus.PENDING_APPROVAL,
          estimatedDurationMinutes: 10,
          order: 3,
          chapterId: "chapter-1",
          isPublished: false,
          isFreePreview: false,
          passPercent: 70,
          timeLimit: 15,
          maxAttempts: 3,
          retryDelay: 5,
          blockAfterMaxAttempts: true,
          blockDuration: 60,
          requireUnlockAction: false,
          submittedAt: "2025-01-19T16:45:00Z",
          course: {
            id: "course-1",
            title: "React Advanced: Hooks và Context API",
          },
          chapter: {
            id: "chapter-1",
            title: "Chương 1: React Hooks Cơ Bản",
            order: 1,
          },
          instructor: {
            userId: "instructor-1",
            user: {
              id: "instructor-1",
              name: "Nguyễn Văn An",
              email: "an.nguyen@example.com",
              image:
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
            },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "4",
          title: "Express.js Router và Middleware",
          content:
            "<p>Học cách sử dụng Router và Middleware trong Express.js...</p>",
          type: LessonType.MIXED,
          status: LessonStatus.PENDING_APPROVAL,
          videoUrl: "https://youtube.com/watch?v=example2",
          estimatedDurationMinutes: 30,
          order: 2,
          chapterId: "chapter-3",
          isPublished: false,
          isFreePreview: false,
          submittedAt: "2025-01-19T14:15:00Z",
          course: {
            id: "course-2",
            title: "Node.js Backend Fundamentals",
          },
          chapter: {
            id: "chapter-3",
            title: "Chương 2: Express.js Framework",
            order: 2,
          },
          instructor: {
            userId: "instructor-2",
            user: {
              id: "instructor-2",
              name: "Trần Thị Bình",
              email: "binh.tran@example.com",
              image:
                "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100",
            },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Filter by type if specified
      let filteredLessons = mockLessons;
      if (type !== "all") {
        filteredLessons = mockLessons.filter((lesson) => lesson.type === type);
      }

      setLessons(filteredLessons);
      setPagination({
        page: page,
        limit: limit,
        total: filteredLessons.length,
        totalPages: Math.ceil(filteredLessons.length / limit),
      });
    } catch (error) {
      console.error("Error fetching pending lessons:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách bài học chờ duyệt",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveLesson = async (lessonId: string) => {
    try {
      setProcessingIds((prev) => new Set(prev).add(lessonId));

      // Mock API call - replace with actual implementation
      // await approveLesson(lessonId);

      setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));

      toast({
        title: "Thành công",
        description: "Đã duyệt bài học",
      });
    } catch (error) {
      console.error("Error approving lesson:", error);
      toast({
        title: "Lỗi",
        description: "Không thể duyệt bài học",
        variant: "destructive",
      });
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(lessonId);
        return newSet;
      });
    }
  };

  const handleRejectLesson = async (lessonId: string, reason: string) => {
    // Mock API call - replace with actual implementation
    // await rejectLesson(lessonId, { rejectionReason: reason });

    setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
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

  const getLessonTypeIcon = (type: LessonType) => {
    switch (type) {
      case LessonType.VIDEO:
        return <Play className="h-4 w-4 text-red-500" />;
      case LessonType.BLOG:
        return <FileText className="h-4 w-4 text-blue-500" />;
      case LessonType.QUIZ:
        return <Award className="h-4 w-4 text-green-500" />;
      case LessonType.MIXED:
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const openRejectModal = (lesson: PendingLesson) => {
    setSelectedLesson(lesson);
    setIsRejectModalOpen(true);
  };

  const openDetailModal = (lesson: PendingLesson) => {
    setSelectedLesson(lesson);
    setIsDetailModalOpen(true);
  };

  useEffect(() => {
    fetchPendingLessons(pagination.page, pagination.limit, sortBy, filterType);
  }, [pagination.page, sortBy, filterType]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-500">Đang tải danh sách bài học...</p>
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
                📝 Xét Duyệt Bài Học
              </h1>
              <p className="text-slate-500 text-sm">
                {lessons.length} bài học đang chờ xét duyệt
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value={LessonType.VIDEO}>🎥 Video</SelectItem>
              <SelectItem value={LessonType.BLOG}>📝 Blog/Text</SelectItem>
              <SelectItem value={LessonType.QUIZ}>❓ Quiz</SelectItem>
              <SelectItem value={LessonType.MIXED}>🔀 Hỗn hợp</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oldest">Cũ nhất trước</SelectItem>
              <SelectItem value="newest">Mới nhất trước</SelectItem>
              <SelectItem value="instructor">Theo giảng viên</SelectItem>
              <SelectItem value="course">Theo khóa học</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.values(LessonType).map((type) => {
          const count = lessons.filter((lesson) => lesson.type === type).length;
          return (
            <div
              key={type}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                filterType === type
                  ? "border-orange-500 bg-orange-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
              onClick={() => setFilterType(filterType === type ? "all" : type)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getLessonTypeIcon(type)}
                  <span className="text-sm font-medium">
                    {type === LessonType.VIDEO
                      ? "Video"
                      : type === LessonType.BLOG
                        ? "Blog/Text"
                        : type === LessonType.QUIZ
                          ? "Quiz"
                          : "Hỗn hợp"}
                  </span>
                </div>
                <span className="text-xl font-bold text-slate-700">
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-slate-700">Bài học</TableHead>
              <TableHead className="text-slate-700">
                Khóa học & Chương
              </TableHead>
              <TableHead className="text-slate-700">Giảng viên</TableHead>
              <TableHead className="text-slate-700">
                Loại & Thời lượng
              </TableHead>
              <TableHead className="text-slate-700">Thời gian gửi</TableHead>
              <TableHead className="text-right text-slate-700">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-slate-500"
                >
                  🎉 Không có bài học nào chờ duyệt
                  {filterType !== "all" && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilterType("all")}
                      >
                        Xem tất cả loại bài học
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              lessons.map((lesson) => (
                <TableRow key={lesson.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getLessonTypeIcon(lesson.type)}
                        <p className="font-medium text-slate-900 line-clamp-2">
                          {lesson.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Bài {lesson.order}</span>
                        {lesson.isFreePreview && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">🆓 Miễn phí</span>
                          </>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-700">
                        {lesson.course?.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {lesson.chapter?.title}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={lesson.instructor?.user.image} />
                        <AvatarFallback className="text-xs">
                          {lesson.instructor?.user.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {lesson.instructor?.user.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {lesson.instructor?.user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        className={`text-xs ${
                          lesson.type === LessonType.VIDEO
                            ? "bg-red-100 text-red-800"
                            : lesson.type === LessonType.BLOG
                              ? "bg-blue-100 text-blue-800"
                              : lesson.type === LessonType.QUIZ
                                ? "bg-green-100 text-green-800"
                                : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {lesson.type === LessonType.VIDEO
                          ? "🎥 Video"
                          : lesson.type === LessonType.BLOG
                            ? "📝 Blog"
                            : lesson.type === LessonType.QUIZ
                              ? "❓ Quiz"
                              : "🔀 Hỗn hợp"}
                      </Badge>
                      {lesson.estimatedDurationMinutes && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Timer className="h-3 w-3" />
                          <span>{lesson.estimatedDurationMinutes} phút</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-sm">
                        {getTimeAgo(lesson.submittedAt!)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailModal(lesson)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        Chi tiết
                      </Button>

                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleApproveLesson(lesson.id)}
                        disabled={processingIds.has(lesson.id)}
                      >
                        {processingIds.has(lesson.id) ? (
                          <div className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                            Đang duyệt...
                          </div>
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
                        onClick={() => openRejectModal(lesson)}
                        disabled={processingIds.has(lesson.id)}
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
      {lessons.length > 0 && (
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
      <LessonRejectModal
        lesson={selectedLesson}
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleRejectLesson}
      />

      <LessonDetailModal
        lesson={selectedLesson}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
}
