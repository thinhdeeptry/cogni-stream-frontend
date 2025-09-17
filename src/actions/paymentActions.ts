import { AxiosFactory } from "@/lib/axios";

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
    return response.data;
  } catch (error: any) {
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

    if (transaction.status !== "success") {
      throw new Error("Transaction chưa thành công");
    }

    if (!transaction.metadata) {
      throw new Error("Không tìm thấy thông tin metadata");
    }

    const metadata =
      typeof transaction.metadata === "string"
        ? JSON.parse(transaction.metadata)
        : transaction.metadata;

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
