"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CreateSessionModalProps = {
  open: boolean;
  onClose: () => void;
  classroomId: string;
  onSuccess: () => void;
};

export function CreateSessionModal({
  open,
  onClose,
  classroomId,
  onSuccess,
}: CreateSessionModalProps) {
  const [topic, setTopic] = useState("");
  const [scheduledAt, setScheduledAt] = useState(""); // datetime-local
  const [durationMinutes, setDurationMinutes] = useState("60"); // mặc định 60 phút

  const handleSubmit = async () => {
    try {
      await fetch(`/api/classrooms/${classroomId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          scheduledAt,
          durationMinutes: Number(durationMinutes),
        }),
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to create session", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold">Tạo buổi học mới</DialogTitle>
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
              placeholder="Nhập tên chủ đề..."
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
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          <Button onClick={handleSubmit}>Lưu</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
