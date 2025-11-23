import { useState } from "react";

import { toast } from "@/hooks/use-toast";
import {
  MoreVertical,
  Plus,
  Settings,
  Star,
  Trash2,
  Wallet,
} from "lucide-react";

import {
  PayoutMethod,
  deletePayoutMethod,
  setDefaultPayoutMethod,
} from "@/actions/paymentActions";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Danh sách ngân hàng Việt Nam
const banksInVietnam = [
  "Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)",
  "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)",
  "Ngân hàng TMCP Công Thương Việt Nam (VietinBank)",
  "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)",
  "Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)",
  "Ngân hàng TMCP Quân đội (MB Bank)",
  "Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)",
  "Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh (HDBank)",
  "Ngân hàng TMCP Á Châu (ACB)",
  "Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)",
  "Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam (Eximbank)",
  "Ngân hàng TMCP Quốc tế Việt Nam (VIB)",
  "Ngân hàng TMCP Đông Nam Á (SeABank)",
  "Ngân hàng TMCP An Bình (ABBank)",
  "Ngân hàng TMCP Bản Việt (VietCapital Bank)",
];

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
  onRefresh: () => Promise<void>;
}

export default function PayoutMethods({
  payoutMethods,
  isLoading,
  onCreateMethod,
  isCreating,
  onRefresh,
}: PayoutMethodsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [isSettingDefault, setIsSettingDefault] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Validation functions
  const validateAccountHolderName = (name: string) => {
    // Chỉ cho phép chữ cái, khoảng trắng, không dấu
    const regex = /^[A-Za-z\s]+$/;
    return regex.test(name);
  };

  const validateAccountNumber = (number: string) => {
    // Chỉ cho phép số
    const regex = /^[0-9]+$/;
    return regex.test(number);
  };

  const handleAccountHolderNameChange = (value: string) => {
    // Chỉ cho phép nhập chữ và khoảng trắng
    const filtered = value.replace(/[^A-Za-z\s]/g, "");
    setAccountHolderName(filtered);
  };

  const handleAccountNumberChange = (value: string) => {
    // Chỉ cho phép nhập số
    const filtered = value.replace(/[^0-9]/g, "");
    setAccountNumber(filtered);
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      setIsSettingDefault(methodId);
      await setDefaultPayoutMethod(methodId);
      toast({
        title: "Thành công",
        description: "Đã thiết lập phương thức thanh toán mặc định",
      });
      await onRefresh();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thiết lập mặc định",
        variant: "destructive",
      });
    } finally {
      setIsSettingDefault(null);
    }
  };

  const handleDelete = async (methodId: string) => {
    try {
      setIsDeleting(methodId);
      await deletePayoutMethod(methodId);
      toast({
        title: "Thành công",
        description: "Đã xóa phương thức thanh toán",
      });
      await onRefresh();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa phương thức thanh toán",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCreate = async () => {
    if (!accountHolderName || !accountNumber || !bankName) return;

    // Validate inputs
    if (!validateAccountHolderName(accountHolderName)) {
      toast({
        title: "Lỗi",
        description: "Tên chủ tài khoản chỉ được chứa chữ cái và khoảng trắng",
        variant: "destructive",
      });
      return;
    }

    if (!validateAccountNumber(accountNumber)) {
      toast({
        title: "Lỗi",
        description: "Số tài khoản chỉ được chứa số",
        variant: "destructive",
      });
      return;
    }

    try {
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
    } catch (error) {
      // Error đã được handle trong parent component
    }
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
                    <div className="flex items-center gap-2">
                      {method.isDefault && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Mặc định
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!method.isDefault && (
                            <DropdownMenuItem
                              onClick={() => handleSetDefault(method.id)}
                              disabled={isSettingDefault === method.id}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              {isSettingDefault === method.id
                                ? "Đang thiết lập..."
                                : "Đặt làm mặc định"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(method.id)}
                            disabled={isDeleting === method.id}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting === method.id ? "Đang xóa..." : "Xóa"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
                onChange={(e) => handleAccountHolderNameChange(e.target.value)}
                placeholder="NGUYEN VAN A (không dấu, chỉ chữ cái)"
                className={
                  !validateAccountHolderName(accountHolderName) &&
                  accountHolderName
                    ? "border-red-500"
                    : ""
                }
              />
              {!validateAccountHolderName(accountHolderName) &&
                accountHolderName && (
                  <p className="text-sm text-red-500 mt-1">
                    Tên chỉ được chứa chữ cái và khoảng trắng
                  </p>
                )}
            </div>
            <div>
              <Label htmlFor="bankName">Tên ngân hàng *</Label>
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngân hàng" />
                </SelectTrigger>
                <SelectContent>
                  {banksInVietnam.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="accountNumber">Số tài khoản *</Label>
              <Input
                id="accountNumber"
                value={accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
                placeholder="123456789 (chỉ số)"
                className={
                  !validateAccountNumber(accountNumber) && accountNumber
                    ? "border-red-500"
                    : ""
                }
              />
              {!validateAccountNumber(accountNumber) && accountNumber && (
                <p className="text-sm text-red-500 mt-1">
                  Số tài khoản chỉ được chứa số
                </p>
              )}
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
                isCreating ||
                !accountHolderName ||
                !accountNumber ||
                !bankName ||
                !validateAccountHolderName(accountHolderName) ||
                !validateAccountNumber(accountNumber)
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
