import { SessionHandler } from "@/components/auth/session-handler";
import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import UserHeader from "@/components/userLayout/user.header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        {/* Hidden SidebarTrigger on mobile to prevent layout issues */}
        <SidebarTrigger className="mt-2 ml-2 hidden md:block" />
        <main className="flex flex-col w-full h-screen overflow-y-auto overflow-x-hidden scrollbar-hide">
          <UserHeader />
          <Toaster />
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
