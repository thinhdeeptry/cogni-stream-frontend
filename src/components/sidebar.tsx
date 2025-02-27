import {
  BookOpen,
  GraduationCap,
  Home,
  LayoutDashboard,
  Bell,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

// Menu items.
const items = [
  {
    title: "Trang chủ",
    url: "/course",
    icon: Home,
  },
  {
    title: "Lộ trình",
    url: "/",
    icon: GraduationCap,
  },
  {
    title: "Bài viết",
    url: "/",
    icon: BookOpen,
  },
  {
    title: "Quản lý",
    url: "/",
    icon: LayoutDashboard,
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="w-22 z-9999">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="w-full">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-20">
                    <Link
                      href={item.url}
                      className="flex h-10 flex-col items-center justify-center w-full"
                    >
                      <p>
                        <item.icon />
                      </p>
                      <p className="text-center text-[12px] font-semibold ">
                        {item.title}
                      </p>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenuButton asChild className="mb-10 rounded-full">
          <Link
            href={"/"}
            className="flex flex-col items-center justify-center w-full h-20"
          >
            <p>
              <Bell />
            </p>
          </Link>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
