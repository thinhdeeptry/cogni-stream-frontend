import { useState } from "react";

import { toast } from "@/hooks/use-toast";
import { AlertCircle, Calendar, Wallet, X } from "lucide-react";

import {
  PaymentRecord,
  cancelPaymentRecord,
  formatCurrency,
  formatDate,
  getStatusBadgeColor,
  getStatusLabel,
} from "@/actions/paymentActions";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PaymentRecordsTableProps {
  records: PaymentRecord[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh?: () => Promise<void>;
}

export default function PaymentRecordsTable({
  records,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  onRefresh,
}: PaymentRecordsTableProps) {
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  const handleCancelPayment = async (recordId: string) => {
    try {
      setIsCancelling(recordId);
      await cancelPaymentRecord(recordId, "Hủy bởi giảng viên");
      toast({
        title: "Thành công",
        description: "Đã hủy yêu cầu thanh toán",
      });
      onRefresh?.(); // Refresh the data
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể hủy yêu cầu thanh toán",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(null);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Lịch sử thanh toán
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-4 border rounded-lg"
              >
                <div className="h-10 w-10 bg-gray-200 animate-pulse rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-3 w-32 bg-gray-200 animate-pulse rounded"></div>
                </div>
                <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg mb-2">
              Chưa có thanh toán nào
            </p>
            <p className="text-slate-400">
              Lịch sử thanh toán sẽ xuất hiện khi bạn tạo yêu cầu thanh toán
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">
                          {record.description}
                        </p>
                        {record.transactionId && (
                          <p className="text-xs text-slate-400">
                            ID: {record.transactionId}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {formatCurrency(record.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(record.status)}>
                        {getStatusLabel(record.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.notes ? (
                        <div className="max-w-xs">
                          <p
                            className="text-sm text-slate-600 truncate"
                            title={record.notes}
                          >
                            {record.notes}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">
                          {record.payoutMethod.accountHolderName}
                        </p>
                        <p className="text-slate-500">
                          {record.payoutMethod.bankName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(record.createdAt)}
                    </TableCell>
                    <TableCell>
                      {record.status === "PENDING" ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              disabled={isCancelling === record.id}
                            >
                              <X className="h-4 w-4 mr-1" />
                              {isCancelling === record.id
                                ? "Đang hủy..."
                                : "Hủy"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                Xác nhận hủy yêu cầu thanh toán
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn hủy yêu cầu thanh toán{" "}
                                <span className="font-semibold">
                                  {formatCurrency(record.amount)}
                                </span>
                                ?
                                <br />
                                Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Không</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelPayment(record.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Có, hủy yêu cầu
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <span className="text-sm text-slate-400">
                          {record.paidAt ? formatDate(record.paidAt) : "-"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination for payments */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-slate-500">
                  Trang {currentPage} / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onPageChange(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
