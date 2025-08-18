import { Inter } from "next/font/google";
import { Great_Vibes, Playfair_Display } from "next/font/google";

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

export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-great-vibes",
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://eduforge.com"),
  title: {
    default: "Eduforge - Nền tảng học trực tuyến hàng đầu Việt Nam",
    template: "%s | Eduforge",
  },
  description:
    "Eduforge là nền tảng học trực tuyến với hàng nghìn khóa học chất lượng cao về lập trình, thiết kế, marketing và nhiều lĩnh vực khác.",
  applicationName: "Eduforge",
  authors: [{ name: "Eduforge Team" }],
  generator: "Next.js",
  keywords: [
    "eduforge",
    "học trực tuyến",
    "khóa học online",
    "lập trình",
    "elearning",
    "việt nam",
  ],
  referrer: "origin-when-cross-origin",
  creator: "Eduforge Team",
  publisher: "Eduforge",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${inter.variable} ${playfair.variable} ${greatVibes.variable} ${inter.className} antialiased`}
      >
        {/* //render auth sync component */}
        <SessionProvider>
          <ClientProvider>
            <AuthSync />
            {children}
          </ClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
