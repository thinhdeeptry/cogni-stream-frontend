import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eduforge - Nền tảng học trực tuyến hàng đầu Việt Nam",
  description:
    "Eduforge cung cấp hàng nghìn khóa học trực tuyến chất lượng cao với nội dung đa dạng từ lập trình, thiết kế đến marketing. Học mọi lúc, mọi nơi với các chuyên gia hàng đầu.",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://eduforge.com",
    title: "Eduforge - Nền tảng học trực tuyến hàng đầu Việt Nam",
    description:
      "Học trực tuyến với các khóa học chất lượng cao từ Eduforge. Khám phá các khóa học miễn phí và Pro từ các chuyên gia hàng đầu.",
    siteName: "Eduforge",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Eduforge - Nền tảng học trực tuyến",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eduforge - Nền tảng học trực tuyến hàng đầu Việt Nam",
    description:
      "Học trực tuyến với các khóa học chất lượng cao từ Eduforge. Khám phá các khóa học miễn phí và Pro từ các chuyên gia hàng đầu.",
    images: ["/images/og-image.png"],
    creator: "@eduforge",
  },
  alternates: {
    canonical: "https://eduforge.com",
  },
  category: "education",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
