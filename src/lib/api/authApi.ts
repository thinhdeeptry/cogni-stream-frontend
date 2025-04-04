import { cookies } from "next/headers";

import { jwtDecode } from "jwt-decode";

import useUserStore from "@/stores/useUserStoree";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Lớp gọi API cho Auth
class AuthApi {
  // Helper để thêm header Authorization nếu có token
  private getHeaders(token?: string) {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  // Đăng ký người dùng
  handleErrorsRegister = (response: Response, data: any) => {
    switch (response.status) {
      case 201:
        return {
          statusCode: 201,
          error: false,
          message:
            "Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.",
          data: data,
        };
      case 400:
        return {
          statusCode: 400,
          error: true,
          message:
            data.message ||
            "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt.",
        };
      default:
        return {
          statusCode: 500,
          error: true,
          message:
            data.message || "Đã xảy ra lỗi từ server. Vui lòng thử lại sau.",
        };
    }
  };
  async register(email: string, password: string, name: string) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password, name }),
    });
    const data = await response.json();

    if (!response.ok) {
      return this.handleErrorsRegister(response, data);
    }
    return {
      statusCode: 201,
      error: false,
      message:
        "Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.",
      data: data,
    };
  }
  // Hàm xử lý lỗi
  handleErrorsLogin = (response: Response, data: any) => {
    switch (response.status) {
      case 201:
        localStorage.setItem("refreshToken", data.refreshToken);
        useUserStore.getState().setUser(data.user, data.access_token);
        useUserStore.getState().setTokens(data.access_token, data.refreshToken);
        console.log(
          "check refreshTOken >>> ",
          useUserStore.getState().refreshToken,
        );
        return data;
      case 400:
        console.log("check response in authAPI >> ", data.userId);

        return {
          statusCode: 400,
          error: true,
          _id: data.userId,
          message:
            data.message ||
            "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt.",
        };
      case 401:
        console.log("API error 401:", data);
        return {
          statusCode: 401,
          error: true,
          message: data.message || "Email hoặc mật khẩu không chính xác.",
        };
      case 500:
        return {
          statusCode: 500,
          error: true,
          message:
            data.message || "Đã xảy ra lỗi từ server. Vui lòng thử lại sau.",
        };
      default:
        return {
          statusCode: 500,
          error: true,
          message:
            data.message || "Đã xảy ra lỗi từ server. Vui lòng thử lại sau.",
        };
    }
  };

  // Đăng nhập
  async login(email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include", // để cookies hoạt động
    });
    const data = await response.json();
    const cookieStore = await cookies();
    cookieStore.set({
      name: "name",
      value: data.refreshToken,
      httpOnly: true,
      path: "/",
    }); // Cập nhật accessToken vào store
    if (data.accessToken) {
      useUserStore
        .getState()
        .setTokens(data.accessToken, data.refreshToken || "");
    }
    // Sử dụng hàm handleErrors để kiểm tra lỗi
    if (!response.ok) {
      return this.handleErrorsLogin(response, data);
    }
    return data;
  }

  handleErrorsVerify = (response: Response, data: any) => {
    switch (response.status) {
      case 201:
        return {
          statusCode: 201,
          error: false,
          message: "Xác thực OTP thành công. Tài khoản đã được kích hoạt.",
          data: data,
        };
      case 400:
        return {
          statusCode: 400,
          error: true,
          message:
            data.message ||
            "Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại mã OTP.",
        };
      default:
        return {
          statusCode: 500,
          error: true,
          message:
            data.message || "Đã xảy ra lỗi từ server. Vui lòng thử lại sau.",
        };
    }
  };
  handleErrorsRefreshOTP = (response: Response, data: any) => {
    switch (response.status) {
      case 201:
        return {
          statusCode: 201,
          error: false,
          message:
            "Gửi mã OTP thành công. Vui lòng kiểm tra email để xác thực.",
          data: data,
        };
      case 400:
        return {
          statusCode: 400,
          error: true,
          message: data.message || "Gửi mã OTP thất bại.",
        };
      default:
        return {
          statusCode: 500,
          error: true,
          message:
            data.message || "Đã xảy ra lỗi từ server. Vui lòng thử lại sau.",
        };
    }
  };
  async verifyOTP(id: string, otp: string) {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, otp }),
    });

    const data = await response.json();

    // Sử dụng hàm handleErrors để kiểm tra lỗi
    if (!response.ok) {
      return this.handleErrorsVerify(response, data);
    }
    return data;
  }
  async refreshOTP(id: string) {
    const response = await fetch(`${API_URL}/auth/refresh-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const data = await response.json();

    // Sử dụng hàm handleErrors để kiểm tra lỗi
    if (!response.ok) {
      return this.handleErrorsRefreshOTP(response, data);
    }
    return data;
  }
  // Lấy thông tin hồ sơ
  async getProfile(accessToken: string) {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: "POST",
      headers: this.getHeaders(accessToken),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch profile");
    }

    return response.json();
  }
  // làm mới token
  async refresh(): Promise<{ accessToken: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/token`, {
        method: "GET",
        credentials: "include", // Important to include cookies
      });
      console.log("check response in api >>> ", response);

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      useUserStore.getState().setTokens(data.accessToken, ""); // Cập nhật accessToken
      return data;
    } catch (error) {
      console.error("Token refresh error:", error);
      // Handle authentication errors, possibly by redirecting to login
      throw error;
    }
  }
  async getData(
    accessToken: string,
    query: string = "",
    current: number = 1,
    pageSize: number = 10,
  ) {
    if (!accessToken || this.isTokenExpired(accessToken)) {
      const accessTokenNew = await this.refresh();
      accessToken = accessTokenNew.accessToken;
      console.log("check accessTokenNew >>>", accessTokenNew);
    }

    // Xây dựng query params
    const params = new URLSearchParams();
    if (query) params.append("query", query);
    // params.append('query', current.toString());
    params.append("current", current.toString());
    params.append("pageSize", pageSize.toString());

    const url = `${API_URL}/dashboard?${params.toString()}`;
    console.log("check url>>> ", url);

    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(accessToken),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: true,
        statusCode: response.status,
        message:
          errorData.message || "Đã xảy ra lỗi khi lấy dữ liệu từ dashboard",
        data: null,
      };
    }

    const data = await response.json();
    return {
      error: false,
      statusCode: 200,
      message: "Lấy dữ liệu thành công",
      data: data,
    };
  }
  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      // Lấy thời gian hết hạn từ token (exp là timestamp tính bằng giây)
      const expirationTime = decoded.exp * 1000; // Chuyển sang milliseconds
      const currentTime = Date.now();

      // Trả về true nếu token đã hết hạn hoặc sắp hết hạn (còn dưới 30 giây)
      return expirationTime <= currentTime + 400000;
    } catch (error) {
      console.error("Error decoding token:", error);
      // Nếu không thể decode token, coi như token đã hết hạn
      return true;
    }
  }
}

export const authApi = new AuthApi();
