"use client";

import { useRouter } from "next/navigation";

import { signOut } from "next-auth/react";
import { toast } from "sonner";

import useUserStore from "@/stores/useUserStore";

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
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        isLoggedIn={isLoggedIn}
        userAvatar={user?.image || ""}
        userName={user?.name || "User"}
        onLogout={handleLogout}
      />
    </div>
  );
}
