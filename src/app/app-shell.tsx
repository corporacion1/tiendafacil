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
import { useSettings } from '@/contexts/settings-context';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isPinLocked } = useSecurity();
  const { settings } = useSettings();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);

  const isPublicPage = pathname === '/' || pathname.startsWith('/catalog') || pathname.startsWith('/register');
  const isAuthRequired = !isPublicPage;

  // Get background gradient based on palette
  const getBackgroundGradient = () => {
    const palette = settings?.colorPalette || 'blue-orange';

    const gradientMap = {
      'blue-orange': 'bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-orange-50/30',
      'purple-pink': 'bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-fuchsia-50/30',
      'green-teal': 'bg-gradient-to-br from-green-50/30 via-teal-50/20 to-emerald-50/30',
      'red-yellow': 'bg-gradient-to-br from-red-50/30 via-orange-50/20 to-yellow-50/30',
      'indigo-cyan': 'bg-gradient-to-br from-indigo-50/30 via-cyan-50/20 to-sky-50/30',
      'slate-amber': 'bg-gradient-to-br from-slate-50/30 via-stone-50/20 to-amber-50/30'
    };

    return gradientMap[palette];
  };

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
    <div className={cn("flex min-h-screen w-full", getBackgroundGradient())}>
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