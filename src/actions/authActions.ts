// actions/login.ts
"use server";

import { signIn } from "@/auth";
import { authApi } from "@/lib/api/authApi";
import { AuthError } from "next-auth";

// actions/login.ts

// actions/login.ts

// actions/login.ts

// actions/login.ts

// actions/login.ts

export async function loginUser(email: string, password: string) {
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false, // Không redirect tự động, xử lý bằng FE
    });

    // Nếu thành công, trả về thông tin để FE xử lý chuyển hướng
    return {
      error: false,
      success: true,
      message: "",
      redirectTo: "/",
      status: 200,
    };
  } catch (error) {
    if ((error as any).name === "AccountNotActivatedError") {
      return {
        error: true,
        success: true,
        message: "Tài khoản chưa được kích hoạt",
        status: 401,
      };
    } else if ((error as any).name === "InvalidEmailPasswordError") {
      console.error("Login error:", JSON.stringify(error));
      return {
        error: true,
        success: true,
        message: (error as any).type,
        status: 400,
      };
    }
    //hello
    return {
      error: true,
      success: true,
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
        console.log("check error verrify >>>", result);
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
