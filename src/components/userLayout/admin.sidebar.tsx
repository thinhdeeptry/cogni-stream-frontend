"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BarChart,
  ChevronDown,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

// Define the navigation items
const navigationItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
    // subItems: [
    //   { title: "All Users", href: "/admin/users" },
    //   { title: "Add New User", href: "/admin/users/new" },
    //   { title: "User Roles", href: "/admin/users/roles" },
    // ],
  },
  {
    title: "Content Management",
    href: "/admin/content",
    icon: FileText,
    // subItems: [
    //   { title: "Pages", href: "/admin/content/pages" },
    //   { title: "Blog Posts", href: "/admin/content/posts" },
    //   { title: "Media Library", href: "/admin/content/media" },
    // ],
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart,
    // subItems: [
    //   { title: "Analytics", href: "/admin/reports/analytics" },
    //   { title: "User Activity", href: "/admin/reports/activity" },
    //   { title: "Sales", href: "/admin/reports/sales" },
    // ],
  },
  // {
  //   title: "Settings",
  //   href: "/admin/settings",
  //   icon: Settings,
  //   subItems: [
  //     { title: "General", href: "/admin/settings/general" },
  //     { title: "Security", href: "/admin/settings/security" },
  //     { title: "Appearance", href: "/admin/settings/appearance" },
  //   ],
  // },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
            A
          </div>
          <span className="font-semibold text-lg">Admin Panel</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.subItems ? (
                <Collapsible className="w-full">
                  <CollapsibleTrigger className="w-full" asChild>
                    <SidebarMenuButton className="group/menu-button w-full justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {/* <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === subItem.href}
                          >
                            <Link href={subItem.href}>
                              <ChevronRight className="h-3 w-3 mr-1" />
                              {subItem.title}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent> */}
                </Collapsible>
              ) : (
                <SidebarMenuButton asChild isActive={pathname === item.href}>
                  <Link href={item.href} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted"></div>
            <div>
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-muted-foreground">admin@example.com</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
