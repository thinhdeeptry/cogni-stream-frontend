"use client";

import Link from "next/link";
import { use } from "react";

import {
  BarChart,
  Bell,
  BookOpen,
  GraduationCap,
  Home,
  LayoutDashboard,
  Users,
} from "lucide-react";

import useUserStore from "@/stores/useUserStore";

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

// Menu items.
const getMenuItems = (userRole: string) => {
  const baseItems = [
    {
      title: "Trang chủ",
      url: "/",
      icon: Home,
    },
    {
      title: "Lộ trình",
      url: "/roadmap",
      icon: GraduationCap,
    },
    {
      title: "Bài viết",
      url: "/",
      icon: BookOpen,
    },
  ];

  if (userRole === "ADMIN") {
    baseItems.push(
      {
        title: "Quản lý",
        url: "/admin/courses",
        icon: LayoutDashboard,
      },
      {
        title: "User",
        url: "/admin/users",
        icon: Users,
      },
      {
        title: "Report",
        url: "/admin/reports",
        icon: BarChart,
      },
    );
  }

  return baseItems;
};

export function AppSidebar() {
  const { user } = useUserStore();
  const items = getMenuItems(user?.role || "");

  return (
    <Sidebar className="w-22">
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
