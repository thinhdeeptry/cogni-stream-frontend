"use client";

import { useState } from "react";

import { toast } from "@/hooks/use-toast";
import { Check, Loader2, MessageSquare, X } from "lucide-react";

import {
  approveCourse,
  approveLesson,
  rejectCourse,
  rejectLesson,
} from "@/actions/approvalActions";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ApprovalButtonsProps {
  type: "course" | "lesson";
  itemId: string;
  itemTitle: string;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "PUBLISHED";
  onStatusChange?: () => void;
}

export function ApprovalButtons({
  type,
  itemId,
  itemTitle,
  status,
  onStatusChange,
}: ApprovalButtonsProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Don't show buttons if already approved, rejected, or published
  if (status !== "PENDING_APPROVAL") {
    return null;
  }

  const handleApprove = async () => {
    try {
      setIsApproving(true);

      if (type === "course") {
        await approveCourse(itemId);
        toast({
          title: "Thành công",
          description: `Khóa học "${itemTitle}" đã được duyệt`,
        });
      } else {
        await approveLesson(itemId);
        toast({
          title: "Thành công",
          description: `Bài học "${itemTitle}" đã được duyệt`,
        });
      }

      onStatusChange?.();
    } catch (error: any) {
      console.error(`Error approving ${type}:`, error);
      toast({
        title: "Lỗi",
        description:
          error.message ||
          `Không thể duyệt ${type === "course" ? "khóa học" : "bài học"}`,
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRejecting(true);

      if (type === "course") {
        await rejectCourse(itemId, { rejectionReason: rejectionReason.trim() });
        toast({
          title: "Thành công",
          description: `Khóa học "${itemTitle}" đã bị từ chối`,
        });
      } else {
        await rejectLesson(itemId, { rejectionReason: rejectionReason.trim() });
        toast({
          title: "Thành công",
          description: `Bài học "${itemTitle}" đã bị từ chối`,
        });
      }

      setRejectDialogOpen(false);
      setRejectionReason("");
      onStatusChange?.();
    } catch (error: any) {
      console.error(`Error rejecting ${type}:`, error);
      toast({
        title: "Lỗi",
        description:
          error.message ||
          `Không thể từ chối ${type === "course" ? "khóa học" : "bài học"}`,
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
          size="sm"
        >
          {isApproving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Duyệt
        </Button>

        <Button
          onClick={() => setRejectDialogOpen(true)}
          disabled={isApproving || isRejecting}
          variant="destructive"
          className="gap-2"
          size="sm"
        >
          <X className="h-4 w-4" />
          Từ chối
        </Button>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              Từ chối {type === "course" ? "khóa học" : "bài học"}
            </DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối để giúp người tạo nội dung hiểu và cải
              thiện.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Lý do từ chối *</Label>
              <Textarea
                id="rejection-reason"
                placeholder={`Nhập lý do từ chối ${type === "course" ? "khóa học" : "bài học"} này...`}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px] mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
              disabled={isRejecting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
              variant="destructive"
              className="gap-2"
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
