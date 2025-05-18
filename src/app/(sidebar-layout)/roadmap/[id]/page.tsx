"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Course } from "@/types/course/types";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

import { getAllCourses } from "@/actions/courseAction";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RoadmapDetail() {
  const params = useParams();
  const roadmapId = params.id as string;
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await getAllCourses({
          isPublished: true,
          skipPagination: true,
        });
        setCourses(response.data || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // Filter courses based on roadmap type
  const getRoadmapCourses = () => {
    switch (roadmapId) {
      case "programming":
        return courses.filter(
          (c) =>
            c.categoryId === "11111111-1111-1111-1111-111111111111" ||
            c.categoryId === "66666666-6666-6666-6666-666666666666" ||
            c.tags?.includes("BE") ||
            c.tags?.includes("Git") ||
            c.tags?.includes("Linux"),
        );
      case "languages":
        return courses.filter((c) => c.tags?.includes("Language"));
      case "personal":
        return courses.filter(
          (c) =>
            c.categoryId === "55555555-5555-5555-5555-555555555555" &&
            !c.tags?.includes("Language"),
        );
      case "education":
        return courses.filter(
          (c) =>
            c.categoryId === "f7423037-6a44-4213-ad08-ee465782964d" ||
            c.tags?.includes("math") ||
            c.tags?.includes("basic"),
        );
      default:
        return [];
    }
  };

  // Define roadmap data
  const roadmaps = {
    programming: {
      title: "Lộ trình học Lập trình",
      description:
        "Lộ trình học lập trình từ cơ bản đến nâng cao, giúp bạn xây dựng nền tảng vững chắc và phát triển kỹ năng lập trình chuyên nghiệp.",
      image:
        courses.find((c) => c.tags?.includes("BE"))?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/43658b78-7873-42b3-a0d6-906368748d33.png",
    },
    languages: {
      title: "Lộ trình học Ngoại ngữ",
      description:
        "Lộ trình học ngoại ngữ giúp bạn nâng cao khả năng giao tiếp và đạt được các chứng chỉ quốc tế.",
      image:
        courses.find((c) => c.tags?.includes("Language"))?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/3aa205ea-270f-4352-8268-15e01614bf95.jpg",
    },
    personal: {
      title: "Lộ trình Phát triển cá nhân",
      description:
        "Lộ trình học phát triển bản thân, rèn luyện kỹ năng mềm và tư duy.",
      image:
        courses.find((c) => c.tags?.includes("Behavior"))?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/2314b91c-7239-488d-9299-5b0c9ddbc0f9.jpeg",
    },
    education: {
      title: "Lộ trình Kiến thức phổ thông",
      description:
        "Lộ trình học các môn học phổ thông, củng cố kiến thức nền tảng.",
      image:
        courses.find((c) => c.tags?.includes("math"))?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/fc3aeacb-9100-4c02-9156-063921a05a99.jpeg",
    },
  };

  const currentRoadmap = roadmaps[roadmapId as keyof typeof roadmaps];
  const roadmapCourses = getRoadmapCourses();

  if (loading) {
    return (
      <div className="container py-10 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!currentRoadmap) {
    return <div className="container py-10">Không tìm thấy lộ trình này.</div>;
  }

  return (
    <div className="container py-10">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row gap-8 items-center mb-10"
      >
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-4">{currentRoadmap.title}</h1>
          <p className="text-gray-600">{currentRoadmap.description}</p>
        </div>
        <div className="w-full md:w-1/3 flex justify-center">
          {currentRoadmap.image && (
            <Image
              src={currentRoadmap.image}
              alt={currentRoadmap.title}
              width={300}
              height={300}
              className="rounded-full border-4 border-orange-500 p-2"
            />
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {roadmapCourses.map((course, index) => (
          <motion.div
            key={course.id}
            initial="hidden"
            animate="visible"
            variants={itemVariant}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-40 w-full">
                <Image
                  src={course.thumbnailUrl || "/placeholder-course.jpg"}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
                {course.price === 0 && (
                  <span className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                    Miễn phí
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {course.description}
                </p>
                <div className="mt-auto">
                  <Link href={`/course/${course.id}`}>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Xem khóa học <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
