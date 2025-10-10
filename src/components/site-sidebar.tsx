
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/firebase";
import type { UserProfile } from "@/lib/types";

import { navItems, adminNavItems, settingsNav } from "@/lib/navigation";
import { Logo } from "./logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/settings-context";
import { useMemo } from "react";

interface SiteSidebarProps {
  isExpanded: boolean;
}

export function SiteSidebar({ isExpanded }: SiteSidebarProps) {
    const pathname = usePathname();
    const { settings, userProfile } = useSettings();

    const userRole = userProfile?.role;

    const renderLink = (item: typeof navItems[0]) => (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                pathname === item.href ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary',
                !isExpanded && "justify-center"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className={cn("transition-all duration-300", !isExpanded && "hidden")}>{item.label}</span>
            </Link>
          </TooltipTrigger>
          {!isExpanded && (
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );

    const filteredAdminNavItems = (adminNavItems || []).filter(item => {
        if (!item.role) return true;
        return userRole === item.role;
    });

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-all duration-300",
            isExpanded ? "w-56" : "w-20"
        )}>
            <div className={cn("flex h-[60px] items-center border-b", isExpanded ? "px-6" : "justify-center")}>
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <Logo className="h-20 w-20" />
                </Link>
            </div>
            <nav className="flex flex-col gap-2 p-2 font-medium">
                {navItems.map((item) => (
                    <div key={item.href}>{renderLink(item)}</div>
                ))}
                {filteredAdminNavItems.map((item) => (
                    <div key={item.href}>{renderLink(item)}</div>
                ))}
            </nav>
            <nav className="mt-auto flex flex-col gap-2 p-2 font-medium">
                 {renderLink(settingsNav)}
            </nav>
        </aside>
    );
}
