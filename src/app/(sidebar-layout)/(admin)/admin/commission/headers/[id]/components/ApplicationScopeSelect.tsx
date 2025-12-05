"use client";

import React from "react";

import { BookOpen, Layers, Target } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CourseOption {
  id: string;
  title: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface ApplicationScopeSelectProps {
  applicationType: "general" | "course" | "category";
  onApplicationTypeChange: (value: "general" | "course" | "category") => void;
  courseId?: string;
  onCourseChange: (value: string) => void;
  categoryId?: string;
  onCategoryChange: (value: string) => void;
  courses: CourseOption[];
  categories: CategoryOption[];
  isLoadingData: boolean;
}

export const ApplicationScopeSelect: React.FC<ApplicationScopeSelectProps> = ({
  applicationType,
  onApplicationTypeChange,
  courseId,
  onCourseChange,
  categoryId,
  onCategoryChange,
  courses,
  categories,
  isLoadingData,
}) => {
  return (
    <div className="space-y-4">
      {/* Application Type */}
      <div className="space-y-2">
        <Label>Phạm vi áp dụng *</Label>
        <Select value={applicationType} onValueChange={onApplicationTypeChange}>
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
            value={courseId || ""}
            onValueChange={onCourseChange}
            disabled={isLoadingData}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingData ? "Đang tải khóa học..." : "Chọn khóa học..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {isLoadingData ? (
                <SelectItem value="" disabled>
                  Đang tải...
                </SelectItem>
              ) : courses.length === 0 ? (
                <SelectItem value="" disabled>
                  Không có khóa học nào
                </SelectItem>
              ) : (
                courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {course.title}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {!isLoadingData && courses.length === 0 && (
            <p className="text-xs text-red-500">
              Không có khóa học nào được tìm thấy. Vui lòng kiểm tra API hoặc
              tạo khóa học trước.
            </p>
          )}
        </div>
      )}

      {/* Category Selection (if category type) */}
      {applicationType === "category" && (
        <div className="space-y-2">
          <Label htmlFor="categoryId">Danh mục *</Label>
          <Select
            value={categoryId || ""}
            onValueChange={onCategoryChange}
            disabled={isLoadingData}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingData ? "Đang tải danh mục..." : "Chọn danh mục..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {isLoadingData ? (
                <SelectItem value="" disabled>
                  Đang tải...
                </SelectItem>
              ) : categories.length === 0 ? (
                <SelectItem value="" disabled>
                  Không có danh mục nào
                </SelectItem>
              ) : (
                categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      {category.name}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {!isLoadingData && categories.length === 0 && (
            <p className="text-xs text-red-500">
              Không có danh mục nào được tìm thấy. Vui lòng kiểm tra API hoặc
              tạo danh mục trước.
            </p>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {isLoadingData && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-blue-700">
              Đang tải dữ liệu khóa học và danh mục...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
