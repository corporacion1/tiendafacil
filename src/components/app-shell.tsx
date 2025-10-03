
"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { SecurityProvider, useSecurity } from "@/contexts/security-context";
import { SettingsProvider } from "@/contexts/settings-context";
import { ProductProvider } from "@/contexts/product-context";
import { PinModal } from "@/components/pin-modal";
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';


function MainApp({ children }: { children: React.ReactNode }) {
  const { isLocked, lockApp, hasPin } = useSecurity();
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !hasPin) return;

    const fromPosToDashboard = previousPathname.current === '/pos' && pathname === '/dashboard';
    const navigatingAwayFromNonPos = previousPathname.current !== '/pos' && pathname !== previousPathname.current && pathname !== '/pos';

    if (fromPosToDashboard) {
      lockApp();
    } else if (navigatingAwayFromNonPos) {
       // Only lock if we are not on the dashboard already and navigating away
      if (previousPathname.current !== '/dashboard' || (previousPathname.current === '/dashboard' && pathname !== '/pos')) {
         if (pathname !== '/dashboard') lockApp();
      }
    }
    
    previousPathname.current = pathname;
  }, [pathname, lockApp, hasPin, isMounted]);

  if (!isMounted) {
    return null;
  }

  if (isLocked) {
      return <PinModal />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <SiteSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <SiteHeader />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SecurityProvider>
          <SettingsProvider>
            <ProductProvider>
              <MainApp>{children}</MainApp>
              <Toaster />
            </ProductProvider>
          </SettingsProvider>
        </SecurityProvider>
    </ThemeProvider>
  );
}
