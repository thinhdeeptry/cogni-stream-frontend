"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSession } from "next-auth/react";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AdminContent from "@/components/userLayout/admin.content";
import AdminHeader from "@/components/userLayout/admin.header";
import AdminSidebar from "@/components/userLayout/admin.sidebar";
import UserHeader from "@/components/userLayout/user.header";

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
    return <div>Đang tải...</div>;
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="flex flex-col h-screen">
        <UserHeader />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
