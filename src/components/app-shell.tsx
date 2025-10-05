
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

  // Auth Guard Logic for login page redirection
  useEffect(() => {
    // If auth state is still loading, or we are not mounted, don't do anything yet.
    if (isUserLoading || !isMounted) {
      return;
    }
    // If there is a user and we are on the login page, redirect to dashboard.
    if (user && pathname === '/login') {
      router.replace('/dashboard');
    }
    // If there is no user and we are NOT on the login page, redirect to login.
    // This is a failsafe, but AuthGuard should handle the main logic.
    if (!user && pathname !== '/login') {
      router.replace('/login');
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
  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (isLocked) {
    return <PinModal />;
  }
  
  return (
    <AuthGuard>
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
    </AuthGuard>
  );
}
