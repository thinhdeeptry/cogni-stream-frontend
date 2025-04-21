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
  payment: "payment",
  assessment: "assessment",
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
        // Skip auth for login and public routes
        if (
          config.url?.includes("/auth/login") ||
          config.url?.includes("/auth/register") ||
          config.url?.includes("/auth/google") ||
          config.url?.includes("/auth/facebook")
        ) {
          return config;
        }

        const session = await getSession();

        if (!session?.accessToken) {
          console.error("No access token found in session");
          throw new Error("No access token available");
        }

        try {
          const decoded = jwtDecode(session.accessToken) as DecodedToken;
          if (!decoded.sub) {
            throw new Error("Invalid token structure - no sub claim");
          }

          // Set both required headers
          config.headers["Authorization"] = `Bearer ${session.accessToken}`;
          config.headers["X-User-Id"] = decoded.sub;
        } catch (error) {
          console.error("Token processing error:", error);
          throw new Error("Invalid access token");
        }

        return config;
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
