
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store } from "lucide-react";
import { useUser } from "@/firebase";
import { navItems, adminNavItems, settingsNav } from "@/lib/navigation";
import { Logo } from "./logo";
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "./ui/sidebar";

export function SiteSidebar() {
  const pathname = usePathname();
  const { user } = useUser(); // Using the mock user

  // In a real app, the user object would have a `role` property.
  // We'll simulate it for "corporacion1@gmail.com".
  const userRole = user?.email === 'corporacion1@gmail.com' ? 'superAdmin' : 'admin';

  return (
    <>
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <Logo className="h-6 w-6" />
          <span>Tienda Facil</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label, side: "right" }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {adminNavItems.map((item) =>
            userRole === item.role ? (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label, side: "right" }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : null
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === settingsNav.href}
              tooltip={{ children: settingsNav.label, side: "right" }}
            >
              <Link href={settingsNav.href}>
                <settingsNav.icon />
                <span>{settingsNav.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
