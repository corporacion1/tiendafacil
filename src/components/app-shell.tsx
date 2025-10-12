
"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { cn } from '@/lib/utils';
import { Footer } from './footer';
import { useSecurity } from '@/contexts/security-context';
import { useSettings } from '@/contexts/settings-context';
import { Skeleton } from './ui/skeleton';
import { FirstTimeSetupModal } from './first-time-setup-modal';


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lockApp } = useSecurity();
  const { userProfile, isLoadingSettings, useDemoData } = useSettings();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => !prev);
  };

  const isPublicPage = pathname === '/' || pathname.startsWith('/catalog');

  useEffect(() => {
    // Si no estamos en modo demo y no hay un usuario cargado, redirigimos al catálogo.
    if (!isLoadingSettings && !useDemoData && !userProfile && !isPublicPage) {
      router.replace('/catalog');
      return;
    }
    
    // Bloquear la app con PIN si corresponde (solo en páginas protegidas y con perfil de usuario).
    if (!isPublicPage && userProfile) {
      lockApp();
    }
  // El eslint-disable es para evitar un loop de dependencias complejo con el router.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, userProfile, isLoadingSettings, useDemoData, isPublicPage]);

  // Si es una página pública (catálogo), la mostramos directamente.
  if (isPublicPage) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex-1">{children}</main>
        <FirstTimeSetupModal />
        <Footer />
      </div>
    );
  }

  // Si es una página protegida, pero aún está cargando la data o no hay perfil, mostramos un esqueleto.
  // El useEffect de arriba se encargará de la redirección si es necesario.
  if (isLoadingSettings || (!userProfile && !useDemoData)) {
    return (
        <div className="flex min-h-screen w-full bg-muted/40">
            <div className={cn("hidden sm:flex flex-col border-r bg-background transition-all duration-300", isSidebarExpanded ? "w-56" : "w-20")}>
                <div className="flex h-[60px] items-center border-b justify-center p-2"><Skeleton className="h-10 w-28" /></div>
                <div className="flex flex-col gap-2 p-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
            </div>
            <div className={cn("flex flex-1 flex-col transition-all duration-300", isSidebarExpanded ? "sm:pl-56" : "sm:pl-20")}>
                <div className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <Skeleton className="h-9 w-9" />
                    <div className="ml-auto flex items-center gap-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-9 w-9 rounded-full" /></div>
                </div>
                <main className="flex-1 p-4 sm:px-6 sm:py-0"><Skeleton className="h-full w-full" /></main>
            </div>
        </div>
    );
  }
  
  // Si todo está correcto (usuario logueado o modo demo activo), mostramos la app completa.
  return (
      <div className="flex min-h-screen w-full bg-muted/40">
        <SiteSidebar isExpanded={isSidebarExpanded} />
        <div className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          isSidebarExpanded ? "sm:pl-56" : "sm:pl-20"
        )}>
          <SiteHeader toggleSidebar={toggleSidebar} isSidebarExpanded={isSidebarExpanded} />
          <main className={cn(
            "flex-1 overflow-y-auto",
            "grid items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8"
          )}>
            <FirstTimeSetupModal />
            {children}
          </main>
          <Footer />
        </div>
      </div>
  );
}
