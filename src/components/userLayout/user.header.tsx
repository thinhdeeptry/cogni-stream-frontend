"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { signOut } from "next-auth/react";
import { toast } from "sonner";

import useUserStore from "@/stores/useUserStore";

import Navbar from "./navbar";

export default function UserHeader() {
  const [mounted, setMounted] = useState(false);
  const { user, accessToken, clearUser } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return null;
  }

  const isLoggedIn = !!user && !!accessToken;

  return (
    <div className="w-full sticky top-0 z-50">
      <Navbar
        isLoggedIn={isLoggedIn}
        userAvatar={user?.image || ""}
        userName={user?.name || "User"}
        onLogout={handleLogout}
      />
    </div>
  );
}
