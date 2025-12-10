// src/api/instructorRegistrationApi.ts
import { AxiosFactory } from "@/lib/axios";
import { InstructorRegistration } from "@/types/instructor/types";

const instructorRegistrationApi =
  await AxiosFactory.getApiInstance("instructor");

// Lấy tất cả đăng ký giảng viên (dành cho admin)
export const getAllInstructorRegistrations = async (
  page = 1,
  limit = 10,
  filters?: {
    status?: string;
    search?: string;
  },
): Promise<{
  data: InstructorRegistration[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    if (filters?.status && filters.status !== "ALL") {
      params.append("status", filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      params.append("search", filters.search.trim());
    }

    const res = await instructorRegistrationApi.get(
      `/instructor-registrations?${params.toString()}`,
    );

    const responseData = res.data.data;
    return {
      data: responseData.data || [],
      meta: {
        total: responseData.total || 0,
        page: responseData.page || 1,
        limit: responseData.limit || 10,
        totalPages: Math.ceil(
          (responseData.total || 0) / (responseData.limit || 10),
        ),
      },
    };
  } catch (error) {
    throw error;
  }
};

// Lấy tất cả đăng ký giảng viên (không phân trang, dùng cho hooks)
export const getAllInstructorRegistrationsNoPagination = async (): Promise<
  InstructorRegistration[]
> => {
  try {
    const res = await instructorRegistrationApi.get(
      "/instructor-registrations?limit=1000", // Lấy nhiều để cover hết
    );
    const responseData = res.data.data;
    return responseData.data || [];
  } catch (error) {
    throw error;
  }
};

// Lấy thông tin 1 đăng ký
export const getInstructorRegistrationById = async (
  id: string,
): Promise<InstructorRegistration> => {
  try {
    const res = await instructorRegistrationApi.get(
      `/instructor-registrations/${id}`,
    );
    return res.data.data; // BE -> { message, statusCode, data: {...} }
  } catch (error) {
    throw error;
  }
};

// Kiểm tra đơn đăng ký giảng viên của user hiện tại
export const getUserInstructorRegistration = async (
  userId: string,
): Promise<InstructorRegistration | null> => {
  try {
    const res = await instructorRegistrationApi.get(
      `/instructor-registrations/user/${userId}`,
    );

    // Kiểm tra response và đảm bảo có data
    if (res.data?.statusCode === 200 && res.data?.data) {
      return res.data.data as InstructorRegistration;
    }

    return null;
  } catch (error) {
    console.error("Error getting user instructor registration:", error);
    return null;
  }
};

// Lấy tất cả đơn đăng ký của một user
export const getAllUserInstructorRegistrations = async (
  userId: string,
): Promise<InstructorRegistration[]> => {
  try {
    const allRegistrations = await getAllInstructorRegistrationsNoPagination();
    return allRegistrations.filter((reg) => reg.userId === userId);
  } catch (error) {
    console.error("Error getting all user instructor registrations:", error);
    return [];
  }
};

// Tạo mới đăng ký giảng viên
export const createInstructorRegistration = async (
  registrationData: Omit<
    InstructorRegistration,
    "id" | "status" | "submittedAt" | "reviewedAt"
  >,
) => {
  try {
    const res = await instructorRegistrationApi.post(
      "/instructor-registrations",
      registrationData,
    );
    return {
      success: res.data.statusCode === 201,
      data: res.data.data,
      message: res.data.message,
    };
  } catch (error) {
    throw error;
  }
};

// Cập nhật đăng ký giảng viên
export const updateInstructorRegistration = async (
  id: string,
  registrationData: Partial<InstructorRegistration>,
) => {
  try {
    const res = await instructorRegistrationApi.patch(
      `/instructor-registrations/${id}`,
      registrationData,
    );
    return {
      success: res.data.statusCode === 200,
      data: res.data.data,
      message: res.data.message,
    };
  } catch (error) {
    throw error;
  }
};

// Upload files cho đăng ký giảng viên
export const uploadInstructorRegistrationFiles = async (
  files: File[],
  type: "qualifications" | "portfolio",
  userId: string,
) => {
  try {
    const formData = new FormData();

    // Thêm từng file vào FormData
    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("type", type);
    formData.append("userId", userId);

    const res = await instructorRegistrationApi.post(
      "/instructor-registrations/upload-files",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return {
      success: res.data.statusCode === 200,
      data: res.data.data,
      message: res.data.message,
    };
  } catch (error) {
    throw error;
  }
};
