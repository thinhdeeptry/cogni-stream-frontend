import { useState } from "react";

import { Plus, Wallet } from "lucide-react";

import {
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
import { Textarea } from "@/components/ui/textarea";

interface PaymentRequestDialogProps {
  summary: TeacherPaymentSummary;
  payoutMethods: PayoutMethod[];
  onCreatePaymentRequest: (data: {
    payoutMethodId: string;
    amount: number;
    description: string;
  }) => Promise<void>;
  onCreatePayoutRecord: (data: {
    amount: number;
    description: string;
  }) => Promise<void>;
  isCreating: boolean;
}

export default function PaymentRequestDialog({
  summary,
  payoutMethods,
  onCreatePaymentRequest,
  onCreatePayoutRecord,
  isCreating,
}: PaymentRequestDialogProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutDescription, setPayoutDescription] = useState("");

  const handleCreatePaymentRequest = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Check if amount exceeds available balance
    const availableBalance =
      (summary?.teacher?.totalRevenue || 0) -
      (summary?.teacher?.totalPaidOut || 0) -
      (summary?.teacher?.pendingPayout || 0);

    if (amount > availableBalance) {
      alert(
        `Số tiền vượt quá số dư khả dụng: ${formatCurrency(availableBalance)}`,
      );
      return;
    }

    const defaultPayoutMethod = Array.isArray(payoutMethods)
      ? payoutMethods.find((method) => method.isDefault)
      : null;

    if (!defaultPayoutMethod) {
      alert("Vui lòng thêm phương thức thanh toán trước khi tạo yêu cầu");
      return;
    }

    await onCreatePaymentRequest({
      payoutMethodId: defaultPayoutMethod.id,
      amount,
      description:
        paymentDescription || `Yêu cầu thanh toán ${formatCurrency(amount)}`,
    });

    setPaymentAmount("");
    setPaymentDescription("");
    setShowPaymentDialog(false);
  };

  const handleCreatePayoutRecord = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Check if amount exceeds available balance
    const availableBalance =
      (summary?.teacher?.totalRevenue || 0) -
      (summary?.teacher?.totalPaidOut || 0) -
      (summary?.teacher?.pendingPayout || 0);

    if (amount > availableBalance) {
      alert(
        `Số tiền vượt quá số dư khả dụng: ${formatCurrency(availableBalance)}`,
      );
      return;
    }

    await onCreatePayoutRecord({
      amount,
      description:
        payoutDescription || `Yêu cầu rút tiền ${formatCurrency(amount)}`,
    });

    setPayoutAmount("");
    setPayoutDescription("");
    setShowPayoutDialog(false);
  };

  // Calculate available balance
  const availableBalance =
    (summary?.teacher?.totalRevenue || 0) -
    (summary?.teacher?.totalPaidOut || 0) -
    (summary?.teacher?.pendingPayout || 0);
  const hasBalance = availableBalance > 0;

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
                  Bạn có {formatCurrency(pendingAmount)} có thể rút ra
                </p>
                <p className="text-xs text-slate-500">
                  Yêu cầu thanh toán sẽ được xử lý trong 1-3 ngày làm việc
                </p>
              </div>
              <div className="flex gap-2">
                {/* Payment Request Button */}
                <Dialog
                  open={showPaymentDialog}
                  onOpenChange={setShowPaymentDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Yêu cầu thanh toán
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Tạo yêu cầu thanh toán</DialogTitle>
                      <DialogDescription>
                        Nhập số tiền bạn muốn rút. Tối đa:{" "}
                        {formatCurrency(pendingAmount)}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="payment-amount" className="text-right">
                          Số tiền
                        </Label>
                        <Input
                          id="payment-amount"
                          type="number"
                          placeholder="0"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="col-span-3"
                          max={pendingAmount}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="payment-description"
                          className="text-right"
                        >
                          Mô tả
                        </Label>
                        <Textarea
                          id="payment-description"
                          placeholder="Mô tả yêu cầu thanh toán (tùy chọn)"
                          value={paymentDescription}
                          onChange={(e) =>
                            setPaymentDescription(e.target.value)
                          }
                          className="col-span-3"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPaymentDialog(false)}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        onClick={handleCreatePaymentRequest}
                        disabled={isCreating}
                      >
                        {isCreating ? "Đang tạo..." : "Tạo yêu cầu"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Payout Record Button */}
                <Dialog
                  open={showPayoutDialog}
                  onOpenChange={setShowPayoutDialog}
                >
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Tạo Payout Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Tạo Payout Record</DialogTitle>
                      <DialogDescription>
                        Tạo yêu cầu rút tiền để chờ admin duyệt. Tối đa:{" "}
                        {formatCurrency(pendingAmount)}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="payout-amount" className="text-right">
                          Số tiền
                        </Label>
                        <Input
                          id="payout-amount"
                          type="number"
                          placeholder="0"
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          className="col-span-3"
                          max={pendingAmount}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="payout-description"
                          className="text-right"
                        >
                          Mô tả
                        </Label>
                        <Textarea
                          id="payout-description"
                          placeholder="Mô tả yêu cầu rút tiền (tùy chọn)"
                          value={payoutDescription}
                          onChange={(e) => setPayoutDescription(e.target.value)}
                          className="col-span-3"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowPayoutDialog(false)}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        onClick={handleCreatePayoutRecord}
                        disabled={isCreating}
                      >
                        {isCreating ? "Đang tạo..." : "Tạo Payout Record"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
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
