import { Calendar, Wallet } from "lucide-react";

import {
  PaymentRecord,
  formatCurrency,
  formatDate,
  getStatusBadgeColor,
  getStatusLabel,
} from "@/actions/paymentActions";

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
}

export default function PaymentRecordsTable({
  records,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
}: PaymentRecordsTableProps) {
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
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Ngày thanh toán</TableHead>
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
                        {record.notes && (
                          <p className="text-sm text-slate-500">
                            {record.notes}
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
                    <TableCell className="text-sm text-slate-500">
                      {record.paidAt ? formatDate(record.paidAt) : "-"}
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
