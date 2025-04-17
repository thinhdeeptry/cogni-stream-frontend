import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { jwtDecode } from "jwt-decode";
import { getSession } from "next-auth/react";

import { authApi } from "./api/authApi";

interface DecodedToken {
  sub?: string;
  exp?: number;
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
  | "discussion"
  | "gateway";

class AxiosFactory {
  private static instances: Map<ServiceName, AxiosInstance> = new Map();
  private static readonly GATEWAY_URL =
    process.env.NEXT_PUBLIC_GATEWAY_URL || "https://kong.eduforge.io.vn/";
  private static isRefreshing = false;
  private static refreshSubscribers: ((token: string) => void)[] = [];

  private static onRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private static subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private static async refreshAuthToken() {
    try {
      const result = await authApi.refresh();
      return result.accessToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      // Redirect to login or handle refresh failure
      window.location.href = "/auth/login";
      return null;
    }
  }

  static async getApiInstance(
    serviceName: ServiceName,
  ): Promise<AxiosInstance> {
    if (this.instances.has(serviceName)) {
      return this.instances.get(serviceName)!;
    }

    const instance = axios.create({
      baseURL: this.GATEWAY_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request Interceptor
    instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Skip auth for public routes
        if (
          config.url?.includes("/auth/login") ||
          config.url?.includes("/auth/register") ||
          config.url?.includes("/auth/google") ||
          config.url?.includes("/auth/facebook") ||
          config.url?.includes("/auth/token")
        ) {
          return config;
        }

        const session = await getSession();
        if (!session?.accessToken) {
          throw new Error("No access token available");
        }

        try {
          const decoded = jwtDecode(session.accessToken) as DecodedToken;
          if (!decoded.sub) {
            throw new Error("Invalid token structure - no sub claim");
          }

          // Check if token is expired or will expire soon (30 seconds buffer)
          const currentTime = Math.floor(Date.now() / 1000);
          if (decoded.exp && decoded.exp - currentTime < 30) {
            const newToken = await this.refreshAuthToken();
            if (newToken) {
              config.headers["Authorization"] = `Bearer ${newToken}`;
            }
          } else {
            config.headers["Authorization"] = `Bearer ${session.accessToken}`;
          }

          config.headers["X-User-Id"] = decoded.sub;
        } catch (error) {
          console.error("Token processing error:", error);
          throw new Error("Invalid access token");
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response Interceptor
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for token refresh
            return new Promise((resolve) => {
              this.subscribeTokenRefresh((token: string) => {
                originalRequest.headers["Authorization"] = `Bearer ${token}`;
                resolve(instance(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAuthToken();
            this.isRefreshing = false;

            if (newToken) {
              this.onRefreshed(newToken);
              originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
              return instance(originalRequest);
            }
          } catch (refreshError) {
            this.isRefreshing = false;
            this.clearInstances();
            // Redirect to login
            window.location.href = "/auth/login";
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );

    this.instances.set(serviceName, instance);
    return instance;
  }

  static clearInstances() {
    this.instances.clear();
    this.refreshSubscribers = [];
    this.isRefreshing = false;
  }
}

export { AxiosFactory };
