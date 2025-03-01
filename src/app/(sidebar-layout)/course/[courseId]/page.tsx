"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import axios from "axios";
import { Book, Crown, Users } from "lucide-react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Course {
  id: string;
  title: string;
  description?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  price: number;
  currency: string;
  thumbnailUrl?: string;
  promotionPrice?: number;
  isHasCertificate: boolean;
  totalLessons: number;
  learningOutcomes: string[];
  requirements: string[];
  targetAudience?: string;
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  type: "VIDEO" | "BLOG" | "MIXED";
  isFreePreview: boolean;
}

export default function CourseDetail() {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:3002/courses/${params.courseId}`,
        );
        setCourse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [params.courseId]);

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

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Course not found
      </div>
    );
  }

  return (
    <div className="flex-1 flex gap-8 justify-center min-h-screen p-8">
      {/* Left Column */}
      <div className="w-2/3 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold mb-4">{course.title}</h1>
          <p className="text-gray-600">{course.description}</p>
        </div>

        {/* Learning Outcomes */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Bạn sẽ học được gì?</h2>
          <ul className="grid grid-cols-2 gap-4">
            {course.learningOutcomes.map((outcome, index) => (
              <li key={index} className="flex text-start gap-2 ">
                <div className="">✓</div>
                <span className="">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Course Content */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Nội dung khoá học</h2>
          <div className="space-y-4">
            {course.chapters.map((chapter) => (
              <Collapsible key={chapter.id}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{chapter.title}</h3>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4">
                  <ul className="mt-2 space-y-2">
                    {chapter.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Book className="h-4 w-4" />
                          <span>{lesson.title}</span>
                        </div>
                        {lesson.isFreePreview && (
                          <span className="text-xs bg-gray-200 text-black px-2 py-1 rounded">
                            Preview
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Yêu cầu</h2>
          <ul className="space-y-2">
            {course.requirements.map((requirement, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="">•</div>
                <span>{requirement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="w-1/3">
        <div className="sticky top-8">
          <Card className="overflow-hidden">
            <div className="relative aspect-video w-full">
              <Image
                src={course.thumbnailUrl || "/placeholder-course.jpg"}
                alt={course.title}
                fill
                className="object-cover"
              />
              {course.price > 0 && (
                <div className="absolute top-2 right-2 rounded-lg px-1 py-1.5 bg-gray-500/35">
                  <Crown size={18} color={"gold"} />
                </div>
              )}
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Price */}
                <div className="flex items-center gap-2">
                  {course.price === 0 ? (
                    <p className="text-red-600 text-2xl font-semibold">
                      Miễn phí
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p
                        className={`font-semibold text-2xl ${course.promotionPrice ? "text-red-600" : ""}`}
                      >
                        {course.promotionPrice
                          ? course.promotionPrice.toLocaleString()
                          : course.price.toLocaleString()}{" "}
                        {course.currency}
                      </p>
                      {course.promotionPrice && (
                        <p className="text-gray-500 line-through">
                          {course.price.toLocaleString()} {course.currency}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Course Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={18} />
                    <span>Trình độ: {course.level}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Book size={18} />
                    <span>{course.totalLessons} bài học</span>
                  </div>
                </div>

                {/* Target Audience */}
                {course.targetAudience && (
                  <div className="text-gray-600">
                    <h3 className="font-semibold mb-1">Đối tượng học viên:</h3>
                    <p>{course.targetAudience}</p>
                  </div>
                )}

                {/* Enroll Button */}
                <Button className="w-full" size="lg">
                  <p className="text-md font-semibold">Đăng ký</p>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
