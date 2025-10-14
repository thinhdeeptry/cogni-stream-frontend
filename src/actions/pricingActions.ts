// "use server";
import { AxiosFactory } from "@/lib/axios";
import {
  CoursePrice,
  CoursePricingPolicies,
  PricingDetail,
  PricingHeader,
} from "@/types/course/types";

const pricingApi = await AxiosFactory.getApiInstance("courses");

// ============================================
// PRICING MANAGEMENT FUNCTIONS
// ============================================

// Lấy giá hiện tại của khóa học
export const getCourseCurrentPrice = async (
  courseId: string,
): Promise<CoursePrice> => {
  try {
    const { data } = await pricingApi.get(`/courses/${courseId}/price`);
    return data;
  } catch (error) {
    console.error("Error fetching course price:", error);
    throw error;
  }
};

// Lấy giá hiện tại của nhiều khóa học
export const getMultipleCoursesPrice = async (
  courseIds: string[],
): Promise<Record<string, CoursePrice>> => {
  try {
    const { data } = await pricingApi.post("/courses/batch-pricing", {
      courseIds,
    });
    return data;
  } catch (error) {
    console.error("Error fetching multiple courses pricing:", error);
    throw error;
  }
};

// Lấy danh sách chính sách giá (PricingHeaders)
export const getPricingHeaders = async (): Promise<PricingHeader[]> => {
  try {
    const { data } = await pricingApi.get("/courses/pricing/headers");
    return data.data || data;
  } catch (error) {
    console.error("Error fetching pricing headers:", error);
    throw error;
  }
};

