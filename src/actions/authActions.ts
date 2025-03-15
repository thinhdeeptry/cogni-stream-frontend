// actions/login.ts
"use server";

import { auth, signIn } from "@/auth";
import { authApi } from "@/lib/api/authApi";

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
    const session = await auth();
    // Nếu thành công, trả về thông tin để FE xử lý chuyển hướng
    if (session?.user?.role === "ADMIN") {
      return {
        error: false,
        success: true,
        message: "",
        redirectTo: "/admin",
        status: 200,
      };
    }
    if (result.role === "ADMIN") {
      return {
        error: false,
        success: true,
        message: "",
        redirectTo: "/admin",
        status: 200,
      };
    }
    return {
      error: false,
      success: true,
      message: "",
      redirectTo: "/test",
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
    console.log("check result in action >>>", result);

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
