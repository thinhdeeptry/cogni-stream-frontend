import { AxiosFactory } from "@/lib/axios";
import { Enrollment } from "@/types/enrollment/types";

const enrollmentApi = await AxiosFactory.getApiInstance("enrollment");

// Lấy tất cả enrollment (có phân trang)
export const getEnrollments = async (
  page: number = 1,
  limit: number = 10,
): Promise<{ data: Enrollment[]; total: number }> => {
  try {
    const { data } = await enrollmentApi.get(
      `/enrollments?page=${page}&limit=${limit}`,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

// Lấy thông tin 1 enrollment theo id
export const getEnrollmentById = async (id: string): Promise<Enrollment> => {
  try {
    const { data } = await enrollmentApi.get(`/enrollments/${id}`);
    return data;
  } catch (error) {
    throw error;
  }
};

// Tạo mới enrollment
export const createEnrollment = async (
  enrollmentData: Omit<Enrollment, "id" | "createdAt" | "updatedAt">,
) => {
  try {
    const { data } = await enrollmentApi.post("/enrollments", enrollmentData);
    return {
      success: true,
      data,
      message: "Tạo enrollment thành công",
    };
  } catch (error) {
    throw error;
  }
};

// Cập nhật enrollment
export const updateEnrollment = async (
  id: string,
  enrollmentData: Partial<Omit<Enrollment, "id" | "createdAt" | "updatedAt">>,
) => {
  try {
    const { data } = await enrollmentApi.patch(
      `/enrollments/${id}`,
      enrollmentData,
    );
    return {
      success: true,
      data,
      message: "Cập nhật enrollment thành công",
    };
  } catch (error) {
    throw error;
  }
};

// Xóa enrollment
export const deleteEnrollment = async (id: string) => {
  try {
    const { data } = await enrollmentApi.delete(`/enrollments/${id}`);
    return {
      success: true,
      data,
      message: "Xóa enrollment thành công",
    };
  } catch (error) {
    return {
      success: false,
      message: "Lỗi khi xóa enrollment",
      error,
    };
  }
};
