"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  InstructorRegistration,
  RegistrationStatus,
} from "@/types/instructor/types";
import { Loader2 } from "lucide-react";

import {
  getInstructorRegistrationById,
  updateInstructorRegistration,
} from "@/actions/instructorRegistrationAction";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function InstructorRegistrationDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InstructorRegistration | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Lấy chi tiết đăng ký
  useEffect(() => {
    if (!id || Array.isArray(id)) return;
    setLoading(true);
    getInstructorRegistrationById(id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // Chấp nhận
  const handleAccept = async () => {
    if (!data || !confirm("Bạn có chắc muốn chấp nhận đăng ký này?")) return;
    setActionLoading(true);
    try {
      await updateInstructorRegistration(data.id, {
        status: RegistrationStatus.APPROVED,
      });
      alert("Đã chấp nhận thành công");
      router.push("/instructors");
    } catch (err) {
      console.error(err);
      alert("Xảy ra lỗi khi chấp nhận");
    } finally {
      setActionLoading(false);
    }
  };

  // Từ chối
  const handleReject = async () => {
    if (!data) return;
    const confirmed = confirm("Bạn có chắc muốn từ chối đăng ký này?");
    if (!confirmed) return;

    const reason = prompt("Nhập lý do từ chối:");
    if (!reason) return;

    setActionLoading(true);
    try {
      await updateInstructorRegistration(data.id, {
        status: RegistrationStatus.REJECTED,
        rejectionReason: reason,
      });
      alert("Đã từ chối thành công");
      router.push("/instructors");
    } catch (err) {
      console.error(err);
      alert("Xảy ra lỗi khi từ chối");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div>Không tìm thấy dữ liệu</div>;
  }

  return (
    <div className="space-y-6">
      {/* Thông tin chung của user */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin người dùng</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback>{data.user.name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-lg">{data.user.name}</p>
            <p className="text-sm text-muted-foreground">{data.user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Thông tin đăng ký */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin đăng ký</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="font-semibold">Tiêu đề:</p>
            <p>{data.headline ?? "-"}</p>
          </div>
          <div>
            <p className="font-semibold">Trạng thái:</p>
            <p className="capitalize">{data.status}</p>
          </div>
          <div>
            <p className="font-semibold">Ngày đăng ký:</p>
            <p>{new Date(data.submittedAt).toLocaleString()}</p>
          </div>
          {data.rejectionReason && (
            <div>
              <p className="font-semibold">Lý do từ chối:</p>
              <p>{data.rejectionReason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Nút hành động */}
      <div className="flex gap-4">
        <Button
          disabled={
            actionLoading || data.status === RegistrationStatus.APPROVED
          }
          onClick={handleAccept}
          className="bg-green-600 hover:bg-green-700"
        >
          Chấp nhận
        </Button>
        <Button
          disabled={
            actionLoading || data.status === RegistrationStatus.REJECTED
          }
          variant="destructive"
          onClick={handleReject}
        >
          Từ chối
        </Button>
      </div>
    </div>
  );
}
