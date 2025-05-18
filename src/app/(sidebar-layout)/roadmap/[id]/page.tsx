"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Course } from "@/types/course/types";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import { getAllCourses } from "@/actions/courseAction";
import { getUserEnrollments } from "@/actions/enrollmentActions";

import useUserStore from "@/stores/useUserStore";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RoadmapDetail() {
  const params = useParams();
  const roadmapId = params.id as string;
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});
  const { user } = useUserStore();

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch courses
        const coursesResponse = await getAllCourses({
          isPublished: true,
          skipPagination: true,
        });

        if (isMounted) {
          setCourses(coursesResponse.data || []);
        }

        // Fetch user enrollments if user is logged in
        if (isMounted && user?.id) {
          const enrollmentsResponse = await getUserEnrollments(user.id);

          // Transform enrollments data into a map of courseId -> progress percentage
          if (isMounted && enrollmentsResponse?.data) {
            const progressMap: Record<string, number> = {};
            enrollmentsResponse.data.forEach((enrollment: any) => {
              progressMap[enrollment.courseId] = enrollment.progress || 0;
            });
            setUserProgress(progressMap);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [params.id, user?.id]); // Only re-run when roadmap ID or user ID changes

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
      case "frontend":
        return courses.filter(
          (c) =>
            c.tags?.includes("FE") ||
            c.tags?.includes("Web Development") ||
            c.tags?.includes("JavaScript") ||
            c.tags?.includes("React") ||
            c.tags?.includes("CSS") ||
            c.tags?.includes("SASS") ||
            c.tags?.includes("Frontend"),
        );
      case "backend":
        return courses.filter(
          (c) =>
            c.tags?.includes("BE") ||
            c.categoryId === "11111111-1111-1111-1111-111111111111" ||
            c.categoryId === "66666666-6666-6666-6666-666666666666",
        );
      case "devops":
        return courses.filter(
          (c) =>
            c.tags?.includes("docker") ||
            c.tags?.includes("Linux") ||
            c.tags?.includes("deploy") ||
            c.tags?.includes("Git"),
        );
      case "languages":
        return courses.filter((c) => c.tags?.includes("Language"));
      case "datascience":
        return courses.filter(
          (c) =>
            c.tags?.includes("AI") ||
            c.tags?.includes("ML") ||
            c.tags?.includes("analyze") ||
            c.title.includes("Python"),
        );
      case "personal":
        return courses.filter(
          (c) =>
            c.tags?.includes("Behavior") ||
            (c.categoryId === "55555555-5555-5555-5555-555555555555" &&
              !c.tags?.includes("Language")),
        );
      case "education":
        return courses.filter(
          (c) =>
            c.tags?.includes("math") ||
            c.tags?.includes("basic") ||
            c.tags?.includes("Tin học cơ bản") ||
            c.tags?.includes("Nhập môn") ||
            c.categoryId === "f7423037-6a44-4213-ad08-ee465782964d",
        );
      case "programming":
        return courses.filter(
          (c) =>
            c.tags?.includes("Lập trình") ||
            c.tags?.includes("C++") ||
            c.title.includes("Python căn bản"),
        );
      default:
        return [];
    }
  };

  // Define roadmap data
  const roadmaps = {
    frontend: {
      title: "Lộ trình Front-end Developer",
      description:
        "Học các công nghệ và kỹ năng cần thiết để trở thành lập trình viên Front-end chuyên nghiệp, từ HTML/CSS cơ bản đến các framework hiện đại.",
      image:
        courses.find((c) => c.tags?.includes("FE") || c.tags?.includes("React"))
          ?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/frontend-path.png",
    },
    backend: {
      title: "Lộ trình Back-end Developer",
      description:
        "Phát triển kỹ năng lập trình phía máy chủ với các ngôn ngữ và framework hiện đại như Java Spring Boot, Node.js và các công nghệ liên quan.",
      image:
        courses.find((c) => c.tags?.includes("BE"))?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/43658b78-7873-42b3-a0d6-906368748d33.png",
    },
    devops: {
      title: "Lộ trình DevOps & Cloud",
      description:
        "Học cách triển khai, quản lý và tự động hóa hệ thống với Docker, Linux và các công cụ DevOps hiện đại.",
      image:
        courses.find(
          (c) => c.tags?.includes("docker") || c.tags?.includes("Linux"),
        )?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/devops-path.png",
    },
    languages: {
      title: "Lộ trình học Ngoại ngữ",
      description:
        "Nâng cao khả năng ngoại ngữ với các khóa học TOEIC, IELTS và các chứng chỉ quốc tế khác.",
      image:
        courses.find((c) => c.tags?.includes("Language"))?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/3aa205ea-270f-4352-8268-15e01614bf95.jpg",
    },
    datascience: {
      title: "Lộ trình Data Science & AI",
      description:
        "Khám phá thế giới phân tích dữ liệu, machine learning và trí tuệ nhân tạo với Python và các công cụ chuyên dụng.",
      image:
        courses.find(
          (c) =>
            c.tags?.includes("AI") ||
            c.tags?.includes("ML") ||
            c.tags?.includes("analyze"),
        )?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/data-science-path.png",
    },
    personal: {
      title: "Lộ trình Phát triển cá nhân",
      description:
        "Rèn luyện kỹ năng mềm, tư duy và phát triển bản thân với các khóa học tâm lý học hành vi.",
      image:
        courses.find((c) => c.tags?.includes("Behavior"))?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/2314b91c-7239-488d-9299-5b0c9ddbc0f9.jpeg",
    },
    education: {
      title: "Lộ trình Kiến thức phổ thông",
      description:
        "Củng cố kiến thức nền tảng với các khóa học toán học, tin học cơ bản và các môn học phổ thông khác.",
      image:
        courses.find(
          (c) => c.tags?.includes("math") || c.tags?.includes("basic"),
        )?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/fc3aeacb-9100-4c02-9156-063921a05a99.jpeg",
    },
    programming: {
      title: "Lộ trình Lập trình cơ bản",
      description:
        "Bắt đầu hành trình lập trình với các ngôn ngữ phổ biến như C++, Python và các kiến thức nền tảng về lập trình.",
      image:
        courses.find(
          (c) => c.tags?.includes("Lập trình") || c.tags?.includes("C++"),
        )?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/programming-basics.png",
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
    <div className="container py-10 pl-16">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-bold mb-4">{currentRoadmap.title}</h1>
        <p className="text-gray-600 max-w-3xl">{currentRoadmap.description}</p>
      </motion.div>

      <div className="space-y-6 mt-10">
        {roadmapCourses.map((course, index) => (
          <motion.div
            key={course.id}
            initial="hidden"
            animate="visible"
            variants={itemVariant}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="max-w-3xl"
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 rounded-xl p-4">
              <div className="flex">
                <Link
                  href={`/course/${course.id}`}
                  className="relative h-44 w-64 flex-shrink-0 rounded-xl overflow-hidden m-2 cursor-pointer"
                >
                  <Image
                    src={course.thumbnailUrl || "/placeholder-course.jpg"}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {course.price === 0 && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                      Miễn phí
                    </span>
                  )}
                </Link>
                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-xl font-bold mb-2">
                      <Link
                        href={`/course/${course.id}`}
                        className="hover:text-blue-500 transition-colors"
                      >
                        {course.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {course.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      {userProgress[course.id] > 0 &&
                        userProgress[course.id] < 100 && (
                          <span className="text-orange-500 font-medium">
                            {Math.round(userProgress[course.id])}% hoàn thành
                          </span>
                        )}
                      {userProgress[course.id] === 100 && (
                        <span className="text-green-500 font-medium">
                          Đã hoàn thành
                        </span>
                      )}
                    </div>
                    <Link href={`/course/${course.id}`}>
                      <Button className="bg-blue-500 hover:bg-blue-600 rounded-full px-6">
                        {userProgress[course.id] > 0
                          ? "TIẾP TỤC HỌC"
                          : userProgress[course.id] === 100
                            ? "XEM LẠI"
                            : "XEM KHÓA HỌC"}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
