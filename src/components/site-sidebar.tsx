
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUser } from "@/firebase";
import { navItems, adminNavItems, settingsNav } from "@/lib/navigation";
import { Logo } from "./logo";


export function SiteSidebar() {
  const pathname = usePathname();
  const { user } = useUser(); // Using the mock user

  // In a real app, the user object would have a `role` property.
  // We'll simulate it for "corporacion1@gmail.com".
  const userRole = user?.email === 'corporacion1@gmail.com' ? 'superAdmin' : 'admin';

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-56 flex-col border-r bg-background sm:flex">
        <div className="flex h-[60px] items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <Logo className="h-6 w-6" />
                <span>Tienda Facil</span>
            </Link>
        </div>
      <TooltipProvider>
        <nav className="flex flex-col items-start gap-1 px-4 sm:py-5">
            {navItems.map((item) => (
            <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                <Link
                    href={item.href}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 ${pathname === item.href ? 'bg-muted text-primary' : 'text-muted-foreground'} transition-all hover:text-primary`}
                >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
            ))}
            {adminNavItems.map((item) => (
                userRole === item.role && (
                    <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                        <Link
                            href={item.href}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 ${pathname === item.href ? 'bg-muted text-primary' : 'text-muted-foreground'} transition-all hover:text-primary`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                )
            ))}
        </nav>
        <nav className="mt-auto flex flex-col items-start gap-1 px-4 sm:py-5">
            <Tooltip>
                <TooltipTrigger asChild>
                <Link
                    href={settingsNav.href}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 ${pathname === settingsNav.href ? 'bg-muted text-primary' : 'text-muted-foreground'} transition-all hover:text-primary`}
                >
                    <settingsNav.icon className="h-4 w-4" />
                    {settingsNav.label}
                </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{settingsNav.label}</TooltipContent>
            </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
