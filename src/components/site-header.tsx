
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Boxes, FileText, Home, PackagePlus, PanelLeft, Settings, ShoppingCart, Store, CreditCard, Coins } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ThemeToggle } from "./theme-toggle";
import { useSettings } from "@/contexts/settings-context";

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


export function SiteHeader() {
  const pathname = usePathname();
  const { activeSymbol, toggleDisplayCurrency } = useSettings();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="#"
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                >
                  <Store className="h-5 w-5" />
                  <span className="sr-only">Tienda Facil</span>
                </Link>
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-4 px-2.5 ${pathname === item.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                    </Link>
                ))}
                 <Link
                    href={settingsNav.href}
                    className={`flex items-center gap-4 px-2.5 ${pathname === settingsNav.href ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <settingsNav.icon className="h-5 w-5" />
                    {settingsNav.label}
                </Link>
              </nav>
            </SheetContent>
        </Sheet>
        <div className="hidden items-center gap-2 md:flex">
            <Image src="/logo.png" width={28} height={28} alt="Tienda Facil Logo" />
            <span className="font-semibold text-lg">Tienda Facil</span>
        </div>
      <div className="relative ml-auto flex items-center gap-2 md:grow-0">
        <Button variant="ghost" size="icon" onClick={toggleDisplayCurrency} aria-label="Cambiar moneda">
            <Coins className="h-5 w-5" />
            <span className="absolute bottom-0 right-0 text-xs font-bold leading-none">{activeSymbol}</span>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
