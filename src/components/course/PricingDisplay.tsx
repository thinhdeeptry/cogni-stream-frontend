// Demo component để test các trường hợp hiển thị giá khác nhau
import { CoursePrice } from "@/types/course/types";

// Các trường hợp test theo logic backend
export const PRICING_TEST_CASES: CoursePrice[] = [
  // Trường hợp 1: Khóa học miễn phí
  {
    currentPrice: null,
    priceType: "none",
    hasPromotion: false,
  },

  // Trường hợp 2: Khóa học có giá cơ bản
  {
    currentPrice: 500000,
    priceType: "base",
    hasPromotion: false,
  },

  // Trường hợp 3: Khóa học đang có khuyến mãi
  {
    currentPrice: 300000,
    priceType: "promotion",
    promotionName: "Khuyến mãi Black Friday",
    promotionEndDate: "2025-12-01T00:00:00Z",
    hasPromotion: true,
  },

  // Trường hợp 4: Khóa học có khuyến mãi không thời hạn
  {
    currentPrice: 200000,
    priceType: "promotion",
    promotionName: "Giá đặc biệt",
    hasPromotion: true,
  },
];

// Hàm helper để format hiển thị thông tin pricing
export const formatPricingInfo = (pricing: CoursePrice) => {
  if (!pricing.currentPrice || pricing.currentPrice === 0) {
    return "Miễn phí";
  }

  let info = `${pricing.currentPrice.toLocaleString()} VND`;

  if (pricing.hasPromotion && pricing.promotionName) {
    info += ` (${pricing.promotionName})`;
    if (pricing.promotionEndDate) {
      const endDate = new Date(pricing.promotionEndDate);
      info += ` - Hết hạn: ${endDate.toLocaleDateString("vi-VN")}`;
    }
  }

  return info;
};

// Component để hiển thị thông tin pricing chi tiết
export const PricingDisplay = ({ pricing }: { pricing: CoursePrice }) => {
  const isPaid = pricing.currentPrice && pricing.currentPrice > 0;

  return (
    <div className="space-y-2">
      {/* Giá hiện tại */}
      <div className="flex items-center gap-2">
        {!isPaid ? (
          <span className="text-green-600 font-bold">Miễn phí</span>
        ) : (
          <span className="text-red-500 font-bold">
            {pricing.currentPrice!.toLocaleString()} VND
          </span>
        )}
      </div>

      {/* Thông tin khuyến mãi */}
      {pricing.hasPromotion && pricing.promotionName && (
        <div className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded inline-block">
          🎉 {pricing.promotionName}
          {pricing.promotionEndDate && (
            <span className="block mt-1">
              Hết hạn:{" "}
              {new Date(pricing.promotionEndDate).toLocaleDateString("vi-VN")}
            </span>
          )}
        </div>
      )}

      {/* Loại giá */}
      <div className="text-xs text-gray-500">
        Loại:{" "}
        {pricing.priceType === "promotion"
          ? "Giá khuyến mãi"
          : pricing.priceType === "base"
            ? "Giá cơ bản"
            : "Miễn phí"}
      </div>
    </div>
  );
};
