import { Metadata } from "next";

import { getCourseById } from "@/actions/courseAction";

interface ClassPageProps {
  params: Promise<{
    courseId: string;
    classId: string;
  }>;
}

export async function generateMetadata({
  params,
}: ClassPageProps): Promise<Metadata> {
  try {
    const { courseId, classId } = await params;
    const course = await getCourseById(courseId);

    if (!course) {
      return {
        title: "Lớp học không tồn tại | CogniStream",
        description: "Lớp học bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.",
      };
    }

    // Find the specific class
    const classInfo = course.classes?.find((c) => c.id === classId);
    const className = classInfo?.name || `Lớp học ${course.title}`;

    const title = `${className} - ${course.title} | CogniStream`;
    const description = `Tham gia lớp học trực tuyến "${className}" thuộc khóa ${course.title}. Học cùng giảng viên ${course.instructor?.user?.name || "chuyên gia"} và các học viên khác.`;

    return {
      title,
      description,
      keywords: [
        className,
        course.title,
        "lớp học trực tuyến",
        "học nhóm",
        "tương tác trực tiếp",
        course.category?.name || "",
        course.level || "",
        "CogniStream",
        ...(course.tags || []),
      ].filter(Boolean),
      authors: [
        {
          name: course.instructor?.user?.name || "CogniStream Instructor",
          url: `https://cognistream.id.vn/instructor/${course.instructorId}`,
        },
      ],
      creator: course.instructor?.user?.name || "CogniStream",
      publisher: "CogniStream",
      robots: {
        index:
          course.status === "PUBLISHED" &&
          classInfo?.statusActive === "PUBLISHED",
        follow: true,
        googleBot: {
          index:
            course.status === "PUBLISHED" &&
            classInfo?.statusActive === "PUBLISHED",
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
      openGraph: {
        type: "article",
        locale: "vi_VN",
        url: `https://cognistream.id.vn/course/${courseId}/class/${classId}`,
        siteName: "CogniStream",
        title,
        description,
        images: [
          {
            url:
              course.thumbnailUrl ||
              "https://cognistream.id.vn/images/default-class.jpg",
            width: 1200,
            height: 630,
            alt: `${className} - ${course.title}`,
          },
        ],
        authors: [course.instructor?.user?.name || "CogniStream Instructor"],
        publishedTime:
          (classInfo?.createdAt
            ? new Date(classInfo.createdAt).toISOString()
            : undefined) ||
          (course.createdAt
            ? new Date(course.createdAt).toISOString()
            : undefined),
        modifiedTime:
          (classInfo?.updatedAt
            ? new Date(classInfo.updatedAt).toISOString()
            : undefined) ||
          (course.updatedAt
            ? new Date(course.updatedAt).toISOString()
            : undefined),
        section: course.category?.name || "Lớp học",
        tags: ["lớp học trực tuyến", "học nhóm", ...(course.tags || [])],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [
          course.thumbnailUrl ||
            "https://cognistream.id.vn/images/default-class.jpg",
        ],
        creator: "@CogniStream",
      },
      alternates: {
        canonical: `https://cognistream.id.vn/course/${courseId}/class/${classId}`,
      },
      category: course.category?.name || "education",
      other: {
        "class:name": className,
        "class:course": course.title,
        "class:instructor": course.instructor?.user?.name || "",
        "class:students": classInfo?.currentStudents?.toString() || "0",
        "class:maxStudents": classInfo?.maxStudents?.toString() || "",
        "class:startDate": classInfo?.startDate || "",
        "class:status": classInfo?.status || "",
      },
    };
  } catch (error) {
    console.error("Error generating class metadata:", error);
    return {
      title: "Lỗi tải lớp học | CogniStream",
      description: "Đã xảy ra lỗi khi tải thông tin lớp học.",
    };
  }
}

export default function ClassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
