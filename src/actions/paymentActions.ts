import { AxiosFactory } from "@/lib/axios";

// ============================================
// PAYMENT TYPES
// ============================================

// Type cho dữ liệu tạo payment (tương ứng backend CreatePaymentDto)
export interface PaymentCreateDto {
  amount: number;
  orderId: string;
  orderDescription: string;
  orderType: string;
  studentId: string;
  metadata?: Record<string, any>;
}

// Type cho dữ liệu trả về từ handleReturn (backend trả về { status, message, data })
export interface PaymentReturnResponse {
  status: string;
  message: string;
  paymentUrl?: string; // Thêm trường này để FE lấy url thanh toán
  returnUrl?: string; // Thêm returnUrl từ backend
  orderId?: string; // orderId từ backend
  metadata?: any; // metadata từ backend
  data: {
    orderId: string;
    vnpTransactionNo?: string;
    vnpResponseCode?: string;
    amount?: number;
    orderDescription?: string;
    transaction?: any; // Thay vì payment, giờ là transaction
  } | null;
}

// ============================================
// PAYOUT METHOD TYPES
// ============================================

export interface PayoutMethod {
  id: string;
  teacherId: string;
  methodType: "BANK_ACCOUNT" | "E_WALLET";
  accountHolderName: string;
  accountNumber: string; // This will be masked from backend
  bankName: string;
  bankBranch?: string;
  bankCode?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PAYMENT RECORD TYPES
// ============================================

export interface PaymentRecord {
  id: string;
  amount: number;
  description?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  transactionId?: string;
  failureReason?: string;
  paidAt?: string;
  notes?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  teacher: {
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  payoutMethod: {
    id: string;
    methodType: "BANK_ACCOUNT" | "E_WALLET";
    accountHolderName: string;
    bankName: string;
    bankBranch?: string;
    isDefault: boolean;
  };
  processedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TeacherPaymentSummary {
  teacher: {
    id: string;
    name: string;
    email: string;
    totalRevenue: number;
    totalPaidOut: number;
    pendingPayout: number;
  };
  paymentHistory: {
    totalPayments: number;
    totalAmountPaid: number;
    recentPayments: PaymentRecord[];
  };
}

export interface CreatePaymentRecordDto {
  payoutMethodId: string;
  amount: number;
  description?: string;
  notes?: string;
}

export interface UpdatePaymentRecordDto {
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  failureReason?: string;
  paidAt?: string;
  notes?: string;
}

export interface PaymentRecordQueryParams {
  teacherId?: string;
  status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// ============================================
// PAYMENT FUNCTIONS
// ============================================

// Tạo payment (POST /payments/create)
export const createPaymentVnpay = async (
  data: PaymentCreateDto,
): Promise<PaymentReturnResponse> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    console.log(paymentApi);
    const response = await paymentApi.post("/payments/create", data);
    return response.data;
  } catch (error: any) {
    return {
      status: "error",
      message:
        error.response?.data?.message || error.message || "Lỗi tạo thanh toán",
      data: null,
    };
  }
};

// Xử lý kết quả trả về từ VNPAY (GET /payments/vnpay_return)
export const handleVnpayReturn = async (
  query: Record<string, any>,
): Promise<PaymentReturnResponse> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.get("/payments/vnpay_return", {
      params: query,
    });
    return response.data;
  } catch (error: any) {
    return {
      status: "error",
      message:
        error.response?.data?.message ||
        error.message ||
        "Lỗi xác thực thanh toán",
      data: null,
    };
  }
};

// Lấy thông tin payment theo ID (GET /payments/:id)
export const getPaymentById = async (paymentId: string): Promise<any> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.get(`/payments/${paymentId}`);

    // Handle case where transaction is not found
    if (response.data?.status === "not_found") {
      return {
        status: "not_found",
        message: "Transaction not found",
        data: null,
      };
    }

    return response.data;
  } catch (error: any) {
    // Return null data instead of throwing for not found cases
    if (error.response?.status === 404) {
      return {
        status: "not_found",
        message: "Transaction not found",
        data: null,
      };
    }

    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Lỗi lấy thông tin thanh toán",
    );
  }
};

// Tạo enrollment sau khi thanh toán thành công
export const createEnrollmentAfterPayment = async (
  orderId: string,
): Promise<any> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");

    // 1. Lấy thông tin transaction
    const transaction = await getPaymentById(orderId);

    // Handle case where transaction is not found
    if (
      !transaction ||
      transaction.status === "not_found" ||
      !transaction.data
    ) {
      throw new Error("Không tìm thấy thông tin giao dịch");
    }

    if (transaction.data.status !== "success") {
      throw new Error("Transaction chưa thành công");
    }

    if (!transaction.data.metadata) {
      throw new Error("Không tìm thấy thông tin metadata");
    }

    const metadata =
      typeof transaction.data.metadata === "string"
        ? JSON.parse(transaction.data.metadata)
        : transaction.data.metadata;

    const { courseId, userId, courseType, classId } = metadata;

    // 2. Tạo enrollment
    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
    const enrollmentData = {
      studentId: userId,
      type: courseType === "ONLINE" ? ("ONLINE" as const) : ("STREAM" as const),
      ...(courseType === "ONLINE" ? { courseId } : { classId }),
      progress: 0,
      isCompleted: false,
      transactionId: orderId,
    };

    const response = await enrollmentApi.post("/enrollments", enrollmentData);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || error.message || "Lỗi tạo enrollment",
    );
  }
};

