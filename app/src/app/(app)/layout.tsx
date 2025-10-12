
"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { cn } from '@/lib/utils';
import { Footer } from '@/components/footer';
import { useSecurity } from '@/contexts/security-context';
import { useSettings } from '@/contexts/settings-context';
import { Skeleton } from '@/components/ui/skeleton';
import { FirstTimeSetupModal } from '@/components/first-time-setup-modal';
import { SecurityProvider } from '@/contexts/security-context';
import { SettingsProvider } from '@/contexts/settings-context';

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lockApp } = useSecurity();
  const { userProfile, isLoadingSettings, useDemoData } = useSettings();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => !prev);
  };
  
  const isPublicRoute = pathname.startsWith('/catalog');

  useEffect(() => {
    // Public routes don't need security checks.
    if (isPublicRoute || isLoadingSettings) {
      return;
    }
    
    // If not using demo data AND there's no user profile, redirect to catalog.
    // This allows the public catalog to be seen without a login in a live environment.
    if (!useDemoData && !userProfile) {
      router.replace(`/catalog/${process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || 'default'}`);
      return;
    }
    
    // If we have a user profile (in live mode) or are in demo mode, lock the app if needed.
    if (userProfile || useDemoData) {
      lockApp();
    }
  }, [pathname, userProfile, isLoadingSettings, router, lockApp, useDemoData, isPublicRoute]);
  
  // Do not render the protected shell for public catalog pages
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Skeleton loader for protected routes while settings/user are loading.
  if (isLoadingSettings || (!useDemoData && !userProfile)) {
    return (
        <div className="flex min-h-screen w-full bg-muted/40">
            <div className={cn("hidden sm:flex flex-col border-r bg-background transition-all duration-300", isSidebarExpanded ? "w-56" : "w-20")}>
                <div className="flex h-[60px] items-center border-b justify-center p-2"><Skeleton className="h-10 w-28" /></div>
                <div className="flex flex-col gap-2 p-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
            </div>
            <div className={cn("flex flex-1 flex-col transition-all duration-300", isSidebarExpanded ? "sm:pl-56" : "sm:pl-20")}>
                <div className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <Skeleton className="h-9 w-9" />
                    <div className="ml-auto flex items-center gap-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-9 w-9 rounded-full" /></div>
                </div>
                <main className="flex-1 p-4 sm:px-6 sm:py-0"><Skeleton className="h-full w-full" /></main>
            </div>
        </div>
    );
  }
  
  return (
      <div className="flex min-h-screen w-full bg-muted/40">
        <SiteSidebar isExpanded={isSidebarExpanded} />
        <div className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          isSidebarExpanded ? "sm:pl-56" : "sm:pl-20"
        )}>
          <SiteHeader toggleSidebar={toggleSidebar} isSidebarExpanded={isSidebarExpanded} />
          <main className={cn(
            "flex-1 overflow-y-auto",
            "grid items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8"
          )}>
            <FirstTimeSetupModal />
            {children}
          </main>
          <Footer />
        </div>
      </div>
  );
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SecurityProvider>
      <SettingsProvider>
        <AppShell>{children}</AppShell>
      </SettingsProvider>
    </SecurityProvider>
  );
}
