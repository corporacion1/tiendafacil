
"use client";

import { PinModal } from "@/components/pin-modal";
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useSecurity } from "@/contexts/security-context";
import { useUser } from '@/firebase';
import { AuthGuard } from "./auth-guard";


export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLocked, lockApp, hasPin, isMounted } = useSecurity();
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (isMounted && !isUserLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, isUserLoading, pathname, router, isMounted]);

  useEffect(() => {
    if (!hasPin || !isMounted) return;

    if (previousPathname.current === '/pos' && pathname !== '/pos') {
      lockApp();
    }
    
    previousPathname.current = pathname;
  }, [pathname, lockApp, hasPin, isMounted]);
  
  
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!isMounted) {
     return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <p>Cargando aplicación...</p>
        </div>
      );
  }

  if (isLocked) {
    return <PinModal />;
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AuthGuard>
          <SiteSidebar />
          <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
              <SiteHeader />
              <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                  {children}
              </main>
              <Footer />
          </div>
        </AuthGuard>
    </div>
  );
}
