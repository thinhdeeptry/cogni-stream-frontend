"use client";

import React, { useEffect, useState } from "react";

import type {
  AttendanceCheckInRequest,
  AttendanceRecord,
  SyllabusAttendanceInfo,
} from "@/types/attendance";
import { AttendanceStatus } from "@/types/attendance";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  QrCode,
  Timer,
  UserCheck,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
  checkAttendanceStatus,
  submitAttendanceCode,
} from "@/actions/attendanceActions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface StudentAttendanceInputProps {
  syllabusItemId: string;
  enrollmentId: string;
  sessionTopic?: string;
  onAttendanceSuccess?: () => void; // Callback when attendance is successful
  className?: string;
}

export function StudentAttendanceInput({
  syllabusItemId,
  enrollmentId,
  sessionTopic = "Buổi học",
  onAttendanceSuccess,
  className = "",
}: StudentAttendanceInputProps) {
  const { data: session } = useSession();
  const [attendanceCode, setAttendanceCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attendanceInfo, setAttendanceInfo] =
    useState<SyllabusAttendanceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(() => {
    // Check if already submitted in this session
    if (typeof window !== "undefined") {
      return localStorage.getItem(`attendance_${syllabusItemId}`) === "true";
    }
    return false;
  });
  const [hasActiveCode, setHasActiveCode] = useState(false); // Track if there's an active attendance code

  // Fetch attendance info when component mounts
  useEffect(() => {
    fetchAttendanceInfo();
  }, [syllabusItemId]);

  const fetchAttendanceInfo = async () => {
    try {
      setIsLoading(true);

      if (!enrollmentId) {
        console.error("No enrollmentId provided");
        return;
      }

      // Check attendance status using real API
      const result = await checkAttendanceStatus(syllabusItemId, enrollmentId);

      if (result.success && result.data) {
        const apiData = result.data;

        // Map API data to expected format
        const mappedData: SyllabusAttendanceInfo = {
          syllabusItem: {
            ...apiData.syllabusItem,
            // Đảm bảo attendanceEnabled là true nếu có thể check in
            attendanceEnabled:
              apiData.canCheckIn !== undefined
                ? true
                : apiData.syllabusItem.attendanceEnabled || false,
          },
          userRole: "STUDENT",
          userAttendanceRecord: apiData.attendanceRecord || undefined,
        };

        setAttendanceInfo(mappedData);
        setHasSubmitted(!!apiData.attendanceRecord);

        // Check if there's an active attendance code
        setHasActiveCode(apiData.canCheckIn || false);

        // Sync with localStorage
        if (apiData.attendanceRecord && typeof window !== "undefined") {
          localStorage.setItem(`attendance_${syllabusItemId}`, "true");
        }
      } else {
        console.error("Failed to fetch attendance info:", result.message);
        // Set minimal fallback data
        setAttendanceInfo({
          syllabusItem: {
            id: syllabusItemId,
            day: 1,
            order: 1,
            itemType: "LIVE_SESSION",
            attendanceEnabled: true,
            attendanceStartTime: new Date(),
            attendanceEndTime: new Date(Date.now() + 30 * 60 * 1000),
            lateThresholdMinutes: 10,
            classSession: {
              topic: sessionTopic,
              scheduledTime: new Date(),
            },
          },
          userRole: "STUDENT",
          userAttendanceRecord: undefined,
        });
      }
    } catch (error) {
      console.error("Error fetching attendance info:", error);
      toast.error("Không thể tải thông tin điểm danh");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAttendance = async () => {
    if (!attendanceCode.trim()) {
      toast.error("Vui lòng nhập mã điểm danh");
      return;
    }

    if (hasSubmitted) {
      toast.error("Bạn đã điểm danh thành công cho buổi học này");
      return;
    }

    if (!hasActiveCode) {
      toast.error(
        "Hiện tại chưa có mã điểm danh. Vui lòng chờ giảng viên tạo mã.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      if (!enrollmentId) {
        throw new Error("Thiếu thông tin ghi danh");
      }

      // Submit attendance using real API
      const result = await submitAttendanceCode({
        syllabusItemId,
        enrollmentId,
        code: attendanceCode.trim().toUpperCase(),
      });

      if (!result.success) {
        throw new Error(result.message || "Điểm danh thất bại");
      }

      setHasSubmitted(true);

      // Persist attendance status in localStorage for this session
      if (typeof window !== "undefined") {
        localStorage.setItem(`attendance_${syllabusItemId}`, "true");
      }

      toast.success(
        `Điểm danh thành công cho ${sessionTopic}! 🎉\nBạn có thể tiếp tục sang buổi học tiếp theo.`,
      );

      // Clear the input
      setAttendanceCode("");

      // Trigger success callback to create progress and move to next lesson
      if (onAttendanceSuccess) {
        onAttendanceSuccess();
      }

      // Refresh attendance info
      await fetchAttendanceInfo();
    } catch (error: any) {
      console.error("Error submitting attendance:", error);
      toast.error(error.message || "Không thể điểm danh. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmitAttendance();
    }
  };

  const getTimeRemaining = () => {
    if (!attendanceInfo?.syllabusItem.attendanceEndTime) return null;

    const now = new Date();
    const endTime = new Date(attendanceInfo.syllabusItem.attendanceEndTime);
    const diffMs = endTime.getTime() - now.getTime();

    if (diffMs <= 0) return "Đã hết hạn";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m`;
    }
    return `${diffMinutes}m`;
  };

  const isAttendanceActive = () => {
    if (!attendanceInfo?.syllabusItem.attendanceEndTime) return false;
    const now = new Date();
    const endTime = new Date(attendanceInfo.syllabusItem.attendanceEndTime);
    return now < endTime;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Đang tải thông tin điểm danh...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Kiểm tra nếu không có thông tin hoặc không có mã nào cả (chưa kích hoạt)
  if (!attendanceInfo || (!hasActiveCode && !hasSubmitted)) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Điểm danh chưa được kích hoạt
          </h3>
          <p>Buổi học này không yêu cầu điểm danh hoặc chưa có mã điểm danh</p>
        </CardContent>
      </Card>
    );
  }

  if (hasSubmitted && attendanceInfo?.userAttendanceRecord) {
    const record = attendanceInfo.userAttendanceRecord;
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-6 w-6" />
            Đã điểm danh thành công
          </CardTitle>
          <CardDescription>
            Bạn đã hoàn thành điểm danh cho {sessionTopic}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-800 mb-1">
                  Thông tin điểm danh
                </h4>
                <div className="space-y-1 text-sm text-green-700">
                  <p>
                    Trạng thái:
                    <Badge className="ml-2 bg-green-100 text-green-800">
                      {record.status === AttendanceStatus.PRESENT
                        ? "Có mặt"
                        : record.status === AttendanceStatus.LATE
                          ? "Muộn"
                          : "Vắng mặt"}
                    </Badge>
                  </p>
                  <p>
                    Thời gian:{" "}
                    {new Date(record.checkedInAt).toLocaleString("vi-VN")}
                  </p>
                  {record.isLate && (
                    <p className="text-yellow-700">⚠️ Bạn đã điểm danh muộn</p>
                  )}
                </div>
              </div>
              <UserCheck className="h-12 w-12 text-green-600" />
            </div>
          </div>

          {/* Success message with next steps */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700 mb-2">
              <CheckCircle className="h-5 w-5" />
              <h4 className="font-medium">Bạn có thể tiếp tục học!</h4>
            </div>
            <p className="text-sm text-blue-600">
              💡 Sử dụng nút "Tiếp theo" ở cuối trang để chuyển sang buổi học
              tiếp theo.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-6 w-6 text-blue-600" />
          Điểm danh - {sessionTopic}
        </CardTitle>
        <CardDescription>
          Nhập mã điểm danh mà giảng viên cung cấp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time remaining info */}
        {isAttendanceActive() && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <Timer className="h-4 w-4" />
              <span className="text-sm font-medium">
                Thời gian còn lại: {getTimeRemaining()}
              </span>
            </div>
          </div>
        )}

        {/* Attendance input */}
        {isAttendanceActive() ? (
          hasActiveCode ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="attendance-code"
                  className="text-sm font-medium text-gray-700"
                >
                  Mã điểm danh
                </label>
                <div className="flex gap-2">
                  <Input
                    id="attendance-code"
                    type="text"
                    placeholder="Nhập mã điểm danh (VD: ABC123)"
                    value={attendanceCode}
                    onChange={(e) =>
                      setAttendanceCode(e.target.value.toUpperCase())
                    }
                    onKeyPress={handleKeyPress}
                    disabled={isSubmitting}
                    className="flex-1 font-mono text-lg text-center tracking-widest"
                    maxLength={10}
                  />
                  <Button
                    onClick={handleSubmitAttendance}
                    disabled={isSubmitting || !attendanceCode.trim()}
                    className="min-w-[100px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Điểm danh
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  💡 Mẹo: Mã điểm danh thường có 6-8 ký tự và được giảng viên
                  cung cấp trong lớp
                </p>
                <p>
                  ⚠️ Lưu ý: Mỗi học viên chỉ được điểm danh một lần cho mỗi buổi
                  học
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <h4 className="font-medium text-yellow-800 mb-1">
                Chưa có mã điểm danh
              </h4>
              <p className="text-sm text-yellow-600">
                Giảng viên chưa tạo mã điểm danh cho buổi học này. Vui lòng chờ
                giảng viên thông báo.
              </p>
            </div>
          )
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <h4 className="font-medium text-red-800 mb-1">
              Hết thời gian điểm danh
            </h4>
            <p className="text-sm text-red-600">
              Thời gian điểm danh đã kết thúc. Vui lòng liên hệ giảng viên nếu
              cần hỗ trợ.
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Hướng dẫn điểm danh
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>1. Tham gia buổi học theo link được cung cấp</p>
            <p>2. Lắng nghe giảng viên công bố mã điểm danh</p>
            <p>3. Nhập mã điểm danh vào ô trên và nhấn "Điểm danh"</p>
            <p className="font-medium text-orange-600">
              ⚠️ Lưu ý: Phải điểm danh thành công mới được phép tiếp tục buổi
              học tiếp theo
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
