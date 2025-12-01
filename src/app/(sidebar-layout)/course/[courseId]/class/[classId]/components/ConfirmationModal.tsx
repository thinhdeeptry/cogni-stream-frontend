"use client";

import { SyllabusItem, SyllabusItemType } from "@/types/course/types";
import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentItem?: SyllabusItem | null;
  pendingNavigation?: SyllabusItem | null;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  currentItem,
  pendingNavigation,
}: ConfirmationModalProps) {
  const getCurrentItemTitle = () => {
    if (!currentItem) return "";
    return currentItem.itemType === SyllabusItemType.LESSON
      ? currentItem.lesson?.title
      : currentItem.classSession?.topic;
  };

  const getPendingItemTitle = () => {
    if (!pendingNavigation) return "";
    return pendingNavigation.itemType === SyllabusItemType.LESSON
      ? pendingNavigation.lesson?.title
      : pendingNavigation.classSession?.topic;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-orange-500" />
            Xác nhận hoàn thành bài học
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn hoàn thành bài học hiện tại và chuyển sang bài
            học tiếp theo không?
          </DialogDescription>
        </DialogHeader>

        {currentItem && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-900">
              Bài học hiện tại: {getCurrentItemTitle()}
            </p>
            {pendingNavigation && (
              <p className="text-sm text-gray-600 mt-1">
                Bài học tiếp theo: {getPendingItemTitle()}
              </p>
            )}
          </div>
        )}

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Xác nhận hoàn thành
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
