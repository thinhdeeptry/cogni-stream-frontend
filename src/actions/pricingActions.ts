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
export const createPricing = async (price: {
  courseId: string;
  name: string;
  description?: string;
  price: number;
  type: "BASE_PRICE" | "PROMOTION";
  startDate?: string;
  endDate?: string;
}): Promise<PricingHeader> => {
  try {
    if (price.type === "BASE_PRICE") {
      const { data } = await pricingApi.patch(
        `/courses/${price.courseId}/price`,
        {
          price: price.price,
        },
      );
      return data;
    } else {
      // Đảm bảo promotion data đúng format
      const promotionData = {
        courseId: price.courseId,
        name: price.name,
        description: price.description,
        price: price.price,
        type: price.type,
        startDate: price.startDate,
        endDate: price.endDate,
      };
      const { data } = await pricingApi.post(
        "/courses/promotions",
        promotionData,
      );
      return data;
    }
  } catch (error) {
    console.error("Error creating pricing header:", error);
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

// Cập nhật status của pricing policy
export const updatePricingStatus = async (
  id: string,
  pricingId: string,
  status: "ACTIVE" | "INACTIVE" | "SCHEDULED" | "EXPIRED",
): Promise<PricingHeader> => {
  try {
    const { data } = await pricingApi.patch(
      `/courses/pricing/promotions/${id}/status`,
      {
        pricingId,
        status,
      },
    );
    return data;
  } catch (error) {
    console.error("Error updating pricing status:", error);
    throw error;
  }
};

// Xóa pricing policy
export const deletePricingPolicy = async (
  pricingId: string,
  id: string,
): Promise<void> => {
  try {
    await pricingApi.delete(`/courses/pricing/${id}`, { data: { pricingId } });
  } catch (error) {
    console.error("Error deleting pricing policy:", error);
    throw error;
  }
};
