import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar />
          <SidebarTrigger className="mt-2 ml-2 " />
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
          <Toaster />
        </div>
      </SidebarProvider>
    </div>
  );
}
