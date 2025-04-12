import useUserStore from "@/stores/useUserStoree";

import { AxiosFactory } from "./axios";

/**
 * API Client để sử dụng trong toàn bộ ứng dụng
 * Tự động xử lý refresh token và authentication
 */
class ApiClient {
  /**
   * Gọi API không cần xác thực
   * @param serviceName Tên service cần gọi
   * @param endpoint Endpoint của API
   * @param method HTTP method
   * @param data Dữ liệu gửi lên (cho POST, PUT, PATCH)
   * @param params Query params (cho GET)
   * @returns Promise với kết quả từ API
   */
  static async callPublicApi(
    serviceName: any,
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
    data?: any,
    params?: any,
  ) {
    const api = AxiosFactory.getApiInstance(serviceName);

    try {
      const response = await api({
        url: endpoint,
        method,
        data,
        params,
      });

      return response.data;
    } catch (error) {
      console.error(`Error calling ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Gọi API cần xác thực
   * @param serviceName Tên service cần gọi
   * @param endpoint Endpoint của API
   * @param method HTTP method
   * @param data Dữ liệu gửi lên (cho POST, PUT, PATCH)
   * @param params Query params (cho GET)
   * @returns Promise với kết quả từ API
   */
  static async callAuthenticatedApi(
    serviceName: any,
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" = "GET",
    data?: any,
    params?: any,
  ) {
    // Kiểm tra xem có token không
    const accessToken = useUserStore.getState().accessToken;

    if (!accessToken) {
      console.error("No access token available");
      throw new Error("Bạn cần đăng nhập để thực hiện thao tác này");
    }

    const api = AxiosFactory.getJwtInstance(serviceName);

    try {
      const response = await api({
        url: endpoint,
        method,
        data,
        params,
      });

      return response.data;
    } catch (error) {
      console.error(
        `Error calling authenticated ${method} ${endpoint}:`,
        error,
      );
      throw error;
    }
  }
}

export default ApiClient;
