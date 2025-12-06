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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currSyllabusItem, setCurrSyllabusItem] = useState<any | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(() => {
    // Check if already submitted in this session
    if (typeof window !== "undefined") {
      return localStorage.getItem(`attendance_${syllabusItemId}`) === "true";
    }
    return false;
  });
  const [hasActiveCode, setHasActiveCode] = useState(false); // Track if there's an active attendance code
  const [currentAttendanceCode, setCurrentAttendanceCode] = useState<any>(null); // Store current attendance code with expiresAt

  // Fetch attendance info when component mounts
  useEffect(() => {
    fetchAttendanceInfo();
  }, [syllabusItemId]);

  const fetchAttendanceInfo = async () => {
    try {
      setIsLoading(true);

      console.log(
        "🔍 [Debug] syllabusItemId:",
        syllabusItemId,
        "enrollmentId:",
        enrollmentId,
      );

      if (!enrollmentId) {
        console.error("No enrollmentId provided");
        return;
      }

      if (!syllabusItemId) {
        console.error("❌ No syllabusItemId provided!");
        return;
      }

      // Check attendance status using real API
      const result = await checkAttendanceStatus(syllabusItemId, enrollmentId);
      console.log("Attendance status result:", result);
      if (result.success && result.data) {
        const apiData = result.data;

        // Map API data to expected format
        const mappedData: SyllabusAttendanceInfo = {
          syllabusItem: {
            ...apiData.syllabusItem,
            // Đảm bảo attendanceEnabled là true nếu có thể check in
          },
          userRole: "STUDENT",
          userAttendanceRecord: apiData.attendanceRecord || undefined,
        };

        setAttendanceInfo(mappedData);
        setHasSubmitted(!!apiData.attendanceRecord);
        setCurrSyllabusItem(apiData.syllabusItem);

        // Check if there's an active attendance code and store current code
        setHasActiveCode(apiData.canCheckIn == true);
        // Current code là code mới nhất trong attendanceCodes array
        const currentCode = apiData.syllabusItem?.attendanceCodes?.[0] || null;
        setCurrentAttendanceCode(currentCode);

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
    setErrorMessage(null);
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

      const msg = error.message || "Không thể điểm danh. Vui lòng thử lại.";

      toast.error(msg);
      setErrorMessage("Điểm danh thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmitAttendance();
    }
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
  if (!hasActiveCode && !hasSubmitted) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Điểm danh chưa được kích hoạt
          </h3>
          <p className="mb-4">
            Buổi học này không yêu cầu điểm danh hoặc chưa có mã điểm danh
          </p>
          <div className="text-xs text-gray-400 font-mono space-y-1 bg-gray-100 p-3 rounded">
            <p>
              📍 syllabusItemId:{" "}
              <span className="text-blue-600">{syllabusItemId || "NULL"}</span>
            </p>
            <p>
              🔑 hasActiveCode:{" "}
              <span className="text-red-600">{hasActiveCode.toString()}</span>
            </p>
            <p>✅ hasSubmitted: {hasSubmitted.toString()}</p>
            <p>📝 currentCode: {currentAttendanceCode.toString()}</p>
            <p>📄 syllabusItem: {currSyllabusItem.toString()}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasSubmitted) {
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
      </Card>
    );
  }

  // Có mã active → hiển thị form nhập
  if (hasActiveCode) {
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

            {/* Error message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{errorMessage}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Không có mã active (nhưng có thể đã có mã cũ hết hạn)
  return (
    <Card className={className}>
      <CardContent className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-lg font-medium mb-2 text-yellow-800">
          Chưa có mã điểm danh
        </h3>
        <p className="text-gray-600">
          Giảng viên chưa tạo mã điểm danh cho buổi học này. Vui lòng chờ giảng
          viên thông báo.
        </p>
      </CardContent>
    </Card>
  );
}
