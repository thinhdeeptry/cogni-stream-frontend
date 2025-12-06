"use client";

import { useEffect, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  UserCheck,
} from "lucide-react";

import {
  checkAttendanceStatus,
  submitAttendanceCode,
} from "@/actions/attendanceActions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";

interface AttendanceRecord {
  id: string;
  userId: string;
  syllabusItemId: string;
  attendanceCodeId: string;
  status: AttendanceStatus;
  checkedInAt: string;
  isLate: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface AttendanceCheckInRequest {
  code: string;
  syllabusItemId: string;
}

interface SyllabusAttendanceInfo {
  syllabusItem: {
    id: string;
    day: number;
    order: number;
    itemType: string;
    attendanceEnabled: boolean;
    attendanceStartTime: string | null;
    attendanceEndTime: string | null;
    lateThresholdMinutes: number | null;
    classSession?: {
      topic: string;
      scheduledTime: string;
    };
  };
  userRole: "INSTRUCTOR" | "STUDENT";
  codes?: any[]; // Chỉ có khi user là instructor
  userAttendanceRecord?: AttendanceRecord; // Chỉ có khi user là student
}

interface StudentAttendanceModalProps {
  syllabusItem: any;
}

export function StudentAttendanceModal({
  syllabusItem,
}: StudentAttendanceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingInfo, setIsCheckingInfo] = useState(false);
  const [attendanceCode, setAttendanceCode] = useState("");
  const [attendanceInfo, setAttendanceInfo] =
    useState<SyllabusAttendanceInfo | null>(null);
  const { toast } = useToast();

  // Fetch attendance info when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAttendanceInfo();
    }
  }, [isOpen]);

  const fetchAttendanceInfo = async () => {
    setIsCheckingInfo(true);
    try {
      const response = await checkAttendanceStatus(syllabusItem.id, "");
      if (!response.success || !response.data) {
        throw new Error(
          response.message || "Không thể tải thông tin điểm danh",
        );
      }
      setAttendanceInfo(response.data as any);
    } catch (error: any) {
      toast({
        title: "❌ Lỗi tải thông tin",
        description: error.message || "Không thể tải thông tin điểm danh",
        variant: "destructive",
      });
    } finally {
      setIsCheckingInfo(false);
    }
  };

  const handleCheckIn = async () => {
    if (!attendanceCode.trim()) {
      toast({
        title: "⚠️ Thiếu thông tin",
        description: "Vui lòng nhập mã điểm danh",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await submitAttendanceCode({
        code: attendanceCode.trim(),
        syllabusItemId: syllabusItem.id,
        enrollmentId: "", // Backend doesn't need this
      });

      if (!response.success || !response.data) {
        throw new Error(
          response.message || "Mã điểm danh không đúng hoặc đã hết hạn",
        );
      }

      const record = response.data;

      // Update local state
      if (attendanceInfo) {
        setAttendanceInfo({
          ...attendanceInfo,
          userAttendanceRecord: record as any,
        });
      }

      toast({
        title: "✅ Điểm danh thành công",
        description: record.isLate
          ? "Bạn đã điểm danh thành công (trễ giờ)"
          : "Bạn đã điểm danh thành công",
      });

      setAttendanceCode("");
    } catch (error: any) {
      toast({
        title: "❌ Điểm danh thất bại",
        description: error.message || "Mã điểm danh không đúng hoặc đã hết hạn",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAttendanceStatusBadge = (
    status: AttendanceStatus,
    isLate: boolean,
  ) => {
    if (status === "PRESENT") {
      return (
        <Badge className={isLate ? "bg-yellow-500" : "bg-green-500"}>
          <CheckCircle className="h-3 w-3 mr-1" />
          {isLate ? "Có mặt (trễ)" : "Có mặt"}
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Vắng mặt
      </Badge>
    );
  };

  const formatTime = (date: Date | string) => {
    return format(new Date(date), "HH:mm dd/MM/yyyy", { locale: vi });
  };

  const isAttendanceEnabled = attendanceInfo?.syllabusItem.attendanceEnabled;
  const userRecord = attendanceInfo?.userAttendanceRecord;
  const hasAttended = !!userRecord;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700"
          disabled={!syllabusItem.attendanceEnabled}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Điểm danh
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Điểm danh
          </DialogTitle>
          <DialogDescription>
            Buổi học: {syllabusItem.classSession?.topic}
          </DialogDescription>
        </DialogHeader>

        {isCheckingInfo ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Đang tải thông tin...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Attendance Status */}
            {hasAttended && (
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    {getAttendanceStatusBadge(
                      userRecord.status,
                      userRecord.isLate,
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Điểm danh lúc: {formatTime(userRecord.checkedInAt)}
                  </div>
                </div>
              </Card>
            )}

            {/* Attendance disabled */}
            {!isAttendanceEnabled && (
              <Card className="p-4 bg-gray-50 border-gray-200">
                <div className="text-center text-gray-600">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Điểm danh chưa được kích hoạt cho buổi học này</p>
                </div>
              </Card>
            )}

            {/* Check-in form */}
            {isAttendanceEnabled && !hasAttended && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="attendance-code">Mã điểm danh</Label>
                  <Input
                    id="attendance-code"
                    placeholder="Nhập mã điểm danh..."
                    value={attendanceCode}
                    onChange={(e) =>
                      setAttendanceCode(e.target.value.toUpperCase())
                    }
                    className="text-center text-lg font-mono"
                    maxLength={8}
                  />
                </div>

                {attendanceInfo?.syllabusItem.attendanceEndTime && (
                  <div className="text-sm text-gray-600 text-center">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Hạn điểm danh:{" "}
                    {formatTime(attendanceInfo.syllabusItem.attendanceEndTime)}
                  </div>
                )}
              </div>
            )}

            {/* Already attended message */}
            {isAttendanceEnabled && hasAttended && (
              <div className="text-center text-gray-600">
                <p>Bạn đã hoàn thành điểm danh cho buổi học này</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Đóng
          </Button>
          {isAttendanceEnabled && !hasAttended && (
            <Button
              onClick={handleCheckIn}
              disabled={isLoading || !attendanceCode.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang điểm danh...
                </>
              ) : (
                "Điểm danh"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
