import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { jwtDecode } from "jwt-decode";
import { getSession } from "next-auth/react";

// Định nghĩa interface cho config tùy chỉnh
interface CustomApiConfig extends AxiosRequestConfig {
  customHeaders?: Record<string, string>;
}

// Định nghĩa interface cho decoded JWT
interface DecodedToken {
  sub?: string;
  [key: string]: any;
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
  static readonly DEFAULT_TIMEOUT: number = 10000;

  // Định nghĩa base URL mặc định (dùng cho user service chạy ở local)
  static readonly DEFAULT_API_URL: string =
    process.env.NEXT_PUBLIC_KONG_API_URL || "https://kong.eduforge.io.vn/";

  // Định nghĩa base URL cho từng service (trừ user)
  static readonly SERVICE_BASE_URLS: Partial<Record<ServiceName, string>> = {
    course:
      process.env.NEXT_PUBLIC_COURSE_API_URL ||
      "https://course.eduforge.io.vn/",
    enrollment:
      process.env.NEXT_PUBLIC_ENROLLMENT_API_URL ||
      "https://enrollment.eduforge.io.vn/",
    payment:
      process.env.NEXT_PUBLIC_PAYMENT_API_URL ||
      "https://payment.eduforge.io.vn/",
    assessment:
      process.env.NEXT_PUBLIC_ASSESSMENT_API_URL ||
      "https://assessment.eduforge.io.vn/",
    notification:
      process.env.NEXT_PUBLIC_NOTIFICATION_API_URL ||
      "https://notification.eduforge.io.vn/",
    report:
      process.env.NEXT_PUBLIC_REPORT_API_URL ||
      "https://report.eduforge.io.vn/",
    discussion:
      process.env.NEXT_PUBLIC_DISCUSSION_API_URL ||
      "https://discussion.eduforge.io.vn/",
  };

  // Định nghĩa path cho từng service
  static readonly SERVICE_PATHS: Record<ServiceName, string> = {
    user: "/auth",
    course: "",
    enrollment: "",
    payment: "",
    assessment: "",
    notification: "",
    report: "",
    discussion: "",
  };
}

// Factory class để tạo API instances
class AxiosFactory {
  private static instances: Partial<Record<ServiceName, AxiosInstance>> = {};

  private static createInstance(
    serviceName: ServiceName,
    config: CustomApiConfig = {},
  ): AxiosInstance {
    const path = ApiConfig.SERVICE_PATHS[serviceName];
    const baseURL =
      ApiConfig.SERVICE_BASE_URLS[serviceName] || ApiConfig.DEFAULT_API_URL;

    if (!baseURL) {
      throw new Error(
        `Base URL cho service ${serviceName} không được định nghĩa`,
      );
    }
    if (path === undefined) {
      throw new Error(`Path cho service ${serviceName} không được định nghĩa`);
    }

    const instance = axios.create({
      baseURL: `${baseURL}${path}`,
      timeout: ApiConfig.DEFAULT_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        ...config.customHeaders,
        ...config.headers,
      },
      ...config,
    });

    // Gắn interceptor để tự động thêm token vào mọi request
    instance.interceptors.request.use(
      async (
        reqConfig: InternalAxiosRequestConfig,
      ): Promise<InternalAxiosRequestConfig> => {
        // Bỏ qua các route đăng nhập
        if (reqConfig.url?.includes("/auth/login")) {
          return reqConfig;
        }

        try {
          const session = await getSession();
          if (session?.accessToken) {
            reqConfig.headers = reqConfig.headers || {};
            reqConfig.headers.Authorization = `Bearer ${session.accessToken}`;

            // Giải mã JWT để lấy sub (userId)
            const decodedToken: DecodedToken = jwtDecode(session.accessToken);
            const userId = decodedToken.sub;

            if (userId) {
              reqConfig.headers["X-User-Id"] = userId;
            }
          }
        } catch (error) {
          console.error("Error getting session or decoding token:", error);
        }

        return reqConfig;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    return instance;
  }

  // Phương thức public để lấy instance với token tự động
  public static getApiInstance(
    serviceName: ServiceName,
    config?: CustomApiConfig,
  ): AxiosInstance {
    if (!this.instances[serviceName]) {
      this.instances[serviceName] = this.createInstance(serviceName, config);
    }
    return this.instances[serviceName]!;
  }

  // Reset instances (hữu ích khi logout)
  public static resetInstances(): void {
    this.instances = {};
  }
}

export { AxiosFactory };
