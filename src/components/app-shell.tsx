
"use client";

import { PinModal } from "@/components/pin-modal";
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useSecurity } from "@/contexts/security-context";
import { useUser } from '@/firebase';
import { ProvidersWrapper } from "./providers-wrapper";


export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLocked, lockApp, hasPin } = useSecurity();
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, isUserLoading, pathname, router]);

  useEffect(() => {
    if (!hasPin) return;

    if (previousPathname.current === '/pos' && pathname !== '/pos') {
      lockApp();
    }
    
    previousPathname.current = pathname;
  }, [pathname, lockApp, hasPin]);
  
  // Render login page without the shell
  if (pathname === '/login') {
      return <>{children}</>;
  }

  // If locked, only show PIN modal
  if (isLocked) {
      return <PinModal />;
  }

  // Main application shell
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <SiteSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <SiteHeader />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {isUserLoading || !user ? (
            <div className="flex w-full items-center justify-center pt-20">
              <p>Cargando aplicación...</p>
            </div>
          ) : (
            <ProvidersWrapper>
              {children}
            </ProvidersWrapper>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
}
