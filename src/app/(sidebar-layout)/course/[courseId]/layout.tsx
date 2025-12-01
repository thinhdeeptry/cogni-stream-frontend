import { notFound } from "next/navigation";

import { Metadata } from "next";

import { getCourseById } from "@/actions/courseAction";

interface CoursePageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  try {
    const { courseId } = await params;
    const course = await getCourseById(courseId);

    if (!course) {
      return {
        title: "Khóa học không tồn tại | CogniStream",
        description: "Khóa học bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.",
      };
    }

    const title = `${course.title} | CogniStream`;
    const description =
      course.description ||
      `Khóa học ${course.title} - Học ${course.category?.name || "kỹ năng mới"} cùng với các chuyên gia hàng đầu trên CogniStream.`;

    return {
      title,
      description,
      keywords: [
        course.title,
        course.category?.name || "",
        course.level || "",
        course.courseType === "LIVE" ? "trực tuyến" : "tự học",
        "khóa học",
        "học online",
        "CogniStream",
        ...(course.tags || []),
      ].filter(Boolean),
      authors: [
        {
          name: course.instructor?.user?.name || "CogniStream Instructor",
          // url: `https://cognistream.id.vn/instructor/${course.instructorId}`
        },
      ],
      creator: course.instructor?.user?.name || "CogniStream",
      publisher: "CogniStream",
      robots: {
        index: course.status === "PUBLISHED", // cho phép lập chỉ mục nếu khóa học đã được xuất bản
        follow: true, // cho phép crawl links trên trang
        googleBot: {
          // cho phép crawl links trên trang
          index: course.status === "PUBLISHED",
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
      openGraph: {
        type: "article",
        locale: "vi_VN",
        url: `https://cognistream.id.vn/course/${courseId}`,
        siteName: "CogniStream",
        title,
        description,
        images: [
          {
            url:
              course.thumbnailUrl ||
              "https://cognistream.id.vn/images/default-course.jpg",
            width: 1200,
            height: 630,
            alt: course.title,
          },
        ],
        authors: [course.instructor?.user?.name || "CogniStream Instructor"],
        publishedTime: course.createdAt
          ? new Date(course.createdAt).toISOString()
          : undefined,
        modifiedTime: course.updatedAt
          ? new Date(course.updatedAt).toISOString()
          : undefined,
        section: course.category?.name || "Khóa học",
        tags: course.tags || [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [
          course.thumbnailUrl ||
            "https://cognistream.id.vn/images/default-course.jpg",
        ],
        creator: "@CogniStream",
      },
      alternates: {
        canonical: `https://cognistream.id.vn/course/${courseId}`,
      },
      category: course.category?.name || "education",
      other: {
        "course:level": course.level || "",
        "course:type": course.courseType || "",
        "course:instructor": course.instructor?.user?.name || "",
        "course:category": course.category?.name || "",
        "course:rating": course.avgRating?.toString() || "",
        "course:students": course.totalStudents?.toString() || "",
        "course:lessons": course.totalLessons?.toString() || "",
      },
    };
  } catch (error) {
    console.error("Error generating course metadata:", error);
    return {
      title: "Lỗi tải khóa học | CogniStream",
      description: "Đã xảy ra lỗi khi tải thông tin khóa học.",
    };
  }
}

export default function CourseIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
