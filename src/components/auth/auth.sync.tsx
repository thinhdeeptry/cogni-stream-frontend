"use client";

import { useEffect, useState } from "react";

import { authApi } from "@/lib/api/authApi";
import { useSession } from "next-auth/react";

import useUserStore from "@/stores/useUserStore";

export default function AuthSync() {
  const [mounted, setMounted] = useState(false);
  const { data: session, update: updateSession } = useSession();
  const setUser = useUserStore((state) => state.setUser);
  const setTokens = useUserStore((state) => state.setTokens);
  const clearUser = useUserStore((state) => state.clearUser);
  const user = useUserStore((state) => state.user);
  const hydrated = useUserStore((state) => state.hydrated);
  const setHydrated = useUserStore((state) => state.setHydrated);

  useEffect(() => {
    setMounted(true);
    // Đảm bảo Zustand store đã được hydrate
    if (typeof window !== "undefined") {
      const hasPersistedData = localStorage.getItem("user-session");
      if (hasPersistedData && !hydrated) {
        // Trigger hydration
        setHydrated(true);
      }
    }
  }, [hydrated, setHydrated]);

  // Listen for profile update events
  useEffect(() => {
    if (!mounted) return;

    const handleProfileUpdate = async () => {
      if (user && session?.accessToken) {
        try {
          // Fetch latest user data from backend
          const response = await authApi.getCurrentUser(session.accessToken);

          if (!response.error && response.data) {
            const updatedUser = response.data;

            // Update Zustand store
            setUser(updatedUser, session.accessToken);

            // Update NextAuth session with fresh data
            await updateSession({
              user: updatedUser,
            });
          }
        } catch (error) {
          console.error("Error updating session:", error);
        }
      }
    };

    // Create a custom event listener for profile updates
    window.addEventListener("profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [mounted, updateSession, user, session?.accessToken, setUser]);

  useEffect(() => {
    if (!mounted) return;

    if (!session) {
      console.log("AuthSync: No session, clearing user");
      clearUser();
      return;
    }

    if (session?.user && session.accessToken) {
      const currentUser = useUserStore.getState().user;

      // Chỉ cập nhật nếu thông tin user thay đổi hoặc chưa có user trong store
      const shouldUpdate =
        !currentUser ||
        currentUser.id !== session.user.id ||
        currentUser.email !== session.user.email ||
        currentUser.name !== session.user.name;

      if (shouldUpdate) {
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
        const refreshToken =
          typeof session.refreshToken === "string" ? session.refreshToken : "";
        setTokens(session.accessToken, refreshToken);

        console.log("AuthSync: User data updated in store");
      }
    } else {
      console.log("AuthSync: Missing user or accessToken in session");
    }
  }, [session, setUser, setTokens, clearUser, mounted]);

  return null;
}
