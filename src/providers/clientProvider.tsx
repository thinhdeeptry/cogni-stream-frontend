"use client";

import { SessionProvider } from "next-auth/react";

import AuthSync from "@/components/auth/auth.sync";

import { QueryProvider } from "./query-provider";

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <SessionProvider>
        <AuthSync />
        {children}
      </SessionProvider>
    </QueryProvider>
  );
}
