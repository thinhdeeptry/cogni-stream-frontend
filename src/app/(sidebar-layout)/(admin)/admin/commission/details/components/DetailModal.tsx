"use client";

import React, { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { BookOpen, Layers, Target } from "lucide-react";

import type { CategoryOption, CourseOption } from "@/actions/commissionActions";

import {
  CommissionDetail,
  CommissionHeader,
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

// Form types
export interface DetailFormData {
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
  courses: CourseOption[];
  categories: CategoryOption[];
  isLoadingCourses: boolean;
  isLoadingCategories: boolean;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  detail,
  mode,
  onSubmit,
  headers,
  currentHeaderId,
  courses,
  categories,
  isLoadingCourses,
  isLoadingCategories,
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

  const instructorRate = 100 - formData.platformRate;

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
  console.log("danh sach courses:", courses);
  console.log("danh sach categories:", categories);

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
                disabled={isLoadingCourses}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingCourses
                        ? "Đang tải khóa học..."
                        : "Chọn khóa học..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCourses ? (
                    <SelectItem value="" disabled>
                      Đang tải...
                    </SelectItem>
                  ) : courses.length > 0 ? (
                    courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      Không có khóa học nào
                    </SelectItem>
                  )}
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
                disabled={isLoadingCategories}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingCategories
                        ? "Đang tải danh mục..."
                        : "Chọn danh mục..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCategories ? (
                    <SelectItem value="" disabled>
                      Đang tải...
                    </SelectItem>
                  ) : categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      Không có danh mục nào
                    </SelectItem>
                  )}
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
