"use server";

import { AxiosFactory } from "@/lib/axios";

export interface CertificateData {
  id: string;
  title: string;
  description?: string;
  studentId: string;
  courseId: string;
  classId?: string;
  enrollmentId: string;
  instructorId: string;
  issuedAt: string;
  completedAt: string;
  expiresAt?: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  student: {
    id: string;
    name: string;
    email: string;
  };
  course: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl?: string;
  };
  class?: {
    id: string;
    name: string;
    description: string;
  };
  instructor: {
    id: string;
    user: {
      name: string;
      email: string;
    };
  };
  enrollment?: {
    id: string;
    progress: number;
    completedAt: string;
  };
  isValid?: boolean;
}

export interface CreateCertificateParams {
  title: string;
  description?: string;
  studentId: string;
  courseId: string;
  classId?: string;
  enrollmentId: string;
  instructorId: string;
  completedAt?: string;
  expiresAt?: string;
  status?: "ACTIVE" | "REVOKED" | "EXPIRED";
}

/**
 * Tạo chứng chỉ thủ công (Admin only)
 */
export const createCertificate = async (params: CreateCertificateParams) => {
  try {
    const certificatesApi = await AxiosFactory.getApiInstance("certificates");
    const response = await certificatesApi.post("/certificates", params);

    return {
      error: false,
      success: true,
      message: "Tạo chứng chỉ thành công!",
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Error creating certificate:", error);
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message || "Có lỗi xảy ra khi tạo chứng chỉ.",
      data: null,
    };
  }
};

/**
 * Cấp chứng chỉ tự động khi hoàn thành khóa học
 */
export const issueCertificate = async (enrollmentId: string) => {
  try {
    const certificatesApi = await AxiosFactory.getApiInstance("certificates");
    const response = await certificatesApi.post(
      `/certificates/issue/${enrollmentId}`,
    );

    return {
      error: false,
      success: true,
      message: "Cấp chứng chỉ thành công!",
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Error issuing certificate:", error);
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message || "Có lỗi xảy ra khi cấp chứng chỉ.",
      data: null,
    };
  }
};

/**
 * Lấy thông tin chứng chỉ theo ID
 */
export const getCertificate = async (certificateId: string) => {
  try {
    const certificatesApi = await AxiosFactory.getApiInstance("certificates");
    const response = await certificatesApi.get(
      `/certificates/${certificateId}`,
    );

    return {
      error: false,
      success: true,
      data: response.data.data as CertificateData,
    };
  } catch (error: any) {
    console.error("Error fetching certificate:", error);
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message ||
        "Có lỗi xảy ra khi lấy thông tin chứng chỉ.",
      data: null,
    };
  }
};

/**
 * Lấy danh sách chứng chỉ của học viên
 */
export const getStudentCertificates = async (
  studentId: string,
  page: number = 1,
  limit: number = 10,
) => {
  try {
    const certificatesApi = await AxiosFactory.getApiInstance("certificates");
    const response = await certificatesApi.get(
      `/certificates/student/${studentId}?page=${page}&limit=${limit}`,
    );

    return {
      error: false,
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Error fetching student certificates:", error);
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message ||
        "Có lỗi xảy ra khi lấy danh sách chứng chỉ.",
      data: null,
    };
  }
};

/**
 * Lấy danh sách tất cả chứng chỉ với filter
 */
export const getAllCertificates = async (filter?: {
  studentId?: string;
  courseId?: string;
  instructorId?: string;
  status?: "ACTIVE" | "REVOKED" | "EXPIRED";
  search?: string;
  issuedFrom?: string;
  issuedTo?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const certificatesApi = await AxiosFactory.getApiInstance("certificates");

    const params = new URLSearchParams();
    if (filter?.studentId) params.append("studentId", filter.studentId);
    if (filter?.courseId) params.append("courseId", filter.courseId);
    if (filter?.instructorId)
      params.append("instructorId", filter.instructorId);
    if (filter?.status) params.append("status", filter.status);
    if (filter?.search) params.append("search", filter.search);
    if (filter?.issuedFrom) params.append("issuedFrom", filter.issuedFrom);
    if (filter?.issuedTo) params.append("issuedTo", filter.issuedTo);
    if (filter?.page) params.append("page", filter.page.toString());
    if (filter?.limit) params.append("limit", filter.limit.toString());

    const response = await certificatesApi.get(
      `/certificates?${params.toString()}`,
    );

    return {
      error: false,
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Error fetching certificates:", error);
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message ||
        "Có lỗi xảy ra khi lấy danh sách chứng chỉ.",
      data: null,
    };
  }
};

/**
 * Cập nhật chứng chỉ
 */
export const updateCertificate = async (
  certificateId: string,
  updateData: Partial<CreateCertificateParams>,
) => {
  try {
    const certificatesApi = await AxiosFactory.getApiInstance("certificates");
    const response = await certificatesApi.patch(
      `/certificates/${certificateId}`,
      updateData,
    );

    return {
      error: false,
      success: true,
      message: "Cập nhật chứng chỉ thành công!",
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Error updating certificate:", error);
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message ||
        "Có lỗi xảy ra khi cập nhật chứng chỉ.",
      data: null,
    };
  }
};

/**
 * Thu hồi chứng chỉ
 */
export const revokeCertificate = async (
  certificateId: string,
  reason?: string,
) => {
  try {
    const certificatesApi = await AxiosFactory.getApiInstance("certificates");
    const response = await certificatesApi.patch(
      `/certificates/${certificateId}/revoke`,
      { reason },
    );

    return {
      error: false,
      success: true,
      message: "Thu hồi chứng chỉ thành công!",
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Error revoking certificate:", error);
    return {
      error: true,
      success: false,
      message:
        error.response?.data?.message || "Có lỗi xảy ra khi thu hồi chứng chỉ.",
      data: null,
    };
  }
};
