"use client";

import React, { useState } from "react";

import { QrCode, Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AttendanceConfigModal } from "./AttendanceConfigModal";

interface AttendanceManagerProps {
  syllabusItemId: string;
  instructorId: string;
  isLiveSession?: boolean;
  sessionTopic?: string;
  userRole?: "INSTRUCTOR" | "ADMIN"; // Thêm prop userRole
}

export function AttendanceManager({
  syllabusItemId,
  instructorId,
  isLiveSession = false,
  sessionTopic = "Buổi học",
  userRole = "INSTRUCTOR",
}: AttendanceManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Xác định hiển thị badge
  const getBadgeText = () => {
    if (userRole === "ADMIN") return "Quản trị viên";
    return "Giảng viên";
  };

  const getBadgeColor = () => {
    if (userRole === "ADMIN") return "text-purple-600";
    return "text-blue-600";
  };

  return (
    <>
      <Card className="border-l-4 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-500" />
              <span>Quản lý điểm danh</span>
            </div>
            <Badge variant="outline" className={getBadgeColor()}>
              {getBadgeText()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              Tạo mã điểm danh cho học viên tham gia {sessionTopic}
              {userRole === "ADMIN" && " (Chế độ quản trị)"}
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Mở bảng điều khiển điểm danh
            </Button>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-700 space-y-1">
              <p>• Tạo mã điểm danh để học viên có thể check-in</p>
              <p>• Theo dõi danh sách học viên đã điểm danh</p>
              <p>• Gia hạn thời gian điểm danh nếu cần thiết</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AttendanceConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        syllabusItemId={syllabusItemId}
        instructorId={instructorId}
        sessionTopic={sessionTopic}
        isLiveSession={isLiveSession}
        userRole={userRole}
      />
    </>
  );
}
