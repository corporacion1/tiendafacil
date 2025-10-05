
"use client";

import { usePathname } from 'next/navigation';
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { AuthGuard } from './auth-guard';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return <>{children}</>;
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
