"use client";

import Link from "next/link";
import { use } from "react";
import { useEffect, useState } from "react";

import { toast } from "@/hooks/use-toast";
import { Course, CoursePrice } from "@/types/course/types";
import { ChevronLeft, Edit, Loader2, Plus } from "lucide-react";

import { getCourseById } from "@/actions/courseAction";
import { getCourseCurrentPrice } from "@/actions/pricingActions";

import { CourseContent } from "@/components/CourseContent";
import { AdminPricingManager } from "@/components/admin/AdminPricingManager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AddChapterDialog } from "./AddChapterDialog";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [coursePrice, setCoursePrice] = useState<CoursePrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const fetchCourseData = async () => {
    try {
      setIsLoading(true);
      const courseData = await getCourseById(resolvedParams.courseId);
      setCourse(courseData);
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin khóa học",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoursePrice = async () => {
    try {
      setIsLoadingPrice(true);
      const priceData = await getCourseCurrentPrice(resolvedParams.courseId);
      setCoursePrice(priceData);
    } catch (error) {
      console.error("Error fetching course price:", error);
      // Set default pricing if API fails
      setCoursePrice({
        currentPrice: 0,
        priceType: "none",
        hasPromotion: false,
      });
    } finally {
      setIsLoadingPrice(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
    fetchCoursePrice();
  }, [resolvedParams.courseId]);

  if (isLoading || isLoadingPrice) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-slate-500">Đang tải thông tin khóa học...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
        <div className="text-slate-500 text-center">
          <p className="text-lg font-semibold">Không tìm thấy khóa học</p>
          <p className="text-sm">
            Khóa học này có thể đã bị xóa hoặc không tồn tại
          </p>
        </div>
        <Link href="/admin/courses">
          <Button variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Quay lại danh sách
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/courses">
              <Button
                variant="outline"
                size="icon"
                className="border-slate-200 hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {course.title}
              </h1>
              <div className="flex items-center gap-2 mt-2 cursor-pointer">
                <Badge
                  variant={course.isPublished ? "default" : "secondary"}
                  className={
                    course.isPublished ? "bg-green-500" : "bg-orange-500"
                  }
                >
                  {course.isPublished ? "Đã xuất bản" : "Chưa xuất bản"}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-slate-200 text-slate-600"
                >
                  {course.level}
                </Badge>
              </div>
            </div>
          </div>
          <Link href={`/admin/courses/${resolvedParams.courseId}/edit`}>
            <Button className="bg-black hover:bg-gray-800 text-white gap-2">
              <Edit className="h-4 w-4" />
              Chỉnh sửa khóa học
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Course Info */}
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-slate-900">
                Thông tin khóa học
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="aspect-video relative rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={course.thumbnailUrl || "/placeholder-course.jpg"}
                  alt={course.title}
                  className="object-cover w-full h-full"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    Mô tả
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    Danh mục
                  </h3>
                  <p className="text-sm text-slate-600">
                    {course.category?.name || "Chưa phân loại"}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    Giá
                  </h3>
                  <AdminPricingManager
                    courseId={resolvedParams.courseId}
                    courseName={course.title}
                    onPricingUpdated={fetchCoursePrice}
                  />
                </div>
                <div className="space-y-2">
                  {isLoadingPrice ? (
                    <div className="h-6 w-24 bg-slate-200 animate-pulse rounded"></div>
                  ) : coursePrice ? (
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-slate-900">
                        {coursePrice.currentPrice === null ||
                        coursePrice.currentPrice === 0
                          ? "Miễn phí"
                          : `${coursePrice.currentPrice.toLocaleString()} VND`}
                      </p>
                      {coursePrice.hasPromotion && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                            🎉 Khuyến mãi
                          </span>
                          {coursePrice.promotionName && (
                            <span className="text-xs text-slate-500">
                              {coursePrice.promotionName}
                            </span>
                          )}
                        </div>
                      )}
                      {coursePrice.promotionEndDate && (
                        <p className="text-xs text-slate-500">
                          Hết hạn:{" "}
                          {new Date(
                            coursePrice.promotionEndDate,
                          ).toLocaleDateString("vi-VN")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">
                      Chưa có thông tin giá
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    Tổng quan
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500">Số chương</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {course.chapters?.length || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Số bài học</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {course.totalLessons || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    Yêu cầu
                  </h3>
                  <ul className="text-sm text-slate-600 list-disc pl-4 space-y-2">
                    {course.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    Mục tiêu khóa học
                  </h3>
                  <ul className="text-sm text-slate-600 list-disc pl-4 space-y-2">
                    {course.learningOutcomes.map((outcome, index) => (
                      <li key={index}>{outcome}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chapters and Lessons */}
        <div className="col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-slate-900">
                  Nội dung khóa học
                </CardTitle>
                <Button
                  onClick={() => setIsAddChapterOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Thêm chương mới
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <CourseContent
                courseId={resolvedParams.courseId}
                chapters={(course.chapters || []).map((chapter) => ({
                  ...chapter,
                  lessons: chapter.lessons || [],
                }))}
                onOrderUpdate={fetchCourseData}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <AddChapterDialog
        courseId={resolvedParams.courseId}
        open={isAddChapterOpen}
        onOpenChange={setIsAddChapterOpen}
        onSuccess={fetchCourseData}
      />
    </div>
  );
}
