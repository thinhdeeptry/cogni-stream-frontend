import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Các URL tĩnh cơ bản của trang web
  const baseUrls = [
    {
      url: "https://cognistream.io.vn",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://cognistream.io.vn/courses",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: "https://cognistream.io.vn/discussion",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ] as MetadataRoute.Sitemap;

  // NOTE: Trong một ứng dụng thực tế, bạn có thể muốn thêm các URL động từ cơ sở dữ liệu
  // Ví dụ: Lấy tất cả các khóa học và tạo URL cho mỗi khóa học
  // const courseUrls = await getAllCourses().then(courses =>
  //   courses.map(course => ({
  //     url: `https://cognistream.com/courses/${course.id}`,
  //     lastModified: new Date(course.updatedAt),
  //     changeFrequency: 'weekly',
  //     priority: 0.6,
  //   }))
  // );

  // return [...baseUrls, ...courseUrls];
  return baseUrls;
}
