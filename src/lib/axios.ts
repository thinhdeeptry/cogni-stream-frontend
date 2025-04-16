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
  | "user"
  | "course"
  | "enrollment"
  | "payment"
  | "assessment"
  | "notification"
  | "report"
  | "discussion";

class AxiosFactory {
  private static instances: Map<ServiceName, AxiosInstance> = new Map();

  // Base API URL for user service
  private static readonly API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

  // Định nghĩa base URL cho các services khác
  private static readonly SERVICE_BASE_URLS: Record<
    Exclude<ServiceName, "user">,
    string
  > = {
    course:
      process.env.NEXT_PUBLIC_COURSE_API_URL || "https://course.eduforge.io.vn",
    enrollment:
      process.env.NEXT_PUBLIC_ENROLLMENT_API_URL ||
      "https://enrollment.eduforge.io.vn",
    payment:
      process.env.NEXT_PUBLIC_PAYMENT_API_URL ||
      "https://payment.eduforge.io.vn",
    assessment:
      process.env.NEXT_PUBLIC_ASSESSMENT_API_URL ||
      "https://assessment.eduforge.io.vn",
    notification:
      process.env.NEXT_PUBLIC_NOTIFICATION_API_URL ||
      "https://notification.eduforge.io.vn",
    report:
      process.env.NEXT_PUBLIC_REPORT_API_URL || "https://report.eduforge.io.vn",
    discussion:
      process.env.NEXT_PUBLIC_DISCUSSION_API_URL ||
      "https://discussion.eduforge.io.vn",
  };

  private static readonly GATEWAY_URL =
    process.env.NEXT_PUBLIC_GATEWAY_URL || "https://kong.eduforge.io.vn";

  static async getApiInstance(
    serviceName: ServiceName,
  ): Promise<AxiosInstance> {
    if (this.instances.has(serviceName)) {
      return this.instances.get(serviceName)!;
    }

    let baseURL: string;

    // Special handling for user service
    if (serviceName === "user") {
      baseURL = this.API_URL;
    }
    // Temporary direct access to enrollment service for testing
    else if (serviceName === "enrollment") {
      baseURL = this.SERVICE_BASE_URLS.enrollment;
    }
    // All other services go through gateway
    else {
      baseURL = this.GATEWAY_URL;
    }

    const instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor
    instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Skip auth for login routes
        if (config.url?.includes("/auth/login")) {
          return config;
        }

        const session = await getSession();
        if (session?.accessToken) {
          config.headers["Authorization"] = `Bearer ${session.accessToken}`;

          try {
            const decoded = jwtDecode(session.accessToken) as DecodedToken;
            if (decoded.sub) {
              config.headers["X-User-Id"] = decoded.sub;
            }
          } catch (error) {
            console.error("Error decoding JWT:", error);
          }
        }

        return config;
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
