"use client";
import CourseItem from "@/components/courseItem";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { useEffect, useState } from "react";

const bannerImages = [
  "https://res.cloudinary.com/dxxsudprj/image/upload/v1740496946/clockscreen_diavzb.jpg",
  "https://res.cloudinary.com/dxxsudprj/image/upload/v1740496946/clockscreen_diavzb.jpg",
  "https://res.cloudinary.com/dxxsudprj/image/upload/v1740496946/clockscreen_diavzb.jpg",
  "https://res.cloudinary.com/dxxsudprj/image/upload/v1740496946/clockscreen_diavzb.jpg",
  "https://res.cloudinary.com/dxxsudprj/image/upload/v1740496946/clockscreen_diavzb.jpg",
];

const proCourses = [
  {
    id: "1",
    title: "Advanced Web Development",
    price: 200000,
    currency: "VND",
    promotionPrice: 100000,
    totalLessons: 40,
    enrollmentCount: 1000,
    thumbnailUrl:
      "https://res.cloudinary.com/dxxsudprj/image/upload/v1740496946/clockscreen_diavzb.jpg",
    ownerAvatarUrl:
      "https://res.cloudinary.com/dxxsudprj/image/upload/v1733839978/Anime_Characters_cnkjji.jpg",
  },
  {
    id: "2",
    title: "Professional UI/UX Design",
    price: 150000,
    currency: "VND",
    totalLessons: 35,
    enrollmentCount: 800,
    thumbnailUrl:
      "https://res.cloudinary.com/dxxsudprj/image/upload/v1740496946/clockscreen_diavzb.jpg",
    ownerAvatarUrl:
      "https://res.cloudinary.com/dxxsudprj/image/upload/v1733839978/Anime_Characters_cnkjji.jpg",
  },
  {
    id: "3",
    title: "Mobile App Development",
    price: 100,
    currency: "USD",
    promotionPrice: 50,
    totalLessons: 45,
    enrollmentCount: 1200,
    thumbnailUrl:
      "https://res.cloudinary.com/dxxsudprj/image/upload/v1740496946/clockscreen_diavzb.jpg",
    ownerAvatarUrl:
      "https://res.cloudinary.com/dxxsudprj/image/upload/v1733839978/Anime_Characters_cnkjji.jpg",
  },
];

const freeCourses = [
  {
    id: "4",
    title: "Introduction to Programming",
    price: 0,
    totalLessons: 20,
    enrollmentCount: 2000,
    thumbnailUrl:
      "https://res.cloudinary.com/dxxsudprj/image/upload/v1740496946/clockscreen_diavzb.jpg",
    ownerAvatarUrl:
      "https://res.cloudinary.com/dxxsudprj/image/upload/v1733839978/Anime_Characters_cnkjji.jpg",
  },
  {
    id: "5",
    title: "Basic Web Development",
    price: 0,
    totalLessons: 25,
    enrollmentCount: 1500,
    thumbnailUrl:
      "https://res.cloudinary.com/dxxsudprj/image/upload/v1740496946/clockscreen_diavzb.jpg",
    ownerAvatarUrl:
      "https://res.cloudinary.com/dxxsudprj/image/upload/v1733839978/Anime_Characters_cnkjji.jpg",
  },
  {
    id: "6",
    title: "Git Basics",
    price: 0,
    totalLessons: 15,
    enrollmentCount: 3000,
    thumbnailUrl:
      "https://res.cloudinary.com/dxxsudprj/image/upload/v1740496946/clockscreen_diavzb.jpg",
    ownerAvatarUrl:
      "https://res.cloudinary.com/dxxsudprj/image/upload/v1733839978/Anime_Characters_cnkjji.jpg",
  },
];

export default function Home() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

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
                    className="object-cover"
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

      <div className="w-full space-y-4">
        <h2 className="text-2xl font-semibold">Khoá học Pro</h2>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {proCourses.map((course) => (
            <CourseItem key={course.id} {...course} />
          ))}
        </div>
      </div>

      <div className="w-full space-y-4">
        <h2 className="text-2xl font-semibold">Khoá học miễn phí</h2>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {freeCourses.map((course) => (
            <CourseItem key={course.id} {...course} />
          ))}
        </div>
      </div>
    </div>
  );
}
