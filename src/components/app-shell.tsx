
"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { cn } from '@/lib/utils';
import { AppLoader } from './app-loader';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => !prev);
  };

  // The login page has its own minimal layout.
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // The catalog page has a public-facing layout.
  if (pathname.startsWith('/catalog')) {
      return <>{children}</>;
  }

  // The main layout structure for authenticated backend routes.
  return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <SiteSidebar isExpanded={isSidebarExpanded} />
          <div className={cn(
            "flex flex-col sm:gap-4 sm:py-4 transition-all duration-300",
            isSidebarExpanded ? "sm:pl-56" : "sm:pl-20"
          )}>
              <SiteHeader toggleSidebar={toggleSidebar} isSidebarExpanded={isSidebarExpanded} />
              <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                  <AppLoader>
                    {children}
                  </AppLoader>
              </main>
          </div>
      </div>
  );
}
