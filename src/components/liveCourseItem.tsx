"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Class, Course, CoursePrice } from "@/types/course/types";
import { Book, Calendar, Clock, Crown, Star, Users, Video } from "lucide-react";

import { getCourseCurrentPrice } from "@/actions/pricingActions";

import { Badge } from "./ui/badge";
import { Card, CardContent, CardFooter } from "./ui/card";

interface LiveCourseItemProps {
  course: Course;
  classData: Class;
}

export default function LiveCourseItem({
  course,
  classData,
}: LiveCourseItemProps) {
  const courseLink = `/course/${course.id}?classId=${classData.id}`;

  // State để lưu thông tin giá
  const [pricing, setPricing] = useState<CoursePrice | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  // Fetch pricing data
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const priceData = await getCourseCurrentPrice(course.id);
        setPricing(priceData);
      } catch (error) {
        console.error("Error fetching course pricing:", error);
        setPricing({
          currentPrice: 0,
          priceType: "base",
          hasPromotion: false,
        });
      } finally {
        setLoadingPrice(false);
      }
    };

    fetchPricing();
  }, [course.id]);

  // Check if course is free
  const isFree = pricing?.currentPrice == 0 || pricing?.currentPrice == null;
  // Check if course has promotion
  const hasPromotion = pricing?.hasPromotion && pricing?.promotionName;

  // Format class schedule
  const formatClassSchedule = () => {
    if (!classData.schedules || classData.schedules.length === 0) {
      return "Lịch học sẽ được cập nhật";
    }

    const schedule = classData.schedules[0];
    const startDate = new Date(classData.startDate).toLocaleDateString("vi-VN");
    const endDate = classData.endDate
      ? new Date(classData.endDate).toLocaleDateString("vi-VN")
      : "Không giới hạn";

    return {
      days: schedule.days?.join(", ") || "Chưa xác định",
      time: schedule.startTime
        ? `${schedule.startTime}${schedule.endTime ? ` - ${schedule.endTime}` : ""}`
        : "Chưa xác định",
      duration: `${startDate} - ${endDate}`,
    };
  };

  const scheduleInfo = formatClassSchedule();

  return (
    <Link
      href={courseLink}
      className="block transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
    >
      <Card className="overflow-hidden h-full border-none shadow-md hover:shadow-2xl transition-all duration-300">
        <div className="relative h-36 w-full overflow-hidden group">
          <Image
            src={course.thumbnailUrl || "/placeholder-course.jpg"}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Live badge */}
          <div className="absolute top-3 left-3 rounded-lg px-2 py-1 bg-red-500 text-white text-xs font-bold flex items-center gap-1">
            <Video size={12} />
            LIVE
          </div>

          {/* Crown icon for paid courses */}
          {!isFree && (
            <div className="absolute top-3 right-3 rounded-lg px-2 py-1.5 bg-black/40 backdrop-blur-sm">
              <Crown size={18} className="text-yellow-400" />
            </div>
          )}

          {/* Promotion banner */}
          {hasPromotion && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold py-2 px-3">
              <div className="flex items-center justify-between">
                <span>🎉 {pricing.promotionName}</span>
                {pricing.promotionEndDate && (
                  <span className="text-[10px] opacity-90">
                    Hết hạn:{" "}
                    {new Date(pricing.promotionEndDate).toLocaleDateString(
                      "vi-VN",
                    )}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <CardContent className="px-4 py-3">
          {/* Course title */}
          <h3 className="font-bold text-md line-clamp-2 mb-2 text-gray-800">
            {course.title}
          </h3>

          {/* Class name */}
          <div className="mb-2">
            <Badge
              variant="outline"
              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
            >
              {classData.name}
            </Badge>
          </div>

          {/* Instructor info */}
          {course.instructor && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-shrink-0">
                <Image
                  src={
                    course.instructor.user?.image || "/placeholder-avatar.jpg"
                  }
                  alt="Instructor"
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">
                  {course.instructor.headline || "Giảng viên"}
                </p>
                {course.instructor.avgRating &&
                  course.instructor.totalRatings && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-gray-600">
                        {course.instructor.avgRating.toFixed(1)} (
                        {course.instructor.totalRatings})
                      </span>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Schedule info */}
          <div className="space-y-1 mb-3 text-xs text-gray-600">
            {typeof scheduleInfo === "object" && (
              <>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-blue-500" />
                  <span>{scheduleInfo.days}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-green-500" />
                  <span>{scheduleInfo.time}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {scheduleInfo.duration}
                </div>
              </>
            )}
          </div>

          {/* Price display */}
          <div
            className={cn(
              "flex items-center gap-2 min-h-[20px]",
              hasPromotion ? "mb-1" : "mb-2",
            )}
          >
            {loadingPrice ? (
              <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
            ) : isFree ? (
              <div className="flex items-center gap-2">
                <p className="text-green-600 font-bold text-lg">Miễn phí</p>
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-700"
                >
                  FREE
                </Badge>
              </div>
            ) : (
              <div className="flex flex-col gap-1 w-full">
                <p className="text-red-500 font-bold text-lg">
                  {Number(pricing?.currentPrice).toLocaleString()} VND
                </p>
                {hasPromotion && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded inline-block w-fit">
                    {pricing?.priceType === "promotion"
                      ? "🎉 Khuyến mãi"
                      : "Giá gốc"}
                  </span>
                )}
              </div>
            )}
          </div>

          {!hasPromotion && <div className="pb-5"></div>}
        </CardContent>

        <CardFooter className="px-4 py-2 bg-gray-100/35">
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Book className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-gray-600">
                {course.totalLessons} bài học
              </span>
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="h-4 w-4 text-blue-500" />
              <span>
                {classData.currentStudents}/{classData.maxStudents}
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
