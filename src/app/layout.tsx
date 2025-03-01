import { Inter } from "next/font/google";
import { Geist, Geist_Mono } from "next/font/google";

import type { Metadata } from "next";

import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eduforge - Your Next Education Platform",
  description:
    "Eduforge is a platform for educators and students to collaborate and learn together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
