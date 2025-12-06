"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useSession } from "next-auth/react";

import Loading from "@/components/userLayout/Loading";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex-1 py-4 px-2 overflow-auto">{children}</main>;
}
