"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UpdateSessionModal({
  open,
  onClose,
  session,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  session: any;
  onSuccess: () => Promise<void>;
}) {
  const [topic, setTopic] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");

  // Reset form khi session thay đổi
  useEffect(() => {
    if (session) {
      setTopic(session.topic || "");
      // session.scheduledAt: ISO string → datetime-local cần format "YYYY-MM-DDTHH:mm"
      setScheduledAt(
        session.scheduledAt ? session.scheduledAt.slice(0, 16) : "",
      );
      setDurationMinutes(session.durationMinutes?.toString() || "60");
    }
  }, [session]);

  const handleSubmit = async () => {
    try {
      await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          scheduledAt,
          durationMinutes: Number(durationMinutes),
        }),
      });

      await onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to update session", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold">
            Xem thông tin buổi học
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="topic" className="font-bold">
              Chủ đề
            </Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="scheduledAt" className="font-bold">
              Thời gian bắt đầu
            </Label>
            <Input
              type="datetime-local"
              id="scheduledAt"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="durationMinutes" className="font-bold">
              Thời lượng (phút)
            </Label>
            <Input
              type="number"
              min="15"
              step="15"
              id="durationMinutes"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              disabled
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          {/* <Button onClick={handleSubmit}>Cập nhật</Button> */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
