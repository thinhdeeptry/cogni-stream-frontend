import React, { useState } from "react";

import { toast } from "@/hooks/use-toast";
import { Plus, Wallet } from "lucide-react";

import {
  PaymentRecord,
  PayoutMethod,
  TeacherPaymentSummary,
  formatCurrency,
} from "@/actions/paymentActions";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface PaymentRequestDialogProps {
  summary: TeacherPaymentSummary;
  payoutMethods: PayoutMethod[];
  paymentRecords: PaymentRecord[]; // Thêm để kiểm tra điều kiện
  onCreatePaymentRequest: (data: {
    payoutMethodId: string;
    amount: number;
    description: string;
  }) => Promise<void>;
  onCreatePayoutRecord: (data: {
    payoutMethodId: string;
    amount: number;
    description: string;
  }) => Promise<void>;
  isCreating: boolean;
}

export default function PaymentRequestDialog({
  summary,
  payoutMethods,
  paymentRecords,
  onCreatePaymentRequest,
  onCreatePayoutRecord,
  isCreating,
}: PaymentRequestDialogProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPayoutMethodId, setSelectedPayoutMethodId] = useState("");

  const handleCreateRequest = async () => {
    const requestAmount = parseFloat(amount);
    if (isNaN(requestAmount) || requestAmount <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số tiền hợp lệ (> 0)",
        variant: "destructive",
      });
      return;
    }

    // Check if amount exceeds available balance
    const availableBalance =
      (summary?.teacher?.totalRevenue || 0) -
      (summary?.teacher?.totalPaidOut || 0);

    if (requestAmount > availableBalance) {
      toast({
        title: "Lỗi",
        description: `Số tiền vượt quá số dư khả dụng: ${formatCurrency(availableBalance)}`,
        variant: "destructive",
      });
      return;
    }

    // Check if payout method is selected
    if (!selectedPayoutMethodId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn phương thức thanh toán",
        variant: "destructive",
      });
      return;
    }

    // Use createPaymentRequest with selected payout method
    await onCreatePaymentRequest({
      payoutMethodId: selectedPayoutMethodId,
      amount: requestAmount,
      description:
        description || `Yêu cầu thanh toán ${formatCurrency(requestAmount)}`,
    });

    setAmount("");
    setDescription("");
    setSelectedPayoutMethodId("");
    setShowDialog(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Chỉ cho phép số và dấu chấm
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  // Calculate available balance - chỉ check totalRevenue - totalPaidOut
  const availableBalance =
    (summary?.teacher?.totalRevenue || 0) -
    (summary?.teacher?.totalPaidOut || 0);
  const hasBalance = availableBalance > 0;
  const hasPayoutMethods = payoutMethods && payoutMethods.length > 0;

  // Check điều kiện tạo yêu cầu rút tiền
  const checkCanCreateRequest = () => {
    if (!paymentRecords || paymentRecords.length === 0) {
      return { canCreate: true, reason: "" };
    }

    // Sắp xếp theo thời gian tạo (mới nhất trước)
    const sortedRecords = [...paymentRecords].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const latestRecord = sortedRecords[0];

    // Kiểm tra có request đang chờ duyệt không
    const hasPendingRequest = paymentRecords.some(
      (record) => record.status === "PENDING" || record.status === "PROCESSING",
    );

    if (hasPendingRequest) {
      return {
        canCreate: false,
        reason:
          "Bạn có yêu cầu rút tiền đang chờ duyệt. Vui lòng đợi admin xử lý.",
      };
    }

    // Nếu request cuối bị hủy, cho phép tạo mới
    if (
      latestRecord.status === "CANCELLED" ||
      latestRecord.status === "FAILED"
    ) {
      return { canCreate: true, reason: "" };
    }

    // Nếu request cuối thành công, kiểm tra 24h
    if (latestRecord.status === "COMPLETED") {
      const completedTime = new Date(
        latestRecord.paidAt || latestRecord.updatedAt,
      );
      const now = new Date();
      const hoursDiff =
        (now.getTime() - completedTime.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        const remainingHours = Math.ceil(24 - hoursDiff);
        return {
          canCreate: false,
          reason: `Bạn cần đợi ${remainingHours} giờ nữa từ lần rút tiền thành công gần nhất.`,
        };
      }
    }

    return { canCreate: true, reason: "" };
  };

  const { canCreate, reason: restrictionReason } = checkCanCreateRequest();

  // Hàm rút hết số tiền
  const handleWithdrawAll = () => {
    setAmount(availableBalance.toString());
  };

  return (
    <>
      {hasBalance ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Yêu cầu thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-2">
                  Bạn có {formatCurrency(availableBalance)} có thể rút ra
                </p>
                {!hasPayoutMethods ? (
                  <p className="text-xs text-amber-600 font-medium">
                    ⚠️ Vui lòng thêm phương thức thanh toán trước
                  </p>
                ) : !canCreate ? (
                  <p className="text-xs text-amber-600 font-medium">
                    ⚠️ {restrictionReason}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Yêu cầu thanh toán sẽ được xử lý trong 1-3 ngày làm việc
                  </p>
                )}
              </div>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button
                    className="flex items-center gap-2"
                    disabled={!hasPayoutMethods || !canCreate}
                  >
                    <Plus className="h-4 w-4" />
                    Tạo yêu cầu thanh toán
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Tạo yêu cầu thanh toán</DialogTitle>
                    <DialogDescription>
                      Nhập số tiền bạn muốn rút. Tối đa:{" "}
                      {formatCurrency(availableBalance)}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="payoutMethod" className="text-right">
                        Phương thức *
                      </Label>
                      <Select
                        value={selectedPayoutMethodId}
                        onValueChange={setSelectedPayoutMethodId}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Chọn phương thức thanh toán" />
                        </SelectTrigger>
                        <SelectContent>
                          {payoutMethods.length === 0 ? (
                            <SelectItem value="" disabled>
                              Chưa có phương thức thanh toán
                            </SelectItem>
                          ) : (
                            payoutMethods.map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.accountHolderName} - {method.bankName} -{" "}
                                {method.accountNumber}
                                {method.isDefault && (
                                  <span className="text-blue-500 ml-1">
                                    (Mặc định)
                                  </span>
                                )}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="amount" className="text-right">
                        Số tiền *
                      </Label>
                      <div className="col-span-3 space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id="amount"
                            type="text"
                            placeholder="0"
                            value={amount}
                            onChange={handleAmountChange}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleWithdrawAll}
                            className="whitespace-nowrap"
                          >
                            Rút hết
                          </Button>
                        </div>
                        {amount && parseFloat(amount) > 0 && (
                          <div className="text-sm text-slate-600">
                            {formatCurrency(parseFloat(amount) || 0)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Mô tả
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Mô tả yêu cầu thanh toán (tùy chọn)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="col-span-3"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDialog(false)}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      onClick={handleCreateRequest}
                      disabled={
                        isCreating ||
                        !amount ||
                        parseFloat(amount) <= 0 ||
                        !selectedPayoutMethodId ||
                        payoutMethods.length === 0
                      }
                    >
                      {isCreating ? "Đang tạo..." : "Tạo yêu cầu"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Yêu cầu thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Chưa có tiền để rút</p>
              <p className="text-sm text-gray-500">
                Bán khóa học để có doanh thu
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
