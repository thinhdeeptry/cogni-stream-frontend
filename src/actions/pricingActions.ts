// "use server";
import { AxiosFactory } from "@/lib/axios";
import {
  CoursePrice,
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

// Lấy danh sách chính sách giá
export const getPricingHeaders = async (): Promise<PricingHeader[]> => {
  try {
    const { data } = await pricingApi.get("/pricing/headers");
    return data;
  } catch (error) {
    console.error("Error fetching pricing headers:", error);
    throw error;
  }
};

// Tạo chính sách giá mới
export const createPricingHeader = async (headerData: {
  name: string;
  description?: string;
  type: "BASE_PRICE" | "PROMOTION";
  startDate?: string;
  endDate?: string;
}): Promise<PricingHeader> => {
  try {
    const { data } = await pricingApi.post("/pricing/headers", headerData);
    return data;
  } catch (error) {
    console.error("Error creating pricing header:", error);
    throw error;
  }
};

// Cập nhật chính sách giá
export const updatePricingHeader = async (
  headerId: string,
  headerData: Partial<PricingHeader>,
): Promise<PricingHeader> => {
  try {
    const { data } = await pricingApi.patch(
      `/pricing/headers/${headerId}`,
      headerData,
    );
    return data;
  } catch (error) {
    console.error("Error updating pricing header:", error);
    throw error;
  }
};

// Kích hoạt/vô hiệu hóa chính sách giá
export const updatePricingHeaderStatus = async (
  headerId: string,
  status: "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED",
): Promise<PricingHeader> => {
  try {
    const { data } = await pricingApi.patch(
      `/pricing/headers/${headerId}/status`,
      { status },
    );
    return data;
  } catch (error) {
    console.error("Error updating pricing header status:", error);
    throw error;
  }
};

// Lấy chi tiết giá của một chính sách
export const getPricingDetails = async (
  headerId: string,
): Promise<PricingDetail[]> => {
  try {
    const { data } = await pricingApi.get(
      `/pricing/headers/${headerId}/details`,
    );
    return data;
  } catch (error) {
    console.error("Error fetching pricing details:", error);
    throw error;
  }
};

// Thêm/cập nhật giá cho khóa học/danh mục
export const createPricingDetail = async (detailData: {
  headerId: string;
  price: number;
  courseId?: string;
  categoryId?: string;
}): Promise<PricingDetail> => {
  try {
    const { data } = await pricingApi.post("/pricing/details", detailData);
    return data;
  } catch (error) {
    console.error("Error creating pricing detail:", error);
    throw error;
  }
};

// Xóa chi tiết giá
export const deletePricingDetail = async (detailId: string): Promise<void> => {
  try {
    await pricingApi.delete(`/pricing/details/${detailId}`);
  } catch (error) {
    console.error("Error deleting pricing detail:", error);
    throw error;
  }
};

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
