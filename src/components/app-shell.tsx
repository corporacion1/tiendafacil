
"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { cn } from '@/lib/utils';
import { AppLoader } from './app-loader';
import { AuthGuard } from './auth-guard';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => !prev);
  };

  const isPublicPage = pathname === '/login' || pathname.startsWith('/catalog');

  // The AuthGuard will now decide whether to render the protected layout
  // or the public content (children). This ensures all pages are
  // wrapped by the necessary providers from the root layout.
  return (
    <AuthGuard>
      {/* AuthGuard will pass through public pages, and wrap protected ones */}
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        {!isPublicPage && <SiteSidebar isExpanded={isSidebarExpanded} />}
        <div className={cn(
          "flex flex-col sm:gap-4 sm:py-4 transition-all duration-300",
          !isPublicPage && (isSidebarExpanded ? "sm:pl-56" : "sm:pl-20")
        )}>
          {!isPublicPage && <SiteHeader toggleSidebar={toggleSidebar} isSidebarExpanded={isSidebarExpanded} />}
          <main className={cn(
            "flex-1",
            !isPublicPage && "grid items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8"
          )}>
            {/* AppLoader will handle the loading state for protected pages */}
            {isPublicPage ? children : <AppLoader>{children}</AppLoader>}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
