import { AxiosFactory } from "@/lib/axios";

export const createPayment = async (paymentData: {
  amount: number;
  method: string;
  serviceName: string;
  description: string;
  orderCode: string;
  userId: string;
  serviceId: string;
  returnUrl: string;
  cancelUrl: string;
  metadata: {
    courseId: string;
    userId: string;
    userName: string;
    courseName: string;
    serviceType: string;
    instructor: string;
    duration: string;
    level: string;
  };
}) => {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.post("/", paymentData);

    if (response.data?.checkoutUrl) {
      return {
        error: false,
        success: true,
        data: response.data,
        checkoutUrl: response.data.checkoutUrl,
      };
    } else {
      throw new Error("Không thể tạo trang thanh toán");
    }
  } catch (error) {
    return {
      error: true,
      success: false,
      message: error.message || "Có lỗi xảy ra khi tạo thanh toán",
      data: null,
    };
  }
};

export const generateOrderCode = () => {
  const now = new Date();
  return parseInt(
    String(now.getFullYear()).slice(-2) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0"),
  );
};
