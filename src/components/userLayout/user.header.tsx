"use client";

import { useRouter } from "next/navigation";

import { signOut } from "next-auth/react";
import { toast } from "sonner";

import useUserStore from "@/stores/useUserStore";

import { SidebarTrigger } from "../ui/sidebar";
import Navbar from "./navbar";

export default function UserHeader() {
  const { user, accessToken, clearUser } = useUserStore();
  const isLoggedIn = !!user && !!accessToken;
  const router = useRouter();

  const handleLogout = async () => {
    try {
      clearUser();
      await signOut({ redirect: false });
      toast.success("Đăng xuất thành công");
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  return (
    <div className="w-full">
      <Navbar
        isLoggedIn={isLoggedIn}
        userAvatar={user?.image || ""}
        userName={user?.name || "User"}
        onLogout={handleLogout}
      />
    </div>
  );
}
