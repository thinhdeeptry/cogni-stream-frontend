import { AxiosFactory } from "@/lib/axios";

// ============================================
// PAYOUT METHOD TYPES
// ============================================

export interface PayoutMethod {
  id: string;
  methodType: "BANK_ACCOUNT" | "E_WALLET";
  accountHolderName: string;
  accountNumber: string; // Masked account number
  bankName: string;
  bankBranch?: string;
  bankCode?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayoutMethodDto {
  methodType: "BANK_ACCOUNT" | "E_WALLET";
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  bankBranch?: string;
  bankCode?: string;
  isDefault?: boolean;
}

export interface UpdatePayoutMethodDto {
  accountHolderName?: string;
  accountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  bankCode?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CreatePayoutRecordDto {
  amount: number;
  description: string;
}

// ============================================
// PAYOUT METHOD FUNCTIONS
// ============================================

// Lấy danh sách payout methods của giảng viên hiện tại
export const getMyPayoutMethods = async (): Promise<PayoutMethod[]> => {
  try {
    const payoutApi = await AxiosFactory.getApiInstance("payout");
    const response = await payoutApi.get("/methods");

    // Ensure response data is always an array
    const data = response.data;
    console.log("Payout methods response data:", data);
    if (!Array.isArray(data)) {
      console.warn("Payout methods API response is not an array:", data);
      return [];
    }

    return data;
  } catch (error: any) {
    console.error("Error fetching my payout methods:", error);
    throw error;
  }
};

// Lấy danh sách payout methods của teacher theo ID (Admin)
export const getTeacherPayoutMethods = async (
  teacherId: string,
): Promise<PayoutMethod[]> => {
  try {
    const payoutApi = await AxiosFactory.getApiInstance("payout");
    const response = await payoutApi.get(`/teacher/${teacherId}/methods`);

    const data = response.data;
    if (!Array.isArray(data)) {
      console.warn(
        "Teacher payout methods API response is not an array:",
        data,
      );
      return [];
    }

    return data;
  } catch (error: any) {
    console.error("Error fetching teacher payout methods:", error);
    throw error;
  }
};

// Lấy chi tiết payout method
export const getPayoutMethod = async (id: string): Promise<PayoutMethod> => {
  try {
    const payoutApi = await AxiosFactory.getApiInstance("payout");
    const response = await payoutApi.get(`/methods/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching payout method:", error);
    throw error;
  }
};

// Tạo payout method mới cho giảng viên hiện tại
export const createMyPayoutMethod = async (
  data: CreatePayoutMethodDto,
): Promise<PayoutMethod> => {
  try {
    const payoutApi = await AxiosFactory.getApiInstance("payout");
    const response = await payoutApi.post("/methods", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating payout method:", error);
    throw error;
  }
};

// Cập nhật payout method
export const updatePayoutMethod = async (
  id: string,
  data: UpdatePayoutMethodDto,
): Promise<PayoutMethod> => {
  try {
    const payoutApi = await AxiosFactory.getApiInstance("payout");
    const response = await payoutApi.put(`/methods/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error updating payout method:", error);
    throw error;
  }
};

// Xóa payout method
export const deletePayoutMethod = async (id: string): Promise<void> => {
  try {
    const payoutApi = await AxiosFactory.getApiInstance("payout");
    await payoutApi.delete(`/methods/${id}`);
  } catch (error: any) {
    console.error("Error deleting payout method:", error);
    throw error;
  }
};

// Set payout method as default
export const setDefaultPayoutMethod = async (
  id: string,
): Promise<PayoutMethod> => {
  try {
    const payoutApi = await AxiosFactory.getApiInstance("payout");
    const response = await payoutApi.patch(`/methods/${id}/set-default`);
    return response.data;
  } catch (error: any) {
    console.error("Error setting default payout method:", error);
    throw error;
  }
};

// Tạo payout record (yêu cầu rút tiền chờ admin duyệt)
export const createPayoutRecord = async (
  data: CreatePayoutRecordDto,
): Promise<any> => {
  try {
    const payoutApi = await AxiosFactory.getApiInstance("payout");
    const response = await payoutApi.post("/records", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating payout record:", error);
    throw error;
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const formatAccountNumber = (accountNumber: string): string => {
  // Mask account number for display (show only last 4 digits)
  if (!accountNumber || accountNumber.length < 4) return accountNumber;
  return `****${accountNumber.slice(-4)}`;
};

export const getMethodTypeLabel = (methodType: string) => {
  const labels = {
    BANK_ACCOUNT: "Tài khoản ngân hàng",
    E_WALLET: "Ví điện tử",
  };

  return labels[methodType as keyof typeof labels] || methodType;
};

export const getMethodTypeBadgeColor = (methodType: string) => {
  const colors = {
    BANK_ACCOUNT: "bg-blue-100 text-blue-800",
    E_WALLET: "bg-purple-100 text-purple-800",
  };

  return (
    colors[methodType as keyof typeof colors] || "bg-gray-100 text-gray-800"
  );
};
