
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store } from "lucide-react";
import { useUser } from "@/firebase";
import { navItems, adminNavItems, settingsNav } from "@/lib/navigation";
import { Logo } from "./logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
            <nav className="flex flex-col gap-2 p-2 font-medium">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === item.href ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary'}`}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                ))}
                {adminNavItems.map((item) => (
                     userRole === item.role ? (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === item.href ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary'}`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ) : null
                ))}
            </nav>
            <nav className="mt-auto flex flex-col gap-2 p-2 font-medium">
                 <Link
                    href={settingsNav.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${pathname === settingsNav.href ? 'bg-muted text-primary' : 'text-muted-foreground hover:text-primary'}`}
                >
                    <settingsNav.icon className="h-4 w-4" />
                    {settingsNav.label}
                </Link>
            </nav>
        </aside>
    );
}
