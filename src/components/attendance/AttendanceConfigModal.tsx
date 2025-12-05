"use client";

import React, { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import type {
  AttendanceCode,
  AttendanceRecord,
  AttendanceReport,
  CreateAttendanceCodeRequest,
} from "@/types/attendance";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  Plus,
  QrCode,
  RotateCcw,
  Settings,
  Timer,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";

import {
  createAttendanceCode,
  deactivateAttendanceCode,
  getAttendanceCodesBySyllabusItem,
  getAttendanceStats,
  getCurrentAttendanceCode,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AttendanceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  syllabusItemId: string;
  instructorId: string;
  sessionTopic?: string;
  isLiveSession?: boolean;
  userRole?: "INSTRUCTOR" | "ADMIN"; // Thêm prop userRole
}

export function AttendanceConfigModal({
  isOpen,
  onClose,
  syllabusItemId,
  instructorId,
  sessionTopic = "Buổi học",
  isLiveSession = false,
  userRole = "INSTRUCTOR",
}: AttendanceConfigModalProps) {
  const [activeTab, setActiveTab] = useState("create");
  const [isLoading, setIsLoading] = useState(false);
  const [attendanceReport, setAttendanceReport] =
    useState<AttendanceReport | null>(null);
  const [currentCode, setCurrentCode] = useState<AttendanceCode | null>(null);
  const [attendanceCodes, setAttendanceCodes] = useState<AttendanceCode[]>([]);

  // Create form state
  const [autoExpire, setAutoExpire] = useState(true);
  const [expirationMinutes, setExpirationMinutes] = useState(30);
  const [customExpirationTime, setCustomExpirationTime] = useState("");

  // Copy code state
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch attendance data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAttendanceReport();
      fetchAttendanceCodes();
    }
  }, [isOpen, syllabusItemId]);

  const fetchAttendanceCodes = async () => {
    try {
      const result = await getAttendanceCodesBySyllabusItem(syllabusItemId);
      if (result.success) {
        setAttendanceCodes(result.data);
        // Tìm mã đang hoạt động
        const activeCode = result.data.find(
          (code: AttendanceCode) => code.isActive,
        );
        setCurrentCode(activeCode || null);
      }
    } catch (error) {
      console.error("Error fetching attendance codes:", error);
    }
  };

  const fetchAttendanceReport = async () => {
    try {
      setIsLoading(true);

      // Get current attendance code
      const currentCodeResult = await getCurrentAttendanceCode(syllabusItemId);

      // Get attendance stats
      const statsResult = await getAttendanceStats(syllabusItemId);
      console.log("statsResult", statsResult);
      if (currentCodeResult.success && currentCodeResult.data) {
        setCurrentCode(currentCodeResult.data);
      } else {
        setCurrentCode(null);
      }

      if (statsResult.success && statsResult.data) {
        setAttendanceReport(statsResult.data);
      } else {
        // Fallback for no data
        setAttendanceReport({
          syllabusItem: {
            id: syllabusItemId,
            day: 1,
            order: 1,
            itemType: isLiveSession ? "LIVE_SESSION" : "LESSON",
            classSession: isLiveSession
              ? {
                  topic: sessionTopic,
                  scheduledTime: new Date(),
                }
              : undefined,
          },
          codes: [],
          report: [],
          stats: {
            totalStudents: 0,
            presentCount: 0,
            lateCount: 0,
            absentCount: 0,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching attendance report:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin điểm danh",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCode = async () => {
    try {
      setIsLoading(true);

      const requestData = {
        syllabusItemId,
        expiresAt: autoExpire
          ? new Date(Date.now() + expirationMinutes * 60 * 1000)
          : customExpirationTime
            ? new Date(customExpirationTime)
            : undefined,
      };

      const result = await createAttendanceCode(requestData);

      if (!result.success) {
        throw new Error(result.message || "Không thể tạo mã điểm danh");
      }

      setCurrentCode(result.data);
      setActiveTab("manage");

      toast({
        title: "✅ Tạo mã điểm danh thành công",
        description: `Mã điểm danh: ${result.data?.code || "Đã tạo thành công"}`,
      });

      // Refresh data
      await fetchAttendanceReport();
      await fetchAttendanceCodes();
    } catch (error: any) {
      console.error("Error creating attendance code:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo mã điểm danh",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateExpiration = async (newMinutes: number) => {
    if (!currentCode) return;

    try {
      setIsLoading(true);

      const newExpirationTime = new Date(Date.now() + newMinutes * 60 * 1000);

      // For now, create a new code since we don't have update API yet
      // TODO: Use update API when available
      const result = await createAttendanceCode({
        syllabusItemId,
        expiresAt: newExpirationTime,
      });

      if (!result.success) {
        throw new Error(result.message || "Không thể cập nhật thời hạn");
      }

      setCurrentCode(result.data);

      toast({
        title: "✅ Cập nhật thành công",
        description: `Gia hạn thêm ${newMinutes} phút`,
      });

      // Refresh data
      await fetchAttendanceReport();
      await fetchAttendanceCodes();
    } catch (error: any) {
      console.error("Error updating attendance code:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật thời hạn",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateCode = async () => {
    if (!currentCode) return;

    try {
      setIsLoading(true);

      const result = await deactivateAttendanceCode(syllabusItemId);

      if (!result.success) {
        throw new Error(result.message || "Không thể dừng điểm danh");
      }

      setCurrentCode(null);

      toast({
        title: "✅ Đã dừng điểm danh",
        description: "Mã điểm danh đã được vô hiệu hóa",
      });

      // Refresh data
      await fetchAttendanceReport();
      await fetchAttendanceCodes();
    } catch (error: any) {
      console.error("Error deactivating attendance code:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể dừng điểm danh",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      toast({
        title: "📋 Đã sao chép",
        description: "Mã điểm danh đã được sao chép vào clipboard",
      });
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể sao chép mã",
        variant: "destructive",
      });
    }
  };

  const isCodeExpired = (code: AttendanceCode) => {
    return code.expiresAt && new Date(code.expiresAt) < new Date();
  };

  const formatTimeRemaining = (expiresAt: Date | null) => {
    if (!expiresAt) return "Không giới hạn";

    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs <= 0) return "Đã hết hạn";

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m`;
    }
    return `${diffMinutes}m`;
  };
  console.log("att report", attendanceReport);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Quản lý điểm danh - {sessionTopic}
            {userRole === "ADMIN" && (
              <Badge variant="outline" className="text-purple-600 ml-2">
                Quản trị viên
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Tạo mã điểm danh cho học viên hoặc xem danh sách đã điểm danh
            {userRole === "ADMIN" && " (Chế độ quản trị)"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tạo mới
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Quản lý
            </TabsTrigger>
            <TabsTrigger value="view" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Danh sách
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Lịch sử
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Tạo mã điểm danh mới
                </CardTitle>
                <CardDescription>
                  {currentCode
                    ? "Đã có mã điểm danh đang hoạt động"
                    : "Tạo mã điểm danh cho buổi học này"}
                  {userRole === "ADMIN" && " (Admin Mode)"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentCode ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">
                        Đã có mã điểm danh đang hoạt động
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Mã:{" "}
                      <span className="font-mono font-bold">
                        {currentCode.code}
                      </span>
                    </p>
                    <p className="text-sm text-yellow-700">
                      Thời hạn: {formatTimeRemaining(currentCode.expiresAt)}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-expire"
                        checked={autoExpire}
                        onCheckedChange={setAutoExpire}
                      />
                      <Label htmlFor="auto-expire">Tự động hết hạn</Label>
                    </div>

                    {autoExpire ? (
                      <div>
                        <Label htmlFor="expiration-minutes">
                          Thời gian có hiệu lực (phút)
                        </Label>
                        <Input
                          id="expiration-minutes"
                          type="number"
                          value={expirationMinutes}
                          onChange={(e) =>
                            setExpirationMinutes(Number(e.target.value))
                          }
                          min="5"
                          max="180"
                          className="w-full"
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          Mã sẽ hết hạn sau {expirationMinutes} phút
                        </p>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="custom-expiration">
                          Thời gian hết hạn
                        </Label>
                        <Input
                          id="custom-expiration"
                          type="datetime-local"
                          value={customExpirationTime}
                          onChange={(e) =>
                            setCustomExpirationTime(e.target.value)
                          }
                          className="w-full"
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleCreateCode}
                      disabled={
                        isLoading || (!autoExpire && !customExpirationTime)
                      }
                      className="w-full"
                    >
                      {isLoading ? "Đang tạo..." : "Tạo mã điểm danh"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="space-y-6">
            {currentCode ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Mã điểm danh hiện tại
                  </CardTitle>
                  <CardDescription>
                    Quản lý mã điểm danh đang hoạt động
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Code Display */}
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div className="text-center space-y-4">
                      <div className="text-4xl font-mono font-bold text-blue-900 tracking-wider">
                        {currentCode.code}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleCopyCode(currentCode.code)}
                        className="flex items-center gap-2"
                      >
                        {copiedCode ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copiedCode ? "Đã sao chép" : "Sao chép mã"}
                      </Button>
                    </div>
                  </div>

                  {/* Code Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-700 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Trạng thái</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCodeExpired(currentCode) ? (
                          <Badge variant="destructive">Đã hết hạn</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            Đang hoạt động
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-700 mb-1">
                        <Timer className="h-4 w-4" />
                        <span className="font-medium">Thời gian còn lại</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatTimeRemaining(currentCode.expiresAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateExpiration(15)}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Gia hạn 15 phút
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateExpiration(30)}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Gia hạn 30 phút
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeactivateCode}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Dừng điểm danh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <QrCode className="h-12 w-12 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Chưa có mã điểm danh
                  </h3>
                  <p className="text-center mb-4">
                    Chuyển sang tab "Tạo mới" để tạo mã điểm danh
                  </p>
                  <Button
                    onClick={() => setActiveTab("create")}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo mã điểm danh
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="view" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Danh sách điểm danh
                </CardTitle>
                <CardDescription>
                  Xem học viên đã điểm danh cho buổi học này
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceReport ? (
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-900">
                          {attendanceReport.stats.totalStudents}
                        </div>
                        <p className="text-sm text-blue-700">
                          Tổng số học viên
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-900">
                          {attendanceReport.stats.presentCount}
                        </div>
                        <p className="text-sm text-green-700">Đã điểm danh</p>
                      </div>
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-900">
                          {attendanceReport.stats.lateCount}
                        </div>
                        <p className="text-sm text-yellow-700">
                          Điểm danh muộn
                        </p>
                      </div>
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-900">
                          {attendanceReport.stats.absentCount}
                        </div>
                        <p className="text-sm text-red-700">Vắng mặt</p>
                      </div>
                    </div>

                    {/* Attendance List */}
                    {attendanceReport &&
                    attendanceReport.report &&
                    attendanceReport.report.length > 0 ? (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                Học viên
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                Trạng thái
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                Thời gian
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {attendanceReport.report.map((record) => (
                              <tr key={record.id}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                  {record.student?.name || "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {record.student?.email || "N/A"}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <Badge
                                    className={
                                      record.status === "PRESENT"
                                        ? "bg-green-100 text-green-800"
                                        : record.status === "LATE"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {record.status === "PRESENT"
                                      ? "Có mặt"
                                      : record.status === "LATE"
                                        ? "Muộn"
                                        : "Vắng mặt"}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {format(
                                    new Date(record.attendedAt),
                                    "HH:mm:ss dd/MM/yyyy",
                                    { locale: vi },
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          Chưa có học viên nào điểm danh
                        </h3>
                        <p>Danh sách sẽ được cập nhật khi học viên điểm danh</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-4"></div>
                    <p>Đang tải dữ liệu...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Lịch sử mã điểm danh
                </CardTitle>
                <CardDescription>
                  Xem tất cả mã điểm danh đã tạo cho buổi học này
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceCodes.length > 0 ? (
                  <div className="space-y-4">
                    {attendanceCodes.map((code) => (
                      <div
                        key={code.id}
                        className={`border rounded-lg p-4 ${
                          code.isActive
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                code.isActive ? "bg-green-100" : "bg-gray-100"
                              }`}
                            >
                              <QrCode
                                className={`h-4 w-4 ${
                                  code.isActive
                                    ? "text-green-600"
                                    : "text-gray-600"
                                }`}
                              />
                            </div>
                            <div>
                              <div className="font-mono text-lg font-semibold">
                                {code.code}
                              </div>
                              <div className="text-sm text-gray-600">
                                Tạo:{" "}
                                {format(
                                  new Date(code.createdAt),
                                  "dd/MM/yyyy 'lúc' HH:mm",
                                  { locale: vi },
                                )}
                              </div>
                              {code.expiresAt && (
                                <div className="text-sm text-gray-600">
                                  Hết hạn:{" "}
                                  {format(
                                    new Date(code.expiresAt),
                                    "dd/MM/yyyy 'lúc' HH:mm",
                                    { locale: vi },
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={code.isActive ? "default" : "secondary"}
                            >
                              {code.isActive ? "Đang hoạt động" : "Đã kết thúc"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Chưa có mã điểm danh nào được tạo</p>
                    <p className="text-sm mt-2">
                      Chuyển sang tab "Tạo mới" để tạo mã điểm danh đầu tiên
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
