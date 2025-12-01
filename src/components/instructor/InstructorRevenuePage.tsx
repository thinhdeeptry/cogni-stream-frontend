"use client";

import { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { Download, RefreshCw } from "lucide-react";

// Import payment actions
import {
  PaymentRecord,
  PayoutMethod,
  TeacherPaymentSummary,
  createMyPayoutMethod,
  createPaymentRecord,
  createPayoutRecord,
  getMyPaymentSummary,
  getMyPayoutMethods,
  getPaymentRecords,
} from "@/actions/paymentActions";
// Import revenue actions
import {
  PaginatedResponse,
  RevenueShare,
  RevenueShareSummary,
  getMyRevenue,
  getMySummary,
} from "@/actions/revenueShareActions";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PaymentRecordsTable from "./payment/PaymentRecordsTable";
import PaymentRequestDialog from "./payment/PaymentRequestDialog";
import PaymentSummaryCards from "./payment/PaymentSummaryCards";
import PayoutMethods from "./payment/PayoutMethods";
import RevenueShareBreakdown from "./revenue/RevenueShareBreakdown";
// Import separated components
import RevenueSummaryCards from "./revenue/RevenueSummaryCards";
import TransactionHistory from "./revenue/TransactionHistory";

export default function InstructorRevenuePage() {
  // Revenue states
  const [revenueSummary, setRevenueSummary] =
    useState<RevenueShareSummary | null>(null);
  const [revenueShares, setRevenueShares] = useState<RevenueShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Payment states
  const [paymentSummary, setPaymentSummary] =
    useState<TeacherPaymentSummary | null>(null);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [currentPaymentPage, setCurrentPaymentPage] = useState(1);
  const [totalPaymentPages, setTotalPaymentPages] = useState(1);

  // Payment Request Dialog states
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  // Payout Methods states
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [isLoadingPayoutMethods, setIsLoadingPayoutMethods] = useState(false);
  const [isCreatingPayoutMethod, setIsCreatingPayoutMethod] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("revenue");

  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchRevenueShares(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPaymentData();
      fetchPaymentRecords(1); // Đảm bảo fetch payment records cho validation
    } else if (activeTab === "payout-methods") {
      fetchPayoutMethods();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "payments") {
      fetchPaymentRecords(currentPaymentPage);
    }
  }, [currentPaymentPage]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchRevenueSummary(), fetchRevenueShares(1)]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu doanh thu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentData = async () => {
    try {
      setIsLoadingPayments(true);
      await Promise.all([fetchPaymentSummary(), fetchPaymentRecords(1)]);
    } catch (error) {
      console.error("Error fetching payment data:", error);
      // Set default empty data for new teachers
      setPaymentSummary({
        teacher: {
          id: "",
          name: "Giảng viên mới",
          email: "teacher@example.com",
          totalRevenue: 0,
          totalPaidOut: 0,
          pendingPayout: 0,
        },
        paymentHistory: {
          totalPayments: 0,
          totalAmountPaid: 0,
          recentPayments: [],
        },
      });
      setPaymentRecords([]);
      toast({
        title: "Thông tin",
        description:
          "Chưa có dữ liệu thanh toán. Đây có thể là tài khoản giảng viên mới.",
        variant: "default",
      });
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const fetchPaymentSummary = async () => {
    try {
      const summary = await getMyPaymentSummary();
      setPaymentSummary(summary);
      console.log("Fetched payment summary:", summary);
    } catch (error) {
      console.error("Error fetching payment summary:", error);
      // Set default empty data for new teachers
      setPaymentSummary({
        teacher: {
          id: "",
          name: "Giảng viên mới",
          email: "teacher@example.com",
          totalRevenue: 0,
          totalPaidOut: 0,
          pendingPayout: 0,
        },
        paymentHistory: {
          totalPayments: 0,
          totalAmountPaid: 0,
          recentPayments: [],
        },
      });
    }
  };

  const fetchPaymentRecords = async (page: number) => {
    try {
      setIsLoadingPayments(true);
      const response = await getPaymentRecords({
        page,
        limit: 10,
      });
      setPaymentRecords(response.data);
      if (response.pagination?.totalPages)
        setTotalPaymentPages(response.pagination.totalPages);
      setCurrentPaymentPage(response.pagination.currentPage);

      // Reload payment summary để đồng bộ dữ liệu
      await fetchPaymentSummary();
    } catch (error) {
      console.error("Error fetching payment records:", error);
      // Set empty data for new teachers
      setPaymentRecords([]);
      setTotalPaymentPages(1);
      setCurrentPaymentPage(1);
      // Don't show error toast for empty data - it's normal for new teachers
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const fetchPayoutMethods = async () => {
    try {
      setIsLoadingPayoutMethods(true);
      const methods = await getMyPayoutMethods();
      console.log(
        "Fetched payout methods:",
        methods,
        "Type:",
        typeof methods,
        "Is array:",
        Array.isArray(methods),
      );
      setPayoutMethods(Array.isArray(methods) ? methods : []);
    } catch (error) {
      console.error("Error fetching payout methods:", error);
      // Set empty array for new teachers - this is normal
      setPayoutMethods([]);
    } finally {
      setIsLoadingPayoutMethods(false);
    }
  };

  const handleCreatePayoutMethod = async (data: {
    methodType: "BANK_ACCOUNT";
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    bankBranch?: string;
    isDefault?: boolean;
  }) => {
    try {
      setIsCreatingPayoutMethod(true);
      await createMyPayoutMethod(data);
      toast({
        title: "Thành công",
        description: "Đã thêm phương thức thanh toán mới",
      });
      await fetchPayoutMethods(); // Refresh the list
    } catch (error: any) {
      console.error("Error creating payout method:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo phương thức thanh toán",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayoutMethod(false);
    }
  };

  const handleCreatePaymentRequest = async (data: {
    payoutMethodId: string;
    amount: number;
    description: string;
  }) => {
    try {
      console.log("Creating payment request with data:", data);
      setIsCreatingPayment(true);
      await createPaymentRecord(data);
      toast({
        title: "Thành công",
        description: "Yêu cầu thanh toán đã được tạo thành công",
      });
      // Reload cả payment data và records để hiển thị ngay
      await Promise.all([
        fetchPaymentSummary(),
        fetchPaymentRecords(1), // Reset về trang 1 để thấy record mới
      ]);
      setCurrentPaymentPage(1);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message || "Không thể tạo yêu cầu thanh toán",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleCreatePayoutRecord = async (data: {
    payoutMethodId: string;
    amount: number;
    description: string;
  }) => {
    try {
      setIsCreatingPayment(true);
      await createPayoutRecord(data);
      toast({
        title: "Thành công",
        description: "Payout record đã được tạo và chờ admin duyệt",
      });
      // Reload cả payment data và records để hiển thị ngay
      await Promise.all([
        fetchPaymentSummary(),
        fetchPaymentRecords(1), // Reset về trang 1 để thấy record mới
      ]);
      setCurrentPaymentPage(1);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.response?.data?.message || "Không thể tạo payout record",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const fetchRevenueSummary = async () => {
    try {
      const summary = await getMySummary();
      setRevenueSummary(summary);
    } catch (error) {
      console.error("Error fetching revenue summary:", error);
      throw error;
    }
  };

  const fetchRevenueShares = async (page: number) => {
    try {
      setIsLoadingShares(true);
      const response: PaginatedResponse<RevenueShare> = await getMyRevenue({
        page,
        limit: 10,
      });
      setRevenueShares(response.data);
      setTotalPages(response.totalPages);
      setCurrentPage(response.page);
    } catch (error) {
      console.error("Error fetching revenue shares:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách giao dịch",
        variant: "destructive",
      });
    } finally {
      setIsLoadingShares(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      if (activeTab === "revenue") {
        await fetchInitialData();
      } else {
        await fetchPaymentData();
      }
      toast({
        title: "Thành công",
        description: "Dữ liệu đã được cập nhật",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật dữ liệu",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="space-y-4 lg:space-y-0">
          <div className="lg:hidden space-y-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Doanh thu của tôi
              </h1>
              <p className="text-sm text-slate-600">
                Theo dõi doanh thu và hoa hồng từ các khóa học
              </p>
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Doanh thu của tôi
              </h1>
              <p className="text-slate-600">
                Theo dõi doanh thu và hoa hồng từ các khóa học
              </p>
            </div>
          </div>
        </div>
        <RevenueSummaryCards summary={null} isLoading={true} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-4 lg:space-y-0">
        <div className="lg:hidden space-y-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Doanh thu của tôi
            </h1>
            <p className="text-sm text-slate-600">
              Theo dõi doanh thu và quản lý thanh toán
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 w-full"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 w-full"
            >
              <Download className="h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Doanh thu của tôi
            </h1>
            <p className="text-slate-600">
              Theo dõi doanh thu và quản lý thanh toán
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          <TabsTrigger value="payments">Thanh toán</TabsTrigger>
          <TabsTrigger value="payout-methods">
            Phương thức thanh toán
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <RevenueSummaryCards summary={revenueSummary} isLoading={isLoading} />

          {revenueSummary && <RevenueShareBreakdown summary={revenueSummary} />}

          <TransactionHistory
            revenueShares={revenueShares}
            isLoading={isLoadingShares}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentSummaryCards
            summary={paymentSummary}
            isLoading={isLoading || isLoadingPayments}
          />

          {paymentSummary && (
            <PaymentRequestDialog
              summary={paymentSummary}
              payoutMethods={payoutMethods}
              paymentRecords={paymentRecords}
              onCreatePaymentRequest={handleCreatePaymentRequest}
              onCreatePayoutRecord={handleCreatePayoutRecord}
              isCreating={isCreatingPayment}
            />
          )}

          <PaymentRecordsTable
            records={paymentRecords}
            isLoading={isLoadingPayments}
            currentPage={currentPaymentPage}
            totalPages={totalPaymentPages}
            onPageChange={setCurrentPaymentPage}
            onRefresh={async () => {
              await Promise.all([
                fetchPaymentSummary(),
                fetchPaymentRecords(currentPaymentPage),
              ]);
            }}
          />
        </TabsContent>

        <TabsContent value="payout-methods" className="space-y-6">
          <PayoutMethods
            payoutMethods={payoutMethods}
            isLoading={isLoadingPayoutMethods}
            onCreateMethod={handleCreatePayoutMethod}
            isCreating={isCreatingPayoutMethod}
            onRefresh={fetchPayoutMethods}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
