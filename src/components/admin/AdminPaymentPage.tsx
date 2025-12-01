"use client";

import { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { CheckCircle, Clock, Eye, RefreshCcw, XCircle } from "lucide-react";

import {
  PaginatedResponse,
  PaymentRecord,
  formatCurrency,
  formatDate,
  getPaymentRecords,
  getStatusBadgeColor,
  getStatusLabel,
} from "@/actions/paymentActions";

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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export default function AdminPaymentPage() {
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<PaymentRecord | null>(
    null,
  );
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate transaction ID
  const generateTransactionId = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    return `TX${timestamp}${random.toString().padStart(4, "0")}`;
  };

  useEffect(() => {
    fetchPaymentRecords(1);
  }, []);

  const fetchPaymentRecords = async (page: number) => {
    try {
      setIsLoading(true);
      const response: PaginatedResponse<PaymentRecord> =
        await getPaymentRecords({
          page,
          limit: 20,
          status: undefined, // Load all statuses
        });
      console.log("Fetched payment records:", response);

      // Handle case when no data exists or API returns not_found status
      if (!response || !response.data || response.data === null) {
        setPaymentRecords([]);
        setTotalPages(1);
        setCurrentPage(1);
        return;
      }

      // Handle normal paginated response
      if (response.pagination) {
        setPaymentRecords(response.data);
        setTotalPages(response.pagination.totalPages || 1);
        setCurrentPage(response.pagination.currentPage || 1);
      } else {
        // Fallback if pagination object is missing
        setPaymentRecords(Array.isArray(response.data) ? response.data : []);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching payment records:", error);
      // Reset to empty state on error
      setPaymentRecords([]);
      setTotalPages(1);
      setCurrentPage(1);

      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách thanh toán",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRecord) return;

    try {
      setIsProcessing(true);

      // Generate transaction ID automatically
      const generatedTransactionId = generateTransactionId();

      // Use the payment actions instead of direct fetch
      const { AxiosFactory } = await import("@/lib/axios");
      const paymentApi = await AxiosFactory.getApiInstance("payment");

      await paymentApi.patch(
        `/payments/records/${selectedRecord.id}/complete`,
        {
          transactionId: generatedTransactionId,
        },
      );

      toast({
        title: "Thành công",
        description: `Đã duyệt thanh toán thành công với mã GD: ${generatedTransactionId}`,
      });
      fetchPaymentRecords(currentPage);
      setShowApprovalDialog(false);
      setSelectedRecord(null);
      setTransactionId("");
      setFailureReason("");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message || "Không thể duyệt thanh toán",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRecord || !failureReason) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Use the payment actions instead of direct fetch
      const { AxiosFactory } = await import("@/lib/axios");
      const paymentApi = await AxiosFactory.getApiInstance("payment");

      await paymentApi.patch(`/payments/records/${selectedRecord.id}/fail`, {
        failureReason,
      });

      toast({
        title: "Thành công",
        description: "Đã từ chối thanh toán",
      });
      fetchPaymentRecords(currentPage);
      setShowApprovalDialog(false);
      setSelectedRecord(null);
      setFailureReason("");
      setTransactionId("");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message || "Không thể từ chối thanh toán",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openApprovalDialog = (record: PaymentRecord) => {
    setSelectedRecord(record);
    setTransactionId("");
    setFailureReason("");
    setShowApprovalDialog(true);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">
            Quản lý thanh toán
          </h1>
          <p className="text-slate-600">
            Duyệt và quản lý các yêu cầu thanh toán từ giảng viên
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 bg-gray-100 animate-pulse rounded"
                ></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Quản lý thanh toán
        </h1>
        <p className="text-slate-600">
          Duyệt và quản lý các yêu cầu thanh toán từ giảng viên
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách yêu cầu thanh toán</CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchPaymentRecords(currentPage)}
          >
            <RefreshCcw className="h-4 w-4 mx-8" />
          </Button>
        </CardHeader>
        <CardContent>
          {paymentRecords.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không có yêu cầu thanh toán nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Giảng viên</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {record.teacher.user.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {record.teacher.user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(record.amount)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {record.payoutMethod.bankName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.payoutMethod.accountHolderName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(record.createdAt)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(record.status)}>
                        {getStatusLabel(record.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            record.status === "COMPLETED" ||
                            record.status === "FAILED"
                          }
                          onClick={() => openApprovalDialog(record)}
                        >
                          <Eye className="h-4 w-4" />
                          Xử lý
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xử lý yêu cầu thanh toán</DialogTitle>
            <DialogDescription>
              Duyệt hoặc từ chối yêu cầu thanh toán từ giảng viên
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p>
                  <strong>Giảng viên:</strong>{" "}
                  {selectedRecord.teacher.user.name}
                </p>
                <p>
                  <strong>Số tiền:</strong>{" "}
                  {formatCurrency(selectedRecord.amount)}
                </p>
                <p>
                  <strong>Ngân hàng:</strong>{" "}
                  {selectedRecord.payoutMethod.bankName}
                </p>
                <p>
                  <strong>Chủ TK:</strong>{" "}
                  {selectedRecord.payoutMethod.accountHolderName}
                </p>
                {selectedRecord.description && (
                  <p>
                    <strong>Mô tả:</strong> {selectedRecord.description}
                  </p>
                )}
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Mã giao dịch sẽ được tự động tạo khi
                  duyệt thanh toán.
                </p>
              </div>

              <div>
                <Label htmlFor="failureReason">
                  Lý do từ chối (nếu từ chối)
                </Label>
                <Textarea
                  id="failureReason"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="Nhập lý do từ chối..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={isProcessing}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={
                isProcessing ||
                !failureReason ||
                selectedRecord?.status === "COMPLETED" ||
                selectedRecord?.status === "FAILED"
              }
            >
              <XCircle className="h-4 w-4 mr-2" />
              Từ chối
            </Button>
            <Button
              onClick={handleApprove}
              disabled={
                isProcessing ||
                !!failureReason ||
                selectedRecord?.status === "COMPLETED" ||
                selectedRecord?.status === "FAILED"
              }
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
