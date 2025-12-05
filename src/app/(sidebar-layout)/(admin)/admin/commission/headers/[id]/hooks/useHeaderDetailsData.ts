"use client";

import { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";

import type { CategoryOption, CourseOption } from "@/actions/commissionActions";
import {
  getCategoriesForCommission,
  getCoursesForCommission,
} from "@/actions/commissionActions";

interface HeaderDetailsDataState {
  courses: CourseOption[];
  categories: CategoryOption[];
  isLoadingCourses: boolean;
  isLoadingCategories: boolean;
}

export const useHeaderDetailsData = () => {
  console.log("🚀 useHeaderDetailsData hook được gọi");

  const [state, setState] = useState<HeaderDetailsDataState>({
    courses: [],
    categories: [],
    isLoadingCourses: true,
    isLoadingCategories: true,
  });

  useEffect(() => {
    console.log("🔄 useEffect trong useHeaderDetailsData được chạy");

    const loadData = async () => {
      console.log("📡 Bắt đầu gọi API loadData cho Header Details");

      try {
        console.log(
          "🌐 Đang gọi API courses và categories cho Header Details...",
        );

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
        console.error("❌ Error loading header details data:", error);
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

  console.log("📊 Header Details Data State hiện tại:", state);
  return state;
};
