
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
    // Si no estamos en una página pública y (no hay perfil de usuario Y no estamos en modo demo)
    if (!isLoadingSettings && !isPublicPage && !userProfile) {
      // Redirigir inmediatamente al catálogo.
      router.replace('/catalog');
      return; // Detener la ejecución de otros efectos.
    }
    
    // Bloquear la app con PIN si corresponde
    if (!isPublicPage && userProfile) {
      lockApp();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, userProfile, isLoadingSettings, isPublicPage, router]);

  if (isPublicPage) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex-1">{children}</main>
        <FirstTimeSetupModal />
        <Footer />
      </div>
    );
  }

  // Si estamos en una página protegida, pero aún cargando o sin perfil, mostramos un loader.
  // El useEffect de arriba se encargará de la redirección.
  if (isLoadingSettings || !userProfile) {
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
  
  return (
      <div className="flex min-h-screen w-full bg-muted/40">
        <SiteSidebar isExpanded={isSidebarExpanded} />
        <div className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          isExpanded ? "sm:pl-56" : "sm:pl-20"
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
