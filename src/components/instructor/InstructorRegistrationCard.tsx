"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useInstructorRegistrationStatus } from "@/hooks/useInstructorRegistrationStatus";
import { RegistrationStatus } from "@/types/instructor/types";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  GraduationCap,
  History,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { RejectedRegistrationsModal } from "./RejectedRegistrationsModal";

export function InstructorRegistrationCard() {
  const router = useRouter();
  const {
    loading,
    registration,
    allUserRegistrations,
    canApply,
    isInstructor,
  } = useInstructorRegistrationStatus();
  const [showRejectedModal, setShowRejectedModal] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Trở thành giảng viên
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isInstructor) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Giảng viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600 mb-4">
            Bạn đã là giảng viên trên nền tảng. Hãy tạo khóa học để chia sẻ kiến
            thức!
          </p>
          <Button
            onClick={() => router.push("/instructor/courses")}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Quản lý khóa học
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (registration) {
    const getStatusColor = (status: RegistrationStatus) => {
      switch (status) {
        case RegistrationStatus.PENDING:
          return "bg-yellow-50 border-yellow-200";
        case RegistrationStatus.APPROVED:
          return "bg-green-50 border-green-200";
        case RegistrationStatus.REJECTED:
          return "bg-red-50 border-red-200";
      }
    };

    const getStatusBadge = (status: RegistrationStatus) => {
      switch (status) {
        case RegistrationStatus.PENDING:
          return (
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800"
            >
              <Clock className="w-3 h-3 mr-1" />
              Đang chờ duyệt
            </Badge>
          );
        case RegistrationStatus.APPROVED:
          return (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Đã được chấp nhận
            </Badge>
          );
        case RegistrationStatus.REJECTED:
          return (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              <XCircle className="w-3 h-3 mr-1" />
              Đã bị từ chối
            </Badge>
          );
      }
    };

    const getStatusMessage = (status: RegistrationStatus) => {
      switch (status) {
        case RegistrationStatus.PENDING:
          return "Đơn đăng ký của bạn đang được xem xét. Chúng tôi sẽ phản hồi trong vòng 3-5 ngày làm việc.";
        case RegistrationStatus.APPROVED:
          return "Chúc mừng! Đơn đăng ký của bạn đã được chấp nhận. Bạn sẽ sớm có quyền tạo khóa học.";
        case RegistrationStatus.REJECTED:
          return (
            registration.rejectionReason ||
            "Đơn đăng ký của bạn đã bị từ chối. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết."
          );
      }
    };

    return (
      <Card className={getStatusColor(registration.status)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Đăng ký giảng viên
            </CardTitle>
            {getStatusBadge(registration.status)}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">
            {getStatusMessage(registration.status)}
          </p>

          <div className="space-y-2 text-sm text-slate-500">
            <p>
              Ngày đăng ký:{" "}
              {new Date(registration.submittedAt).toLocaleDateString("vi-VN")}
            </p>
            {registration.reviewedAt && (
              <p>
                Ngày xét duyệt:{" "}
                {new Date(registration.reviewedAt).toLocaleDateString("vi-VN")}
              </p>
            )}
          </div>

          {registration.status === RegistrationStatus.REJECTED && (
            <Button
              onClick={() => router.push("/instructor/apply")}
              className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
            >
              Đăng ký lại
            </Button>
          )}

          {allUserRegistrations.length > 0 && (
            <Button
              onClick={() => setShowRejectedModal(true)}
              variant="outline"
              className="w-full mt-2"
            >
              <History className="w-4 h-4 mr-2" />
              Xem các đơn đăng ký của bạn
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (canApply) {
    return (
      <>
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <GraduationCap className="h-5 w-5" />
              Trở thành giảng viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-600 mb-4">
              Chia sẻ kiến thức và kinh nghiệm của bạn với hàng nghìn học viên
              trên nền tảng.
            </p>

            <div className="mb-4 space-y-2 text-sm text-orange-700">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Tạo và bán khóa học trực tuyến</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Nhận hoa hồng từ học viên đăng ký</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>Xây dựng thương hiệu cá nhân</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => router.push("/instructor/apply")}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                Đăng ký ngay
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {allUserRegistrations.length > 0 && (
                <Button
                  onClick={() => setShowRejectedModal(true)}
                  variant="outline"
                  className="w-full"
                >
                  <History className="w-4 h-4 mr-2" />
                  Xem các đơn đăng ký của bạn
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <RejectedRegistrationsModal
          open={showRejectedModal}
          onOpenChange={setShowRejectedModal}
          registrations={allUserRegistrations}
        />
      </>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-700">
          <AlertCircle className="h-5 w-5" />
          Giảng viên
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600">
          Hiện tại bạn chưa thể đăng ký làm giảng viên. Vui lòng liên hệ hỗ trợ
          nếu cần hỗ trợ.
        </p>
      </CardContent>
    </Card>
  );
}
