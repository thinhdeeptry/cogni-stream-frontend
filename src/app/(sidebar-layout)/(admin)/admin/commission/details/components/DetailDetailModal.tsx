"use client";

import React from "react";

import { BookOpen, FileText, Layers, Target } from "lucide-react";

import { CommissionDetail } from "@/stores/useCommissionStore";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Detail Detail Modal Component
interface DetailDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: CommissionDetail | null;
}

export const DetailDetailModal: React.FC<DetailDetailModalProps> = ({
  isOpen,
  onClose,
  detail,
}) => {
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
