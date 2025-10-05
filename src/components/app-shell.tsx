
"use client";

import { PinModal } from "@/components/pin-modal";
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { ProvidersWrapper } from "@/components/providers-wrapper";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useSecurity } from "@/contexts/security-context";
import { useUser } from '@/firebase';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLocked, lockApp, hasPin, isMounted } = useSecurity();
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef(pathname);

  // Auth Guard Logic
  useEffect(() => {
    // If auth state is loading, or we are not mounted yet, don't do anything.
    if (isUserLoading || !isMounted) {
      return;
    }
    // If there is no user and we are not on the login page, redirect.
    if (!user && pathname !== '/login') {
      router.replace('/login');
    }
    // If there is a user and we are on the login page, redirect to dashboard.
    if (user && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, pathname, router, isMounted]);

  // Lock app on POS exit
  useEffect(() => {
    if (!hasPin || !isMounted) return;
    if (previousPathname.current === '/pos' && pathname !== '/pos') {
      lockApp();
    }
    previousPathname.current = pathname;
  }, [pathname, lockApp, hasPin, isMounted]);

  // Render based on auth and lock state
  if (isUserLoading || !isMounted) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <p>Verificando sesión...</p>
      </div>
    );
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  // If there's no user, we show a loading screen while the redirect effect happens.
  if (!user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <p>Redirigiendo...</p>
      </div>
    );
  }

  if (isLocked) {
    return <PinModal />;
  }
  
  // User is authenticated and app is unlocked, render the full app.
  return (
    <ProvidersWrapper>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <SiteSidebar />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <SiteHeader />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </ProvidersWrapper>
  );
}
