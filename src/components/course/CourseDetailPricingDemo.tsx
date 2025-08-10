"use client";

import { useState } from "react";

import { CoursePrice } from "@/types/course/types";
import { motion } from "framer-motion";
import { Crown, Loader2 } from "lucide-react";

// Test cases for different pricing scenarios
const PRICING_TEST_CASES: CoursePrice[] = [
  // Free course
  {
    currentPrice: 0,
    priceType: "none",
    hasPromotion: false,
  },
  // Base price course
  {
    currentPrice: 500000,
    priceType: "base",
    hasPromotion: false,
  },
  // Promotion course
  {
    currentPrice: 300000,
    priceType: "promotion",
    hasPromotion: true,
    promotionName: "Giảm giá Black Friday",
    promotionEndDate: "2025-12-31",
  },
  // Another promotion
  {
    currentPrice: 250000,
    priceType: "promotion",
    hasPromotion: true,
    promotionName: "Ưu đãi sinh viên",
    promotionEndDate: "2025-09-15",
  },
];

const CourseDetailPricingDisplay = ({
  pricing,
  loadingPrice,
}: {
  pricing: CoursePrice | null;
  loadingPrice: boolean;
}) => {
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      {loadingPrice ? (
        <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
      ) : !pricing || !pricing.currentPrice || pricing.currentPrice === 0 ? (
        <p className="text-green-600 text-2xl font-semibold">Miễn phí</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-red-600 text-2xl font-semibold">
              {pricing.currentPrice.toLocaleString()} VND
            </p>
            {pricing.hasPromotion && pricing.promotionName && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                {pricing.priceType === "promotion"
                  ? "🎉 Khuyến mãi"
                  : "Giá gốc"}
              </span>
            )}
          </div>
          {pricing.hasPromotion && pricing.promotionName && (
            <div className="bg-red-50 p-2 rounded-md">
              <p className="text-sm text-red-700 font-medium">
                🎉 {pricing.promotionName}
              </p>
              {pricing.promotionEndDate && (
                <p className="text-xs text-red-600">
                  Hết hạn:{" "}
                  {new Date(pricing.promotionEndDate).toLocaleDateString(
                    "vi-VN",
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default function CourseDetailPricingDemo() {
  const [currentTestCase, setCurrentTestCase] = useState(0);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const simulateLoading = () => {
    setLoadingPrice(true);
    setTimeout(() => setLoadingPrice(false), 1500);
  };

  const nextTestCase = () => {
    setCurrentTestCase((prev) => (prev + 1) % PRICING_TEST_CASES.length);
  };

  const currentPricing = PRICING_TEST_CASES[currentTestCase];

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center">
        Course Detail Pricing Display Demo
      </h2>

      {/* Demo Controls */}
      <div className="flex gap-2 mb-6 justify-center">
        <button
          onClick={nextTestCase}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Next Test Case ({currentTestCase + 1}/{PRICING_TEST_CASES.length})
        </button>
        <button
          onClick={simulateLoading}
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
        >
          Simulate Loading
        </button>
      </div>

      {/* Current Test Case Info */}
      <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
        <strong>Test Case:</strong> {currentTestCase + 1}
        <br />
        <strong>Type:</strong>{" "}
        {currentPricing.currentPrice === 0
          ? "Free Course"
          : currentPricing.hasPromotion
            ? "Promotion Course"
            : "Base Price Course"}
        <br />
        <strong>Price:</strong>{" "}
        {currentPricing.currentPrice?.toLocaleString() || 0} VND
        <br />
        {currentPricing.hasPromotion && (
          <>
            <strong>Promotion:</strong> {currentPricing.promotionName}
            <br />
            <strong>End Date:</strong> {currentPricing.promotionEndDate}
          </>
        )}
      </div>

      {/* Course Detail Pricing Display */}
      <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
        <h3 className="text-sm font-semibold mb-3 text-orange-700">
          Course Detail Price Display:
        </h3>
        <CourseDetailPricingDisplay
          pricing={currentPricing}
          loadingPrice={loadingPrice}
        />
      </div>

      {/* Crown Icon Test */}
      <div className="mt-4 border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
        <h3 className="text-sm font-semibold mb-3 text-yellow-700">
          Crown Icon (Premium Course):
        </h3>
        <div className="relative w-16 h-16 bg-gray-300 rounded">
          {currentPricing &&
            currentPricing.currentPrice &&
            currentPricing.currentPrice > 0 && (
              <motion.div
                className="absolute top-1 right-1 rounded-lg px-2 py-1.5 bg-black/35 backdrop-blur-sm"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, delay: 0.5 }}
              >
                <Crown size={18} color="gold" />
              </motion.div>
            )}
        </div>
      </div>
    </div>
  );
}
