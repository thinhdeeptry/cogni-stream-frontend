"use client";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import useUserStore from "@/stores/useUserStoree";

export default function AuthSync() {
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!session) {
      clearUser();
      return;
    }

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
      setUser(user, session.accessToken);
    }
  }, [session, setUser, clearUser, mounted]);

  return null;
}
