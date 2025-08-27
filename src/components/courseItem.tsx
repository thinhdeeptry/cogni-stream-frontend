"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { CoursePrice, CourseWithUser } from "@/types/course/types";
import { Book, Crown, Star, Users } from "lucide-react";

import { getLessonsByCourse } from "@/actions/courseAction";
import { getCourseCurrentPrice } from "@/actions/pricingActions";

import useUserStore from "@/stores/useUserStore";

import { Badge } from "./ui/badge";
import { Card, CardContent, CardFooter } from "./ui/card";

export default function CourseItem({
  id,
  title,
  thumbnailUrl,
  totalLessons,
  enrollmentCount = 0,
  categories,
  rating,
  instructor,
  avgRating,
}: CourseWithUser & {
  description?: string;
  categories?: string[];
  rating?: number;
  instructor?: {
    headline?: string;
    bio?: string;
    specialization?: string;
    avgRating?: number;
    totalRatings?: number;
    user?: {
      image?: string;
    };
  };
  avgRating?: number;
}) {
  // Keep the ID for the link but don't display it
  const courseLink = `/course/${id}`;
  const { user } = useUserStore();

  // State để lưu thông tin giá
  const [pricing, setPricing] = useState<CoursePrice | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  // Fetch pricing data
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const priceData = await getCourseCurrentPrice(id);
        setPricing(priceData);
      } catch (error) {
        console.error("Error fetching course pricing:", error);
        // Set default pricing if API fails
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
  }, [id]);

  // Check if course is free
  const isFree = pricing?.currentPrice == 0 || pricing?.currentPrice == null;
  // Check if course has promotion
  const hasPromotion = pricing?.hasPromotion && pricing?.promotionName;

  return (
    <Link
      href={courseLink}
      className="block transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
    >
      <Card className="overflow-hidden h-full border-none shadow-md hover:shadow-2xl transition-all duration-300">
        <div className="relative h-36 w-full overflow-hidden group">
          <Image
            src={thumbnailUrl || "/placeholder-course.jpg"}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Crown icon for paid courses */}
          {!isFree && (
            <div className="absolute top-3 right-3 rounded-lg px-2 py-1.5 bg-black/40 backdrop-blur-sm">
              <Crown size={18} className="text-yellow-400" />
            </div>
          )}

          {/* Promotion banner - chỉ hiển thị khi có khuyến mãi thực sự */}
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
          <h3 className="font-bold text-md line-clamp-2 mb-2 text-gray-800 truncate">
            {title}
          </h3>

          {/* Instructor info */}
          {instructor && (
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-shrink-0">
                <Image
                  src={instructor.user?.image || "/placeholder-avatar.jpg"}
                  alt="Instructor"
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">
                  {instructor.headline || "Giảng viên"}
                </p>
                {instructor.avgRating && instructor.totalRatings && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-gray-600">
                      {instructor.avgRating.toFixed(1)} (
                      {instructor.totalRatings})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price display with consistent spacing */}
          <div
            className={cn(
              "flex items-center gap-2 min-h-[20px]", // Đảm bảo min-height nhất quán
              hasPromotion ? "mb-1" : "mb-2", // Thêm margin bottom khi không có promotion
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
                {totalLessons} bài học
              </span>
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="h-4 w-4 text-blue-500" />
              <span>{enrollmentCount}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
