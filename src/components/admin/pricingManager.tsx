"use client";

import { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import {
  CoursePrice,
  CoursePricingPolicies,
  PriceApprovalStatus,
  PricingPolicy,
  PricingStatus,
  PricingType,
} from "@/types/course/types";
import { id } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Loader2,
  Play,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  activateApprovedPrice,
  approveCoursePrice,
  createCoursePrice,
  createPricing,
  createPromotionForCourse,
  // Legacy support
  deletePricingDetail,
  deletePricingPolicy,
  // Legacy support
  getCourseCurrentPrice,
  getCoursePricingPolicies,
  getPriceHistory,
  getPricingHeaders,
  rejectCoursePrice,
  setBasePriceForCourse,
  // Legacy support
  submitPriceForApproval,
  updatePricingHeaderStatus,
  updatePricingPrice,
  updatePricingStatus,
} from "@/actions/pricingActions";

import useUserStore from "@/stores/useUserStore";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

interface AdminPricingManagerProps {
  courseId: string;
  courseName: string;
  onPricingUpdated?: () => void;
}

export function AdminPricingManager({
  courseId,
  courseName,
  onPricingUpdated,
}: AdminPricingManagerProps) {
  const { user } = useUserStore();
  const isAdmin = user?.role === "ADMIN";

  const [isOpen, setIsOpen] = useState(false);
  const [currentPricing, setCurrentPricing] = useState<CoursePrice | null>(
    null,
  );
  const [coursePricingData, setCoursePricingData] =
    useState<CoursePricingPolicies | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPolicies, setIsLoadingPolicies] = useState(false); // New loading state
  const [isUpdating, setIsUpdating] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>(
    PricingType.BASE_PRICE,
  );
  const [promotionName, setPromotionName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit price states
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  // Price approval states
  const [approvingPriceId, setApprovingPriceId] = useState<string | null>(null);
  const [rejectingPriceId, setRejectingPriceId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [submittingPriceId, setSubmittingPriceId] = useState<string | null>(
    null,
  );
  const [activatingPriceId, setActivatingPriceId] = useState<string | null>(
    null,
  );

  // Admin approval/rejection states
  const [adminApprovingId, setAdminApprovingId] = useState<string | null>(null);
  const [adminRejectingId, setAdminRejectingId] = useState<string | null>(null);
  const [adminRejectReason, setAdminRejectReason] = useState("");
  const [showAdminRejectDialog, setShowAdminRejectDialog] = useState(false);
  const [currentRejectingId, setCurrentRejectingId] = useState<string | null>(
    null,
  );

  // Fetch current pricing and all policies when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchCurrentPricing();
      fetchAllPricings();
    }
  }, [isOpen, courseId]);

  const fetchCurrentPricing = async () => {
    try {
      setIsLoading(true);
      const pricing = await getCourseCurrentPrice(courseId);
      setCurrentPricing(pricing);
    } catch (error) {
      console.error("Error fetching current pricing:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin giá hiện tại",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllPricings = async () => {
    try {
      setIsLoadingPolicies(true);
      const pricings = await getCoursePricingPolicies(courseId);
      setCoursePricingData(pricings);
    } catch (error) {
      console.error("Error fetching all pricings:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách chính sách giá",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPolicies(false); // Clear loading
    }
  };

  const handleStatusUpdate = async (
    pricingId: string,
    newStatus: PricingStatus,
  ) => {
    if (!coursePricingData) return;

    // Kiểm tra ràng buộc: chỉ một promotion có thể ACTIVE
    if (newStatus === PricingStatus.ACTIVE) {
      const activePricings = coursePricingData.prices.filter(
        (p) =>
          p.headerStatus === PricingStatus.ACTIVE &&
          p.type === PricingType.PROMOTION &&
          p.id !== pricingId,
      );

      if (activePricings.length > 0) {
        toast({
          title: "Lỗi",
          description:
            "Chỉ có thể có một chương trình khuyến mãi active. Vui lòng deactivate promotion khác trước.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsUpdating(true);
      // pricingId ở đây có thể là Header ID hoặc Detail ID
      // Cần xác định đúng context để call function phù hợp
      await updatePricingHeaderStatus(pricingId, newStatus);

      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái thành công",
      });

      await fetchAllPricings();
      await fetchCurrentPricing();

      if (onPricingUpdated) {
        onPricingUpdated();
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (pricingId: string) => {
    try {
      setDeletingId(pricingId);
      // pricingId ở đây thực chất là PricingDetail ID
      await deletePricingDetail(pricingId);

      toast({
        title: "Thành công",
        description: "Xóa nhãn giá thành công",
      });

      await fetchAllPricings();
      await fetchCurrentPricing();

      if (onPricingUpdated) {
        onPricingUpdated();
      }
    } catch (error: any) {
      console.error("Error deleting pricing:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa pricing policy",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handlePriceUpdate = async (pricingId: string) => {
    if (!editPrice || Number(editPrice) < 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập giá hợp lệ",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdating(true);
      // pricingId ở đây thực chất là PricingDetail ID
      await updatePricingPrice(pricingId, Number(editPrice));

      toast({
        title: "Thành công",
        description: "Cập nhật giá thành công",
      });

      await fetchAllPricings();
      await fetchCurrentPricing();

      if (onPricingUpdated) {
        onPricingUpdated();
      }

      // Reset edit state
      setEditingPriceId(null);
      setEditPrice("");
    } catch (error: any) {
      console.error("Error updating price:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật giá",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const startEditPrice = (pricingId: string, currentPrice: number) => {
    setEditingPriceId(pricingId);
    setEditPrice(currentPrice.toString());
  };

  const cancelEditPrice = () => {
    setEditingPriceId(null);
    setEditPrice("");
  };

  const handleSubmitForApproval = async (pricingId: string) => {
    try {
      setSubmittingPriceId(pricingId);
      await submitPriceForApproval(pricingId);

      toast({
        title: "Thành công",
        description: "Đã gửi yêu cầu duyệt giá",
      });

      await fetchAllPricings();
      await fetchCurrentPricing();

      if (onPricingUpdated) {
        onPricingUpdated();
      }
    } catch (error: any) {
      console.error("Error submitting for approval:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi yêu cầu duyệt giá",
        variant: "destructive",
      });
    } finally {
      setSubmittingPriceId(null);
    }
  };

  const handleActivatePrice = async (pricingId: string) => {
    try {
      setActivatingPriceId(pricingId);
      await activateApprovedPrice(pricingId);

      toast({
        title: "Thành công",
        description: "Đã kích hoạt giá khóa học",
      });

      await fetchAllPricings();
      await fetchCurrentPricing();

      if (onPricingUpdated) {
        onPricingUpdated();
      }
    } catch (error: any) {
      console.error("Error activating price:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể kích hoạt giá",
        variant: "destructive",
      });
    } finally {
      setActivatingPriceId(null);
    }
  };

  // Admin approval/rejection handlers
  const handleAdminApprovePrice = async (pricingId: string) => {
    if (!isAdmin) {
      toast({
        title: "Lỗi",
        description: "Bạn không có quyền duyệt giá",
        variant: "destructive",
      });
      return;
    }

    try {
      setAdminApprovingId(pricingId);
      await approveCoursePrice(pricingId);

      toast({
        title: "Thành công",
        description: "Đã duyệt giá thành công",
      });

      await fetchAllPricings();
      await fetchCurrentPricing();

      if (onPricingUpdated) {
        onPricingUpdated();
      }
    } catch (error: any) {
      console.error("Error approving price:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể duyệt giá",
        variant: "destructive",
      });
    } finally {
      setAdminApprovingId(null);
    }
  };

  const handleAdminRejectPrice = async () => {
    if (!isAdmin || !currentRejectingId) {
      toast({
        title: "Lỗi",
        description: "Bạn không có quyền từ chối giá",
        variant: "destructive",
      });
      return;
    }

    if (!adminRejectReason.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive",
      });
      return;
    }

    try {
      setAdminRejectingId(currentRejectingId);
      await rejectCoursePrice(currentRejectingId, {
        rejectionReason: adminRejectReason,
      });

      toast({
        title: "Thành công",
        description: "Đã từ chối giá thành công",
      });

      await fetchAllPricings();
      await fetchCurrentPricing();

      if (onPricingUpdated) {
        onPricingUpdated();
      }

      // Reset reject dialog state
      setShowAdminRejectDialog(false);
      setCurrentRejectingId(null);
      setAdminRejectReason("");
    } catch (error: any) {
      console.error("Error rejecting price:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể từ chối giá",
        variant: "destructive",
      });
    } finally {
      setAdminRejectingId(null);
    }
  };

  const showAdminRejectConfirmation = (pricingId: string) => {
    setCurrentRejectingId(pricingId);
    setShowAdminRejectDialog(true);
    setAdminRejectReason("");
  };

  const getStatusIcon = (status: PricingStatus) => {
    switch (status) {
      case PricingStatus.ACTIVE:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case PricingStatus.INACTIVE:
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case PricingStatus.SCHEDULED:
        return <Clock className="h-4 w-4 text-blue-500" />;
      case PricingStatus.EXPIRED:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: PricingStatus) => {
    const colors = {
      [PricingStatus.ACTIVE]: "bg-green-100 text-green-800",
      [PricingStatus.INACTIVE]: "bg-gray-100 text-gray-800",
      [PricingStatus.SCHEDULED]: "bg-blue-100 text-blue-800",
      [PricingStatus.EXPIRED]: "bg-red-100 text-red-800",
    };

    const labels = {
      [PricingStatus.ACTIVE]: "Đang hoạt động",
      [PricingStatus.INACTIVE]: "Không hoạt động",
      [PricingStatus.SCHEDULED]: "Đã lên lịch",
      [PricingStatus.EXPIRED]: "Đã hết hạn",
    };

    return <Badge className={colors[status]}>{labels[status]}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === PricingType.PROMOTION ? (
      <Badge variant="destructive">Khuyến mãi</Badge>
    ) : (
      <Badge variant="secondary">Giá cơ bản</Badge>
    );
  };

  const getApprovalStatusBadge = (approvalStatus?: string) => {
    if (!approvalStatus) return null;

    switch (approvalStatus) {
      case PriceApprovalStatus.PENDING_APPROVAL:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Chờ duyệt
          </Badge>
        );
      case PriceApprovalStatus.APPROVED:
        return (
          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Đã duyệt
          </Badge>
        );
      case PriceApprovalStatus.REJECTED:
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Bị từ chối
          </Badge>
        );
      // case PriceApprovalStatus.ACTIVE:
      //   return (
      //     <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
      //       <CheckCircle className="h-3 w-3" />
      //       Đang áp dụng
      //     </Badge>
      //   );
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleSubmit = async () => {
    if (!newPrice || Number(newPrice) < 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập giá hợp lệ",
        variant: "destructive",
      });
      return;
    }

    if (pricingType === PricingType.PROMOTION && !promotionName.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên chương trình khuyến mãi",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdating(true);

      if (pricingType === PricingType.BASE_PRICE) {
        // Tạo giá cơ bản cho khóa học
        await setBasePriceForCourse(courseId, Number(newPrice));

        toast({
          title: "Thành công",
          description: "Đã tạo giá cơ bản và gửi yêu cầu duyệt",
        });
      } else {
        // Tạo chương trình khuyến mãi
        await createPromotionForCourse({
          courseId,
          name: promotionName,
          description: description || undefined,
          price: Number(newPrice),
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });

        toast({
          title: "Thành công",
          description: `Đã tạo chương trình khuyến mãi "${promotionName}" và gửi yêu cầu duyệt`,
        });
      }

      // Refresh data
      await fetchCurrentPricing();
      await fetchAllPricings();

      if (onPricingUpdated) {
        onPricingUpdated();
      }

      setShowAddForm(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating pricing:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo chính sách giá",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const resetForm = () => {
    setNewPrice("");
    setPricingType(PricingType.BASE_PRICE);
    setPromotionName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    // Reset edit price state
    setEditingPriceId(null);
    setEditPrice("");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setShowAddForm(false);
      setShowAdminRejectDialog(false);
      setCurrentRejectingId(null);
      setAdminRejectReason("");
      resetForm();
    }
  };

  // Lấy summary statistics từ API response
  const getSummaryStats = () => {
    if (!coursePricingData) return null;

    // Sử dụng summary từ API response
    return coursePricingData.summary;
  };

  const summaryStats = getSummaryStats();

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 hover:bg-orange-50 border-orange-200"
        >
          <DollarSign className="h-4 w-4" />
          Quản lý giá
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Quản lý giá - {coursePricingData?.courseTitle || courseName}
          </DialogTitle>
          <DialogDescription>
            Quản lý tất cả chính sách giá và chương trình khuyến mãi cho khóa
            học
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Pricing Display */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-medium text-slate-900 mb-3">Giá hiện tại</h4>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-slate-500">Đang tải...</span>
              </div>
            ) : currentPricing ? (
              <div className="space-y-2">
                <p className="text-2xl font-bold text-slate-700">
                  {currentPricing.currentPrice === null ||
                  currentPricing.currentPrice === 0
                    ? "Miễn phí"
                    : `${Number(currentPricing.currentPrice).toLocaleString()} VND`}
                </p>
                {currentPricing.hasPromotion && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                      🎉 Khuyến mãi
                    </span>
                    {currentPricing.promotionName && (
                      <span className="text-sm text-slate-600">
                        {currentPricing.promotionName}
                      </span>
                    )}
                  </div>
                )}
                {currentPricing.promotionEndDate && (
                  <p className="text-xs text-slate-500">
                    Hết hạn: {formatDate(currentPricing.promotionEndDate)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-500">Chưa có thông tin giá</p>
            )}
          </div>

          {/* Summary Statistics */}
          {isLoadingPolicies ? (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-3 rounded-lg text-center"
                >
                  <div className="h-8 w-12 bg-gray-200 animate-pulse rounded mx-auto mb-2"></div>
                  <div className="h-3 w-16 bg-gray-200 animate-pulse rounded mx-auto"></div>
                </div>
              ))}
            </div>
          ) : summaryStats ? (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {summaryStats.total}
                </p>
                <p className="text-xs text-blue-500">Tổng chính sách</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">
                  {summaryStats.byType.basePrice}
                </p>
                <p className="text-xs text-green-500">Giá cơ bản</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {summaryStats.byType.promotion}
                </p>
                <p className="text-xs text-purple-500">Khuyến mãi</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {summaryStats.byHeaderStatus.active}
                </p>
                <p className="text-xs text-orange-500">Đang hoạt động</p>
              </div>
              <div className="bg-cyan-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-cyan-600">
                  {summaryStats.byHeaderStatus.scheduled}
                </p>
                <p className="text-xs text-cyan-500">Đã lên lịch</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">
                  {summaryStats.byHeaderStatus.expired}
                </p>
                <p className="text-xs text-red-500">Đã hết hạn</p>
              </div>
            </div>
          ) : null}

          {/* Approval Status Summary */}
          {summaryStats && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-slate-700">
                  Trạng thái duyệt
                </h5>
                {isAdmin && summaryStats.byApprovalStatus.pending > 0 && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                    <AlertCircle className="h-3 w-3" />
                    <span className="font-medium">
                      {summaryStats.byApprovalStatus.pending} giá cần duyệt
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div
                  className={`bg-yellow-50 p-3 rounded-lg text-center ${
                    isAdmin && summaryStats.byApprovalStatus.pending > 0
                      ? "ring-2 ring-yellow-200 ring-offset-1"
                      : ""
                  }`}
                >
                  <p className="text-xl font-bold text-yellow-600">
                    {summaryStats.byApprovalStatus.pending}
                  </p>
                  <p className="text-xs text-yellow-500">
                    Chờ duyệt{isAdmin ? " (Admin)" : ""}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xl font-bold text-blue-600">
                    {summaryStats.byApprovalStatus.approved}
                  </p>
                  <p className="text-xs text-blue-500">Đã duyệt</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <p className="text-xl font-bold text-red-600">
                    {summaryStats.byApprovalStatus.rejected}
                  </p>
                  <p className="text-xs text-red-500">Bị từ chối</p>
                </div>
                {/* <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xl font-bold text-green-600">
                    {summaryStats.byApprovalStatus.active}
                  </p>
                  <p className="text-xs text-green-500">Đang áp dụng</p>
                </div> */}
                <div className="bg-indigo-50 p-3 rounded-lg text-center">
                  <p className="text-xl font-bold text-indigo-600">
                    {summaryStats.currentlyActive}
                  </p>
                  <p className="text-xs text-indigo-500">Hiệu lực hiện tại</p>
                </div>
              </div>
            </div>
          )}

          {/* All Pricing Policies Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-slate-900 flex items-center gap-2">
                Tất cả chính sách giá
                {isLoadingPolicies && (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                )}
              </h4>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
                disabled={isLoadingPolicies}
              >
                <Plus className="h-4 w-4 mr-2" />
                Thêm chính sách
              </Button>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên chính sách</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Trạng thái duyệt</TableHead>
                    <TableHead>Ngày bắt đầu</TableHead>
                    <TableHead>Ngày kết thúc</TableHead>
                    {/* <TableHead>Người duyệt</TableHead> */}
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPolicies ? (
                    // Loading skeleton for table rows
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                            <div className="h-3 w-24 bg-gray-200 animate-pulse rounded"></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="h-6 w-16 bg-gray-200 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                        </TableCell>
                        {/* <TableCell>
                          <div className="space-y-1">
                            <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
                            <div className="h-3 w-16 bg-gray-200 animate-pulse rounded"></div>
                          </div>
                        </TableCell> */}
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                            <div className="h-8 w-8 bg-gray-200 animate-pulse rounded"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : !coursePricingData ||
                    coursePricingData.prices.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-slate-500"
                      >
                        Chưa có chính sách giá nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    coursePricingData.prices.map((pricing) => (
                      <TableRow key={pricing.id} className="group">
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{pricing.name}</p>
                            {pricing.description && (
                              <p className="text-xs text-slate-500 mt-1">
                                {pricing.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(pricing.type)}</TableCell>
                        <TableCell className="font-semibold">
                          {editingPriceId === pricing.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                step="1000"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-24 h-8"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePriceUpdate(pricing.id)}
                                disabled={isUpdating}
                                className="h-8 px-2"
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditPrice}
                                disabled={isUpdating}
                                className="h-8 px-2"
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>
                                {Number(pricing.price).toLocaleString()} VND
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  startEditPrice(pricing.id, pricing.price)
                                }
                                disabled={isUpdating || isLoadingPolicies}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(pricing.headerStatus)}
                            {getStatusBadge(pricing.headerStatus)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getApprovalStatusBadge(pricing.approvalStatus)}
                        </TableCell>
                        <TableCell>
                          {formatDate(pricing.schedule.startDate)}
                        </TableCell>
                        <TableCell>
                          {formatDate(pricing.schedule.endDate)}
                        </TableCell>
                        {/* <TableCell>
                          {pricing.approval.reviewer ? (
                            <div className="text-sm">
                              <div className="font-medium">{pricing.approval.reviewer.name}</div>
                              <div className="text-slate-500">
                                {pricing.approval.reviewedAt && formatDate(pricing.approval.reviewedAt)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">Chưa duyệt</span>
                          )}
                        </TableCell> */}
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            {/* Workflow Action Buttons Based on Approval Status */}
                            {pricing.approvalStatus ===
                              PriceApprovalStatus.PENDING_APPROVAL &&
                            isAdmin ? (
                              // Admin can approve/reject pending prices
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleAdminApprovePrice(pricing.id)
                                  }
                                  disabled={
                                    adminApprovingId === pricing.id ||
                                    isUpdating ||
                                    isLoadingPolicies
                                  }
                                  className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                                  title="Duyệt giá"
                                >
                                  {adminApprovingId === pricing.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <ThumbsUp className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    showAdminRejectConfirmation(pricing.id)
                                  }
                                  disabled={
                                    adminRejectingId === pricing.id ||
                                    isUpdating ||
                                    isLoadingPolicies
                                  }
                                  className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                                  title="Từ chối giá"
                                >
                                  {adminRejectingId === pricing.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <ThumbsDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            ) : // pricing.approvalStatus ===
                            //   PriceApprovalStatus.APPROVED ? (
                            // Anyone can activate approved prices
                            // <Button
                            //   variant="outline"
                            //   size="sm"
                            //   onClick={() => handleActivatePrice(pricing.id)}
                            //   disabled={
                            //     activatingPriceId === pricing.id ||
                            //     isUpdating ||
                            //     isLoadingPolicies
                            //   }
                            //   className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                            //   title="Kích hoạt giá đã duyệt"
                            // >
                            //   {activatingPriceId === pricing.id ? (
                            //     <Loader2 className="h-4 w-4 animate-spin" />
                            //   ) : (
                            //     <>
                            //       <Play className="h-4 w-4 mr-1" />
                            //       Kích hoạt
                            //     </>
                            //   )}
                            // </Button>
                            // ) :
                            null}

                            {pricing.type === PricingType.PROMOTION ? (
                              <Select
                                value={pricing.headerStatus}
                                onValueChange={(value) =>
                                  handleStatusUpdate(
                                    pricing.id,
                                    value as PricingStatus,
                                  )
                                }
                                disabled={isUpdating || isLoadingPolicies}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={PricingStatus.ACTIVE}>
                                    Active
                                  </SelectItem>
                                  <SelectItem value={PricingStatus.INACTIVE}>
                                    Inactive
                                  </SelectItem>
                                  <SelectItem value={PricingStatus.SCHEDULED}>
                                    Scheduled
                                  </SelectItem>
                                  <SelectItem value={PricingStatus.EXPIRED}>
                                    Expired
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              // Hiển thị placeholder cho BASE_PRICE để giữ alignment
                              <div className="w-10 h-8 flex items-center justify-center">
                                <span
                                  className="text-xs text-gray-400 font-medium"
                                  title="Giá cơ bản không thể xóa"
                                >
                                  N/A
                                </span>
                              </div>
                            )}
                            {/* Chỉ hiển thị nút xóa cho PROMOTION, không cho BASE_PRICE */}
                            {pricing.type === PricingType.PROMOTION ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700"
                                    disabled={
                                      deletingId === pricing.id ||
                                      isLoadingPolicies
                                    }
                                  >
                                    {deletingId === pricing.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Xác nhận xóa
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bạn có chắc chắn muốn xóa chương trình
                                      khuyến mãi "{pricing.name}"? Hành động này
                                      không thể hoàn tác.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(pricing.id)}
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Xóa
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              // Hiển thị placeholder cho BASE_PRICE để giữ alignment
                              <div className="w-10 h-8 flex items-center justify-center">
                                <span
                                  className="text-xs text-gray-400 font-medium"
                                  title="Giá cơ bản không thể xóa"
                                >
                                  N/A
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Add New Pricing Form */}
          {showAddForm && (
            <div className="border rounded-lg p-4 bg-slate-50">
              <h4 className="font-medium text-slate-900 mb-4">
                Thêm chính sách giá mới
              </h4>

              {/* Workflow Explanation */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <strong>Quy trình xét duyệt:</strong> Sau khi tạo, giá sẽ ở
                    trạng thái <span className="font-medium">"Chờ duyệt"</span>{" "}
                    và cần admin xem xét trước khi có thể kích hoạt.
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Giá mới
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="1000"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0"
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Loại giá
                  </Label>
                  <Select
                    value={pricingType}
                    onValueChange={(value) =>
                      setPricingType(value as PricingType)
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PricingType.BASE_PRICE}>
                        Giá cơ bản
                      </SelectItem>
                      <SelectItem value={PricingType.PROMOTION}>
                        Khuyến mãi
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Mô tả
                  </Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="VD: Giá áp dụng cho học viên mới"
                    className="col-span-3"
                  />
                </div>

                {pricingType === PricingType.PROMOTION && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="promotionName" className="text-right">
                        Tên khuyến mãi
                      </Label>
                      <Input
                        id="promotionName"
                        value={promotionName}
                        onChange={(e) => setPromotionName(e.target.value)}
                        placeholder="VD: Giảm giá cuối năm"
                        className="col-span-3"
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="startDate" className="text-right">
                        Ngày bắt đầu
                      </Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="col-span-3"
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="endDate" className="text-right">
                        Ngày kết thúc
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    disabled={isUpdating}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isUpdating || isLoading}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang thêm...
                      </>
                    ) : (
                      "Thêm chính sách"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Admin Rejection Dialog */}
      <Dialog
        open={showAdminRejectDialog}
        onOpenChange={setShowAdminRejectDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Từ chối duyệt giá</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối để gửi phản hồi cho người tạo giá.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminRejectReason">Lý do từ chối *</Label>
              <Textarea
                id="adminRejectReason"
                placeholder="VD: Giá không phù hợp với thị trường, cần điều chỉnh giảm 20%..."
                value={adminRejectReason}
                onChange={(e) => setAdminRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAdminRejectDialog(false);
                setCurrentRejectingId(null);
                setAdminRejectReason("");
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={handleAdminRejectPrice}
              disabled={adminRejectingId !== null || !adminRejectReason.trim()}
              className="bg-red-500 hover:bg-red-600"
            >
              {adminRejectingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang từ chối...
                </>
              ) : (
                "Từ chối"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
