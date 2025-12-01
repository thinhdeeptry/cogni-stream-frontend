import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - Học trực tuyến | CogniStream",
    default: "Học trực tuyến | CogniStream",
  },
  description:
    "Tham gia lớp học trực tuyến tương tác với giảng viên và học viên khác. Trải nghiệm học tập hiện đại và hiệu quả trên CogniStream.",
  keywords: [
    "lớp học trực tuyến",
    "học nhóm",
    "tương tác trực tiếp",
    "học cùng giảng viên",
    "CogniStream class",
    "e-learning interactive",
    "video call learning",
    "online classroom",
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
    "content-type": "online-class",
    "learning-mode": "interactive",
  },
};

export default function ClassIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
