// "use server";
import { AxiosFactory } from "@/lib/axios";

const revenueApi = await AxiosFactory.getApiInstance("courses");

// ============================================
// REVENUE SHARE TYPES
// ============================================

export interface RevenueShare {
  id: string;
  totalAmount: number;
  platformAmount: number;
  instructorAmount: number;
  platformRate: number;
  instructorRate: number;
  productType: "COURSE" | "CLASS";
  productId: string;
  productTitle: string;
  pricingHeaderId?: string;
  pricingDetailId?: string;
  originalPrice: number;
  finalPrice: number;
  createdAt: string;
  updatedAt: string;
  instructor: {
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  transaction: {
    id: string;
    orderId: string;
    status: string;
  };
  commissionDetail: {
    id: string;
    header: {
      id: string;
      name: string;
    };
  };
  pricingHeader?: {
    id: string;
    name: string;
  };
  pricingDetail?: {
    id: string;
    price: number;
  };
}

export interface RevenueShareSummary {
  instructorId: string;
  instructorName: string;
  totalRevenue: number;
  totalInstructorAmount: number;
  totalPlatformAmount: number;
  totalTransactions: number;
  averageCommissionRate: number;
  coursesCount: number;
  classesCount: number;
}

export interface PlatformSummary {
  totalRevenue: number;
  totalInstructorAmount: number;
  totalPlatformAmount: number;
  totalTransactions: number;
  averagePlatformRate: number;
  productBreakdown: {
    productType: "COURSE" | "CLASS";
    totalRevenue: number;
    totalInstructorAmount: number;
    totalPlatformAmount: number;
    totalTransactions: number;
  }[];
}

export interface TopInstructor {
  instructorId: string;
  instructorName: string;
  totalRevenue: number;
  totalInstructorAmount: number;
  totalPlatformAmount: number;
  totalTransactions: number;
}

export interface RevenuePreview {
  totalAmount: number;
  platformAmount: number;
  instructorAmount: number;
  platformRate: number;
  instructorRate: number;
  commissionDetail: {
    id: string;
    header: {
      id: string;
      name: string;
    };
  };
  error?: string;
}

export interface RevenueShareQueryParams {
  instructorId?: string;
  productType?: "COURSE" | "CLASS";
  productId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "totalAmount" | "instructorAmount";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// REVENUE SHARE FUNCTIONS
// ============================================

// Lấy danh sách revenue shares (Admin only)
export const getRevenueShares = async (
  params: RevenueShareQueryParams = {},
): Promise<PaginatedResponse<RevenueShare>> => {
  try {
    const queryParams = new URLSearchParams();

    if (params.instructorId)
      queryParams.append("instructorId", params.instructorId);
    if (params.productType)
      queryParams.append("productType", params.productType);
    if (params.productId) queryParams.append("productId", params.productId);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const { data } = await revenueApi.get(
      `/revenue-share?${queryParams.toString()}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching revenue shares:", error);
    throw error;
  }
};

// Lấy revenue của instructor hiện tại
export const getMyRevenue = async (
  params: Omit<RevenueShareQueryParams, "instructorId"> = {},
): Promise<PaginatedResponse<RevenueShare>> => {
  try {
    const queryParams = new URLSearchParams();

    if (params.productType)
      queryParams.append("productType", params.productType);
    if (params.productId) queryParams.append("productId", params.productId);
    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const { data } = await revenueApi.get(
      `/revenue-share/my-revenue?${queryParams.toString()}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching my revenue:", error);
    throw error;
  }
};

// Lấy tóm tắt revenue của instructor hiện tại
export const getMySummary = async (
  startDate?: string,
  endDate?: string,
): Promise<RevenueShareSummary> => {
  try {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const { data } = await revenueApi.get(
      `/revenue-share/my-summary?${queryParams.toString()}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching my summary:", error);
    throw error;
  }
};

// Lấy tóm tắt revenue của một instructor (Admin only)
export const getInstructorSummary = async (
  instructorId: string,
  startDate?: string,
  endDate?: string,
): Promise<RevenueShareSummary> => {
  try {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const { data } = await revenueApi.get(
      `/revenue-share/summary/instructor/${instructorId}?${queryParams.toString()}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching instructor summary:", error);
    throw error;
  }
};

// Lấy tóm tắt revenue của platform (Admin only)
export const getPlatformSummary = async (
  startDate?: string,
  endDate?: string,
): Promise<PlatformSummary> => {
  try {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const { data } = await revenueApi.get(
      `/revenue-share/summary/platform?${queryParams.toString()}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching platform summary:", error);
    throw error;
  }
};

// Lấy top instructors (Admin only)
export const getTopInstructors = async (
  limit?: number,
  startDate?: string,
  endDate?: string,
): Promise<TopInstructor[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append("limit", limit.toString());
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    const { data } = await revenueApi.get(
      `/revenue-share/top-instructors?${queryParams.toString()}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching top instructors:", error);
    throw error;
  }
};

// Lấy revenue share theo transaction ID (Admin only)
export const getRevenueShareByTransaction = async (
  transactionId: string,
): Promise<RevenueShare | null> => {
  try {
    const { data } = await revenueApi.get(
      `/revenue-share/transaction/${transactionId}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching revenue share by transaction:", error);
    throw error;
  }
};

// Lấy revenue share theo ID
export const getRevenueShare = async (id: string): Promise<RevenueShare> => {
  try {
    const { data } = await revenueApi.get(`/revenue-share/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching revenue share:", error);
    throw error;
  }
};

// Xem preview revenue trước khi thanh toán
export const getRevenuePreview = async (
  productType: "COURSE" | "CLASS",
  productId: string,
  amount: number,
): Promise<RevenuePreview> => {
  try {
    const { data } = await revenueApi.get(
      `/revenue-share/preview/${productType}/${productId}?amount=${amount}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching revenue preview:", error);
    throw error;
  }
};

// Tính lại revenue share cho một transaction (Admin only)
export const recalculateRevenueShare = async (
  transactionId: string,
): Promise<void> => {
  try {
    await revenueApi.post(`/revenue-share/recalculate/${transactionId}`);
  } catch (error) {
    console.error("Error recalculating revenue share:", error);
    throw error;
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format tiền tệ
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// Format phần trăm
export const formatPercentage = (rate: number): string => {
  return `${rate}%`;
};

// Tính commission preview
export const calculateCommissionPreview = (
  amount: number,
  platformRate: number,
  instructorRate: number,
) => {
  const platformAmount = (amount * platformRate) / 100;
  const instructorAmount = (amount * instructorRate) / 100;

  return {
    totalAmount: amount,
    platformAmount,
    instructorAmount,
    platformRate,
    instructorRate,
  };
};
