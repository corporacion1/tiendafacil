
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { PanelLeft, UserCircle, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "./theme-toggle";
import { useSettings } from "@/contexts/settings-context";
import { usePermissions } from "@/hooks/use-permissions";
import { Logo } from "./logo";
import { navItems, settingsNav } from "@/lib/navigation";
import { Badge } from "./ui/badge";
import { defaultStoreId } from "@/lib/data";
import { signOut } from "firebase/auth";

interface SiteHeaderProps {
  toggleSidebar: () => void;
  isSidebarExpanded: boolean;
}

export function SiteHeader({ toggleSidebar, isSidebarExpanded }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { canAccess, hasPermission } = usePermissions();
  const { 
    settings, 
    activeCurrency, 
    toggleDisplayCurrency, 
    activeStoreId, 
    userProfile, 
    isLoadingSettings,
    signOut 
  } = useSettings();

  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
      toast({ title: "Sesión cerrada" });
    }
  };

  const inactiveSymbol = activeCurrency === 'primary' 
    ? settings?.secondaryCurrencySymbol || '...'
    : settings?.primaryCurrencySymbol || '$';

  const inactiveCurrencyName = activeCurrency === 'primary'
    ? settings?.secondaryCurrencyName || 'Moneda Secundaria'
    : settings?.primaryCurrencyName || 'Moneda Principal';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs flex flex-col">
              <SheetHeader className="flex-shrink-0">
                <SheetTitle className="sr-only">Menú Principal</SheetTitle>
              </SheetHeader>
              
              {/* Logo fijo */}
              <div className="flex-shrink-0 pb-4">
                <SheetClose asChild>
                    <Link
                      href="#"
                      className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                    >
                      <Logo className="h-5 w-5" />
                      <span className="sr-only">Tienda Facil</span>
                    </Link>
                </SheetClose>
              </div>
              
              {/* Navegación con scroll */}
              <nav className="flex-1 overflow-y-auto sidebar-scroll">
                <div className="grid gap-6 text-lg font-medium pb-4">
                  {navItems.filter(item => {
                    const route = item.href.split('?')[0];
                    return canAccess(route);
                  }).map((item) => (
                      <SheetClose asChild key={item.href}>
                          <Link
                              href={item.href}
                              className={`flex items-center gap-4 px-2.5 py-2 rounded-lg transition-colors ${pathname === item.href ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                          >
                              <item.icon className="h-5 w-5" />
                              {item.label}
                          </Link>
                      </SheetClose>
                  ))}
                  {hasPermission('canViewSettings') && (
                    <SheetClose asChild>
                         <Link
                            href={settingsNav.href}
                            className={`flex items-center gap-4 px-2.5 py-2 rounded-lg transition-colors ${pathname === settingsNav.href ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                        >
                            <settingsNav.icon className="h-5 w-5" />
                            {settingsNav.label}
                        </Link>
                     </SheetClose>
                  )}
                </div>
              </nav>
            </SheetContent>
        </Sheet>
        
        <Button size="icon" variant="outline" className="hidden sm:flex" onClick={toggleSidebar}>
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
        </Button>

      <div className="relative ml-auto flex items-center gap-2 md:grow-0">
        <Badge variant="outline" className="text-xs text-muted-foreground">
          Tienda Activa: {activeStoreId}
        </Badge>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={toggleDisplayCurrency} aria-label={`Cambiar a ${inactiveCurrencyName}`}>
                  <span className="font-bold text-lg">{inactiveSymbol}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cambiar a {inactiveCurrencyName}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ThemeToggle />

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    {userProfile?.photoURL && !isLoadingSettings ? (
                        <Image src={userProfile.photoURL} width={32} height={32} alt="User" className="rounded-full" />
                    ) : (
                        <UserCircle className="h-6 w-6" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{userProfile?.displayName || userProfile?.email || 'Mi Cuenta'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}
