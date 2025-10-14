"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  X,
} from "lucide-react";

import {
  type PendingPricesResponse,
  approveCoursePrice,
  getPendingPrices,
  rejectCoursePrice,
} from "@/actions/approvalActions";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

// Common rejection reasons for prices
const priceReasons = [
  "Giá quá cao so với thị trường",
  "Giá không phù hợp với chất lượng nội dung",
  "Mức giá không cạnh tranh",
  "Thiếu cơ sở để đánh giá giá trị",
  "Nội dung chưa đủ để justify giá này",
  "Giá cần điều chỉnh theo segment khách hàng",
];

// Reject Modal Component
interface RejectPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  price: any;
  onSubmit: (reason: string) => void;
}

const RejectPriceModal: React.FC<RejectPriceModalProps> = ({
  isOpen,
  onClose,
  price,
  onSubmit,
}) => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const allReasons = [...selectedReasons];
    if (customReason.trim()) {
      allReasons.push(customReason.trim());
    }

    if (allReasons.length === 0) {
      toast({
        title: "Cần nhập lý do",
        description: "Vui lòng chọn hoặc nhập lý do từ chối",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const finalReason = allReasons.join("\n• ");
      await onSubmit(finalReason);

      // Reset and close
      setSelectedReasons([]);
      setCustomReason("");
      onClose();
    } catch (error) {
      // Error handled in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Từ chối giá khóa học: {price?.course?.title}
          </DialogTitle>
          <DialogDescription>
            Giá hiện tại: {Number(price?.price || 0).toLocaleString()} VND
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick reasons */}
          <div className="space-y-3">
            <Label>Chọn lý do từ chối giá:</Label>
            <div className="grid grid-cols-1 gap-2">
              {priceReasons.map((reason, index) => (
                <label
                  key={index}
                  className="flex items-start space-x-2 p-2 border rounded hover:bg-slate-50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedReasons.includes(reason)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedReasons([...selectedReasons, reason]);
                      } else {
                        setSelectedReasons(
                          selectedReasons.filter((r) => r !== reason),
                        );
                      }
                    }}
                  />
                  <span className="text-sm">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom reason */}
          <div className="space-y-2">
            <Label htmlFor="customReason">Lý do khác:</Label>
            <Textarea
              id="customReason"
              placeholder="Nhập lý do cụ thể..."
              value={customReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setCustomReason(e.target.value)
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isSubmitting ? "Đang xử lý..." : "Từ chối giá"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Price Detail Modal Component
const PriceDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  price: any;
}> = ({ isOpen, onClose, price }) => {
  if (!price) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Chi tiết giá: {price.course?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Thông tin giá</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Giá đề xuất:</strong>{" "}
                  <span className="text-lg font-semibold text-green-600">
                    {Number(price.price).toLocaleString()} VND
                  </span>
                </p>
                <p>
                  <strong>Trạng thái:</strong>{" "}
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Chờ duyệt
                  </Badge>
                </p>
                <p>
                  <strong>Ngày gửi:</strong>{" "}
                  {new Date(price.submittedAt).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Thông tin giảng viên</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={price.instructor?.image} />
                    <AvatarFallback>
                      {price.instructor?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{price.instructor?.name}</p>
                    <p className="text-xs text-slate-500">
                      {price.instructor?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Thông tin khóa học</h4>
            <div className="bg-slate-50 p-3 rounded space-y-2">
              <p>
                <strong>Tên khóa học:</strong> {price.course?.title}
              </p>
              <p>
                <strong>Danh mục:</strong> {price.course?.category || "N/A"}
              </p>
            </div>
          </div>

          {price.rejectionReason && (
            <div>
              <h4 className="font-semibold mb-2 text-red-600">
                Lý do từ chối (lần trước)
              </h4>
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <p className="text-sm text-red-800">{price.rejectionReason}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main component
export default function ApprovalPricesPage() {
  const [prices, setPrices] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("oldest");
  const [selectedPrice, setSelectedPrice] = useState<any>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Fetch pending prices
  const fetchPendingPrices = async () => {
    try {
      setIsLoading(true);
      const response = await getPendingPrices({
        page: 1,
        limit: 20,
        sortBy: sortBy as any,
      });
      setPrices(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error("Error fetching pending prices:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách giá chờ duyệt",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPrices();
  }, [sortBy]);

  // Price handlers
  const handleApprovePrice = async (priceId: string) => {
    try {
      setProcessingIds((prev) => new Set([...prev, priceId]));
      await approveCoursePrice(priceId);

      toast({
        title: "Thành công",
        description: "Đã duyệt giá khóa học",
      });

      // Refresh data
      fetchPendingPrices();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể duyệt giá khóa học",
        variant: "destructive",
      });
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(priceId);
        return newSet;
      });
    }
  };

  const handleRejectPrice = async (priceId: string, reason: string) => {
    try {
      setProcessingIds((prev) => new Set([...prev, priceId]));
      await rejectCoursePrice(priceId, { rejectionReason: reason });

      toast({
        title: "Thành công",
        description: "Đã từ chối giá khóa học",
      });

      // Refresh data
      fetchPendingPrices();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể từ chối giá khóa học",
        variant: "destructive",
      });
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(priceId);
        return newSet;
      });
    }
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return "Không rõ";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "Vừa xong";
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-500">Đang tải danh sách giá...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6 bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href="/admin/approvals">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              💰 Xét Duyệt Giá Khóa Học
            </h1>
            <p className="text-slate-500 text-sm">
              {meta?.totalCount || 0} giá khóa học đang chờ xét duyệt
            </p>
          </div>
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="oldest">Cũ nhất trước</SelectItem>
            <SelectItem value="newest">Mới nhất trước</SelectItem>
            <SelectItem value="instructor">Theo giảng viên</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Khóa học</TableHead>
              <TableHead>Giảng viên</TableHead>
              <TableHead>Giá đề xuất</TableHead>
              <TableHead>Thời gian gửi</TableHead>
              <TableHead>Chi tiết</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!prices || prices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-slate-500"
                >
                  🎉 Không có giá nào chờ duyệt
                </TableCell>
              </TableRow>
            ) : (
              prices.map((price: any) => (
                <TableRow key={price.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">
                        {price.course?.title || "N/A"}
                      </p>
                      <div className="text-xs text-slate-500 mt-1">
                        {price.course?.category || "Chưa phân loại"}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={price.instructor?.image} />
                        <AvatarFallback>
                          {price.instructor?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {price.instructor?.name || "Không rõ"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {price.instructor?.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <span className="text-lg font-semibold text-green-600">
                        {Number(price.price).toLocaleString()} VND
                      </span>
                      <div className="text-xs">
                        <Badge className="bg-yellow-100 text-yellow-800">
                          ⏳ Chờ duyệt
                        </Badge>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {getTimeAgo(price.submittedAt)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPrice(price);
                        setIsDetailModalOpen(true);
                      }}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Xem
                    </Button>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleApprovePrice(price.id)}
                        disabled={processingIds.has(price.id)}
                      >
                        {processingIds.has(price.id) ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Duyệt
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedPrice(price);
                          setIsRejectModalOpen(true);
                        }}
                        disabled={processingIds.has(price.id)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Từ chối
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <RejectPriceModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        price={selectedPrice}
        onSubmit={(reason) =>
          selectedPrice && handleRejectPrice(selectedPrice.id, reason)
        }
      />

      <PriceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        price={selectedPrice}
      />
    </div>
  );
}
