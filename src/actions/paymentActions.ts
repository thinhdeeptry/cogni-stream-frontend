// "use server"
import { AxiosFactory } from "@/lib/axios";

export const createPayment = async (paymentData: {
  amount: number;
  method: string;
  serviceName: string;
  description: string;
  orderCode: string; // Frontend sử dụng orderCode
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
    instructor?: string;
    duration?: string;
    level: string;
    categoryName?: string;
  };
}) => {
  try {
    // Chuyển đổi orderCode thành ordercode để khớp với backend
    const validatedPaymentData = {
      ...paymentData,
      method: "BANK_TRANSFER",
      ordercode: paymentData.orderCode, // Chuyển đổi tên trường
    };

    // Xóa trường orderCode để tránh gửi cả hai
    delete validatedPaymentData.orderCode;

    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.post("/", validatedPaymentData);

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
    console.error("Error creating payment:", error);
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Có lỗi xảy ra khi tạo thanh toán",
      data: null,
    };
  }
};

export const generateOrderCode = () => {
  const now = new Date();
  const x = parseInt(
    String(now.getFullYear()).slice(-2) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0"),
  );
  console.log("giá trị x: ", x);
  return x;
};

// Cập nhật trạng thái đơn hàng
export async function updateOrderStatus(orderId: number, status: string) {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.put(`/order/${orderId}/status`, {
      status,
    });
    return {
      success: true,
      data: response.data,
      message: `Cập nhật trạng thái đơn hàng thành ${status}`,
    };
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Lỗi cập nhật trạng thái đơn hàng",
      error,
    };
  }
}

// Lấy thông tin đơn hàng
export async function getOrderById(orderId: number) {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.get(`/order/${orderId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error fetching order:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi lấy thông tin đơn hàng",
      error,
    };
  }
}

// Lấy thông tin đơn hàng theo mã đơn hàng
export async function getOrderByCode(orderCode: number | string) {
  try {
    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.get(`/order/${orderCode}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error fetching order:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi lấy thông tin đơn hàng",
      error,
    };
  }
}

// Tạo enrollment sau khi thanh toán thành công
export async function createEnrollmentAfterPayment(paymentData: any) {
  try {
    if (!paymentData?.metadata?.userId || !paymentData?.metadata?.courseId) {
      return {
        success: false,
        message: "Thiếu thông tin người dùng hoặc khóa học",
      };
    }

    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
    const response = await enrollmentApi.post(`/`, {
      courseId: paymentData.metadata.courseId,
      userId: paymentData.metadata.userId,
      userName: paymentData.metadata.userName || "",
      courseName: paymentData.description || "",
      isFree: false,
      paymentId: paymentData.id,
      status: "ACTIVE",
    });

    return {
      success: true,
      data: response.data,
      message: "Đăng ký khóa học thành công",
    };
  } catch (error: any) {
    console.error("Error creating enrollment:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi đăng ký khóa học",
      error,
    };
  }
}

// Kiểm tra trạng thái đăng ký
export async function checkEnrollmentStatus(userId: string, courseId: string) {
  try {
    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
    const response = await enrollmentApi.get(`/`, {
      params: {
        userId,
        courseId,
      },
    });

    if (response.data && response.data.length > 0) {
      // Lọc chỉ lấy enrollment đúng với courseId được chỉ định
      const matchingEnrollment = response.data.find(
        (enroll) => enroll.courseId === courseId && enroll.userId === userId,
      );

      if (matchingEnrollment) {
        return {
          success: true,
          isEnrolled: matchingEnrollment.status === "ACTIVE",
          data: matchingEnrollment,
        };
      }
    }

    return {
      success: true,
      isEnrolled: false,
      data: null,
    };
  } catch (error: any) {
    console.error("Error checking enrollment status:", error);
    return {
      success: false,
      isEnrolled: false,
      message:
        error.response?.data?.message || "Lỗi kiểm tra trạng thái đăng ký",
      error,
    };
  }
}
