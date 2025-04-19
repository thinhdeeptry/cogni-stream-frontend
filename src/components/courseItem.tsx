"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CourseWithUser } from "@/types/course/types";
import { Book, Crown, Users } from "lucide-react";

import { getLessonsByCourse } from "@/actions/courseAction";

import useUserStore from "@/stores/useUserStore";

import { Card, CardContent, CardFooter } from "./ui/card";

export default function CourseItem({
  id,
  title,
  thumbnailUrl,
  price,
  promotionPrice,
  currency = "VND",
  totalLessons,
  enrollmentCount = 0,
  ownerAvatarUrl,
}: CourseWithUser) {
  const [href, setHref] = useState(`/course/${id}`);
  const { user } = useUserStore();

  return (
    <Link
      href={href}
      className=" block transform transition-all duration-300 hover:-translate-y-1"
    >
      <Card className=" max-h-60 overflow-hidden transition-all hover:shadow-xl cursor-pointer">
        <div className="relative max-h-32 aspect-video w-full">
          <Image
            src={thumbnailUrl || "/placeholder-course.jpg"}
            alt={title}
            fill
            className="object-cover"
          />
          {price > 0 && (
            <div className="absolute top-2 right-2 rounded-lg px-1 py-1.5 bg-gray-500/35">
              <Crown size={18} color={"gold"} />
            </div>
          )}
        </div>
        <CardContent className="px-4 py-2.5">
          <h3 className="font-semibold text-md line-clamp-1 text-ellipsis overflow-hidden whitespace-nowrap mb-1">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            {price === 0 ? (
              <p className="text-red-600 font-normal">Miễn phí</p>
            ) : (
              <>
                <p
                  className={`font-normal ${promotionPrice ? "text-gray-600 line-through text-sm" : "text-red-600"}`}
                >
                  {price.toLocaleString()} {currency}
                </p>
                {promotionPrice && (
                  <p className="text-red-600 text-md pl-2">
                    {promotionPrice.toLocaleString()} {currency}
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="px-4 py-2 pt-0 flex items-center justify-between">
          <div className="relative w-6 h-6 rounded-full overflow-hidden">
            <Image
              src={ownerAvatarUrl || "/placeholder-avatar.jpg"}
              alt="Course owner"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Book color="gray" size={18} strokeWidth={1.5} />
              {totalLessons} bài học
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users color="gray" size={18} strokeWidth={1.5} />
              {enrollmentCount}
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
