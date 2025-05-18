"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Course } from "@/types/course/types";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

import { getAllCourses } from "@/actions/courseAction";
import { getUserEnrollments } from "@/actions/enrollmentActions";

import useUserStore from "@/stores/useUserStore";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function StudyRoadMap() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, number>>({});
  const { user } = useUserStore();

  // Using React Query instead of useEffect
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getAllCourses({ isPublished: true, skipPagination: true }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["enrollments", user?.id],
    queryFn: () => (user?.id ? getUserEnrollments(user.id) : null),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process the data when it's available
  useEffect(() => {
    if (coursesData?.data) {
      setCourses(coursesData.data);
    }

    if (enrollmentsData?.data) {
      const progressMap: Record<string, number> = {};
      enrollmentsData.data.forEach((enrollment: any) => {
        progressMap[enrollment.courseId] = enrollment.progress || 0;
      });
      setUserProgress(progressMap);
    }
  }, [coursesData, enrollmentsData]);

  const loading = coursesLoading || enrollmentsLoading;

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const roadmaps = [
    {
      id: "frontend",
      title: "Lộ trình Front-end Developer",
      description:
        "Học các công nghệ và kỹ năng cần thiết để trở thành lập trình viên Front-end chuyên nghiệp, từ HTML/CSS cơ bản đến các framework hiện đại.",
      image:
        courses.find((c) => c.tags?.includes("FE") || c.tags?.includes("React"))
          ?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/frontend-path.png",
      icons: courses
        .filter(
          (c) =>
            c.tags?.includes("FE") ||
            c.tags?.includes("Web Development") ||
            c.tags?.includes("JavaScript") ||
            c.tags?.includes("React") ||
            c.tags?.includes("CSS") ||
            c.tags?.includes("SASS") ||
            c.tags?.includes("Frontend"),
        )
        .slice(0, 7)
        .map((c) => c.thumbnailUrl || "/placeholder-course.jpg"),
    },
    {
      id: "backend",
      title: "Lộ trình Back-end Developer",
      description:
        "Phát triển kỹ năng lập trình phía máy chủ với các ngôn ngữ và framework hiện đại như Java Spring Boot, Node.js và các công nghệ liên quan.",
      image:
        courses.find((c) => c.tags?.includes("BE"))?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/43658b78-7873-42b3-a0d6-906368748d33.png",
      icons: courses
        .filter(
          (c) =>
            c.tags?.includes("BE") ||
            c.categoryId === "11111111-1111-1111-1111-111111111111" ||
            c.categoryId === "66666666-6666-6666-6666-666666666666",
        )
        .slice(0, 7)
        .map((c) => c.thumbnailUrl || "/placeholder-course.jpg"),
    },
    {
      id: "devops",
      title: "Lộ trình DevOps & Cloud",
      description:
        "Học cách triển khai, quản lý và tự động hóa hệ thống với Docker, Linux và các công cụ DevOps hiện đại.",
      image:
        courses.find(
          (c) => c.tags?.includes("docker") || c.tags?.includes("Linux"),
        )?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/devops-path.png",
      icons: courses
        .filter(
          (c) =>
            c.tags?.includes("docker") ||
            c.tags?.includes("Linux") ||
            c.tags?.includes("deploy") ||
            c.tags?.includes("Git"),
        )
        .slice(0, 7)
        .map((c) => c.thumbnailUrl || "/placeholder-course.jpg"),
    },
    {
      id: "languages",
      title: "Lộ trình học Ngoại ngữ",
      description:
        "Nâng cao khả năng ngoại ngữ với các khóa học TOEIC, IELTS và các chứng chỉ quốc tế khác.",
      image:
        courses.find((c) => c.tags?.includes("Language"))?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/3aa205ea-270f-4352-8268-15e01614bf95.jpg",
      icons: courses
        .filter((c) => c.tags?.includes("Language"))
        .slice(0, 7)
        .map((c) => c.thumbnailUrl || "/placeholder-course.jpg"),
    },
    {
      id: "datascience",
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
      icons: courses
        .filter(
          (c) =>
            c.tags?.includes("AI") ||
            c.tags?.includes("ML") ||
            c.tags?.includes("analyze") ||
            c.title.includes("Python"),
        )
        .slice(0, 7)
        .map((c) => c.thumbnailUrl || "/placeholder-course.jpg"),
    },
    {
      id: "personal",
      title: "Lộ trình Phát triển cá nhân",
      description:
        "Rèn luyện kỹ năng mềm, tư duy và phát triển bản thân với các khóa học tâm lý học hành vi.",
      image:
        courses.find((c) => c.tags?.includes("Behavior"))?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/2314b91c-7239-488d-9299-5b0c9ddbc0f9.jpeg",
      icons: courses
        .filter(
          (c) =>
            c.tags?.includes("Behavior") ||
            (c.categoryId === "55555555-5555-5555-5555-555555555555" &&
              !c.tags?.includes("Language")),
        )
        .slice(0, 7)
        .map((c) => c.thumbnailUrl || "/placeholder-course.jpg"),
    },
    {
      id: "education",
      title: "Lộ trình Kiến thức phổ thông",
      description:
        "Củng cố kiến thức nền tảng với các khóa học toán học, tin học cơ bản và các môn học phổ thông khác.",
      image:
        courses.find(
          (c) => c.tags?.includes("math") || c.tags?.includes("basic"),
        )?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/fc3aeacb-9100-4c02-9156-063921a05a99.jpeg",
      icons: courses
        .filter(
          (c) =>
            c.tags?.includes("math") ||
            c.tags?.includes("basic") ||
            c.tags?.includes("Tin học cơ bản") ||
            c.tags?.includes("Nhập môn") ||
            c.categoryId === "f7423037-6a44-4213-ad08-ee465782964d",
        )
        .slice(0, 7)
        .map((c) => c.thumbnailUrl || "/placeholder-course.jpg"),
    },
    {
      id: "programming",
      title: "Lộ trình Lập trình cơ bản",
      description:
        "Bắt đầu hành trình lập trình với các ngôn ngữ phổ biến như C++, Python và các kiến thức nền tảng về lập trình.",
      image:
        courses.find(
          (c) => c.tags?.includes("Lập trình") || c.tags?.includes("C++"),
        )?.thumbnailUrl ||
        "https://supabasekong-a084okggcg0skwoooockog08.eduforge.io.vn/storage/v1/object/public/courses/course-thumbnails/680342fe32367c789ca11c81/programming-basics.png",
      icons: courses
        .filter(
          (c) =>
            c.tags?.includes("Lập trình") ||
            c.tags?.includes("C++") ||
            c.title.includes("Python căn bản"),
        )
        .slice(0, 7)
        .map((c) => c.thumbnailUrl || "/placeholder-course.jpg"),
    },
  ];

  if (loading) {
    return (
      <div className="container py-10 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto px-6 py-10 max-w-6xl"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <h1 className="text-3xl font-bold mb-8">Lộ trình học</h1>

      <div className="mb-12">
        <p className="text-gray-700 mb-6 max-w-[70%]">
          Để bắt đầu một cách thuận lợi, bạn nên tập trung vào một lộ trình học.
          Ví dụ: Để đi làm với vị trí "Lập trình viên Front-end" bạn nên tập
          trung vào lộ trình "Lập trình".
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {roadmaps.map((roadmap) => (
          <motion.div
            key={roadmap.id}
            whileHover={{ y: -1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-full"
          >
            <Card className="p-6 h-full border border-gray-100 rounded-lg shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex-1 pr-4">
                    <h2 className="text-lg font-bold mb-2">{roadmap.title}</h2>
                    <p className="text-gray-600 text-sm mb-4 text-justify">
                      {roadmap.description}
                    </p>
                  </div>
                  <div className="w-28 h-28 relative flex-shrink-0 ml-2 rounded-full overflow-hidden">
                    <Image
                      src={roadmap.image}
                      alt={roadmap.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  {roadmap.icons.map((icon, index) => {
                    // Find the corresponding course for this icon
                    const course = courses.find((c) => c.thumbnailUrl === icon);
                    const progress = course ? userProgress[course.id] || 0 : 0;

                    return (
                      <div key={index} className="w-10 h-10 relative group">
                        {/* Progress circle */}
                        <div className="w-full h-full absolute">
                          <CircularProgressbar
                            value={progress}
                            strokeWidth={8}
                            styles={buildStyles({
                              strokeLinecap: "round",
                              pathColor: "#f97316",
                              trailColor: "#e5e7eb",
                              backgroundColor: "#fff",
                            })}
                          />
                        </div>

                        {/* Course image */}
                        <div className="absolute inset-0 flex items-center justify-center w-[calc(100%-6px)] h-[calc(100%-6px)] m-[3px] rounded-full overflow-hidden">
                          <Image
                            src={icon}
                            alt={course?.title || "Course icon"}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        </div>

                        {/* Tooltip that appears on hover */}
                        <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-800 rounded-md shadow-sm transition-opacity duration-300 whitespace-nowrap z-20">
                          {course?.title || "Khóa học"}
                          {progress > 0 && (
                            <span className="ml-1">
                              - {Math.round(progress)}% hoàn thành
                            </span>
                          )}
                          {/* Arrow pointing down */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-auto">
                  <Link href={`/roadmap/${roadmap.id}`}>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm">
                      XEM CHI TIẾT
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-8 mb-16">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="md:w-1/2">
            <h2 className="text-xl font-bold mb-4">
              Tham gia cộng đồng học viên EduForge trên Facebook
            </h2>
            <p className="text-gray-600 text-sm mb-5">
              Hàng nghìn người khác đang học lập trình, cùng tham gia hỏi đáp,
              chia sẻ và hỗ trợ nhau trong quá trình học tập.
            </p>
            <a
              href="https://www.facebook.com/groups/f8official"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-50 rounded-full text-sm"
              >
                THAM GIA NHÓM
              </Button>
            </a>
          </div>
          <div className="md:w-1/2">
            <Image
              src="https://fullstack.edu.vn/assets/fb-group-cards-CAn_kGMe.png"
              alt="Facebook Group"
              width={400}
              height={240}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