// ============================================
// PAYMENT RECORD FUNCTIONS
// ============================================

// Tạo payment record mới (Giảng viên tạo yêu cầu thanh toán)
export const createPaymentRecord = async (
  data: CreatePaymentRecordDto,
): Promise<PaymentRecord> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.post("/payments/records", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating payment record:", error);
    throw error;
  }
};

// Lấy danh sách payment records với filter
export const getPaymentRecords = async (
  params: PaymentRecordQueryParams = {},
): Promise<PaginatedResponse<PaymentRecord>> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const queryParams = new URLSearchParams();

    if (params.teacherId) queryParams.append("teacherId", params.teacherId);
    if (params.status) queryParams.append("status", params.status);
    if (params.fromDate) queryParams.append("fromDate", params.fromDate);
    if (params.toDate) queryParams.append("toDate", params.toDate);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const response = await paymentApi.get(
      `/payments/records?${queryParams.toString()}`,
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching payment records:", error);
    // For new teachers without payment records, return empty paginated response
    if (error.response?.status === 404) {
      return {
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: params.limit || 10,
        },
      };
    }
    throw error;
  }
};

// Lấy chi tiết payment record
export const getPaymentRecord = async (id: string): Promise<PaymentRecord> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.get(`/payments/records/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching payment record:", error);
    throw error;
  }
};

// Lấy tổng quan thanh toán của giảng viên hiện tại
export const getMyPaymentSummary = async (): Promise<TeacherPaymentSummary> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.get(`/payments/teacher/current/summary`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching my payment summary:", error);
    // For new teachers without data, return default summary instead of throwing
    if (error.response?.status === 404 || error.response?.status === 500) {
      return {
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
      };
    }
    throw error;
  }
};

// Lấy tổng quan thanh toán của teacher theo ID (Admin)
export const getTeacherPaymentSummary = async (
  teacherId: string,
): Promise<TeacherPaymentSummary> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.get(
      `/payments/teacher/${teacherId}/summary`,
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching teacher payment summary:", error);
    throw error;
  }
};

// ============================================
// PAYOUT METHOD FUNCTIONS
// ============================================

// Tạo payout method mới
export const createMyPayoutMethod = async (data: {
  methodType: "BANK_ACCOUNT";
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  bankBranch?: string;
  bankCode?: string;
  isDefault?: boolean;
}): Promise<PayoutMethod> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.post("/payout/methods", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating payout method:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Lỗi tạo phương thức thanh toán",
    );
  }
};

// Lấy danh sách payout methods của teacher hiện tại
export const getMyPayoutMethods = async (): Promise<PayoutMethod[]> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.get("/payout/methods");
    return Array.isArray(response.data) ? response.data : [];
  } catch (error: any) {
    console.error("Error fetching payout methods:", error);
    // Return empty array instead of throwing for better UX with new teachers
    return [];
  }
};

// Cập nhật payout method
export const updatePayoutMethod = async (
  id: string,
  data: {
    accountHolderName?: string;
    accountNumber?: string;
    bankName?: string;
    bankBranch?: string;
    bankCode?: string;
    isDefault?: boolean;
  },
): Promise<PayoutMethod> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.put(`/payout/methods/${id}`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error updating payout method:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Lỗi cập nhật phương thức thanh toán",
    );
  }
};

// Xóa payout method
export const deletePayoutMethod = async (id: string): Promise<void> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    await paymentApi.delete(`/payout/methods/${id}`);
  } catch (error: any) {
    console.error("Error deleting payout method:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Lỗi xóa phương thức thanh toán",
    );
  }
};

// Set payout method as default
export const setDefaultPayoutMethod = async (
  id: string,
): Promise<PayoutMethod> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.patch(
      `/payout/methods/${id}/set-default`,
    );
    return response.data;
  } catch (error: any) {
    console.error("Error setting default payout method:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Lỗi thiết lập phương thức thanh toán mặc định",
    );
  }
};

// Tạo payout record (yêu cầu rút tiền chờ admin duyệt)
export const createPayoutRecord = async (data: {
  amount: number;
  description: string;
}): Promise<PaymentRecord> => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.post("/payout/records", data);
    return response.data;
  } catch (error: any) {
    console.error("Error creating payout record:", error);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Lỗi tạo yêu cầu rút tiền",
    );
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStatusBadgeColor = (status: string) => {
  const colors = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

export const getStatusLabel = (status: string) => {
  const labels = {
    PENDING: "Chờ xử lý",
    PROCESSING: "Đang xử lý",
    COMPLETED: "Hoàn thành",
    FAILED: "Thất bại",
    CANCELLED: "Đã hủy",
  };

  return labels[status as keyof typeof labels] || status;
};
