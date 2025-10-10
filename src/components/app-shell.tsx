
"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { cn } from '@/lib/utils';
import { Footer } from './footer';
import { SettingsProvider } from '@/contexts/settings-context';
import { SecurityProvider } from '@/contexts/security-context';
import { FirebaseClientProvider } from '@/firebase';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => !prev);
  };

  const isPublicPage = pathname === '/' || pathname.startsWith('/catalog') || pathname.startsWith('/login');

  return (
    <FirebaseClientProvider>
      <SecurityProvider>
        <SettingsProvider>
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
              {!isPublicPage && <SiteSidebar isExpanded={isSidebarExpanded} />}
              <div className={cn(
                "flex flex-1 flex-col sm:gap-4 sm:py-4 transition-all duration-300",
                !isPublicPage && (isSidebarExpanded ? "sm:pl-56" : "sm:pl-20")
              )}>
                {!isPublicPage && <SiteHeader toggleSidebar={toggleSidebar} isSidebarExpanded={isSidebarExpanded} />}
                <main className={cn(
                  "flex-1",
                  !isPublicPage && "grid items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8"
                )}>
                  {children}
                </main>
                <Footer />
              </div>
            </div>
        </SettingsProvider>
      </SecurityProvider>
    </FirebaseClientProvider>
  );
}