// Lấy một PricingHeader cụ thể
export const getPricingHeaderById = async (
  headerId: string,
): Promise<PricingHeader> => {
  try {
    const { data } = await pricingApi.get(
      `/courses/pricing/headers/${headerId}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching pricing header:", error);
    throw error;
  }
};

// Lấy tất cả PricingDetails của một Header
export const getPricingDetailsByHeader = async (
  headerId: string,
): Promise<PricingDetail[]> => {
  try {
    const { data } = await pricingApi.get(
      `/courses/pricing/headers/${headerId}/details`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching pricing details by header:", error);
    throw error;
  }
};

// Lấy PricingDetail cụ thể cho một khóa học trong một Header
export const getPricingDetailByCourse = async (
  headerId: string,
  courseId: string,
): Promise<PricingDetail | null> => {
  try {
    const { data } = await pricingApi.get(
      `/courses/pricing/headers/${headerId}/details/${courseId}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching pricing detail by course:", error);
    // Return null if not found instead of throwing
    return null;
  }
};

// Tạo PricingHeader (Chính sách giá) mới
export const createPricingHeader = async (headerData: {
  name: string;
  description?: string;
  type: "BASE_PRICE" | "PROMOTION";
  startDate?: string;
  endDate?: string;
}): Promise<PricingHeader> => {
  try {
    const { data } = await pricingApi.post(
      "/courses/pricing/headers",
      headerData,
    );
    return data;
  } catch (error) {
    console.error("Error creating pricing header:", error);
    throw error;
  }
};

// Tạo PricingDetail (Nhãn giá cho khóa học cụ thể)
export const createPricingDetail = async (detailData: {
  headerId: string;
  courseId: string;
  price: number;
  categoryId?: string;
}): Promise<PricingDetail> => {
  try {
    const { data } = await pricingApi.post(
      "/courses/pricing/details",
      detailData,
    );
    return data;
  } catch (error) {
    console.error("Error creating pricing detail:", error);
    throw error;
  }
};

// Tạo chính sách giá cho khóa học (Wrapper function - tạo cả Header và Detail)
export const createCoursePrice = async (priceData: {
  courseId: string;
  name: string;
  description?: string;
  price: number;
  type: "BASE_PRICE" | "PROMOTION";
  startDate?: string;
  endDate?: string;
}): Promise<{ header: PricingHeader; detail: PricingDetail }> => {
  try {
    // Bước 1: Tạo hoặc lấy PricingHeader cho chính sách này
    let header: PricingHeader;

    if (priceData.type === "BASE_PRICE") {
      // Kiểm tra xem đã có header BASE_PRICE chưa
      const existingHeaders = await getPricingHeaders();
      const baseHeader = existingHeaders.find((h) => h.type === "BASE_PRICE");

      if (baseHeader) {
        header = baseHeader;
      } else {
        // Tạo header BASE_PRICE mới
        header = await createPricingHeader({
          name: priceData.name || "Bảng giá Tiêu chuẩn",
          description: priceData.description || "Giá gốc cho tất cả khóa học",
          type: "BASE_PRICE",
        });
      }
    } else {
      // Tạo header PROMOTION mới
      header = await createPricingHeader({
        name: priceData.name,
        description: priceData.description,
        type: "PROMOTION",
        startDate: priceData.startDate,
        endDate: priceData.endDate,
      });
    }

    // Bước 2: Tạo PricingDetail với giá cụ thể cho khóa học
    const detail = await createPricingDetail({
      headerId: header.id,
      courseId: priceData.courseId,
      price: priceData.price,
    });

    return { header, detail };
  } catch (error) {
    console.error("Error creating course price:", error);
    throw error;
  }
};

// Legacy function - giữ lại để backward compatibility
export const createPricing = createCoursePrice;

// Lấy danh sách khóa học theo filter giá
export const getCoursesByPriceRange = async (filters: {
  minPrice?: number;
  maxPrice?: number;
  isOnSale?: boolean;
  categoryId?: string;
}): Promise<any[]> => {
  try {
    const params = new URLSearchParams();

    if (filters.minPrice !== undefined)
      params.append("minPrice", filters.minPrice.toString());
    if (filters.maxPrice !== undefined)
      params.append("maxPrice", filters.maxPrice.toString());
    if (filters.isOnSale !== undefined)
      params.append("isOnSale", filters.isOnSale.toString());
    if (filters.categoryId) params.append("categoryId", filters.categoryId);

    const { data } = await pricingApi.get(
      `/courses/filter-by-price?${params.toString()}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching courses by price range:", error);
    throw error;
  }
};

// Lấy tất cả pricing policies của một khóa học
export const getCoursePricingPolicies = async (
  courseId: string,
): Promise<CoursePricingPolicies> => {
  try {
    const { data } = await pricingApi.get(
      `/courses/${courseId}/pricing-policies`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching course pricing policies:", error);
    throw error;
  }
};

// Lấy tất cả PricingDetails của một khóa học (từ tất cả Headers)
export const getCoursePricingDetails = async (
  courseId: string,
): Promise<PricingDetail[]> => {
  try {
    const { data } = await pricingApi.get(
      `/courses/${courseId}/pricing-details`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching course pricing details:", error);
    throw error;
  }
};

// Cập nhật status của PricingHeader (chính sách giá)
export const updatePricingHeaderStatus = async (
  detailId: string,
  status: "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED",
): Promise<PricingHeader> => {
  try {
    const { data } = await pricingApi.patch(
      `courses/pricing/promotions/${detailId}/status`,
      { status },
    );
    return data;
  } catch (error) {
    console.error("Error updating pricing header status:", error);
    throw error;
  }
};

// Legacy function - giữ lại để backward compatibility
export const updatePricingStatus = updatePricingHeaderStatus;

// Cập nhật giá của PricingDetail
export const updatePricingPrice = async (
  pricingDetailId: string,
  price: number,
): Promise<PricingDetail> => {
  try {
    const { data } = await pricingApi.patch(
      `/courses/pricing/details/${pricingDetailId}/price`,
      { price },
    );
    return data;
  } catch (error) {
    console.error("Error updating pricing detail price:", error);
    throw error;
  }
};

// Xóa PricingHeader (chính sách giá)
export const deletePricingHeader = async (headerId: string): Promise<void> => {
  try {
    await pricingApi.delete(`/pricing/headers/${headerId}`);
  } catch (error) {
    console.error("Error deleting pricing header:", error);
    throw error;
  }
};

// Xóa PricingDetail (nhãn giá cụ thể)
export const deletePricingDetail = async (detailId: string): Promise<void> => {
  try {
    await pricingApi.delete(`/pricing/details/${detailId}`);
  } catch (error) {
    console.error("Error deleting pricing detail:", error);
    throw error;
  }
};

// Legacy function - giữ lại để backward compatibility
export const deletePricingPolicy = deletePricingDetail;

// ============================================
// PRICE APPROVAL SYSTEM FUNCTIONS
// ============================================

// Submit price for approval
export const submitPriceForApproval = async (
  priceDetailId: string,
): Promise<PricingDetail> => {
  try {
    const { data } = await pricingApi.post(
      `/courses/prices/${priceDetailId}/submit-for-approval`,
    );
    return data;
  } catch (error) {
    console.error("Error submitting price for approval:", error);
    throw error;
  }
};

// Approve course price (Admin only)
export const approveCoursePrice = async (
  priceDetailId: string,
): Promise<PricingDetail> => {
  try {
    const { data } = await pricingApi.post(
      `/courses/prices/${priceDetailId}/approve`,
    );
    return data;
  } catch (error) {
    console.error("Error approving course price:", error);
    throw error;
  }
};

// Reject course price (Admin only)
export const rejectCoursePrice = async (
  priceDetailId: string,
  rejectionData: { rejectionReason: string },
): Promise<PricingDetail> => {
  try {
    const { data } = await pricingApi.post(
      `/courses/prices/${priceDetailId}/reject`,
      rejectionData,
    );
    return data;
  } catch (error) {
    console.error("Error rejecting course price:", error);
    throw error;
  }
};

// Activate approved price
export const activateApprovedPrice = async (
  priceDetailId: string,
): Promise<PricingDetail> => {
  try {
    const { data } = await pricingApi.post(
      `/courses/prices/${priceDetailId}/activate`,
    );
    return data;
  } catch (error) {
    console.error("Error activating approved price:", error);
    throw error;
  }
};

// Get pending prices for admin review
export const getPendingPrices = async (filters?: {
  page?: number;
  limit?: number;
  courseId?: string;
}): Promise<{
  data: PricingDetail[];
  meta: {
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}> => {
  try {
    const params = new URLSearchParams();

    if (filters?.page !== undefined)
      params.append("page", filters.page.toString());
    if (filters?.limit !== undefined)
      params.append("limit", filters.limit.toString());
    if (filters?.courseId) params.append("courseId", filters.courseId);

    const { data } = await pricingApi.get(
      `/courses/prices/pending/list?${params.toString()}`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching pending prices:", error);
    throw error;
  }
};

// Get price history for a course
export const getPriceHistory = async (
  courseId: string,
): Promise<PricingDetail[]> => {
  try {
    const { data } = await pricingApi.get(`/courses/${courseId}/price-history`);
    return data.data || data; // Handle both formats
  } catch (error) {
    console.error("Error fetching price history:", error);
    throw error;
  }
};

// ============================================
// HELPER FUNCTIONS FOR COURSE PRICING WORKFLOW
// ============================================

// Tạo giá cơ bản cho khóa học (sử dụng Header BASE_PRICE có sẵn)
export const setBasePriceForCourse = async (
  courseId: string,
  price: number,
): Promise<PricingDetail> => {
  try {
    // Lấy hoặc tạo BASE_PRICE header
    const headers = await getPricingHeaders();
    let baseHeader = headers.find((h) => h.type === "BASE_PRICE");

    if (!baseHeader) {
      baseHeader = await createPricingHeader({
        name: "Bảng giá Tiêu chuẩn",
        description: "Giá gốc cho tất cả khóa học",
        type: "BASE_PRICE",
      });
    }

    // Tạo pricing detail cho khóa học
    return await createPricingDetail({
      headerId: baseHeader.id,
      courseId,
      price,
    });
  } catch (error) {
    console.error("Error setting base price for course:", error);
    throw error;
  }
};

// Tạo chương trình khuyến mãi cho khóa học
export const createPromotionForCourse = async (promotionData: {
  courseId: string;
  name: string;
  description?: string;
  price: number;
  startDate?: string;
  endDate?: string;
}): Promise<{ header: PricingHeader; detail: PricingDetail }> => {
  try {
    // Tạo header cho chương trình khuyến mãi
    const header = await createPricingHeader({
      name: promotionData.name,
      description: promotionData.description,
      type: "PROMOTION",
      startDate: promotionData.startDate,
      endDate: promotionData.endDate,
    });

    // Tạo pricing detail với giá khuyến mãi
    const detail = await createPricingDetail({
      headerId: header.id,
      courseId: promotionData.courseId,
      price: promotionData.price,
    });

    return { header, detail };
  } catch (error) {
    console.error("Error creating promotion for course:", error);
    throw error;
  }
};

// Lấy giá hiệu lực hiện tại của khóa học (theo thứ tự ưu tiên: PROMOTION active > BASE_PRICE active)
export const getEffectivePriceForCourse = async (
  courseId: string,
): Promise<PricingDetail | null> => {
  try {
    const { data } = await pricingApi.get(
      `/courses/${courseId}/effective-price`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching effective price:", error);
    return null;
  }
};
