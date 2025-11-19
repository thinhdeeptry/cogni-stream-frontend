import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | CogniStream - Khóa học trực tuyến",
    default: "Khóa học | CogniStream - Nền tảng học tập trực tuyến",
  },
  description:
    "Khám phá hàng nghìn khóa học chất lượng cao trên CogniStream. Học từ các chuyên gia hàng đầu với phương pháp học tập hiện đại và hiệu quả.",
  keywords: [
    "khóa học trực tuyến",
    "học online",
    "e-learning",
    "đào tạo",
    "giáo dục",
    "kỹ năng",
    "chuyên môn",
    "CogniStream",
    "học tập",
    "phát triển bản thân",
  ],
  authors: [{ name: "CogniStream Team" }],
  creator: "CogniStream",
  publisher: "CogniStream",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://cognistream.id.vn/course",
    siteName: "CogniStream",
    title: "Khóa học chất lượng cao | CogniStream",
    description:
      "Nền tảng học tập trực tuyến hàng đầu Việt Nam với hàng nghìn khóa học từ các chuyên gia.",
    images: [
      {
        url: "https://cognistream.id.vn/images/logo.jpg",
        width: 1200,
        height: 630,
        alt: "CogniStream - Khóa học trực tuyến",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Khóa học chất lượng cao | CogniStream",
    description: "Nền tảng học tập trực tuyến hàng đầu Việt Nam",
    images: ["https://cognistream.id.vn/images/twitter-course.jpg"],
    creator: "@CogniStream",
  },
  alternates: {
    canonical: "https://cognistream.id.vn/course",
  },
  category: "education",
};

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
