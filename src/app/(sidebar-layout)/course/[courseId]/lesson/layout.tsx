import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - Bài học | CogniStream",
    default: "Bài học | CogniStream",
  },
  description:
    "Học các bài học chất lượng cao với nội dung phong phú và phương pháp giảng dạy hiện đại trên CogniStream.",
  keywords: [
    "bài học online",
    "video học tập",
    "nội dung học tập",
    "tự học",
    "e-learning content",
    "CogniStream lesson",
    "học tập cá nhân",
    "kiến thức chuyên môn",
  ],
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
  other: {
    "content-type": "lesson",
    "learning-mode": "self-paced",
  },
};

export default function LessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
