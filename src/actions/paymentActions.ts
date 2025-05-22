// "use server";
import { AxiosFactory } from "@/lib/axios";

interface PaymentData {
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
    instructor?: string;
    duration?: string;
    level: string;
    categoryName?: string;
  };
}

interface ValidatedPaymentData extends Omit<PaymentData, "orderCode"> {
  ordercode: string;
}

export const createPayment = async (paymentData: PaymentData) => {
  try {
    // Giới hạn mô tả tối đa 25 ký tự
    const truncatedDescription = paymentData.description.substring(0, 25);

    // Chuyển đổi orderCode thành ordercode để khớp với backend
    const validatedPaymentData: ValidatedPaymentData = {
      ...paymentData,
      description: truncatedDescription,
      method: "BANK_TRANSFER",
      ordercode: paymentData.orderCode,
    };

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
  } catch (error: any) {
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

export const generateOrderCode = async () => {
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
    console.log(`Updating order ${orderId} status to ${status}`);

    // Đảm bảo status là chữ hoa và khớp với enum payment_status
    let normalizedStatus = status.toUpperCase();

    // Kiểm tra và chuyển đổi nếu cần
    if (normalizedStatus === "SUCCESS") normalizedStatus = "COMPLETED";

    console.log(`Normalized status: ${normalizedStatus}`);

    const paymentApi = await AxiosFactory.getApiInstance("payment");
    const response = await paymentApi.put(`/order/${orderId}/status`, {
      status: normalizedStatus,
    });

    console.log(`Update response:`, response.data);

    return {
      success: true,
      data: response.data,
      message: `Cập nhật trạng thái đơn hàng thành ${normalizedStatus}`,
    };
  } catch (error: any) {
    console.error("Error updating order status:", error);
    console.error("Error details:", error.response?.data);

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

interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  status: string;
  [key: string]: any;
}

// Tạo hoặc cập nhật enrollment sau khi thanh toán thành công
export async function createEnrollmentAfterPayment(paymentData: any) {
  try {
    console.log("Processing enrollment with payment data:", paymentData);

    if (!paymentData?.metadata?.userId || !paymentData?.metadata?.courseId) {
      console.error("Missing required metadata:", paymentData?.metadata);
      return {
        success: false,
        message: "Thiếu thông tin người dùng hoặc khóa học",
      };
    }
    console.log("ĐÂY LÀ PAYMENT ID:", paymentData.id);

    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");

    // Tạo enrollment mới với status ACTIVE
    const enrollmentData = {
      courseId: paymentData.metadata.courseId,
      userId: paymentData.metadata.userId,
      userName: paymentData.metadata.userName || "",
      courseName:
        paymentData.description || paymentData.metadata.courseName || "",
      isFree: false,
      paymentId: paymentData.id,
      status: "ACTIVE", // Đảm bảo status là ACTIVE
    };

    console.log("Creating enrollment with data:", enrollmentData);

    try {
      const response = await enrollmentApi.post("/", enrollmentData);
      console.log("Enrollment creation response:", response.data);

      return {
        success: true,
        data: response.data,
        message: "Đăng ký khóa học thành công",
      };
    } catch (error: any) {
      // Nếu lỗi là "User is already enrolled", thử cập nhật status
      if (
        error.response?.data?.message ===
        "User is already enrolled in this course"
      ) {
        console.log(
          "User already enrolled, trying to update enrollment status",
        );

        // Lấy danh sách enrollment của user
        const userEnrollmentsResponse = await enrollmentApi.get(
          `/user/${paymentData.metadata.userId}/courses`,
        );
        console.log("User enrollments:", userEnrollmentsResponse.data);

        // Tìm enrollment cho khóa học hiện tại
        const existingEnrollment = userEnrollmentsResponse.data.find(
          (e: Enrollment) => e.courseId === paymentData.metadata.courseId,
        );

        if (existingEnrollment && existingEnrollment.id) {
          console.log("Found existing enrollment:", existingEnrollment);

          // Cập nhật status thành ACTIVE
          const updateResponse = await enrollmentApi.put(
            `/${existingEnrollment.id}/status`,
            {
              status: "ACTIVE",
            },
          );

          console.log("Status update response:", updateResponse.data);

          return {
            success: true,
            data: updateResponse.data,
            message: "Cập nhật trạng thái đăng ký khóa học thành công",
          };
        }

        // Nếu không tìm thấy enrollment cụ thể, vẫn coi như thành công
        return {
          success: true,
          message: "Người dùng đã đăng ký khóa học này",
        };
      }

      // Nếu là lỗi khác, ném lại
      throw error;
    }
  } catch (error: any) {
    console.error("Error processing enrollment:", error);
    console.error("Error response:", error.response?.data);

    return {
      success: false,
      message: error.response?.data?.message || "Lỗi đăng ký khóa học",
      error,
    };
  }
}

// Kiểm tra trạng thái enrollment
export async function checkEnrollmentStatus(userId: string, courseId: string) {
  try {
    console.log(
      `Checking enrollment status for user ${userId} in course ${courseId}`,
    );

    // Thêm timestamp để tránh cache
    const timestamp = new Date().getTime();
    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");
    const response = await enrollmentApi.get(
      `/check/${userId}/${courseId}?_t=${timestamp}`,
    );

    console.log("Enrollment check response:", response.data);

    return {
      success: true,
      isEnrolled: response.data.enrolled === true,
    };
  } catch (error: any) {
    console.error("Error checking enrollment status:", error);
    console.error("Error details:", error.response?.data);

    return {
      success: false,
      isEnrolled: false,
      message:
        error.response?.data?.message || "Lỗi kiểm tra trạng thái đăng ký",
      error,
    };
  }
}

// Cập nhật trạng thái enrollment thành ACTIVE
export async function updateEnrollmentStatus(userId: string, courseId: string) {
  try {
    console.log(
      `Updating enrollment status for user ${userId} in course ${courseId}`,
    );

    const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");

    // Lấy danh sách enrollment của user
    const userEnrollmentsResponse = await enrollmentApi.get(
      `/user/${userId}/courses`,
    );
    console.log("User enrollments:", userEnrollmentsResponse.data);

    // Tìm enrollment cho khóa học hiện tại
    const existingEnrollment = userEnrollmentsResponse.data.find(
      (e: Enrollment) => e.courseId === courseId,
    );

    if (existingEnrollment && existingEnrollment.id) {
      console.log("Found existing enrollment:", existingEnrollment);

      // Cập nhật status thành ACTIVE
      const updateResponse = await enrollmentApi.put(
        `/${existingEnrollment.id}/status`,
        {
          status: "ACTIVE",
        },
      );

      console.log("Status update response:", updateResponse.data);

      return {
        success: true,
        data: updateResponse.data,
        message: "Cập nhật trạng thái đăng ký khóa học thành công",
      };
    }

    return {
      success: false,
      message: "Không tìm thấy enrollment cho khóa học này",
    };
  } catch (error) {
    console.error("Error updating enrollment status:", error);
    return {
      success: false,
      message: "Lỗi khi cập nhật trạng thái enrollment",
      error,
    };
  }
}
