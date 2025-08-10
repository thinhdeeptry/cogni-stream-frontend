"use client";

import { useState } from "react";

import { CoursePrice } from "@/types/course/types";

import { AdminPricingManager } from "@/components/admin/AdminPricingManager";

// Test data for demo
const DEMO_COURSES = [
  {
    id: "course-1",
    title: "React và Next.js cho người mới bắt đầu",
    category: "Lập trình Frontend",
    pricing: {
      currentPrice: 0,
      priceType: "none" as const,
      hasPromotion: false,
    },
  },
  {
    id: "course-2",
    title: "Node.js và Express.js Advanced",
    category: "Lập trình Backend",
    pricing: {
      currentPrice: 500000,
      priceType: "base" as const,
      hasPromotion: false,
    },
  },
  {
    id: "course-3",
    title: "Full-stack Web Development",
    category: "Lập trình Web",
    pricing: {
      currentPrice: 300000,
      priceType: "promotion" as const,
      hasPromotion: true,
      promotionName: "Giảm giá Black Friday",
      promotionEndDate: "2025-12-31",
    },
  },
];

const AdminPricingDemo = () => {
  const [coursePricing, setCoursePricing] = useState<
    Record<string, CoursePrice>
  >(
    DEMO_COURSES.reduce(
      (acc, course) => {
        acc[course.id] = course.pricing;
        return acc;
      },
      {} as Record<string, CoursePrice>,
    ),
  );

  const [loadingPrices, setLoadingPrices] = useState<Record<string, boolean>>(
    {},
  );

  // Helper function to get price display for a course
  const getPriceDisplay = (courseId: string) => {
    const pricing = coursePricing[courseId];
    const isLoading = loadingPrices[courseId];

    if (isLoading) {
      return <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>;
    }

    if (!pricing || !pricing.currentPrice || pricing.currentPrice === 0) {
      return <span className="text-green-600 font-medium">Miễn phí</span>;
    }

    return (
      <div className="space-y-1">
        <span className="text-slate-700 font-medium">
          {Number(pricing.currentPrice).toLocaleString()} VND
        </span>
        {pricing.hasPromotion && pricing.promotionName && (
          <div className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded inline-block">
            🎉 {pricing.priceType === "promotion" ? "Khuyến mãi" : "Giá gốc"}
          </div>
        )}
      </div>
    );
  };

  const handlePricingUpdate = (courseId: string) => {
    // Simulate pricing update
    console.log(`Pricing updated for course: ${courseId}`);
    // In real app, this would trigger a refresh of the pricing data
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-slate-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Admin Pricing Management Demo
        </h1>
        <p className="text-slate-600">
          Demo cho component quản lý giá khóa học từ admin panel
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Danh sách khóa học
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-4 font-medium text-slate-700">
                  Tên khóa học
                </th>
                <th className="text-left p-4 font-medium text-slate-700">
                  Danh mục
                </th>
                <th className="text-left p-4 font-medium text-slate-700">
                  Giá
                </th>
                <th className="text-right p-4 font-medium text-slate-700">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {DEMO_COURSES.map((course) => (
                <tr
                  key={course.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="p-4 font-medium text-slate-900">
                    {course.title}
                  </td>
                  <td className="p-4 text-slate-700">{course.category}</td>
                  <td className="p-4 text-slate-700">
                    {getPriceDisplay(course.id)}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <AdminPricingManager
                        courseId={course.id}
                        courseName={course.title}
                        onPricingUpdated={() => handlePricingUpdate(course.id)}
                      />
                      <button className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-100">
                        Xem
                      </button>
                      <button className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-100">
                        Sửa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded-lg border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-2">Features Demo:</h3>
        <ul className="space-y-1 text-sm text-slate-600">
          <li>• Click "Quản lý giá" để mở dialog quản lý pricing</li>
          <li>• Hiển thị tất cả pricing policies trong table</li>
          <li>• Cập nhật trạng thái (ACTIVE/INACTIVE/SCHEDULED/EXPIRED)</li>
          <li>• Ràng buộc: chỉ một promotion có thể ACTIVE</li>
          <li>• Form để thêm pricing policy mới</li>
          <li>• Xóa pricing policy với confirm dialog</li>
          <li>• Loading states và error handling</li>
          <li>• Callback để refresh pricing sau khi update</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminPricingDemo;
