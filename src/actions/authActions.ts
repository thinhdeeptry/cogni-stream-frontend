// actions/login.ts
"use server";

import { redirect } from "next/dist/server/api-utils";

import { auth, signIn } from "@/auth";
import { authApi } from "@/lib/api/authApi";

// actions/login.ts

// actions/login.ts

// actions/login.ts

// actions/login.ts

export async function loginUser(email: string, password: string) {
  try {
    console.log("loginUser: Attempting to sign in with email:", email);

    // First attempt to sign in
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false, // Không redirect tự động, xử lý bằng FE
    });

    console.log("loginUser: Sign in result:", {
      ok: !result?.error,
      error: result?.error || null,
      url: result?.url || null,
    });

    // Check if there was an error during sign in
    if (result?.error) {
      // Try to parse the error if it's in JSON format
      try {
        const errorData = JSON.parse(result.error);
        console.log("check error Data>>> ", errorData);

        // Handle non-activated account
        if (errorData.name === "AccountNotActivatedError") {
          return {
            error: true,
            success: false,
            message:
              "Tài khoản chưa được kích hoạt. Vui lòng xác thực email của bạn.",
            status: 401,
            redirectTo: `/verify/${errorData.userId}`,
          };
        }
      } catch (parseError) {
        // If error is not in JSON format, continue with normal error handling
      }
      // Generic error for failed login
      return {
        error: true,
        success: false,
        message: "Email hoặc mật khẩu không chính xác.",
        status: 400,
      };
    }
    // If login successful, get session to check user role
    const session = await auth();
    console.log("loginUser: Session after sign in:", {
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
          }
        : null,
      accessToken: session?.accessToken ? "[EXISTS]" : "[MISSING]",
      refreshToken: session?.refreshToken ? "[EXISTS]" : "[MISSING]",
    });

    // Redirect based on user role
    if (session?.user?.role === "ADMIN") {
      return {
        error: false,
        success: true,
        message: "Đăng nhập thành công!",
        redirectTo: "/admin",
        status: 200,
      };
    }

    // Default successful login response
    return {
      error: false,
      success: true,
      message: "Đăng nhập thành công!",
      redirectTo: "/",
      status: 200,
    };
  } catch (error: any) {
    // Handle specific error types
    if (error.name === "AccountNotActivatedError") {
      // Try to get user ID from error or response
      const userId = error.userId || error._id;
      return {
        error: true,
        success: false,
        message:
          "Tài khoản chưa được kích hoạt. Vui lòng xác thực email của bạn.",
        status: 401,
        redirectTo: `/verify/${userId}`,
      };
    } else if (error.name === "InvalidEmailPasswordError") {
      return {
        error: true,
        success: false,
        message: "Email hoặc mật khẩu không chính xác.",
        status: 400,
      };
    }

    // Generic error response
    return {
      error: true,
      success: false,
      message: "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.",
      status: 500,
    };
  }
}

export async function signUpUser(
  email: string,
  password: string,
  name: string,
) {
  try {
    const result = await authApi.register(email, password, name);

    // Nếu thành công, trả về thông tin để FE xử lý chuyển hướng
    if (result.error) {
      if (result.statusCode === 400) {
        return {
          error: true,
          success: false,
          message: result.message,
          status: 400,
        };
      }
      return {
        error: true,
        success: false,
        message: "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.",
        status: 500,
      };
    }
    return {
      error: false,
      success: true,
      message: "",
      redirectTo: `/verify/${result.data._id}`,
      data: result.data,
      status: 200,
    };
  } catch (error) {
    return {
      error: true,
      success: false,
      message: "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.",
      status: 500,
    };
  }
}
export async function verifyUser(id: string, otp: string) {
  try {
    const result = await authApi.verifyOTP(id, otp);

    // Nếu thành công, trả về thông tin để FE xử lý chuyển hướng
    if (result.error) {
      if (result.statusCode === 400) {
        return result;
      }
      return result;
    }
    return {
      error: false,
      success: true,
      message: "Xác thực thành công!",
      redirectTo: `/auth/login`,
      data: result.data,
      status: 200,
    };
  } catch (error) {
    return {
      error: true,
      success: false,
      message: "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.",
      status: 500,
    };
  }
}
export async function RefreshOTPUser(id: string) {
  try {
    const result = await authApi.refreshOTP(id);
    // Nếu thành công, trả về thông tin để FE xử lý chuyển hướng
    if (result.error) {
      if (result.statusCode === 400) {
        return {
          error: true,
          success: false,
          message: result.message,
          status: 400,
        };
      }
      return {
        error: true,
        success: false,
        message: "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.",
        status: 500,
      };
    }
    return {
      error: false,
      success: true,
      message: result.message,
      data: result.data,
      status: 200,
    };
  } catch (error) {
    return {
      error: true,
      success: false,
      message: "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.",
      status: 500,
    };
  }
}
export async function getDashboardData(
  query: string = "",
  current: number = 1,
  pageSize: number = 10,
) {
  try {
    const session = await auth();

    const accessToken = session?.accessToken;

    const result = await authApi.getData(
      accessToken || "",
      query,
      current,
      pageSize,
    );
    console.log("check result in action >>>", result.data);

    if (result.error) {
      return {
        error: true,
        success: false,
        message: result.message,
        status: result.statusCode,
      };
    }

    return {
      error: false,
      success: true,
      message: "Lấy dữ liệu thành công",
      data: result.data,
      status: 200,
    };
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    return {
      error: true,
      success: false,
      message: "Đã xảy ra lỗi khi lấy dữ liệu dashboard. Vui lòng thử lại sau.",
      status: 500,
    };
  }
}
const API_URL = process.env.NEXT_PUBLIC_API_URL;
export async function requestPasswordReset(email: string) {
  try {
    const result = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    }).then((res) => res.json());

    console.log("Password reset request result:", result);

    if (result.message === "Không tìm thấy người dùng") {
      return {
        error: true,
        success: false,
        message: "Email không tồn tại trong hệ thống",
        status: 404,
      };
    }

    return {
      error: false,
      success: true,
      message: "Mã xác thực đã được gửi đến email của bạn",
      id: result.id,
      otp: result.otp, // Note: In production, you should not return the OTP
      status: 200,
    };
  } catch (error) {
    console.error("Password reset request error:", error);
    return {
      error: true,
      success: false,
      message: "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.",
      status: 500,
    };
  }
}

export async function resetPassword(
  email: string,
  otp: string,
  password: string,
) {
  try {
    const newPassword = password;
    const result = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp, newPassword }),
    }).then((res) => res.json());

    console.log("Password reset result:", result);

    if (result.statusCode === 400) {
      return {
        error: true,
        success: false,
        message: result.message,
        status: 400,
      };
    }

    if (result.message === "Sai mã OTP") {
      return {
        error: true,
        success: false,
        message: "Mã xác thực không đúng. Vui lòng kiểm tra lại.",
        status: 400,
      };
    }

    return {
      error: false,
      success: true,
      message: "Đặt lại mật khẩu thành công!",
      status: 200,
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return {
      error: true,
      success: false,
      message: "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.",
      status: 500,
    };
  }
}
