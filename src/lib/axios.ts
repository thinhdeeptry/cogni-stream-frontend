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
  | "gateway"
  | "storage"
  | "series"
  | "post";

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
  storage: "storage",
  series: "",
  post: "",
};

class AxiosFactory {
  private static instances: Map<ServiceName, AxiosInstance> = new Map();
  private static readonly GATEWAY_URL =
    process.env.NEXT_PUBLIC_GATEWAY_URL || "https://kong.eduforge.io.vn";
  private static getServiceApiKey(serviceName: ServiceName): string {
    const keyMap: Record<ServiceName, string | undefined> = {
      users: process.env.NEXT_PUBLIC_USER_SERVICE_API_KEY,
      courses: process.env.NEXT_PUBLIC_COURSE_SERVICE_API_KEY,
      payment: process.env.NEXT_PUBLIC_PAYMENT_SERVICE_API_KEY,
      enrollment: process.env.NEXT_PUBLIC_ENROLLMENT_SERVICE_API_KEY,
      assessment: process.env.NEXT_PUBLIC_ASSESSMENT_SERVICE_API_KEY,
      notification: process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_API_KEY,
      report: process.env.NEXT_PUBLIC_REPORT_SERVICE_API_KEY,
      discussion: process.env.NEXT_PUBLIC_DISCUSSION_SERVICE_API_KEY,
      gateway: process.env.NEXT_PUBLIC_GATEWAY_API_KEY,
      storage: process.env.NEXT_PUBLIC_STORAGE_SERVICE_API_KEY,
      series: process.env.NEXT_PUBLIC_SERIES_SERVICE_API_KEY,
      post: process.env.NEXT_PUBLIC_POST_SERVICE_API_KEY,
    };
    return keyMap[serviceName] || "";
  }

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
        "x-api-key": this.getServiceApiKey(serviceName),
        "x-service-name": serviceName,
      },
    });

    // Add request interceptor
    instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          // Check if we're in a client environment
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
                config.headers["X-Service-Name"] = serviceName;
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
          AxiosFactory.clearInstances();
        }
        return Promise.reject(error);
      },
    );

    this.instances.set(serviceName, instance);
    return instance;
  }

  static async getUserInfo(userId: string) {
    try {
      const userInstance = await this.getApiInstance("users");
      const response = await userInstance.get(`/users/internal/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user info:", error);
      throw error;
    }
  }

  static clearInstances() {
    this.instances.clear();
  }
}

export { AxiosFactory };
