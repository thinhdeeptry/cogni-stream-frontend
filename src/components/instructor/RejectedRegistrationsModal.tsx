"use client";

import {
  InstructorRegistration,
  RegistrationStatus,
} from "@/types/instructor/types";
import { CheckCircle, Clock, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AllRegistrationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrations: InstructorRegistration[];
}

export function RejectedRegistrationsModal({
  open,
  onOpenChange,
  registrations,
}: AllRegistrationsModalProps) {
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
            Bị từ chối
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Sắp xếp theo ngày gửi, mới nhất trước
  const sortedRegistrations = [...registrations].sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Các đơn đăng ký của bạn</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">STT</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày xét duyệt</TableHead>
                <TableHead>Ghi chú</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRegistrations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    Chưa có đơn đăng ký nào
                  </TableCell>
                </TableRow>
              ) : (
                sortedRegistrations.map((reg, index) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>{formatDate(reg.submittedAt)}</TableCell>
                    <TableCell>{getStatusBadge(reg.status)}</TableCell>
                    <TableCell>
                      {reg.reviewedAt ? formatDate(reg.reviewedAt) : "-"}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      {reg.status === RegistrationStatus.REJECTED &&
                      reg.rejectionReason ? (
                        <span className="text-sm text-red-600">
                          {reg.rejectionReason}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
