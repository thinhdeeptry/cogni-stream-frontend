"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { getCertificate } from "@/actions/enrollmentActions";

import CertificateView from "@/components/certificate/certificate-view";

export default function CertificatePage({
  params,
}: {
  params: { certificateId: string };
}) {
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        // if (!session) {
        //   router.push("/");
        //   return;
        // }

        const result = await getCertificate(params.certificateId);

        if (result.success && result.data) {
          setCertificate(result.data);
        } else {
          throw new Error(
            result.message || "Không thể tải thông tin chứng chỉ",
          );
        }
      } catch (error) {
        console.error("Error fetching certificate:", error);
        toast.error("Không thể tải thông tin chứng chỉ");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [params.certificateId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-slate-500">Đang tải chứng chỉ...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">
          Không tìm thấy chứng chỉ
        </h1>
        <p className="text-gray-600 mb-6">
          Chứng chỉ bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy
          cập.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CertificateView certificate={certificate} />
    </div>
  );
}
