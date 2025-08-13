"use client";

import { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import {
  CoursePrice,
  CoursePricingPolicies,
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
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  createPricing,
  deletePricingPolicy,
  getCourseCurrentPrice,
  getCoursePricingPolicies,
  updatePricingPrice,
  updatePricingStatus,
} from "@/actions/pricingActions";

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
          p.status === PricingStatus.ACTIVE &&
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
      await updatePricingStatus(courseId, pricingId, newStatus);

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
      await deletePricingPolicy(pricingId, courseId);

      toast({
        title: "Thành công",
        description: "Xóa pricing policy thành công",
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
      await updatePricingPrice(courseId, pricingId, Number(editPrice));

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
      await createPricing({
        courseId,
        name:
          pricingType === PricingType.PROMOTION ? promotionName : `Giá cơ bản`,
        price: Number(newPrice),
        description: description || undefined,
        type: pricingType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      toast({
        title: "Thành công",
        description: "Thêm chính sách giá thành công",
      });

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
      resetForm();
    }
  };

  // Tính toán summary statistics
  const getSummaryStats = () => {
    if (!coursePricingData) return null;

    const prices = coursePricingData.prices;
    const basePrices = prices.filter((p) => p.type === "BASE_PRICE");
    const promotions = prices.filter((p) => p.type === "PROMOTION");
    const activePromotions = promotions.filter(
      (p) => p.status === PricingStatus.ACTIVE,
    );
    const scheduledPromotions = promotions.filter(
      (p) => p.status === PricingStatus.SCHEDULED,
    );
    const expiredPromotions = promotions.filter(
      (p) => p.status === PricingStatus.EXPIRED,
    );

    return {
      totalPolicies: prices.length,
      basePrices: basePrices.length,
      promotions: promotions.length,
      activePromotions: activePromotions.length,
      scheduledPromotions: scheduledPromotions.length,
      expiredPromotions: expiredPromotions.length,
    };
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
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
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
                  {summaryStats.totalPolicies}
                </p>
                <p className="text-xs text-blue-500">Tổng chính sách</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">
                  {summaryStats.basePrices}
                </p>
                <p className="text-xs text-green-500">Giá cơ bản</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {summaryStats.promotions}
                </p>
                <p className="text-xs text-purple-500">Khuyến mãi</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {summaryStats.activePromotions}
                </p>
                <p className="text-xs text-orange-500">Đang hoạt động</p>
              </div>
              <div className="bg-cyan-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-cyan-600">
                  {summaryStats.scheduledPromotions}
                </p>
                <p className="text-xs text-cyan-500">Đã lên lịch</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">
                  {summaryStats.expiredPromotions}
                </p>
                <p className="text-xs text-red-500">Đã hết hạn</p>
              </div>
            </div>
          ) : null}

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
                    <TableHead>Ngày bắt đầu</TableHead>
                    <TableHead>Ngày kết thúc</TableHead>
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
                          <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                        </TableCell>
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
                        colSpan={7}
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
                            {getStatusIcon(pricing.status)}
                            {getStatusBadge(pricing.status)}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(pricing.startDate)}</TableCell>
                        <TableCell>{formatDate(pricing.endDate)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Select
                              value={pricing.status}
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
    </Dialog>
  );
}
