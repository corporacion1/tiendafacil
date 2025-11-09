// src/app/app-shell.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { RouteGuard } from "@/components/route-guard";
import { cn } from '@/lib/utils';
import { Footer } from '@/components/footer';
import { PinModal } from '@/components/pin-modal';
import { useAuth } from '@/contexts/AuthContext';
import { useSecurity } from '@/contexts/security-context';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isPinLocked } = useSecurity();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const isPublicPage = pathname === '/' || pathname.startsWith('/catalog') || pathname.startsWith('/register');
  const isAuthRequired = !isPublicPage;

  // Redirige usuarios no autenticados
  useEffect(() => {
    if (!loading && !user && isAuthRequired) {
      console.log('🔄 Redirecting to catalog from:', pathname);
      router.replace('/catalog');
    }
  }, [loading, user, pathname, router, isAuthRequired]);

  // Renderizado único de loading
  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  // Usuario no autenticado intenta acceder a ruta privada
  if (!user && isAuthRequired) {
    return null; // useEffect ya redirige
  }

  // Layout para páginas públicas
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

  // Layout para usuarios autenticados
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {isPinLocked && <PinModal />} 
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