import { useState } from "react";

import { Plus, Wallet } from "lucide-react";

import { PayoutMethod } from "@/actions/paymentActions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

interface PayoutMethodsProps {
  payoutMethods: PayoutMethod[];
  isLoading: boolean;
  onCreateMethod: (data: {
    methodType: "BANK_ACCOUNT";
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    bankBranch?: string;
    isDefault?: boolean;
  }) => Promise<void>;
  isCreating: boolean;
}

export default function PayoutMethods({
  payoutMethods,
  isLoading,
  onCreateMethod,
  isCreating,
}: PayoutMethodsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");

  const handleCreate = async () => {
    if (!accountHolderName || !accountNumber || !bankName) return;

    await onCreateMethod({
      methodType: "BANK_ACCOUNT",
      accountHolderName,
      accountNumber,
      bankName,
      bankBranch: bankBranch || undefined,
      isDefault: !Array.isArray(payoutMethods) || payoutMethods.length === 0,
    });

    // Reset form
    setAccountHolderName("");
    setAccountNumber("");
    setBankName("");
    setBankBranch("");
    setShowDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Phương thức nhận tiền</h3>
          <p className="text-sm text-slate-600">
            Quản lý thông tin tài khoản nhận tiền
          </p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm phương thức
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-4 w-40 bg-gray-200 animate-pulse rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !Array.isArray(payoutMethods) || payoutMethods.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Chưa có phương thức thanh toán nào</p>
            <p className="text-sm text-gray-500">
              Thêm tài khoản ngân hàng để nhận tiền
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.isArray(payoutMethods) &&
            payoutMethods.map((method) => (
              <Card
                key={method.id}
                className={method.isDefault ? "border-blue-500 bg-blue-50" : ""}
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{method.bankName}</h4>
                    {method.isDefault && (
                      <Badge className="bg-blue-100 text-blue-800">
                        Mặc định
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Chủ tài khoản:</strong> {method.accountHolderName}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Số tài khoản:</strong> {method.accountNumber}
                    </p>
                    {method.bankBranch && (
                      <p className="text-sm text-gray-600">
                        <strong>Chi nhánh:</strong> {method.bankBranch}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Create Payout Method Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm phương thức nhận tiền</DialogTitle>
            <DialogDescription>
              Thêm tài khoản ngân hàng để nhận tiền từ các khóa học
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountHolderName">Tên chủ tài khoản *</Label>
              <Input
                id="accountHolderName"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <Label htmlFor="bankName">Tên ngân hàng *</Label>
              <Input
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Vietcombank, BIDV, Techcombank..."
              />
            </div>
            <div>
              <Label htmlFor="accountNumber">Số tài khoản *</Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="123456789"
              />
            </div>
            <div>
              <Label htmlFor="bankBranch">Chi nhánh (tùy chọn)</Label>
              <Input
                id="bankBranch"
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
                placeholder="CN Hà Nội, CN TP.HCM..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isCreating}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                isCreating || !accountHolderName || !accountNumber || !bankName
              }
            >
              {isCreating ? "Đang tạo..." : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
