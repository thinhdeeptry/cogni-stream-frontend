"use client";

import { useEffect, useState } from "react";

import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  createAttendanceCode,
  deactivateAttendanceCode,
  getAttendanceStats,
} from "@/actions/attendanceActions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttendanceManagerProps {
  syllabusItemId: string;
  instructorId: string;
  isLiveSession: boolean;
  sessionTopic: string;
}

interface AttendanceStats {
  totalEnrolled: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  attendanceRate: number;
}

export default function AttendanceManager({
  syllabusItemId,
  instructorId,
  isLiveSession,
  sessionTopic,
}: AttendanceManagerProps) {
  const [attendanceCode, setAttendanceCode] = useState<string>("");
  const [isCodeActive, setIsCodeActive] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [codeMode, setCodeMode] = useState<"manual" | "auto">("auto");
  const [customCode, setCustomCode] = useState("");
  const [expireDuration, setExpireDuration] = useState("30");
  const [isLoading, setIsLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Workflow Step 1: Kiểm tra trạng thái điểm danh hiện tại
  useEffect(() => {
    checkCurrentAttendanceStatus();
  }, [syllabusItemId]);

  const checkCurrentAttendanceStatus = async () => {
    // TODO: Gọi API để kiểm tra xem có mã điểm danh active không
    // Nếu có thì set state tương ứng
  };

  // Workflow Step 2: Tạo mã điểm danh
  const handleCreateCode = async () => {
    if (codeMode === "manual" && !customCode.trim()) {
      toast.error("Vui lòng nhập mã điểm danh");
      return;
    }

    setIsLoading(true);
    try {
      const minutes = parseInt(expireDuration);
      const expirationTime = new Date(Date.now() + minutes * 60 * 1000);

      const result = await createAttendanceCode({
        syllabusItemId,
        code: codeMode === "manual" ? customCode.toUpperCase() : undefined,
        expiresAt: expirationTime,
      });

      if (result.success) {
        setAttendanceCode(result.data.code);
        setIsCodeActive(true);
        setExpiresAt(expirationTime);
        setShowCode(true);
        toast.success("Đã tạo mã điểm danh thành công!");
      } else {
        toast.error(result.message || "Không thể tạo mã điểm danh");
      }
    } catch (error) {
      toast.error("Lỗi khi tạo mã điểm danh");
    } finally {
      setIsLoading(false);
    }
  };

  // Workflow Step 3: Đóng mã điểm danh
  const handleDeactivateCode = async () => {
    setIsLoading(true);
    try {
      const result = await deactivateAttendanceCode(syllabusItemId);

      if (result.success) {
        setIsCodeActive(false);
        setAttendanceCode("");
        setExpiresAt(null);
        setShowCode(false);
        toast.success("Đã đóng điểm danh");
      } else {
        toast.error(result.message || "Không thể đóng điểm danh");
      }
    } catch (error) {
      toast.error("Lỗi khi đóng điểm danh");
    } finally {
      setIsLoading(false);
    }
  };

  // Workflow Step 4: Xem thống kê điểm danh
  const handleViewStats = async () => {
    try {
      const result = await getAttendanceStats(syllabusItemId);
      if (result.success) {
        setStats(result.data);
        setIsStatsOpen(true);
      }
    } catch (error) {
      toast.error("Không thể tải thống kê điểm danh");
    }
  };

  // Không hiển thị nếu không phải buổi live
  if (!isLiveSession) return null;

  return (
    <Card className="border-l-4 border-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <span>Điểm danh: {sessionTopic}</span>
          </div>
          <Badge variant={isCodeActive ? "default" : "secondary"}>
            {isCodeActive ? "Đang mở" : "Chưa mở"}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isCodeActive ? (
          // Form tạo mã điểm danh
          <>
            {/* Chế độ tạo mã */}
            <div className="space-y-2">
              <Label>Chế độ tạo mã</Label>
              <div className="flex gap-2">
                <Button
                  variant={codeMode === "auto" ? "default" : "outline"}
                  onClick={() => setCodeMode("auto")}
                  size="sm"
                >
                  Tự động
                </Button>
                <Button
                  variant={codeMode === "manual" ? "default" : "outline"}
                  onClick={() => setCodeMode("manual")}
                  size="sm"
                >
                  Tự nhập
                </Button>
              </div>
            </div>

            {/* Input mã nếu chọn manual */}
            {codeMode === "manual" && (
              <div className="space-y-2">
                <Label>Mã điểm danh</Label>
                <Input
                  placeholder="VD: ABC123"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  maxLength={8}
                />
              </div>
            )}

            {/* Thời gian hết hạn */}
            <div className="space-y-2">
              <Label>Thời gian hết hạn</Label>
              <Select value={expireDuration} onValueChange={setExpireDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 phút</SelectItem>
                  <SelectItem value="30">30 phút</SelectItem>
                  <SelectItem value="60">60 phút</SelectItem>
                  <SelectItem value="120">2 giờ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nút tạo mã */}
            <Button
              onClick={handleCreateCode}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo mã điểm danh"
              )}
            </Button>
          </>
        ) : (
          // Hiển thị mã đang active
          <div className="space-y-4">
            {/* Mã điểm danh */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-center space-y-2">
                <p className="text-sm text-green-600">Mã điểm danh:</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold text-green-800 font-mono">
                    {showCode ? attendanceCode : "••••••"}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCode(!showCode)}
                  >
                    {showCode ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {expiresAt && (
                  <p className="text-xs text-green-600">
                    Hết hạn: {expiresAt.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDeactivateCode}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang đóng...
                  </>
                ) : (
                  "Đóng điểm danh"
                )}
              </Button>

              {/* Nút xem thống kê */}
              <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handleViewStats}>
                    <Users className="h-4 w-4 mr-2" />
                    Thống kê
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thống kê điểm danh</DialogTitle>
                  </DialogHeader>
                  {stats && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {stats.totalEnrolled}
                          </p>
                          <p className="text-sm text-blue-600">Tổng HV</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {stats.presentCount}
                          </p>
                          <p className="text-sm text-green-600">Có mặt</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-yellow-600">
                            {stats.lateCount}
                          </p>
                          <p className="text-sm text-yellow-600">Trễ</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-red-600">
                            {stats.absentCount}
                          </p>
                          <p className="text-sm text-red-600">Vắng</p>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-xl font-bold text-gray-700">
                          {stats.attendanceRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-600">Tỷ lệ điểm danh</p>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
