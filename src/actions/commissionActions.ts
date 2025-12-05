// "use server";
import { AxiosFactory } from "@/lib/axios";

const commissionApi = await AxiosFactory.getApiInstance("courses");

// ============================================
// COMMISSION TYPES
// ============================================

export interface CommissionHeader {
  id: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED";
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  details: CommissionDetail[];
}

export interface CommissionDetail {
  id: string;
  platformRate: number;
  instructorRate: number;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  headerId: string;
  courseId?: string;
  categoryId?: string;
  header?: {
    id: string;
    name: string;
  };
  course?: {
    id: string;
    title: string;
  };
  category?: {
    id: string;
    name: string;
  };
}

export interface CreateCommissionHeaderData {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateCommissionHeaderData
  extends Partial<CreateCommissionHeaderData> {
  status?: "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED";
}

export interface CreateCommissionDetailData {
  headerId: string;
  platformRate: number;
  instructorRate: number;
  priority?: number;
  isActive?: boolean;
  courseId?: string;
  categoryId?: string;
}

export interface UpdateCommissionDetailData
  extends Partial<Omit<CreateCommissionDetailData, "headerId">> {}

export interface CommissionQueryParams {
  search?: string;
  status?: "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED";
  page?: number;
  limit?: number;
}

export interface CommissionDetailQueryParams {
  headerId?: string;
  courseId?: string;
  categoryId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// COMMISSION HEADER FUNCTIONS
// ============================================

// Tạo commission header mới
export const createCommissionHeader = async (
  data: CreateCommissionHeaderData,
): Promise<CommissionHeader> => {
  try {
    const { data: response } = await commissionApi.post(
      "/commission/headers",
      data,
    );
    return response;
  } catch (error) {
    console.error("Error creating commission header:", error);
    throw error;
  }
};

// Lấy danh sách commission headers
export const getCommissionHeaders = async (
  params: CommissionQueryParams = {},
): Promise<PaginatedResponse<CommissionHeader>> => {
  try {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append("search", params.search);
    if (params.status) queryParams.append("status", params.status);
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const { data } = await commissionApi.get(
      `/commission/headers?${queryParams.toString()}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching commission headers:", error);
    throw error;
  }
};

// Lấy commission header theo ID
export const getCommissionHeader = async (
  id: string,
): Promise<CommissionHeader> => {
  try {
    const { data } = await commissionApi.get(`/commission/headers/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching commission header:", error);
    throw error;
  }
};

// Cập nhật commission header
export const updateCommissionHeader = async (
  id: string,
  data: UpdateCommissionHeaderData,
): Promise<CommissionHeader> => {
  try {
    const { data: response } = await commissionApi.patch(
      `/commission/headers/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.error("Error updating commission header:", error);
    throw error;
  }
};

// Xóa commission header
export const deleteCommissionHeader = async (id: string): Promise<void> => {
  try {
    await commissionApi.delete(`/commission/headers/${id}`);
  } catch (error) {
    console.error("Error deleting commission header:", error);
    throw error;
  }
};

// Kích hoạt commission header
export const activateCommissionHeader = async (
  id: string,
): Promise<CommissionHeader> => {
  try {
    const { data } = await commissionApi.patch(
      `/commission/headers/${id}/activate`,
    );
    return data;
  } catch (error) {
    console.error("Error activating commission header:", error);
    throw error;
  }
};

// Vô hiệu hóa commission header
export const deactivateCommissionHeader = async (
  id: string,
): Promise<CommissionHeader> => {
  try {
    const { data } = await commissionApi.patch(
      `/commission/headers/${id}/deactivate`,
    );
    return data;
  } catch (error) {
    console.error("Error deactivating commission header:", error);
    throw error;
  }
};

// ============================================
// COMMISSION DETAIL FUNCTIONS
// ============================================

// Tạo commission detail mới
export const createCommissionDetail = async (
  data: CreateCommissionDetailData,
): Promise<CommissionDetail> => {
  try {
    const { data: response } = await commissionApi.post(
      "/commission/details",
      data,
    );
    return response;
  } catch (error) {
    console.error("Error creating commission detail:", error);
    throw error;
  }
};

// Lấy danh sách commission details
export const getCommissionDetails = async (
  params: CommissionDetailQueryParams = {},
): Promise<PaginatedResponse<CommissionDetail>> => {
  try {
    const queryParams = new URLSearchParams();

    if (params.headerId) queryParams.append("headerId", params.headerId);
    if (params.courseId) queryParams.append("courseId", params.courseId);
    if (params.categoryId) queryParams.append("categoryId", params.categoryId);
    if (params.isActive !== undefined)
      queryParams.append("isActive", params.isActive.toString());
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const { data } = await commissionApi.get(
      `/commission/details?${queryParams.toString()}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching commission details:", error);
    throw error;
  }
};

// Lấy commission detail theo ID
export const getCommissionDetail = async (
  id: string,
): Promise<CommissionDetail> => {
  try {
    const { data } = await commissionApi.get(`/commission/details/${id}`);
    return data;
  } catch (error) {
    console.error("Error fetching commission detail:", error);
    throw error;
  }
};

// Cập nhật commission detail
export const updateCommissionDetail = async (
  id: string,
  data: UpdateCommissionDetailData,
): Promise<CommissionDetail> => {
  try {
    const { data: response } = await commissionApi.patch(
      `/commission/details/${id}`,
      data,
    );
    return response;
  } catch (error) {
    console.error("Error updating commission detail:", error);
    throw error;
  }
};

// Xóa commission detail
export const deleteCommissionDetail = async (id: string): Promise<void> => {
  try {
    await commissionApi.delete(`/commission/details/${id}`);
  } catch (error) {
    console.error("Error deleting commission detail:", error);
    throw error;
  }
};

// ============================================
// BUSINESS LOGIC FUNCTIONS
// ============================================

// Lấy commission details theo course ID
export const getCommissionDetailsByCourse = async (
  courseId: string,
): Promise<CommissionDetail[]> => {
  try {
    const { data } = await commissionApi.get(
      `/commission/details/course/${courseId}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching commission details by course:", error);
    throw error;
  }
};

// Lấy commission details theo category ID
export const getCommissionDetailsByCategory = async (
  categoryId: string,
): Promise<CommissionDetail[]> => {
  try {
    const { data } = await commissionApi.get(
      `/commission/details/category/${categoryId}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching commission details by category:", error);
    throw error;
  }
};

// Lấy active commission cho sản phẩm
export const getActiveCommissionForProduct = async (
  productType: "COURSE" | "CLASS",
  productId: string,
): Promise<CommissionDetail | null> => {
  try {
    const { data } = await commissionApi.get(
      `/commission/active/${productType}/${productId}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching active commission for product:", error);
    throw error;
  }
};

// 🆕 Cập nhật commission khi giá course thay đổi
export const updateCommissionOnPriceChange = async (
  courseId: string,
  newPrice: number,
): Promise<{
  success: boolean;
  commission?: CommissionDetail;
  message: string;
}> => {
  try {
    // Lấy commission hiện tại cho course
    const currentCommission = await getActiveCommissionForProduct(
      "COURSE",
      courseId,
    );

    if (!currentCommission) {
      return {
        success: false,
        message: "Không tìm thấy commission cho khóa học này",
      };
    }

    // Tính toán số tiền chia cho instructor và platform
    const instructorAmount =
      (newPrice * currentCommission.instructorRate) / 100;
    const platformAmount = (newPrice * currentCommission.platformRate) / 100;

    return {
      success: true,
      commission: currentCommission,
      message: `Commission được cập nhật: Giảng viên nhận ${instructorAmount.toLocaleString()} VND (${currentCommission.instructorRate}%), Nền tảng nhận ${platformAmount.toLocaleString()} VND (${currentCommission.platformRate}%)`,
    };
  } catch (error) {
    console.error("Error updating commission on price change:", error);
    return {
      success: false,
      message: "Lỗi khi cập nhật commission",
    };
  }
};

// 🆕 Lấy thông tin commission đã áp dụng cho course
export const getCourseCommissionInfo = async (courseId: string) => {
  try {
    const commission = await getActiveCommissionForProduct("COURSE", courseId);

    if (!commission) {
      return {
        courseId,
        commission: null,
        hasCommission: false,
      };
    }

    return {
      courseId,
      commission: {
        id: commission.id,
        instructorRate: commission.instructorRate,
        platformRate: commission.platformRate,
        priority: commission.priority,
        isActive: commission.isActive,
        type: commission.courseId
          ? "course-specific"
          : commission.categoryId
            ? "category-specific"
            : "general",
        header: commission.header,
        createdAt: commission.createdAt,
      },
      hasCommission: true,
    };
  } catch (error) {
    console.error("Error fetching course commission info:", error);
    throw error;
  }
};

// 🆕 Tính toán phân chia commission dựa trên giá
export const calculateCommissionBreakdown = (
  price: number,
  commission: CommissionDetail,
) => {
  if (!commission || price <= 0) {
    return {
      totalPrice: price,
      instructorAmount: 0,
      platformAmount: 0,
      instructorRate: 0,
      platformRate: 0,
    };
  }

  const instructorAmount = (price * commission.instructorRate) / 100;
  const platformAmount = (price * commission.platformRate) / 100;

  return {
    totalPrice: price,
    instructorAmount: Math.round(instructorAmount),
    platformAmount: Math.round(platformAmount),
    instructorRate: commission.instructorRate,
    platformRate: commission.platformRate,
  };
};

// 🆕 Format thông tin commission cho hiển thị
export const formatCommissionInfo = (
  commission: CommissionDetail | null,
  price?: number,
) => {
  if (!commission) {
    return {
      hasCommission: false,
      message: "Chưa có commission được áp dụng",
      breakdown: null,
    };
  }

  const breakdown = price
    ? calculateCommissionBreakdown(price, commission)
    : null;

  const typeText = commission.courseId
    ? "riêng cho khóa học"
    : commission.categoryId
      ? "theo danh mục"
      : "chung hệ thống";

  return {
    hasCommission: true,
    commission,
    breakdown,
    message: `Commission ${typeText}: ${commission.instructorRate}% cho giảng viên, ${commission.platformRate}% cho nền tảng`,
    typeText,
  };
};

// ============================================
// HELPER FUNCTIONS FOR COURSES AND CATEGORIES
// ============================================

// Interface cho course data
export interface CourseOption {
  id: string;
  title: string;
}

// Interface cho category data
export interface CategoryOption {
  id: string;
  name: string;
}

// Lấy danh sách courses cho dropdown
export const getCoursesForCommission = async (): Promise<CourseOption[]> => {
  try {
    const { data } = await commissionApi.get("/courses", {
      params: {
        skipPagination: true, // Lấy tất cả courses
        status: "APPROVED", // Chỉ lấy courses đã được approve
      },
    });

    // Chuyển đổi dữ liệu courses thành format cần thiết
    return data.data.map((course: any) => ({
      id: course.id,
      title: course.title,
    }));
  } catch (error) {
    console.error("Error fetching courses for commission:", error);
    throw error;
  }
};

// Lấy danh sách categories cho dropdown
export const getCategoriesForCommission = async (): Promise<
  CategoryOption[]
> => {
  try {
    const { data } = await commissionApi.get("/categories");

    // Chuyển đổi dữ liệu categories thành format cần thiết
    return data.map((category: any) => ({
      id: category.id,
      name: category.name,
    }));
  } catch (error) {
    console.error("Error fetching categories for commission:", error);
    throw error;
  }
};
