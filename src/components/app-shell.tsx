
"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { SecurityProvider, useSecurity } from "@/contexts/security-context";
import { PinModal } from "@/components/pin-modal";
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/toaster";
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';


function MainApp({ children }: { children: React.ReactNode }) {
  const { isLocked, lockApp } = useSecurity();
  const pathname = usePathname();

  useEffect(() => {
      // This effect will run when the component unmounts (i.e., when you navigate away)
      return () => {
          if (pathname === '/pos') {
              lockApp();
          }
      };
  }, [pathname, lockApp]);

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
        <MainApp>{children}</MainApp>
      </SecurityProvider>
      <Toaster />
    </ThemeProvider>
  );
}
