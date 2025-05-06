import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { jwtDecode } from "jwt-decode";
import { getSession } from "next-auth/react";

interface DecodedToken {
  sub?: string;
  [key: string]: any;
}

type ServiceName =
  | "users"
  | "courses"
  | "enrollment"
  | "payment"
  | "assessment"
  | "notification"
  | "report"
  | "discussion"
  | "gateway";

const paths: Record<ServiceName, string> = {
  users: "users",
  courses: "",
  enrollment: "enrollment",
  payment: "payments",
  assessment: "",
  notification: "notification",
  report: "report",
  discussion: "discussion",
  gateway: "gateway",
};

class AxiosFactory {
  private static instances: Map<ServiceName, AxiosInstance> = new Map();
  private static readonly GATEWAY_URL =
    process.env.NEXT_PUBLIC_GATEWAY_URL || "https://kong.eduforge.io.vn/";

  static async getApiInstance(
    serviceName: ServiceName,
  ): Promise<AxiosInstance> {
    if (this.instances.has(serviceName)) {
      return this.instances.get(serviceName)!;
    }

    const instance = axios.create({
      baseURL: `${this.GATEWAY_URL}/${paths[serviceName]}`,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor
    instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          const session = await getSession();

          // Nếu có session và accessToken, thêm vào headers
          if (session?.accessToken) {
            try {
              const decoded = jwtDecode(session.accessToken) as DecodedToken;
              config.headers["Authorization"] = `Bearer ${session.accessToken}`;

              // Chỉ thêm X-User-Id nếu có sub claim
              if (decoded.sub) {
                config.headers["X-User-Id"] = decoded.sub;
              }
            } catch (error) {
              console.warn("Token processing warning:", error);
              // Không throw error, cho phép request tiếp tục mà không có headers
            }
          }

          return config;
        } catch (error) {
          console.warn("Session retrieval warning:", error);
          return config; // Vẫn cho phép request tiếp tục
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
          // Clear instances on auth error to force re-creation
          AxiosFactory.clearInstances();
        }
        return Promise.reject(error);
      },
    );

    this.instances.set(serviceName, instance);
    return instance;
  }

  static clearInstances() {
    this.instances.clear();
  }
}

export { AxiosFactory };
