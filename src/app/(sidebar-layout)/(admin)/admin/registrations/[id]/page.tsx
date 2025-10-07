"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useToast } from "@/hooks/use-toast";
import {
  InstructorRegistration,
  RegistrationStatus,
} from "@/types/instructor/types";
import {
  ArrowLeft,
  Award,
  Briefcase,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  User,
  XCircle,
} from "lucide-react";

import {
  getInstructorRegistrationById,
  updateInstructorRegistration,
} from "@/actions/instructorRegistrationAction";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export default function InstructorRegistrationDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InstructorRegistration | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);

  // Lấy chi tiết đăng ký
  useEffect(() => {
    if (!id || Array.isArray(id)) return;
    setLoading(true);
    getInstructorRegistrationById(id)
      .then(setData)
      .catch((error) => {
        console.error(error);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin đăng ký",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [id, toast]);

  // Chấp nhận
  const handleAccept = async () => {
    if (!data) return;

    setActionLoading(true);
    try {
      await updateInstructorRegistration(data.id, {
        status: RegistrationStatus.APPROVED,
      });

      toast({
        title: "Thành công",
        description: "Đã chấp nhận đơn đăng ký thành công",
      });

      // Refresh data
      const updatedData = await getInstructorRegistrationById(data.id);
      setData(updatedData);
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Xảy ra lỗi khi chấp nhận đơn đăng ký",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Từ chối
  const handleReject = async () => {
    if (!data || !rejectionReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      await updateInstructorRegistration(data.id, {
        status: RegistrationStatus.REJECTED,
        rejectionReason: rejectionReason.trim(),
      });

      toast({
        title: "Thành công",
        description: "Đã từ chối đơn đăng ký",
      });

      setIsRejectDialogOpen(false);
      setRejectionReason("");

      // Refresh data
      const updatedData = await getInstructorRegistrationById(data.id);
      setData(updatedData);
    } catch (err) {
      console.error(err);
      toast({
        title: "Lỗi",
        description: "Xảy ra lỗi khi từ chối đơn đăng ký",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case RegistrationStatus.PENDING:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Đang chờ duyệt
          </Badge>
        );
      case RegistrationStatus.APPROVED:
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Đã chấp nhận
          </Badge>
        );
      case RegistrationStatus.REJECTED:
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Đã từ chối
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Không tìm thấy dữ liệu</h3>
          <p className="text-slate-600">
            Đơn đăng ký không tồn tại hoặc đã bị xóa
          </p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">
            Chi tiết đơn đăng ký giảng viên
          </h1>
          <p className="text-slate-600">
            Xem xét thông tin và quyết định phê duyệt
          </p>
        </div>
        {getStatusBadge(data.status)}
      </div>

      {/* Thông tin người dùng */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-orange-500" />
            Thông tin người dùng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl bg-orange-100 text-orange-600">
                {data.user.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xl font-semibold">{data.user.name}</h3>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-4 w-4" />
                  {data.user.email}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                Đăng ký lúc:{" "}
                {new Date(data.submittedAt).toLocaleString("vi-VN")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thông tin chuyên môn */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-500" />
            Thông tin chuyên môn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.headline && (
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Tiêu đề chuyên môn
              </Label>
              <p className="mt-1 text-slate-900">{data.headline}</p>
            </div>
          )}

          {data.specialization && (
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Lĩnh vực chuyên môn
              </Label>
              <p className="mt-1 text-slate-900">{data.specialization}</p>
            </div>
          )}

          {data.experience_years !== undefined && (
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Số năm kinh nghiệm
              </Label>
              <p className="mt-1 text-slate-900">{data.experience_years} năm</p>
            </div>
          )}

          {data.bio && (
            <div>
              <Label className="text-sm font-medium text-slate-700">
                Giới thiệu bản thân
              </Label>
              <div className="mt-1 p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-900 whitespace-pre-wrap">{data.bio}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chứng chỉ và Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chứng chỉ */}
        {data.qualifications && data.qualifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                Chứng chỉ & Bằng cấp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.qualifications.map((qualification, index) => {
                  const isGoogleDriveFile =
                    qualification.includes("drive.google.com");
                  const isImageFile = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                    qualification,
                  );
                  const isPdfFile =
                    /\.pdf$/i.test(qualification) ||
                    qualification.includes("application/pdf");

                  return (
                    <a
                      key={index}
                      href={qualification}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {isGoogleDriveFile ? (
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                        ) : isPdfFile ? (
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <FileText className="h-4 w-4 text-red-600" />
                          </div>
                        ) : isImageFile ? (
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                            <ExternalLink className="h-4 w-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                            <ExternalLink className="h-4 w-4 text-slate-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-700 truncate block">
                          {isGoogleDriveFile
                            ? `Chứng chỉ ${index + 1} (Google Drive)`
                            : isPdfFile
                              ? `Chứng chỉ ${index + 1} (PDF)`
                              : isImageFile
                                ? `Chứng chỉ ${index + 1} (Hình ảnh)`
                                : `Chứng chỉ ${index + 1}`}
                        </span>
                        <span className="text-xs text-slate-500 truncate block">
                          {qualification.length > 50
                            ? `${qualification.substring(0, 50)}...`
                            : qualification}
                        </span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio */}
        {data.portfolio_links && data.portfolio_links.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-orange-500" />
                Portfolio & Dự án
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.portfolio_links.map((link, index) => {
                  const isGoogleDriveFile = link.includes("drive.google.com");
                  const isGithub = link.includes("github.com");
                  const isLinkedIn = link.includes("linkedin.com");
                  const isImageFile = /\.(jpg|jpeg|png|gif|webp)$/i.test(link);

                  return (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {isGithub ? (
                          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-gray-600" />
                          </div>
                        ) : isLinkedIn ? (
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                        ) : isGoogleDriveFile ? (
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                        ) : isImageFile ? (
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                            <ExternalLink className="h-4 w-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                            <ExternalLink className="h-4 w-4 text-orange-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-slate-700 truncate block">
                          {isGithub
                            ? "GitHub Repository"
                            : isLinkedIn
                              ? "LinkedIn Profile"
                              : isGoogleDriveFile
                                ? `Portfolio ${index + 1} (Google Drive)`
                                : isImageFile
                                  ? `Portfolio ${index + 1} (Hình ảnh)`
                                  : `Portfolio ${index + 1}`}
                        </span>
                        <span className="text-xs text-slate-500 truncate block">
                          {link.length > 50
                            ? `${link.substring(0, 50)}...`
                            : link}
                        </span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Thông tin xét duyệt */}
      {(data.status !== RegistrationStatus.PENDING || data.rejectionReason) && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin xét duyệt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.reviewedAt && (
              <div>
                <Label className="text-sm font-medium text-slate-700">
                  Thời gian xét duyệt
                </Label>
                <p className="mt-1 text-slate-900">
                  {new Date(data.reviewedAt).toLocaleString("vi-VN")}
                </p>
              </div>
            )}

            {data.reviewer && (
              <div>
                <Label className="text-sm font-medium text-slate-700">
                  Người xét duyệt
                </Label>
                <p className="mt-1 text-slate-900">{data.reviewer.name}</p>
              </div>
            )}

            {data.rejectionReason && (
              <div>
                <Label className="text-sm font-medium text-slate-700">
                  Lý do từ chối
                </Label>
                <div className="mt-1 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-900">{data.rejectionReason}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Nút hành động */}
      {data.status === RegistrationStatus.PENDING && (
        <Card className="bg-slate-50">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button
                disabled={actionLoading}
                onClick={handleAccept}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Chấp nhận
              </Button>

              <Dialog
                open={isRejectDialogOpen}
                onOpenChange={setIsRejectDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    disabled={actionLoading}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Từ chối
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Từ chối đơn đăng ký</DialogTitle>
                    <DialogDescription>
                      Vui lòng nhập lý do từ chối để gửi phản hồi cho ứng viên.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="rejection-reason">Lý do từ chối *</Label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="Nhập lý do từ chối chi tiết..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="min-h-[100px] mt-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsRejectDialogOpen(false)}
                        className="flex-1"
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleReject}
                        disabled={!rejectionReason.trim() || actionLoading}
                        variant="destructive"
                        className="flex-1"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Xác nhận từ chối
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
