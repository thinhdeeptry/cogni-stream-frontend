"use client";

import { useEffect, useRef, useState } from "react";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import { Download, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

// Import from existing actions
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { CertificateData } from "../../actions/certificateActions";
import { getCourseById } from "../../actions/courseAction";
import { Category, Course } from "../../types/course/types";

interface Certificate extends CertificateData {
  // Thêm các fields tương thích với UI cũ nếu cần
}

interface CourseInfo {
  id: string;
  title: string;
  tags: string[];
  category: {
    name?: string;
  };
  level?: string;
}

export default function CertificateView({
  certificate,
}: {
  certificate: Certificate;
}) {
  const [isClient, setIsClient] = useState(false);
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);

    // Fetch course information using the existing course action
    const fetchCourseInfo = async () => {
      try {
        setIsLoading(true);
        const courseData: Course = await getCourseById(certificate.courseId);
        // Chuyển đổi dữ liệu Course thành CourseInfo
        const courseInfo: CourseInfo = {
          id: courseData.id,
          title: courseData.title,
          tags: courseData.tags,
          category: {
            name: courseData.category?.name,
          },
          level: courseData.level,
        };
        setCourseInfo(courseInfo);
      } catch (error) {
        console.error("Error fetching course info:", error);
        toast.error("Could not load course details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseInfo();
  }, [certificate.courseId]);

  // Phần còn lại của component giữ nguyên
  const handleDownload = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `certificate-${certificate.courseId}.png`;
      link.click();

      toast.success("Chứng chỉ đã được tải xuống!");
    } catch (error) {
      console.error("Error downloading certificate:", error);
      toast.error("Có lỗi xảy ra khi tải chứng chỉ");
    }
  };

  const handleShare = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      if (navigator.share) {
        await navigator.share({
          title: `Chứng chỉ khóa học ${certificate.course.title}`,
          text: `Tôi đã hoàn thành khóa học ${certificate.course.title} trên CogniStream!`,
          url: window.location.href,
        });
        toast.success("Đã chia sẻ chứng chỉ!");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Đã sao chép liên kết chứng chỉ!");
      }
    } catch (error) {
      console.error("Error sharing certificate:", error);
      toast.error("Có lỗi xảy ra khi chia sẻ chứng chỉ");
    }
  };

  const formattedDate = isClient
    ? format(new Date(certificate.issuedAt), "dd.MM.yyyy", { locale: vi })
    : "";

  const verificationUrl = `https://cognistream.id.vn/certificate/${certificate.id}`;
  const tags = courseInfo?.tags || ["Programming"];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <motion.h1
          className="text-3xl font-bold text-slate-800"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Nhận chứng chỉ
        </motion.h1>
        <motion.p
          className="text-slate-600 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          CogniStream ghi nhận sự nỗ lực của bạn! Bằng cách nhận chứng chỉ này,
          bạn chính thức hoàn thành khóa học{" "}
          <span className="font-semibold">{certificate.course.title}</span>.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="w-full max-w-5xl mx-auto"
      >
        <Card className="overflow-hidden border-orange-200 shadow-lg w-full">
          <CardContent className="p-0">
            <div
              ref={certificateRef}
              className="flex h-full w-full overflow-hidden rounded-lg"
            >
              <div className="relative w-3/4 bg-white p-8 md:p-10">
                <div className="absolute inset-0">
                  <svg
                    width="100%"
                    height="100%"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern
                        id="concentricCircles"
                        width="90"
                        height="90"
                        patternUnits="userSpaceOnUse"
                      >
                        {/* Pattern circles remain the same */}
                      </pattern>
                    </defs>
                    <rect
                      width="100%"
                      height="100%"
                      fill="url(#concentricCircles)"
                    />
                  </svg>
                </div>

                <div className="relative z-10 flex flex-col justify-between h-full py-2">
                  <div>
                    <h3 className="mb-2 text-xl md:text-2xl font-medium text-gray-700 font-playfair">
                      CogniStream
                    </h3>
                    <h1 className="mb-5 md:mb-8 text-3xl md:text-4xl font-bold uppercase tracking-wide text-gray-800 font-playfair">
                      Certificate of Completion
                    </h1>
                    <p className="mb-2 md:mb-3 text-base md:text-lg text-gray-600 font-playfair">
                      This is to certify that
                    </p>
                    <h2 className="mb-5 md:mb-8 font-great-vibes text-4xl md:text-6xl font-normal text-gray-800">
                      {certificate.student.name}
                    </h2>
                    <p className="mb-2 text-base md:text-lg text-gray-600 font-playfair">
                      Graduated from the
                    </p>
                    <h3 className="mb-4 text-xl md:text-2xl font-semibold text-gray-800 font-playfair leading-tight">
                      '{certificate.course.title}'
                    </h3>
                  </div>

                  <div className="mt-4 mb-6 md:mb-8 flex flex-wrap gap-2">
                    {isLoading ? (
                      <span className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs md:text-sm font-medium text-gray-500 font-playfair inline-flex items-center justify-center animate-pulse">
                        Loading...
                      </span>
                    ) : (
                      tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-gray-300 bg-transparent px-3 py-1 text-xs md:text-sm font-medium text-gray-700 font-playfair inline-flex items-center justify-center"
                        >
                          {tag}
                        </span>
                      ))
                    )}
                    {courseInfo?.category && (
                      <span className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs md:text-sm font-medium text-orange-700 font-playfair inline-flex items-center justify-center">
                        {courseInfo.category.name}
                      </span>
                    )}
                    {courseInfo?.level && (
                      <span className="rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs md:text-sm font-medium text-blue-700 font-playfair inline-flex items-center justify-center">
                        {courseInfo.level}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-end mt-auto">
                    <div className="text-center">
                      <img
                        src="/images/logo.jpg"
                        alt="CogniStream Logo"
                        className="h-12 w-12 md:h-16 md:w-16 rounded-lg mx-auto mb-1 md:mb-2"
                        crossOrigin="anonymous"
                      />
                      <p className="text-sm text-gray-600 font-playfair">
                        Edu Forge
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex w-1/4 flex-col justify-between bg-gray-900 p-4 md:p-6">
                <div>
                  <p className="mb-1 text-xs md:text-sm font-medium text-gray-300">
                    Date of issue:
                  </p>
                  <p className="mb-4 md:mb-6 text-lg md:text-xl font-bold text-gray-100 ">
                    {formattedDate}
                  </p>
                  <p className="mb-1 text-xs md:text-sm font-medium text-gray-300">
                    Certificate ID:
                  </p>
                  <p className="break-words text-xs md:text-sm font-medium text-gray-100">
                    {certificate.id}
                  </p>
                </div>

                <div className="flex justify-center items-center mt-4">
                  <div className="rounded-lg bg-white p-2">
                    <QRCodeSVG value={verificationUrl} size={90} level="H" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        className="flex justify-center gap-4 mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Button
          onClick={handleDownload}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Download className="mr-2 h-4 w-4" />
          Tải xuống
        </Button>
        <Button
          onClick={handleShare}
          variant="outline"
          className="border-orange-500 text-orange-500 hover:bg-orange-50"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Chia sẻ
        </Button>
      </motion.div>
    </div>
  );
}
