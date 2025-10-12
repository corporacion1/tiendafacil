
"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { cn } from '@/lib/utils';
import { Footer } from './footer';
import { useUser } from '@/firebase';
import { Skeleton } from './ui/skeleton';
import { useSecurity } from '@/contexts/security-context';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { lockApp } = useSecurity();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => !prev);
  };

  const isPublicPage = pathname === '/' || pathname.startsWith('/catalog') || pathname.startsWith('/login');

  // Effect to re-lock the app on navigation change within protected routes
  useEffect(() => {
    if (!isPublicPage && user) {
      lockApp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, user]); // Dependency on pathname triggers this on every route change

  useEffect(() => {
    // Si no es una página pública y la carga del usuario ha terminado, y no hay usuario...
    if (!isPublicPage && !isUserLoading && !user) {
      // Redirige al catálogo.
      router.replace('/catalog');
    }
  }, [isUserLoading, user, isPublicPage, router, pathname]);

  // Si es una página pública, usamos un layout más simple sin sidebar ni header principal.
  if (isPublicPage) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  // Mientras se verifica el estado de autenticación en páginas protegidas, muestra un loader.
  if (isUserLoading) {
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

  // Si no hay usuario pero aún no se ha redirigido, muestra un loader para evitar un parpadeo de la UI.
  if (!user) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
    );
  }

  // Layout para las páginas internas de la aplicación.
  return (
      <div className="flex min-h-screen w-full bg-muted/40">
        <SiteSidebar isExpanded={isSidebarExpanded} />
        <div className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          isSidebarExpanded ? "sm:pl-56" : "sm:pl-20"
        )}>
          <SiteHeader toggleSidebar={toggleSidebar} isSidebarExpanded={isSidebarExpanded} />
          <main className={cn(
            "flex-1 overflow-y-auto", // Permite que solo el contenido principal tenga scroll si es necesario
            "grid items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8"
          )}>
            {children}
          </main>
          <Footer />
        </div>
      </div>
  );
}
