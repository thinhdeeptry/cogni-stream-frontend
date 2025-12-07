"use client";

import React, { useState } from "react";

import { Trash2 } from "lucide-react";

import { CommissionDetail } from "@/stores/useCommissionStore";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Delete Confirmation Modal
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  detail: CommissionDetail | null;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  detail,
  onConfirm,
}) => {
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
