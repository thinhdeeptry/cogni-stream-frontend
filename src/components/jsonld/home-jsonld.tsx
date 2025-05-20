"use client";

import { useEffect } from "react";

interface HomeJsonLdProps {
  courses?: {
    title: string;
    description: string;
    url: string;
    image?: string;
    price?: number;
    category?: string;
  }[];
}

export const HomeJsonLd = ({ courses = [] }: HomeJsonLdProps) => {
  useEffect(() => {
    // Cấu trúc dữ liệu Organization
    const organizationJsonLd = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Eduforge",
      url: "https://eduforge.io.vn",
      logo: "https://eduforge.io.vn/images/logo.png",
      sameAs: [
        "https://facebook.com/eduforge",
        "https://twitter.com/eduforge",
        "https://instagram.com/eduforge",
        "https://linkedin.com/company/eduforge",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+84-123-456-789",
        contactType: "customer service",
        availableLanguage: ["Vietnamese", "English"],
      },
    };

    // Cấu trúc dữ liệu WebSite
    const websiteJsonLd = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: "https://eduforge.io.vn",
      name: "Eduforge - Nền tảng học trực tuyến hàng đầu Việt Nam",
      description:
        "Eduforge là nền tảng học trực tuyến với hàng nghìn khóa học chất lượng cao về lập trình, thiết kế, marketing và nhiều lĩnh vực khác.",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://eduforge.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    };

    // Cấu trúc dữ liệu cho các khóa học
    const courseListJsonLd =
      courses.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: courses.map((course, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "Course",
                name: course.title,
                description: course.description,
                url: course.url,
                image:
                  course.image ||
                  "https://eduforge.io.vn/images/default-course.jpg",
                provider: {
                  "@type": "Organization",
                  name: "Eduforge",
                  sameAs: "https://eduforge.io.vn",
                },
              },
            })),
          }
        : null;

    // Thêm các thẻ JSON-LD vào head
    const script1 = document.createElement("script");
    script1.type = "application/ld+json";
    script1.innerHTML = JSON.stringify(organizationJsonLd);
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.type = "application/ld+json";
    script2.innerHTML = JSON.stringify(websiteJsonLd);
    document.head.appendChild(script2);

    if (courseListJsonLd) {
      const script3 = document.createElement("script");
      script3.type = "application/ld+json";
      script3.innerHTML = JSON.stringify(courseListJsonLd);
      document.head.appendChild(script3);
    }

    // Cleanup khi component unmount
    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
      if (courseListJsonLd) {
        document.head.querySelector("script:nth-of-type(3)")?.remove();
      }
    };
  }, [courses]);

  return null;
};
