
"use client";

import { PinModal } from "@/components/pin-modal";
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/ui/footer";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useUser } from "@/firebase";
import { useSecurity } from "@/contexts/security-context";


function MainApp({ children }: { children: React.ReactNode }) {
  const { isLocked, lockApp, hasPin } = useSecurity();
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // If the user data is not loading and there's no user,
    // and we are not already on the login page, redirect to login.
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
  
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <p>Cargando aplicación...</p>
      </div>
    );
  }
  
  if (pathname === '/login') {
      return <>{children}</>;
  }
  
  // This should not be reached if there is no user, due to the redirect.
  // But as a safeguard, we can return null.
  if (!user) {
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
        <Footer />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <MainApp>{children}</MainApp>;
}
