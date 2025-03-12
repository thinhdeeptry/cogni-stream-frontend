"use client";

import { redirect } from "next/navigation";
import React from "react";

import { signOut } from "next-auth/react";

import useUserStore from "@/stores/useUserStore";

import { Button } from "@/components/ui/button";

const SidebarPage: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);

  // if (!user || user.role !== 'ADMIN') {
  //     redirect('/'); // Chuyển hướng nếu không phải admin
  // }
  // if (user.role == 'ADMIN') {
  //     redirect('/dashboard'); // Chuyển hướng nếu không phải admin
  // }
  const handleLogout = () => {
    clearUser();
    // Có thể gọi API logout qua actions/ nếu cần
  };
  return (
    <div>
      <h1>Welcome to the Dashboard</h1>
      <>
        <span>Xin chào, {user?.name}</span>
        <button onClick={handleLogout}>Đăng xuất</button>
      </>
    </div>
  );
};
export default SidebarPage;
