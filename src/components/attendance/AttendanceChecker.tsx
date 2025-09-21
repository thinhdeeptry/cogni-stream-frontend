"use client";

import { useEffect, useState } from "react";

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import {
  checkAttendanceStatus,
  submitAttendanceCode,
} from "@/actions/attendanceActions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AttendanceCheckerProps {
  syllabusItemId: string;
  enrollmentId: string;
  isLiveSession: boolean;
  sessionTopic: string;
  attendanceEnabled: boolean;
}

type AttendanceState =
  | "not_started"
  | "checking"
  | "success"
  | "failed"
  | "already_attended";

export default function AttendanceChecker({
  syllabusItemId,
  enrollmentId,
  isLiveSession,
  sessionTopic,
  attendanceEnabled,
}: AttendanceCheckerProps) {
  const [attendanceCode, setAttendanceCode] = useState("");
  const [attendanceState, setAttendanceState] =
    useState<AttendanceState>("not_started");
  const [attendedAt, setAttendedAt] = useState<Date | null>(null);
  const [isLate, setIsLate] = useState(false);

  // Workflow Step 1: Kiểm tra trạng thái điểm danh của học viên
  useEffect(() => {
    checkCurrentAttendanceStatus();
  }, [syllabusItemId, enrollmentId]);

  const checkCurrentAttendanceStatus = async () => {
    if (!attendanceEnabled) return;

    try {
      const result = await checkAttendanceStatus(syllabusItemId, enrollmentId);
      if (result.success && result.data) {
        setAttendanceState("already_attended");
        setAttendedAt(new Date(result.data.attendedAt));
        setIsLate(result.data.isLate);
      }
    } catch (error) {
      // Chưa điểm danh, giữ nguyên state not_started
    }
  };

  // Workflow Step 2: Học viên nhập mã và gửi điểm danh
  const handleSubmitAttendance = async () => {
    if (!attendanceCode.trim()) {
      toast.error("Vui lòng nhập mã điểm danh");
      return;
    }

    setAttendanceState("checking");

    try {
      const result = await submitAttendanceCode({
        syllabusItemId,
        enrollmentId,
        code: attendanceCode.toUpperCase(),
      });

      if (result.success) {
        setAttendanceState("success");
        setAttendedAt(new Date());
        setIsLate(result.data?.isLate || false);
        toast.success(
          result.data?.isLate
            ? "Điểm danh thành công (Trễ)"
            : "Điểm danh thành công!",
        );
      } else {
        setAttendanceState("failed");
        toast.error(
          result.message || "Mã điểm danh không hợp lệ hoặc đã hết hạn",
        );
        // Reset về not_started sau 3 giây để cho phép thử lại
        setTimeout(() => {
          setAttendanceState("not_started");
          setAttendanceCode("");
        }, 3000);
      }
    } catch (error) {
      setAttendanceState("failed");
      toast.error("Lỗi khi gửi điểm danh");
      setTimeout(() => {
        setAttendanceState("not_started");
        setAttendanceCode("");
      }, 3000);
    }
  };

  // Không hiển thị nếu không phải buổi live hoặc không bật điểm danh
  if (!isLiveSession || !attendanceEnabled) return null;

  // Workflow Step 3: Hiển thị kết quả điểm danh
  const renderAttendanceResult = () => {
    if (
      attendanceState === "success" ||
      attendanceState === "already_attended"
    ) {
      return (
        <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <div className="space-y-2">
            <p className="text-green-700 font-medium text-lg">
              {attendanceState === "already_attended"
                ? "Đã điểm danh trước đó"
                : "Điểm danh thành công!"}
            </p>
            {isLate && (
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-300"
              >
                Trễ
              </Badge>
            )}
            {attendedAt && (
              <p className="text-sm text-green-600">
                Thời gian: {attendedAt.toLocaleString("vi-VN")}
              </p>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Workflow Step 4: Form nhập mã điểm danh
  const renderAttendanceForm = () => {
    if (
      attendanceState === "success" ||
      attendanceState === "already_attended"
    ) {
      return null;
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Nhập mã điểm danh từ giảng viên"
            value={attendanceCode}
            onChange={(e) => setAttendanceCode(e.target.value.toUpperCase())}
            maxLength={8}
            className="text-center font-mono text-lg"
            disabled={attendanceState === "checking"}
          />
        </div>

        <Button
          onClick={handleSubmitAttendance}
          disabled={!attendanceCode.trim() || attendanceState === "checking"}
          className="w-full"
        >
          {attendanceState === "checking" ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang kiểm tra...
            </>
          ) : (
            <>
              <UserCheck className="h-4 w-4 mr-2" />
              Xác nhận điểm danh
            </>
          )}
        </Button>

        {attendanceState === "failed" && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-red-600">
                Mã không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-l-4 border-orange-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          <span>Điểm danh: {sessionTopic}</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {renderAttendanceResult() || renderAttendanceForm()}

        {/* Thông tin bổ sung */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-600 text-center">
            💡 Hãy yêu cầu giảng viên cung cấp mã điểm danh để xác nhận sự tham
            gia của bạn
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
