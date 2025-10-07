
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/firebase";
import { navItems, adminNavItems, settingsNav } from "@/lib/navigation";
import { Logo } from "./logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SiteSidebarProps {
  isExpanded: boolean;
}

export function SiteSidebar({ isExpanded }: SiteSidebarProps) {
    const pathname = usePathname();
    const { user } = useUser(); // Using the mock user

    // In a real app, the user object would have a `role` property.
    // We'll simulate it for "corporacion1@gmail.com".
    const userRole = user?.email === 'corporacion1@gmail.com' ? 'superAdmin' : 'admin';

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

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-all duration-300",
            isExpanded ? "w-56" : "w-20"
        )}>
            <div className={cn("flex h-[60px] items-center border-b", isExpanded ? "px-6" : "justify-center")}>
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <Logo className="h-6 w-6" />
                    <span className={cn("transition-opacity", !isExpanded && "hidden")}>Tienda Facil</span>
                </Link>
            </div>
            <nav className="flex flex-col gap-2 p-2 font-medium">
                {navItems.map((item) => (
                    <div key={item.href}>{renderLink(item)}</div>
                ))}
                {adminNavItems.map((item) => (
                     userRole === item.role ? (
                        <div key={item.href}>{renderLink(item)}</div>
                    ) : null
                ))}
            </nav>
            <nav className="mt-auto flex flex-col gap-2 p-2 font-medium">
                 {renderLink(settingsNav)}
            </nav>
        </aside>
    );
}
