import { MetadataRoute } from "next";

import { getAllCourses } from "@/actions/courseAction";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Các URL tĩnh cơ bản của trang web
  const baseUrls = [
    {
      url: "https://cognistream.id.vn",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: "https://cognistream.id.vn/courses",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    // {
    //   url: "https://cognistream.id.vn/about",
    //   lastModified: new Date(),
    //   changeFrequency: "monthly" as const,
    //   priority: 0.5,
    // },
    // {
    //   url: "https://cognistream.id.vn/contact",
    //   lastModified: new Date(),
    //   changeFrequency: "monthly" as const,
    //   priority: 0.5,
    // },
  ] as MetadataRoute.Sitemap;

  try {
    // Lấy tất cả các khóa học đã publish
    const coursesResponse = await getAllCourses({
      isPublished: true,
      skipPagination: true,
    });

    const courses = coursesResponse.data || [];

    // Tạo URL cho từng khóa học
    const courseUrls: MetadataRoute.Sitemap = courses
      .filter((course) => course.status === "PUBLISHED")
      .map((course) => ({
        url: `https://cognistream.id.vn/course/${course.id}`,
        lastModified: new Date(course.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

    // Tạo URL cho các lessons (chỉ những lesson free preview)
    const lessonUrls: MetadataRoute.Sitemap = [];

    for (const course of courses) {
      if (course.chapters) {
        for (const chapter of course.chapters) {
          if (chapter.lessons) {
            const freeLessons = chapter.lessons.filter(
              (lesson) => lesson.isFreePreview && lesson.status === "PUBLISHED",
            );

            freeLessons.forEach((lesson) => {
              lessonUrls.push({
                url: `https://cognistream.id.vn/course/${course.id}/lesson/${lesson.id}`,
                lastModified: new Date(lesson.updatedAt),
                changeFrequency: "weekly" as const,
                priority: 0.6,
              });
            });
          }
        }
      }
    }

    // Tạo URL cho các classes (lớp học trực tuyến)
    const classUrls: MetadataRoute.Sitemap = [];

    for (const course of courses) {
      if (course.classes && course.courseType === "LIVE") {
        const publishedClasses = course.classes.filter(
          (classItem) => classItem.statusActive === "PUBLISHED",
        );

        publishedClasses.forEach((classItem) => {
          classUrls.push({
            url: `https://cognistream.id.vn/course/${course.id}/class/${classItem.id}`,
            lastModified: new Date(
              classItem.updatedAt || classItem.createdAt || new Date(),
            ),
            changeFrequency: "weekly" as const,
            priority: 0.6,
          });
        });
      }
    }

    return [...baseUrls, ...courseUrls, ...lessonUrls, ...classUrls];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Trả về ít nhất các URL tĩnh nếu có lỗi
    return baseUrls;
  }
}
