import { Inter } from "next/font/google";

import ClientProvider from "@/providers/clientProvider";
import { QueryProvider } from "@/providers/query-provider";
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";

import AuthSync from "@/components/auth/auth.sync";

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
      <body className={`${inter.variable} ${inter.className} antialiased`}>
        {/* //render auth sync component */}
        <ClientProvider>
          <AuthSync />
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
