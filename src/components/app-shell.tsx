
"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { cn } from '@/lib/utils';
import { Footer } from './footer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => !prev);
  };

  const isPublicPage = pathname === '/' || pathname.startsWith('/catalog') || pathname.startsWith('/login');

  // Si es una página pública, usamos un layout más simple sin sidebar ni header principal.
  if (isPublicPage) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
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
