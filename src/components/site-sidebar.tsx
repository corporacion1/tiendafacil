
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
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <Link
                href="#"
                className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
                <Logo className="h-4 w-4 transition-all group-hover:scale-110" />
                <span className="sr-only">Tienda Facil</span>
            </Link>

            {navItems.map((item) => (
            <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                <Link
                    href={item.href}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'} transition-colors hover:text-foreground md:h-8 md:w-8`}
                >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
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
                            className={`flex h-9 w-9 items-center justify-center rounded-lg ${pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'} transition-colors hover:text-foreground md:h-8 md:w-8`}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="sr-only">{item.label}</span>
                        </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                )
            ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <Tooltip>
                <TooltipTrigger asChild>
                <Link
                    href={settingsNav.href}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${pathname === settingsNav.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'} transition-colors hover:text-foreground md:h-8 md:w-8`}
                >
                    <settingsNav.icon className="h-5 w-5" />
                    <span className="sr-only">{settingsNav.label}</span>
                </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{settingsNav.label}</TooltipContent>
            </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
