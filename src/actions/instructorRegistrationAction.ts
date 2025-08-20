// src/api/instructorRegistrationApi.ts
import { AxiosFactory } from "@/lib/axios";
import { InstructorRegistration } from "@/types/instructor/types";

const instructorRegistrationApi =
  await AxiosFactory.getApiInstance("instructor");

// Lấy tất cả đăng ký giảng viên
export const getAllInstructorRegistrations = async (): Promise<
  InstructorRegistration[]
> => {
  try {
    const res = await instructorRegistrationApi.get(
      "/instructor-registrations",
    );
    return res.data.data.data; // BE -> { message, statusCode, data: { total, page, limit, data: [...] } }
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
