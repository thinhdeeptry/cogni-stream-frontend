import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

import useUserStore from "@/stores/useUserStoree";

import { authApi } from "./api/authApi";

// Định nghĩa interface cho config tùy chỉnh
interface CustomApiConfig extends AxiosRequestConfig {
  customHeaders?: Record<string, string>;
}

// Định nghĩa các service name hợp lệ
type ServiceName =
  | "user"
  | "course"
  | "enrollment"
  | "payment"
  | "assessment"
  | "notification"
  | "report"
  | "discussion";

// Config cơ bản
class ApiConfig {
  static readonly BASE_URL: string =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost";
  static readonly DEFAULT_TIMEOUT: number = 10000;

  static readonly SERVICE_PORTS: Record<ServiceName, string> = {
    user: process.env.NEXT_PUBLIC_USER_SERVICE || "3001",
    course: process.env.NEXT_PUBLIC_COURSE_SERVICE || "3002",
    enrollment: process.env.NEXT_PUBLIC_ENROLLMENT_SERVICE || "3003",
    payment: process.env.NEXT_PUBLIC_PAYMENT_SERVICE || "3004",
    assessment: process.env.NEXT_PUBLIC_ASSESSMENT_SERVICE || "3005",
    notification: process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE || "3006",
    report: process.env.NEXT_PUBLIC_REPORT_SERVICE || "3007",
    discussion: process.env.NEXT_PUBLIC_DISCUSSION_SERVICE || "3008",
  };
}

// Hàm lấy JWT token từ Zustand store
const getJwtToken = (): string | null => {
  // Lấy accessToken từ Zustand store
  if (typeof window !== "undefined") {
    return useUserStore.getState().accessToken || null;
  }
  return null;
};

// Biến để theo dõi trạng thái refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
  config: InternalAxiosRequestConfig;
}> = [];

// Xử lý hàng đợi các request bị trễ do refresh token
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.config.headers.Authorization = `Bearer ${token}`;
      prom.resolve(axios(prom.config));
    }
  });

  failedQueue = [];
};

// Factory class để tạo API instances
class AxiosFactory {
  private static instances: Partial<Record<ServiceName, AxiosInstance>> = {};
  private static jwtInstances: Partial<Record<ServiceName, AxiosInstance>> = {};

  private static createInstance(
    serviceName: ServiceName,
    config: CustomApiConfig = {},
  ): AxiosInstance {
    const port = ApiConfig.SERVICE_PORTS[serviceName];

    if (!port) {
      throw new Error(
        `Port cho service ${serviceName} không được định nghĩa trong env`,
      );
    }

    return axios.create({
      baseURL: `${ApiConfig.BASE_URL}:${port}`,
      timeout: ApiConfig.DEFAULT_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        ...config.customHeaders,
        ...config.headers,
      },
      ...config,
    });
  }

  // Phương thức public để lấy instance thông thường
  public static getApiInstance(
    serviceName: ServiceName,
    config?: CustomApiConfig,
  ): AxiosInstance {
    if (!this.instances[serviceName]) {
      this.instances[serviceName] = this.createInstance(serviceName, config);
    }
    return this.instances[serviceName]!;
  }

  // Phương thức public để lấy instance với JWT
  public static getJwtInstance(
    serviceName: ServiceName,
    config?: CustomApiConfig,
  ): AxiosInstance {
    if (!this.jwtInstances[serviceName]) {
      const instance = this.createInstance(serviceName, config);

      // Thêm token vào header của mỗi request
      instance.interceptors.request.use(
        (reqConfig: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
          const token = getJwtToken();
          if (token) {
            reqConfig.headers = reqConfig.headers || {};
            reqConfig.headers.Authorization = `Bearer ${token}`;
          }
          return reqConfig;
        },
        (error) => {
          return Promise.reject(error);
        },
      );

      // Xử lý response và refresh token khi cần
      instance.interceptors.response.use(
        (response: AxiosResponse) => response,
        async (error: AxiosError) => {
          const originalRequest = error.config as InternalAxiosRequestConfig;

          // Kiểm tra nếu lỗi là 401 (Unauthorized) và chưa thử refresh token
          if (
            error.response?.status === 401 &&
            !originalRequest.headers["X-Retry-After-Refresh"]
          ) {
            if (isRefreshing) {
              // Nếu đang refresh token, thêm request vào hàng đợi
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject, config: originalRequest });
              });
            }

            isRefreshing = true;

            try {
              // Gọi API refresh token
              const tokenResponse = await authApi.refresh();
              const newToken = tokenResponse.accessToken;

              if (newToken) {
                // Cập nhật token mới vào header của request gốc
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                originalRequest.headers["X-Retry-After-Refresh"] = "true";

                // Xử lý các request đang chờ trong hàng đợi
                processQueue(null, newToken);

                // Thử lại request gốc với token mới
                return axios(originalRequest);
              }
            } catch (refreshError) {
              // Xử lý lỗi refresh token
              console.error("Failed to refresh token:", refreshError);
              processQueue(refreshError, null);

              // Chuyển hướng đến trang đăng nhập nếu cần
              if (typeof window !== "undefined") {
                // Xóa token và thông tin người dùng
                useUserStore.getState().clearUser();

                // Chuyển hướng đến trang đăng nhập
                window.location.href = "/auth/login";
              }
            } finally {
              isRefreshing = false;
            }
          }

          return Promise.reject(error);
        },
      );

      this.jwtInstances[serviceName] = instance;
    }
    return this.jwtInstances[serviceName]!;
  }
}

export { AxiosFactory };
