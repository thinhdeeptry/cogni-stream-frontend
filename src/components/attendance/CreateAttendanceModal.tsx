"use client";

import { useState } from "react";

import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Clock, Copy, Eye, QrCode, Trash2, Users } from "lucide-react";

import {
  createAttendanceCode,
  deleteAttendanceCode,
} from "@/actions/attendanceActions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface AttendanceCode {
  id: string;
  code: string;
  syllabusItemId: string;
  teacherId: string;
  isActive: boolean;
  expiresAt: string | null;
  autoExpire: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateAttendanceCodeRequest {
  syllabusItemId: string;
  expiresAt?: string;
  autoExpire?: boolean;
}

interface CreateAttendanceModalProps {
  syllabusItem: any; // Simplified type
  existingCodes: AttendanceCode[];
  onCodeCreated: (code: AttendanceCode) => void;
  onCodeDeleted: (codeId: string) => void;
}

export function CreateAttendanceModal({
  syllabusItem,
  existingCodes,
  onCodeCreated,
  onCodeDeleted,
}: CreateAttendanceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoExpire, setAutoExpire] = useState(true);
  const [customExpireTime, setCustomExpireTime] = useState("");
  const { toast } = useToast();

  const handleCreateCode = async () => {
    setIsLoading(true);
    try {
      const requestData: CreateAttendanceCodeRequest = {
        syllabusItemId: syllabusItem.id,
        autoExpire,
      };

      if (!autoExpire && customExpireTime) {
        requestData.expiresAt = customExpireTime;
      }

      const response = await createAttendanceCode(requestData);

      if (!response.success || !response.data) {
        throw new Error(response.message || "Không thể tạo mã điểm danh");
      }

      onCodeCreated(response.data);

      toast({
        title: "✅ Tạo mã điểm danh thành công",
        description: `Mã điểm danh: ${response.data.code}`,
      });

      setIsOpen(false);
      setCustomExpireTime("");
    } catch (error: any) {
      toast({
        title: "❌ Lỗi tạo mã điểm danh",
        description: error.message || "Không thể tạo mã điểm danh",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    try {
      const response = await deleteAttendanceCode(codeId);

      if (!response.success) {
        throw new Error(response.message || "Không thể xóa mã điểm danh");
      }

      onCodeDeleted(codeId);

      toast({
        title: "✅ Xóa mã điểm danh thành công",
        description: response.message || "Mã điểm danh đã được vô hiệu hóa",
      });
    } catch (error: any) {
      toast({
        title: "❌ Lỗi xóa mã điểm danh",
        description: error.message || "Không thể xóa mã điểm danh",
        variant: "destructive",
      });
    }
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "📋 Đã sao chép",
      description: `Mã điểm danh "${code}" đã được sao chép`,
    });
  };

  const formatExpireTime = (date: string | null) => {
    if (!date) return "Không giới hạn";
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: vi });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <QrCode className="h-4 w-4 mr-2" />
          Tạo điểm danh
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Quản lý điểm danh
          </DialogTitle>
          <DialogDescription>
            Buổi học: {syllabusItem.classSession?.topic}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Codes */}
          {existingCodes.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Mã điểm danh hiện tại
              </h4>
              <div className="space-y-2">
                {existingCodes.map((code) => (
                  <Card key={code.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={code.isActive ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {code.isActive ? "Hoạt động" : "Không hoạt động"}
                          </Badge>
                          <span className="font-mono text-lg font-bold">
                            {code.code}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Hết hạn: {formatExpireTime(code.expiresAt)}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyCodeToClipboard(code.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteCode(code.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Create New Code Form */}
          <div>
            <h4 className="font-medium mb-3">Tạo mã điểm danh mới</h4>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-expire"
                  checked={autoExpire}
                  onCheckedChange={setAutoExpire}
                />
                <Label htmlFor="auto-expire" className="text-sm">
                  Tự động hết hạn theo lịch buổi học
                </Label>
              </div>

              {!autoExpire && (
                <div className="space-y-2">
                  <Label htmlFor="expire-time" className="text-sm">
                    Thời gian hết hạn (tùy chọn)
                  </Label>
                  <Input
                    id="expire-time"
                    type="datetime-local"
                    value={customExpireTime}
                    onChange={(e) => setCustomExpireTime(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Để trống nếu không muốn giới hạn thời gian
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Đóng
          </Button>
          <Button onClick={handleCreateCode} disabled={isLoading}>
            {isLoading ? "Đang tạo..." : "Tạo mã điểm danh"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
