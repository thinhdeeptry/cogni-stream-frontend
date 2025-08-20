"use client";

import moment from "moment";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ViewSessionModal({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: any;
}) {
  if (!session) return null;

  const startTime = moment(session.scheduledAt);
  const endTime = startTime.clone().add(session.durationMinutes, "minutes");
  const statusMap: Record<string, string> = {
    SCHEDULED: "Đã lên lịch",
    COMPLETED: "Đã hoàn thành",
    CANCELED: "Đã hủy",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold text-lg">
            Thông tin buổi học
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-4 text-slate-700">
          <div>
            <strong>Chủ đề: </strong> {session.topic}
          </div>
          <div>
            <strong>Trạng thái: </strong>{" "}
            {statusMap[session.status] || session.status}
          </div>
          <div>
            <strong>Ngày: </strong> {startTime.format("DD/MM/YYYY")}
          </div>
          <div>
            <strong>Giờ bắt đầu: </strong> {startTime.format("HH:mm")}
          </div>
          <div>
            <strong>Giờ kết thúc: </strong> {endTime.format("HH:mm")}
          </div>
          <div>
            <strong>Thời lượng: </strong> {session.durationMinutes} phút
          </div>
          {session.meetingLink && (
            <div>
              <strong>Link học: </strong>{" "}
              <a
                href={session.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Mở
              </a>
            </div>
          )}
          {session.recordingUrl && (
            <div>
              <strong>Recording: </strong>{" "}
              <a
                href={session.recordingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Xem
              </a>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
