"use client";

import { useSession } from "next-auth/react";

import useUserStore from "@/stores/useUserStore";

/**
 * Custom hook để đồng bộ hóa user data giữa NextAuth session và Zustand store
 * Sử dụng hook này khi cần cập nhật store ngay lập tức sau khi login
 */
export const useAuthSync = () => {
  const { setUser, setTokens } = useUserStore();

  const syncUserData = async () => {
    try {
      // Import getSession dynamically để tránh SSR issues
      const { getSession } = await import("next-auth/react");
      const session = await getSession();

      if (session?.user && session.accessToken) {
        const user: IUser = {
          id: session.user.id || "",
          name: session.user.name || "",
          email: session.user.email || "",
          phone: session.user.phone || "",
          address: session.user.address || "",
          image: session.user.image || "",
          role: session.user.role || "",
          isActive: session.user.isActive || false,
          createdAt: session.user.createdAt || "",
          accountType: session.user.accountType || "",
        };

        // Cập nhật Zustand store
        setUser(user, session.accessToken);

        const refreshToken =
          typeof session.refreshToken === "string" ? session.refreshToken : "";
        setTokens(session.accessToken, refreshToken);

        return { success: true, user };
      }

      return { success: false, error: "No session or missing data" };
    } catch (error) {
      console.error("Error syncing user data:", error);
      return { success: false, error: error };
    }
  };

  return { syncUserData };
};
