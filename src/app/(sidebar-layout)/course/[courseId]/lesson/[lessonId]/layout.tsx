import { Metadata } from "next";

import { getCourseById, getLessonById } from "@/actions/courseAction";

interface LessonPageProps {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  try {
    const { courseId, lessonId } = await params;
    const [course, lesson] = await Promise.all([
      getCourseById(courseId),
      getLessonById(lessonId),
    ]);

    if (!course || !lesson) {
      return {
        title: "Bài học không tồn tại | CogniStream",
        description: "Bài học bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.",
      };
    }

    const title = `${lesson.title} - ${course.title} | CogniStream`;
    const description = lesson.content
      ? `${lesson.title} thuộc khóa học ${course.title}. Học ${lesson.type === "VIDEO" ? "video" : lesson.type === "QUIZ" ? "quiz" : "nội dung"} chất lượng cao từ ${course.instructor?.user?.name || "giảng viên chuyên nghiệp"}.`
      : `Bài học ${lesson.title} trong khóa ${course.title}. Tham gia học tập cùng CogniStream.`;

    const lessonTypeMap = {
      VIDEO: "Video học tập",
      BLOG: "Bài viết",
      MIXED: "Nội dung đa phương tiện",
      QUIZ: "Bài kiểm tra",
    };

    return {
      title,
      description,
      keywords: [
        lesson.title,
        course.title,
        lessonTypeMap[lesson.type as keyof typeof lessonTypeMap] || "bài học",
        lesson.type.toLowerCase(),
        course.category?.name || "",
        course.level || "",
        "bài học online",
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
        index: course.status === "PUBLISHED" && lesson.status === "PUBLISHED",
        follow: true,
        googleBot: {
          index: course.status === "PUBLISHED" && lesson.status === "PUBLISHED",
          follow: true,
          "max-video-preview": lesson.type === "VIDEO" ? -1 : 0,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
      openGraph: {
        type: "article",
        locale: "vi_VN",
        url: `https://cognistream.id.vn/course/${courseId}/lesson/${lessonId}`,
        siteName: "CogniStream",
        title,
        description,
        images: [
          {
            url:
              course.thumbnailUrl ||
              "https://cognistream.id.vn/images/default-lesson.jpg",
            width: 1200,
            height: 630,
            alt: `${lesson.title} - ${course.title}`,
          },
        ],
        authors: [course.instructor?.user?.name || "CogniStream Instructor"],
        publishedTime: lesson.createdAt
          ? new Date(lesson.createdAt).toISOString()
          : undefined,
        modifiedTime: lesson.updatedAt
          ? new Date(lesson.updatedAt).toISOString()
          : undefined,
        section: course.category?.name || "Bài học",
        tags: [
          lessonTypeMap[lesson.type as keyof typeof lessonTypeMap] || "bài học",
          ...(course.tags || []),
        ],
      },
      twitter: {
        card: lesson.type === "VIDEO" ? "player" : "summary_large_image",
        title,
        description,
        images: [
          course.thumbnailUrl ||
            "https://cognistream.id.vn/images/default-lesson.jpg",
        ],
        creator: "@CogniStream",
        ...(lesson.type === "VIDEO" && lesson.videoUrl
          ? {
              players: {
                playerUrl: lesson.videoUrl,
                streamUrl: lesson.videoUrl,
                width: 1280,
                height: 720,
              },
            }
          : {}),
      },
      alternates: {
        canonical: `https://cognistream.id.vn/course/${courseId}/lesson/${lessonId}`,
      },
      category: course.category?.name || "education",
      other: {
        "lesson:title": lesson.title,
        "lesson:type": lesson.type,
        "lesson:course": course.title,
        "lesson:instructor": course.instructor?.user?.name || "",
        "lesson:duration": lesson.estimatedDurationMinutes?.toString() || "",
        "lesson:order": lesson.order?.toString() || "",
        "lesson:chapter": lesson.chapter?.title || "",
        "lesson:free": lesson.isFreePreview ? "true" : "false",
        "video:duration": lesson.estimatedDurationMinutes
          ? (lesson.estimatedDurationMinutes * 60).toString()
          : "",
        ...(lesson.videoUrl
          ? {
              "video:url": lesson.videoUrl,
              "video:type": "video/mp4",
            }
          : {}),
      },
    };
  } catch (error) {
    console.error("Error generating lesson metadata:", error);
    return {
      title: "Lỗi tải bài học | CogniStream",
      description: "Đã xảy ra lỗi khi tải thông tin bài học.",
    };
  }
}

export default function LessonIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
