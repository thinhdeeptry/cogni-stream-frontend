"use client";

import { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";

import type { CategoryOption, CourseOption } from "@/actions/commissionActions";
import {
  getCategoriesForCommission,
  getCoursesForCommission,
} from "@/actions/commissionActions";

// States cho courses và categories data từ API
interface CommissionPageState {
  courses: CourseOption[];
  categories: CategoryOption[];
  isLoadingCourses: boolean;
  isLoadingCategories: boolean;
}

export const useCommissionPageData = () => {
  console.log("🚀 useCommissionPageData hook được gọi");

  const [state, setState] = useState<CommissionPageState>({
    courses: [],
    categories: [],
    isLoadingCourses: true,
    isLoadingCategories: true,
  });

  useEffect(() => {
    console.log("🔄 useEffect trong useCommissionPageData được chạy");

    const loadData = async () => {
      console.log("📡 Bắt đầu gọi API loadData");

      try {
        console.log("🌐 Đang gọi API courses và categories...");

        // Load courses và categories song song
        const [coursesRes, categoriesRes] = await Promise.all([
          getCoursesForCommission(),
          getCategoriesForCommission(),
        ]);

        console.log("✅ API trả về - Courses:", coursesRes);
        console.log("✅ API trả về - Categories:", categoriesRes);

        setState({
          courses: coursesRes,
          categories: categoriesRes,
          isLoadingCourses: false,
          isLoadingCategories: false,
        });
      } catch (error) {
        console.error("❌ Error loading commission page data:", error);
        toast({
          title: "Lỗi tải dữ liệu",
          description: "Không thể tải danh sách khóa học và danh mục",
          variant: "destructive",
        });
        setState((prev) => ({
          ...prev,
          isLoadingCourses: false,
          isLoadingCategories: false,
        }));
      }
    };

    loadData();
  }, []);

  console.log("📊 Commission Page Data State hiện tại:", state);
  return state;
};
