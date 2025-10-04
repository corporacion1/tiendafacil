
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Boxes, FileText, Home, PackagePlus, Settings, ShoppingCart, Store, CreditCard } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/inventory", label: "Inventario", icon: Boxes },
    { href: "/products", label: "Productos", icon: PackagePlus },
    { href: "/pos", label: "Punto de Venta", icon: ShoppingCart },
    { href: "/purchases", label: "Compras", icon: Store },
    { href: "/credits", label: "Créditos", icon: CreditCard },
    { href: "/reports", label: "Reportes", icon: FileText },
];

const settingsNav = { href: "/settings", label: "Configuración", icon: Settings };


export function SiteSidebar() {
  const pathname = usePathname();
  
  const posNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home }
  ];
  
  const getNavItems = () => {
    if (pathname === '/pos') {
      return posNavItems;
    }
    return navItems;
  }

  const currentNavItems = getNavItems();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <Link
                href="#"
                className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
                <Image src="/logo.png" width={24} height={24} alt="Tienda Facil Logo" />
                <span className="sr-only">Tienda Facil</span>
            </Link>

            {currentNavItems.map((item) => (
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
        </nav>
        {pathname !== '/pos' && (
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
        )}
       
      </TooltipProvider>
    </aside>
  );
}

export function SiteSidebarProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
