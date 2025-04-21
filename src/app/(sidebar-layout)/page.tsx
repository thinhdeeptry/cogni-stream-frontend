"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { Course } from "@/types/course/types";

import { getAllCourses } from "@/actions/courseAction";

import CourseItem from "@/components/CourseItem";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const bannerImages = [
  "https://res.cloudinary.com/dxxsudprj/image/upload/v1740664494/Screenshot_2025-02-27_at_20.53.58_wgkc7i.png",
  "https://res.cloudinary.com/dxxsudprj/image/upload/v1740663732/Screenshot_2025-02-27_at_20.37.42_apjhxh.png",
  "https://res.cloudinary.com/dxxsudprj/image/upload/v1740663732/Screenshot_2025-02-27_at_20.38.14_jgjenf.png",
  "https://res.cloudinary.com/dxxsudprj/image/upload/v1740664494/Screenshot_2025-02-27_at_20.54.08_f0jal5.png",
  "https://res.cloudinary.com/dxxsudprj/image/upload/v1740664063/Screenshot_2025-02-27_at_20.39.05_wvgzaw.png",
];

export default function Home() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Get all published courses without pagination
        const response = await getAllCourses({
          isPublished: true, // Only get published courses
          skipPagination: true, // Get all courses, not just the first page
        });

        console.log("Home page courses:", response.data);

        // Double-check to make sure we only show published courses
        const publishedCourses = response.data.filter(
          (course) => course.isPublished === true,
        );
        console.log("Filtered published courses:", publishedCourses.length);

        setCourses(publishedCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  useEffect(() => {
    if (!api) {
      return;
    }

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

  const handleDotClick = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  const proCourses = courses.filter((course) => course.price > 0);
  const freeCourses = courses.filter((course) => course.price === 0);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-5 flex-1 flex flex-col items-center w-full justify-start min-h-screen gap-12">
      <div className="w-full relative rounded-3xl">
        <Carousel
          setApi={setApi}
          opts={{
            align: "center",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="rounded-3xl">
            {bannerImages.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative h-[280px] w-full rounded-3xl overflow-hidden">
                  <Image
                    src={image}
                    alt={`Banner ${index + 1}`}
                    fill
                    className="w-full h-[280px]"
                    priority={index === 0}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-4 h-8 w-8" />
          <CarouselNext className="-right-4 h-8 w-8" />

          <div className="py-4 pl-12 text-center flex justify-start gap-2">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                className={`items-center rounded-md transition-all duration-300 ${index === current - 1 ? "w-10 bg-gray-400/65 h-2" : "w-6 h-1.5 bg-gray-200 hover:bg-gray-200/80"}`}
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => handleDotClick(index)}
              />
            ))}
          </div>
        </Carousel>
      </div>

      <div className="w-full space-y-4 ">
        <h2 className="text-2xl font-semibold">Khoá học Pro</h2>
        <div className="w-full grid grid-cols-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-2 pb-4">
          {proCourses.map((course) => (
            <CourseItem
              key={course.id}
              {...course}
              enrollmentCount={0}
              totalLessons={course.totalLessons}
              ownerAvatarUrl="https://res.cloudinary.com/dxxsudprj/image/upload/v1733839978/Anime_Characters_cnkjji.jpg"
            />
          ))}
        </div>
      </div>

      <div className="w-full ">
        <h2 className="text-2xl font-semibold">Khoá học miễn phí</h2>
        <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-4 pb-6">
          {freeCourses.map((course) => (
            <CourseItem
              key={course.id}
              {...course}
              enrollmentCount={0}
              totalLessons={course.totalLessons}
              ownerAvatarUrl="https://res.cloudinary.com/dxxsudprj/image/upload/v1733839978/Anime_Characters_cnkjji.jpg"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
