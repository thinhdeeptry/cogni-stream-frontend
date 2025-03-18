"use client";

import { useEffect } from "react";

import { useSession } from "next-auth/react";

import useUserStore from "@/stores/useUserStore";

export default function AuthSync() {
  const { data: session } = useSession();
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    if (session?.user && session.accessToken) {
      const user: IUser = {
        id: session.user.id,
        name: session.user.name || "",
        email: session.user.email || "",
        phone: session.user.phone || "",
        address: session.user.address || "",
        image: session.user.image || "",
        role: session.user.role || "",
        accountType: session.user.accountType,
      };
      setUser(user, session.accessToken);
    } else {
      clearUser();
    }
  }, [session, setUser, clearUser]);
  return null; // Component không render UI, chỉ xử lý logic
}
