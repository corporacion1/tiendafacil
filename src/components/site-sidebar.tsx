
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, FileText, Home, PackagePlus, Settings, ShoppingCart, Store, CreditCard } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
    Sidebar, 
    SidebarProvider, 
    SidebarTrigger, 
    SidebarContent, 
    SidebarHeader, 
    SidebarMenu, 
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    useSidebar,
} from "@/components/ui/sidebar";

export const SiteSidebarProvider = SidebarProvider;

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
  const { state } = useSidebar();

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
    <Sidebar>
        <SidebarContent>
            <SidebarHeader>
                <SidebarTrigger asChild>
                    <Link
                        href="#"
                        className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
                        >
                        <Store className="h-4 w-4 transition-all group-hover:scale-110" />
                        <span className="sr-only">Tienda Facil</span>
                    </Link>
                </SidebarTrigger>
                <span className={cn(
                    "text-lg font-semibold text-foreground",
                    state === 'collapsed' && 'hidden'
                )}>
                    Tienda Facil
                </span>
            </SidebarHeader>

            <SidebarMenu>
                {currentNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                         <SidebarMenuButton 
                            asChild 
                            isActive={pathname === item.href}
                            tooltip={item.label}
                        >
                            <Link href={item.href}>
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarContent>

        {pathname !== '/pos' && (
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton 
                            asChild 
                            isActive={pathname === settingsNav.href}
                            tooltip={settingsNav.label}
                        >
                            <Link href={settingsNav.href}>
                                <settingsNav.icon className="h-5 w-5" />
                                <span>{settingsNav.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        )}
    </Sidebar>
  );
}
