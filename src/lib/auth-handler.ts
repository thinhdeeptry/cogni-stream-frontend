"use client";

import { signOut } from "next-auth/react";

import useUserStore from "@/stores/useUserStore";

/**
 * Handle logout process using NextAuth
 * @param reason - Optional reason for logout (e.g., 'session-expired')
 * @param redirect - Whether to redirect after logout (default: true)
 */
export const handleLogout = async (
  reason?: string,
  redirect: boolean = true,
) => {
  try {
    console.log("Initiating logout process", { reason, redirect });

    // Clear store first
    useUserStore.getState().clearTokens();
    useUserStore.getState().clearUser();

    // Clear refresh token from cookies
    if (typeof document !== "undefined") {
      document.cookie =
        "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }

    // Clear localStorage flag
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("was-authenticated");
    }

    // Use NextAuth signOut to properly clear session and cookies
    const callbackUrl = reason
      ? `/auth/login?message=${reason}`
      : "/auth/login";

    await signOut({
      redirect,
      callbackUrl,
    });

    console.log("Logout completed successfully");
  } catch (error) {
    console.error("Error during logout:", error);

    // Fallback: force redirect if signOut fails
    if (redirect && typeof window !== "undefined") {
      const fallbackUrl = reason
        ? `/auth/login?message=${reason}`
        : "/auth/login";
      window.location.href = fallbackUrl;
    }
  }
};

/**
 * Trigger session expired event
 */
export const triggerSessionExpired = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("session-expired"));
  }
};
