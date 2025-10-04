
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, FileText, Home, PackagePlus, PanelLeft, Settings, ShoppingCart, Store, CreditCard, Coins } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { useSettings } from "@/contexts/settings-context";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
  const pathname = usePathname();
  const { activeSymbol, toggleDisplayCurrency } = useSettings();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
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
