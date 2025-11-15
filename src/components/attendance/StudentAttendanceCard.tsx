"use client";

import { useEffect, useState } from "react";

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  UserCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  checkAttendanceStatus,
  getCurrentAttendanceCode,
  submitAttendanceCode,
} from "@/actions/attendanceActions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StudentAttendanceCardProps {
  syllabusItemId: string;
  enrollmentId: string;
  sessionTopic: string;
  onAttendanceSuccess?: () => void;
}

interface AttendanceStatus {
  hasAttended: boolean;
  attendanceTime?: Date;
  isLate?: boolean;
}

interface AttendanceCodeInfo {
  isActive: boolean;
  expiresAt?: Date;
}

export default function StudentAttendanceCard({
  syllabusItemId,
  enrollmentId,
  sessionTopic,
  onAttendanceSuccess,
}: StudentAttendanceCardProps) {
  const [inputCode, setInputCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] =
    useState<AttendanceStatus | null>(null);
  const [codeInfo, setCodeInfo] = useState<AttendanceCodeInfo>({
    isActive: false,
  });
  const [isChecking, setIsChecking] = useState(true);

  // Kiểm tra trạng thái điểm danh khi component mount
  useEffect(() => {
    checkCurrentStatus();
  }, [syllabusItemId, enrollmentId]);

  // Refresh when the page becomes visible or window gains focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkCurrentStatus();
      }
    };

    const handleFocus = () => {
      checkCurrentStatus();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [syllabusItemId, enrollmentId]);

  const checkCurrentStatus = async () => {
    setIsChecking(true);
    try {
      // Kiểm tra trạng thái điểm danh của học viên
      const statusResult = await checkAttendanceStatus(
        syllabusItemId,
        enrollmentId,
      );

      if (statusResult.success && statusResult.data) {
        setAttendanceStatus(statusResult.data);
      }

      // Kiểm tra xem có mã điểm danh active không
      const codeResult = await getCurrentAttendanceCode(syllabusItemId);

      if (codeResult.success && codeResult.data) {
        setCodeInfo({
          isActive: true,
          expiresAt: codeResult.data.expiresAt
            ? new Date(codeResult.data.expiresAt)
            : undefined,
        });
      } else {
        setCodeInfo({ isActive: false });
      }
    } catch (error) {
      console.error("Error checking attendance status:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!inputCode.trim()) {
      toast.error("Vui lòng nhập mã điểm danh");
      return;
    }

    setIsLoading(true);
    try {
      const result = await submitAttendanceCode({
        syllabusItemId,
        enrollmentId,
        code: inputCode.toUpperCase(),
      });

      if (result.success) {
        toast.success("Điểm danh thành công!");
        setAttendanceStatus({
          hasAttended: true,
          attendanceTime: new Date(),
          isLate: result.data?.isLate || false,
        });
        setInputCode("");

        // Gọi callback nếu có để trigger completion logic
        if (onAttendanceSuccess) {
          // Delay nhỏ để UI update trước
          setTimeout(() => {
            onAttendanceSuccess();
          }, 500);
        }
      } else {
        toast.error(result.message || "Mã điểm danh không hợp lệ");
      }
    } catch (error) {
      toast.error("Lỗi khi gửi mã điểm danh");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isChecking) {
    return (
      <Card className="border-l-4 border-blue-500">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Đang kiểm tra trạng thái điểm danh...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Nếu đã điểm danh thành công
  if (attendanceStatus?.hasAttended) {
    return (
      <Card className="border-l-4 border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Điểm danh: {sessionTopic}</span>
            </div>
            <Badge
              variant="default"
              className="bg-green-500 hover:bg-green-600"
            >
              Đã điểm danh
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-800">
                  Điểm danh thành công!
                </h4>
                <p className="text-sm text-green-600">
                  Thời gian:{" "}
                  {attendanceStatus.attendanceTime &&
                    formatTime(attendanceStatus.attendanceTime)}
                  {attendanceStatus.isLate && (
                    <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                      Trễ
                    </span>
                  )}
                </p>
              </div>
              <div className="text-green-600">
                <CheckCircle className="h-8 w-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Nếu không có mã điểm danh active
  if (!codeInfo.isActive) {
    return (
      <Card className="border-l-4 border-gray-500">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <span>Điểm danh: {sessionTopic}</span>
            </div>
            <Badge variant="secondary">Chưa mở</Badge>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">
                  Chưa có mã điểm danh
                </h4>
                <p className="text-sm text-gray-600">
                  Giảng viên chưa mở điểm danh cho buổi học này
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Form nhập mã điểm danh
  return (
    <Card className="border-l-4 border-orange-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-orange-500" />
            <span>Điểm danh: {sessionTopic}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="default"
              className="bg-orange-500 hover:bg-orange-600"
            >
              Đang mở
            </Badge>
            {codeInfo.expiresAt && (
              <Badge variant="outline" className="text-xs">
                Hết hạn: {formatTime(codeInfo.expiresAt)}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-orange-800 mb-1">
                Nhập mã điểm danh
              </h4>
              <p className="text-sm text-orange-600">
                Hãy nhập mã điểm danh mà giảng viên cung cấp để xác nhận tham
                gia buổi học
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label
                htmlFor="attendance-code"
                className="text-orange-700 font-medium"
              >
                Mã điểm danh
              </Label>
              <Input
                id="attendance-code"
                placeholder="Nhập mã điểm danh..."
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                className="mt-1 font-mono text-lg text-center border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                maxLength={8}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading && inputCode.trim()) {
                    handleSubmitCode();
                  }
                }}
              />
              <p className="text-xs text-orange-600 mt-1">
                Nhấn Enter để gửi hoặc click nút bên dưới
              </p>
            </div>

            <Button
              onClick={handleSubmitCode}
              disabled={isLoading || !inputCode.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 transition-colors"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Gửi mã điểm danh
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Refresh button */}
        <Button
          variant="outline"
          onClick={checkCurrentStatus}
          disabled={isChecking}
          className="w-full"
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang kiểm tra...
            </>
          ) : (
            "Kiểm tra lại trạng thái"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
