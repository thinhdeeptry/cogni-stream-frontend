"use client";

import { useEffect, useRef, useState } from "react";

import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import { Download, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Certificate {
  certificateId: string;
  courseId: string;
  courseName: string;
  userName: string;
  issuedAt: string;
  metadata: any;
  isValid: boolean;
}

export default function CertificateView({
  certificate,
}: {
  certificate: Certificate;
}) {
  const [isClient, setIsClient] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
          title: `Chứng chỉ khóa học ${certificate.courseName}`,
          text: `Tôi đã hoàn thành khóa học ${certificate.courseName} trên EduForge!`,
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

  // Create verification URL
  const verificationUrl = `https://eduforge.io.vn/verify/${certificate.certificateId}`;

  // Extract categories from metadata if available
  const categories = certificate.metadata?.categoryName
    ? [certificate.metadata.categoryName]
    : ["Programming"];

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
          EduForge ghi nhận sự nỗ lực của bạn! Bằng cách nhận chứng chỉ này, bạn
          chính thức hoàn thành khóa học{" "}
          <span className="font-semibold">{certificate.courseName}</span>.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="overflow-hidden border-orange-200 shadow-lg">
          <CardContent className="p-0">
            <div
              ref={certificateRef}
              className="flex h-full w-full max-w-5xl overflow-hidden rounded-lg"
            >
              {/* Left section */}
              <div className="relative w-3/4 bg-white p-12">
                {/* Background pattern */}
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
                        {/* Center */}
                        <circle
                          cx="45"
                          cy="45"
                          r="35"
                          fill="none"
                          stroke="#f8f8f8"
                          strokeWidth="1"
                        />
                        <circle
                          cx="45"
                          cy="45"
                          r="25"
                          fill="none"
                          stroke="#f8f8f8"
                          strokeWidth="1"
                        />

                        {/* Left */}
                        <circle
                          cx="0"
                          cy="45"
                          r="35"
                          fill="none"
                          stroke="#f8f8f8"
                          strokeWidth="1"
                        />
                        <circle
                          cx="0"
                          cy="45"
                          r="25"
                          fill="none"
                          stroke="#f8f8f8"
                          strokeWidth="1"
                        />

                        {/* Right */}
                        <circle
                          cx="90"
                          cy="45"
                          r="35"
                          fill="none"
                          stroke="#f8f8f8"
                          strokeWidth="1"
                        />
                        <circle
                          cx="90"
                          cy="45"
                          r="25"
                          fill="none"
                          stroke="#f8f8f8"
                          strokeWidth="1"
                        />

                        {/* Top */}
                        <circle
                          cx="45"
                          cy="0"
                          r="35"
                          fill="none"
                          stroke="#f8f8f8"
                          strokeWidth="1"
                        />
                        <circle
                          cx="45"
                          cy="0"
                          r="25"
                          fill="none"
                          stroke="#f8f8f8"
                          strokeWidth="1"
                        />

                        {/* Bottom */}
                        <circle
                          cx="45"
                          cy="90"
                          r="35"
                          fill="none"
                          stroke="#f8f8f8"
                          strokeWidth="1"
                        />
                        <circle
                          cx="45"
                          cy="90"
                          r="25"
                          fill="none"
                          stroke="#f8f8f8"
                          strokeWidth="1"
                        />
                      </pattern>
                    </defs>
                    <rect
                      width="100%"
                      height="100%"
                      fill="url(#concentricCircles)"
                    />
                  </svg>
                </div>

                {/* Certificate content */}
                <div className="relative z-10">
                  <h3 className="mb-2 text-2xl font-medium text-gray-700 font-playfair">
                    EduForge
                  </h3>

                  <h1 className="mb-10 text-4xl font-bold uppercase tracking-wide text-gray-800 font-playfair">
                    Certificate of Completion
                  </h1>

                  <p className="mb-4 text-lg text-gray-600 font-playfair">
                    This is to certify that
                  </p>

                  <h2 className="mb-10 font-great-vibes text-6xl font-normal text-gray-800">
                    {certificate.userName}
                  </h2>

                  <p className="mb-2 text-lg text-gray-600 font-playfair">
                    Graduated from the
                  </p>

                  <h3 className="mb-6 text-2xl font-semibold text-gray-800 font-playfair">
                    '{certificate.courseName}'
                  </h3>

                  {/* Category tags */}
                  <div className="mb-16 flex gap-2">
                    {categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full border border-gray-300 bg-transparent px-4 py-1 text-sm font-medium text-gray-700 font-playfair"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  {/* Issuer section - replace text with logo */}
                  <div className="flex justify-end">
                    <div className="text-center">
                      <img
                        src="/images/logo.jpg"
                        alt="EduForge Logo"
                        className="h-16 w-16 rounded-lg mx-auto mb-2"
                      />
                      <p className="text-gray-600 font-playfair">Edu Forge</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right section */}
              <div className="flex w-1/4 flex-col justify-between bg-gray-900 p-8 text-white">
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-300">
                    Date of issue:
                  </p>
                  <p className="mb-8 text-2xl font-bold">{formattedDate}</p>

                  <p className="mb-2 text-sm font-medium text-gray-300">
                    Certificate ID:
                  </p>
                  <p className="break-words text-sm font-medium">
                    {certificate.certificateId}
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="rounded-lg bg-white p-2">
                    <QRCodeSVG value={verificationUrl} size={120} level="H" />
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
