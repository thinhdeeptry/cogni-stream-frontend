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
    console.log("check api>> ", API_URL);

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password, name }),
    });
    const data = await response.json();
    console.log("check data >>> ", data);
    console.log("check response >>> ", response);
    console.log("check response ok >>> ", response.ok);
    console.log("check response status >>> ", response.status);

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
  // Hàm xử lý lỗi đăng nhập
  handleErrorsLogin = (response: Response, data: any) => {
    switch (response.status) {
      case 201:
        // Xử lý trường hợp đăng nhập thành công
        const accessToken = data.accessToken || data.access_token;
        const refreshToken = data.refreshToken || data.refresh_token;

        // Cập nhật vào store
        if (data.user && accessToken) {
          useUserStore.getState().setUser(data.user, accessToken);
          useUserStore.getState().setTokens(accessToken, refreshToken || "");
          console.log("Login successful, tokens stored");
        }
        return data;

      case 400:
        console.log("Account not activated:", data.userId);
        return {
          statusCode: 400,
          error: true,
          _id: data.userId,
          message:
            data.message ||
            "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email để kích hoạt.",
        };

      case 401:
        console.log("Authentication failed:", data);
        return {
          statusCode: 401,
          error: true,
          message: data.message || "Email hoặc mật khẩu không chính xác.",
        };

      case 500:
        console.error("Server error during login:", data);
        return {
          statusCode: 500,
          error: true,
          message:
            data.message || "Đã xảy ra lỗi từ server. Vui lòng thử lại sau.",
        };

      default:
        console.error("Unexpected error during login:", response.status, data);
        return {
          statusCode: response.status || 500,
          error: true,
          message:
            data.message ||
            "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.",
        };
    }
  };

  // Đăng nhập
  async login(email: string, password: string) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // để cookies hoạt động
      });

      const data = await response.json();

      // Sử dụng hàm handleErrors để kiểm tra lỗi
      if (!response.ok) {
        return this.handleErrorsLogin(response, data);
      }

      // Lưu refreshToken vào cookie
      const cookieStore = await cookies();
      if (data.refreshToken || data.refresh_token) {
        cookieStore.set({
          name: "refreshToken", // Sửa tên cookie để rõ ràng hơn
          value: data.refreshToken || data.refresh_token,
          httpOnly: true,
          path: "/",
          maxAge: 30 * 24 * 60 * 60, // 30 ngày
        });
      }

      // Cập nhật token vào store
      const accessToken = data.accessToken || data.access_token;
      const refreshToken = data.refreshToken || data.refresh_token;

      if (accessToken) {
        useUserStore.getState().setTokens(accessToken, refreshToken || "");
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      return {
        error: true,
        statusCode: 500,
        message:
          "Lỗi khi đăng nhập: " +
          (error instanceof Error ? error.message : "Unknown error"),
      };
    }
  }

  /**
   * Đăng nhập với Google
   * @param googleUser Thông tin người dùng từ Google
   * @returns Thông tin người dùng và token từ backend
   */
  async loginWithGoogle(googleUser: {
    email: string;
    name: string;
    image?: string;
    provider: string;
    providerId: string;
  }) {
    try {
      console.log("Calling loginWithGoogle API with data:", googleUser);

      const response = await fetch(`${API_URL}/auth/google-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleUser),
        credentials: "include", // để cookies hoạt động
      });

      const data = await response.json();
      console.log("Google login API response:", data);

      if (!response.ok) {
        return {
          error: true,
          statusCode: response.status,
          message: data.message || "Lỗi khi đăng nhập với Google",
        };
      }

      // Lưu refreshToken vào cookie
      const cookieStore = await cookies();
      if (data.refreshToken || data.refresh_token) {
        cookieStore.set({
          name: "refreshToken",
          value: data.refreshToken || data.refresh_token,
          httpOnly: true,
          path: "/",
          maxAge: 30 * 24 * 60 * 60, // 30 ngày
        });
      }

      // Cập nhật token vào store
      const accessToken = data.accessToken || data.access_token;
      const refreshToken = data.refreshToken || data.refresh_token;

      if (accessToken) {
        useUserStore.getState().setTokens(accessToken, refreshToken || "");
      }

      return data;
    } catch (error) {
      console.error("Google login error:", error);
      return {
        error: true,
        statusCode: 500,
        message:
          "Lỗi khi đăng nhập với Google: " +
          (error instanceof Error ? error.message : "Unknown error"),
      };
    }
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
      // Lấy refreshToken từ store
      const cookieStore = await cookies();
      const refreshToken = cookieStore.get("refreshToken")?.value;
      console.log("check refresh token >>> ", refreshToken);
      const response = await fetch(`${API_URL}/auth/token`, {
        method: "POST",
        headers: this.getHeaders(refreshToken || undefined),
        credentials: "include", // Vẫn giữ cookies để tương thích với cả hai cách
        body: JSON.stringify({ refreshToken }),
      });
      console.log("check response in refresh token >>> ", response);

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      // Cập nhật cả accessToken và refreshToken nếu server trả về refreshToken mới
      useUserStore
        .getState()
        .setTokens(
          data.accessToken || data.access_token,
          data.refreshToken || data.refresh_token || refreshToken,
        );
      return {
        accessToken: data.accessToken || data.access_token,
      };
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
    try {
      // Kiểm tra token hết hạn hoặc không tồn tại
      if (!accessToken || this.isTokenExpired(accessToken)) {
        // Lấy token mới từ refresh token
        const tokenResponse = await this.refresh();
        accessToken = tokenResponse.accessToken;
        console.log("Token đã được làm mới >>>", accessToken);
      }

      // Xây dựng query params
      const params = new URLSearchParams();
      if (query) params.append("query", query);
      params.append("current", current.toString());
      params.append("pageSize", pageSize.toString());

      const url = `${API_URL}/dashboard?${params.toString()}`;
      console.log("API URL >>> ", url);

      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(accessToken),
      });

      // Xử lý trường hợp token hết hạn (401)
      if (response.status === 401) {
        // Thử refresh token và gọi lại API
        const tokenResponse = await this.refresh();
        const newAccessToken = tokenResponse.accessToken;

        // Gọi lại API với token mới
        const retryResponse = await fetch(url, {
          method: "GET",
          headers: this.getHeaders(newAccessToken),
        });

        if (!retryResponse.ok) {
          const errorData = await retryResponse.json();
          return {
            error: true,
            statusCode: retryResponse.status,
            message:
              errorData.message || "Đã xảy ra lỗi khi lấy dữ liệu từ dashboard",
            data: null,
          };
        }

        const data = await retryResponse.json();
        return {
          error: false,
          statusCode: 200,
          message: "Lấy dữ liệu thành công",
          data: data,
        };
      }

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
    } catch (error) {
      console.error("Error fetching data:", error);
      return {
        error: true,
        statusCode: 500,
        message:
          "Lỗi khi lấy dữ liệu: " +
          (error instanceof Error ? error.message : "Unknown error"),
        data: null,
      };
    }
  }
  /**
   * Kiểm tra xem token đã hết hạn hay chưa
   * @param token JWT token cần kiểm tra
   * @param bufferTime Thời gian đệm (ms) trước khi token thực sự hết hạn để coi là hết hạn
   * @returns true nếu token đã hết hạn hoặc sắp hết hạn, false nếu còn hạn
   */
  isTokenExpired(token: string, bufferTime: number = 60000): boolean {
    if (!token) return true;

    try {
      const decoded: any = jwtDecode(token);

      // Kiểm tra xem token có chứa trường exp không
      if (!decoded.exp) {
        console.warn("Token does not contain expiration time");
        return true;
      }

      // Lấy thời gian hết hạn từ token (exp là timestamp tính bằng giây)
      const expirationTime = decoded.exp * 1000; // Chuyển sang milliseconds
      const currentTime = Date.now();

      // Trả về true nếu token đã hết hạn hoặc sắp hết hạn (mặc định là 60 giây)
      const isExpired = expirationTime <= currentTime + bufferTime;

      if (isExpired) {
        console.log("Token is expired or will expire soon");
      }

      return isExpired;
    } catch (error) {
      console.error("Error decoding token:", error);
      // Nếu không thể decode token, coi như token đã hết hạn
      return true;
    }
  }
}

export const authApi = new AuthApi();
