"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSession } from "next-auth/react";

import Loading from "@/components/userLayout/Loading";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  console.log("check data>>> ", session);
  console.log("check status>>> ", status);

  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/login");
      return;
    }

    if (session.user.role !== "ADMIN") {
      router.push("/unauthorized");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <Loading isLoading={true} />;
  }

  return <main className="flex-1 p-6 overflow-visible">{children}</main>;
}
