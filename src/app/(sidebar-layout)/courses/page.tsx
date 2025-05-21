"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { Course } from "@/types/course/types";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { getAllCategories, getAllCourses } from "@/actions/courseAction";
import {
  EnrollmentStats,
  getEnrollmentStats,
} from "@/actions/enrollmentActions";

import Loading from "@/components/Loading";
import CourseItem from "@/components/courseItem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function CoursesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State for courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentStats, setEnrollmentStats] =
    useState<EnrollmentStats | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [courseType, setCourseType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // New states for collapsible sidebar and pagination
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Load filter visibility state from localStorage
  useEffect(() => {
    const savedFilterVisibility = localStorage.getItem("coursesFilterVisible");
    if (savedFilterVisibility !== null) {
      setIsFilterVisible(savedFilterVisibility === "true");
    }
  }, []);

  // Save filter visibility state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("coursesFilterVisible", isFilterVisible.toString());
  }, [isFilterVisible]);

  // Load initial filter values from URL
  useEffect(() => {
    applyFiltersFromURL();
  }, [searchParams]);

  // Fetch courses and categories
  useEffect(() => {
    const fetchCoursesAndStats = async () => {
      try {
        setIsLoading(true);
        const response = await getAllCourses({
          isPublished: true,
          skipPagination: true,
        });

        // Ensure we only display published courses
        const publishedCourses = response.data.filter(
          (course) => course.isPublished === true,
        );

        setCourses(publishedCourses);
        console.log("Loaded courses:", publishedCourses.length);

        // Fetch enrollment stats
        const statsResponse = await getEnrollmentStats();
        if (statsResponse.success) {
          setEnrollmentStats(statsResponse.data);
        }

        // Sau khi lấy dữ liệu, áp dụng tự động các bộ lọc từ URL
        applyFiltersFromURL();
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoursesAndStats();
  }, []);

  // Tách hàm áp dụng filter từ URL để sử dụng lại
  const applyFiltersFromURL = () => {
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "all";
    const minPrice = Number(searchParams.get("minPrice") || 0);
    const maxPrice = Number(searchParams.get("maxPrice") || 5000000);
    const sort = searchParams.get("sort") || "newest";
    const type = searchParams.get("type") || "all";

    setSearchQuery(query);
    setSelectedCategory(category);
    setPriceRange([minPrice, maxPrice]);
    setSortBy(sort);
    setCourseType(type);
  };

  // Helper function to get enrollment count for a course
  const getEnrollmentCount = (courseId: string): number => {
    if (!enrollmentStats) return 0;

    // Tìm trong enrollmentsByCourse
    const courseEnrollment = enrollmentStats.enrollmentsByCourse.find(
      (item) => item.courseId === courseId,
    );

    return courseEnrollment?.enrollments || 0;
  };

  // Tạo filtered courses với thông tin enrollment count
  useEffect(() => {
    if (!courses.length) return;

    let filtered = [...courses];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          (course.description &&
            course.description.toLowerCase().includes(query)),
      );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(
        (course) => course.categoryId === selectedCategory,
      );
    }

    // Filter by price range
    if (typeof priceRange === "string") {
      if (priceRange === "free") {
        filtered = filtered.filter((course) => course.price === 0);
      } else if (priceRange === "paid") {
        filtered = filtered.filter((course) => course.price > 0);
      }
    } else if (Array.isArray(priceRange)) {
      filtered = filtered.filter((course) => {
        const coursePrice = course.promotionPrice || course.price || 0;
        return coursePrice >= priceRange[0] && coursePrice <= priceRange[1];
      });
    }

    // Filter by course type
    if (courseType === "free") {
      filtered = filtered.filter((course) => course.price === 0);
    } else if (courseType === "paid") {
      filtered = filtered.filter((course) => course.price > 0);
    }

    // Enrich courses with enrollment count data
    filtered = filtered.map((course) => ({
      ...course,
      enrollmentCount: getEnrollmentCount(course.id),
    }));

    // Sort courses
    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt || "").getTime() -
            new Date(a.createdAt || "").getTime(),
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt || "").getTime() -
            new Date(b.createdAt || "").getTime(),
        );
        break;
      case "price-asc":
        filtered.sort(
          (a, b) =>
            (a.promotionPrice || a.price || 0) -
            (b.promotionPrice || b.price || 0),
        );
        break;
      case "price-desc":
        filtered.sort(
          (a, b) =>
            (b.promotionPrice || b.price || 0) -
            (a.promotionPrice || a.price || 0),
        );
        break;
      case "popular":
        filtered.sort(
          (a, b) =>
            ((b as any).enrollmentCount || 0) -
            ((a as any).enrollmentCount || 0),
        );
        break;
    }

    setFilteredCourses(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [
    courses,
    searchQuery,
    selectedCategory,
    priceRange,
    sortBy,
    courseType,
    enrollmentStats,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCourses, currentPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle filter changes
  const applyFilters = () => {
    const params = new URLSearchParams();

    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory !== "all") params.set("category", selectedCategory);
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
    if (priceRange[1] < 5000000)
      params.set("maxPrice", priceRange[1].toString());
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (courseType !== "all") params.set("type", courseType);

    router.push(`/courses?${params.toString()}`, { scroll: false });
  };

  // Hàm xử lý tìm kiếm nhanh
  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setPriceRange([0, 5000000]);
    setSortBy("newest");
    setCourseType("all");
    router.push("/courses", { scroll: false });
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedCategory !== "all") count++;
    if (priceRange[0] > 0 || priceRange[1] < 5000000) count++;
    if (sortBy !== "newest") count++;
    if (courseType !== "all") count++;
    return count;
  }, [searchQuery, selectedCategory, priceRange, sortBy, courseType]);

  // Skeleton loader for courses
  const CourseSkeletons = () => (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="w-full">
          <Skeleton className="w-full h-36 rounded-t-xl" />
          <div className="p-4 space-y-2">
            <Skeleton className="w-3/4 h-4" />
            <Skeleton className="w-1/2 h-4" />
            <div className="flex justify-between pt-2">
              <Skeleton className="w-1/3 h-3" />
              <Skeleton className="w-1/4 h-3" />
            </div>
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Tất cả khóa học</h1>
        <p className="text-gray-600">
          Khám phá tất cả các khóa học của chúng tôi và tìm khóa học phù hợp với
          nhu cầu của bạn
        </p>
      </div>

      {/* Main content with sidebar filters for desktop and sheet for mobile */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filter sidebar for desktop */}
        {isFilterVisible && (
          <div className="hidden md:block w-64 shrink-0">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium flex items-center justify-between">
                  <span>Bộ lọc</span>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="h-8 text-orange-500 hover:text-orange-700"
                    >
                      Xóa ({activeFiltersCount})
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category filter */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Danh mục</h3>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả danh mục</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price range filter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Mức giá</h3>
                    <span className="text-xs text-gray-500">
                      {priceRange[0].toLocaleString()} -{" "}
                      {priceRange[1].toLocaleString()} VND
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 mt-6">
                    <input
                      type="range"
                      min={0}
                      max={5000000}
                      step={100000}
                      value={priceRange[0]}
                      onChange={(e) =>
                        setPriceRange([Number(e.target.value), priceRange[1]])
                      }
                      className="w-full"
                    />
                    <input
                      type="range"
                      min={0}
                      max={5000000}
                      step={100000}
                      value={priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([priceRange[0], Number(e.target.value)])
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Course type filter */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Loại khóa học</h3>
                  <RadioGroup
                    value={courseType}
                    onValueChange={setCourseType}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all">Tất cả</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="free" id="free" />
                      <Label htmlFor="free">Miễn phí</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="paid" id="paid" />
                      <Label htmlFor="paid">Trả phí</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Sort filter */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Sắp xếp theo</h3>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mới nhất" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="oldest">Cũ nhất</SelectItem>
                      <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                      <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                      <SelectItem value="popular">Phổ biến nhất</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={applyFilters}
                >
                  Áp dụng
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mobile filter button and active filters */}
        <div className="md:hidden sticky top-0 z-10 bg-white py-4 flex items-center justify-between">
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Bộ lọc
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Bộ lọc</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-6">
                {/* Category filter */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Danh mục</h3>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả danh mục</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price range filter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Mức giá</h3>
                    <span className="text-xs text-gray-500">
                      {priceRange[0].toLocaleString()} -{" "}
                      {priceRange[1].toLocaleString()} VND
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 mt-6">
                    <input
                      type="range"
                      min={0}
                      max={5000000}
                      step={100000}
                      value={priceRange[0]}
                      onChange={(e) =>
                        setPriceRange([Number(e.target.value), priceRange[1]])
                      }
                      className="w-full"
                    />
                    <input
                      type="range"
                      min={0}
                      max={5000000}
                      step={100000}
                      value={priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([priceRange[0], Number(e.target.value)])
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Course type filter */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Loại khóa học</h3>
                  <RadioGroup
                    value={courseType}
                    onValueChange={setCourseType}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="mobile-all" />
                      <Label htmlFor="mobile-all">Tất cả</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="free" id="mobile-free" />
                      <Label htmlFor="mobile-free">Miễn phí</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="paid" id="mobile-paid" />
                      <Label htmlFor="mobile-paid">Trả phí</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Sort filter */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Sắp xếp theo</h3>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mới nhất" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mới nhất</SelectItem>
                      <SelectItem value="oldest">Cũ nhất</SelectItem>
                      <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                      <SelectItem value="price-desc">Giá giảm dần</SelectItem>
                      <SelectItem value="popular">Phổ biến nhất</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter className="flex flex-row gap-4 pt-2">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="flex-1"
                >
                  Xóa bộ lọc
                </Button>
                <SheetClose asChild>
                  <Button
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={applyFilters}
                  >
                    Áp dụng
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <div className="flex-1 ml-4">
            <form onSubmit={handleQuickSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm khóa học..."
                  className="pl-10 pr-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
            </form>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] ml-2">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="oldest">Cũ nhất</SelectItem>
              <SelectItem value="price-asc">Giá tăng dần</SelectItem>
              <SelectItem value="price-desc">Giá giảm dần</SelectItem>
              <SelectItem value="popular">Phổ biến nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Courses grid with applied filters */}
        <div className="flex-1">
          {/* Search box and filter toggle for desktop */}
          <div className="hidden md:flex mb-6 items-center justify-between">
            <div className="flex items-center">
              <form
                onSubmit={handleQuickSearch}
                className="flex items-center flex-1 max-w-md"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Tìm kiếm khóa học..."
                    className="pl-10 pr-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>
                <Button
                  type="submit"
                  className="ml-2 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Tìm kiếm
                </Button>
              </form>
            </div>

            {/* Toggle filter button */}
            <Button
              variant="outline"
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className="ml-4"
            >
              {isFilterVisible ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
            </Button>
          </div>

          {/* Active filters display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategory !== "all" && (
                <Badge
                  variant="secondary"
                  className="px-3 py-1 flex items-center gap-1"
                >
                  Danh mục:{" "}
                  {categories.find((cat) => cat.id === selectedCategory)
                    ?.name || selectedCategory}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      setSelectedCategory("all");
                      applyFilters();
                    }}
                  />
                </Badge>
              )}

              {(priceRange[0] > 0 || priceRange[1] < 5000000) && (
                <Badge
                  variant="secondary"
                  className="px-3 py-1 flex items-center gap-1"
                >
                  Giá: {priceRange[0].toLocaleString()} -{" "}
                  {priceRange[1].toLocaleString()} VND
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      setPriceRange([0, 5000000]);
                      applyFilters();
                    }}
                  />
                </Badge>
              )}

              {courseType !== "all" && (
                <Badge
                  variant="secondary"
                  className="px-3 py-1 flex items-center gap-1"
                >
                  {courseType === "free" ? "Miễn phí" : "Trả phí"}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      setCourseType("all");
                      applyFilters();
                    }}
                  />
                </Badge>
              )}

              {sortBy !== "newest" && (
                <Badge
                  variant="secondary"
                  className="px-3 py-1 flex items-center gap-1"
                >
                  Sắp xếp:{" "}
                  {sortBy === "oldest"
                    ? "Cũ nhất"
                    : sortBy === "price-asc"
                      ? "Giá tăng dần"
                      : sortBy === "price-desc"
                        ? "Giá giảm dần"
                        : sortBy === "popular"
                          ? "Phổ biến nhất"
                          : ""}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => {
                      setSortBy("newest");
                      applyFilters();
                    }}
                  />
                </Badge>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 text-orange-500 hover:text-orange-700"
              >
                Xóa tất cả
              </Button>
            </div>
          )}

          {/* Course count */}
          <div className="flex justify-between items-center mb-4">
            {isLoading ? (
              <Skeleton className="w-24 h-4" />
            ) : (
              <p className="text-gray-600 text-sm">
                Hiển thị {paginatedCourses.length} / {filteredCourses.length}{" "}
                khóa học
              </p>
            )}
          </div>

          {/* Course grid - adjust grid columns based on filter visibility */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${!isFilterVisible ? "xl:grid-cols-4" : "xl:grid-cols-3"} gap-6`}
          >
            {isLoading ? (
              <CourseSkeletons />
            ) : paginatedCourses.length > 0 ? (
              paginatedCourses.map((course) => (
                <div
                  key={course.id}
                  className="transform hover:-translate-y-1 transition-transform duration-300"
                >
                  <CourseItem
                    {...course}
                    enrollmentCount={(course as any).enrollmentCount || 0}
                    totalLessons={course.totalLessons || 0}
                    categories={[course.categoryId || ""]}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center">
                <div className="mx-auto w-24 h-24 text-gray-300 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700">
                  Không tìm thấy khóa học
                </h3>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                  Không có khóa học nào phù hợp với bộ lọc của bạn. Vui lòng thử
                  lại với các tiêu chí khác.
                </p>
                <Button
                  className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={resetFilters}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Trước
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Logic to show correct page numbers around current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      onClick={() => handlePageChange(pageNum)}
                      className={
                        currentPage === pageNum
                          ? "bg-orange-500 hover:bg-orange-600"
                          : ""
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center"
                >
                  Tiếp
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<Loading isLoading={true} />}>
      <CoursesContent />
    </Suspense>
  );
}
