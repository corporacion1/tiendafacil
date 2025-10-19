// src/app/app-shell.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { RouteGuard } from "@/components/route-guard";
import { cn } from '@/lib/utils';
import { Footer } from '@/components/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { PinModal } from '@/components/pin-modal';
import { useAuth } from '@/contexts/AuthContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => !prev);
  };

  const isPublicPage = pathname === '/' || pathname.startsWith('/catalog') || pathname.startsWith('/register');

  // Redirige si usuario logueado intenta entrar a página pública (opcional)
  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicPage) {
        console.log('🔄 Redirecting to catalog from:', pathname);
        router.replace('/catalog');
      }
      // Opcional: si está logueado y en página pública, redirigir al dashboard
      // else if (user && isPublicPage && pathname !== '/') {
      //   router.replace('/dashboard');
      // }
    }
  }, [loading, user, isPublicPage, pathname, router]);


  // Mientras carga, muestra loader
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  // Si es página pública → renderiza sin sidebar
  if (isPublicPage) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex-1">
          <RouteGuard>{children}</RouteGuard>
        </main>
        <Footer />
      </div>
    );
  }

  // Si NO hay usuario y no es página pública → no renderices nada (useEffect ya redirigió)
  if (!user && !isPublicPage) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  // Renderiza layout completo para usuarios logueados
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
          <RouteGuard>{children}</RouteGuard>
        </main>
        <Footer />
      </div>
    </div>
  );
}