"use client";

import { SessionProvider } from "next-auth/react";

import AuthSync from "@/components/auth/auth.sync";

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthSync />
      {children}
    </SessionProvider>
  );
}
