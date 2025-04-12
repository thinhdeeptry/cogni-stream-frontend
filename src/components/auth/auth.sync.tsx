"use client";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import useUserStore from "@/stores/useUserStoree";

export default function AuthSync() {
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const setUser = useUserStore((state) => state.setUser);
  const setTokens = useUserStore((state) => state.setTokens);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!session) {
      console.log("AuthSync: No session, clearing user");
      clearUser();
      return;
    }

    console.log("AuthSync: Session data:", {
      user: session.user
        ? {
            id: session.user.id,
            email: session.user.email,
          }
        : null,
      accessToken: session.accessToken ? "[EXISTS]" : "[MISSING]",
      refreshToken: session.refreshToken ? "[EXISTS]" : "[MISSING]",
    });

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

      // Lưu user và accessToken vào store
      setUser(user, session.accessToken);

      // Lưu cả accessToken và refreshToken vào store
      // Sử dụng giá trị mặc định là chuỗi rỗng nếu refreshToken không tồn tại
      const refreshToken =
        typeof session.refreshToken === "string" ? session.refreshToken : "";
      setTokens(session.accessToken, refreshToken);

      console.log("AuthSync: Updated user store with tokens", {
        accessToken: session.accessToken ? "[EXISTS]" : "[MISSING]",
        refreshToken: refreshToken ? "[EXISTS]" : "[MISSING]",
      });
    } else {
      console.log("AuthSync: Missing user or accessToken in session");
    }
  }, [session, setUser, clearUser, mounted]);

  return null;
}
