"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Từ chối truy cập</h1>
      <p className="mb-6">Bạn không có quyền truy cập vào trang này.</p>
      <Button onClick={() => router.push("/")}>Quay lại trang chủ</Button>
    </div>
  );
}
