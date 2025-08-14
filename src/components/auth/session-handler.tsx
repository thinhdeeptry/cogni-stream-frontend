"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSession } from "next-auth/react";

export function SessionHandler() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Listen for session expiry events
    const handleSessionExpired = () => {
      console.log("Session expired event detected");
      router.push("/auth/login?message=session-expired");
    };

    // Listen for global events that might indicate session issues
    window.addEventListener("session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("session-expired", handleSessionExpired);
    };
  }, [router]);

  // Monitor session status changes
  useEffect(() => {
    if (status === "unauthenticated" && typeof window !== "undefined") {
      // Check if we were previously authenticated
      const wasAuthenticated = localStorage.getItem("was-authenticated");
      if (wasAuthenticated === "true") {
        console.log("Session became unauthenticated, redirecting to login");
        localStorage.removeItem("was-authenticated");
        router.push("/auth/login?message=session-expired");
      }
    } else if (status === "authenticated") {
      // Mark that user was authenticated
      localStorage.setItem("was-authenticated", "true");
    }
  }, [status, router]);

  return null;
}
