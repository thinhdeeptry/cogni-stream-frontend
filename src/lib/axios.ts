import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import axiosRetry from "axios-retry";
import { jwtDecode } from "jwt-decode";
import { getSession } from "next-auth/react";

interface DecodedToken {
  sub?: string;
  [key: string]: any;
}

// Giữ lại ServiceName để tương thích với các file đang gọi getApiInstance
// Dù bây giờ chúng ta chỉ dùng 1 instance.
type ServiceName =
  | "users"
  | "courses"
  | "enrollment"
  | "payment"
  | "assessment"
  | "notification"
  | "report"
  | "discussion"
  | "gateway"
  | "storage"
  | "series"
  | "post"
  | "sessions"
  | "instructor"
  | "progress"
  | "certificates"
  | "teachers"
  | "class-chat";

const paths: Record<ServiceName, string> = {
  users: "users",
  courses: "",
  enrollment: "enrollments",
  payment: "payments",
  assessment: "",
  notification: "notification",
  report: "report",
  discussion: "discussion",
  gateway: "gateway",
  storage: "storage",
  series: "",
  post: "",
  sessions: "",
  instructor: "",
  progress: "",
  certificates: "certificates",
  teachers: "teachers",
  "class-chat": "class-chat",
};

class AxiosFactory {
  private static instance: AxiosInstance | null = null;
  private static readonly API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://be.cognistream.id.vn"; // URL của backend monolith

  private static createInstance(): AxiosInstance {
    console.log("api: ", this.API_URL);
    const instance = axios.create({
      baseURL: this.API_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Configure retry logic
    axiosRetry(instance, {
      retries: 3,
      retryDelay: (retryCount: number) => retryCount * 1000,
      retryCondition: (error: AxiosError) => {
        return Boolean(
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
            (error.response && error.response.status >= 500),
        );
      },
      onRetry: (retryCount: number, error: AxiosError, requestConfig: any) => {
        console.warn(`Retry attempt ${retryCount} for ${requestConfig.url}`);
      },
    });

    // Add request interceptor
    instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          if (typeof window !== "undefined") {
            const session = await getSession();
            if (session?.accessToken) {
              try {
                const decoded = jwtDecode(session.accessToken) as DecodedToken;
                config.headers["Authorization"] =
                  `Bearer ${session.accessToken}`;
                if (decoded.sub) {
                  config.headers["X-User-Id"] = decoded.sub;
                }
              } catch (error) {
                console.warn("Token processing warning:", error);
              }
            }
          }
          return config;
        } catch (error) {
          console.warn("Session retrieval warning:", error);
          return config;
        }
      },
      (error) => {
        console.error("Request interceptor error:", error);
        return Promise.reject(error);
      },
    );

    // Add response interceptor for error handling
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Khi bị 401, xóa instance để request sau tạo lại, có thể xử lý đăng xuất ở đây
          AxiosFactory.clearInstances();
        }
        return Promise.reject(error);
      },
    );

    return instance;
  }

  static async getApiInstance(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    serviceName: ServiceName,
  ): Promise<AxiosInstance> {
    if (!this.instance) {
      this.instance = this.createInstance();
    }
    return this.instance;
  }

  static async getUserInfo(userId: string) {
    try {
      // Đường dẫn có thể cần thay đổi tùy theo cấu trúc API của monolith
      const userInstance = await this.getApiInstance("users");
      const response = await userInstance.get(`/users/internal/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user info:", error);
      throw error;
    }
  }

  static clearInstances() {
    this.instance = null;
  }
}

export { AxiosFactory };
