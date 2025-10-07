
"use client";

import { usePathname } from 'next/navigation';
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { AuthGuard } from './auth-guard';
import { Sidebar, SidebarInset } from './ui/sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The login page does not need the main authenticated layout.
  // The catalog has its own simplified layout.
  if (pathname === '/login' || pathname.startsWith('/catalog')) {
    return <>{children}</>;
  }

  // The main layout structure for authenticated routes.
  return (
    <Sidebar>
        <SiteSidebar />
        <SidebarInset>
            <SiteHeader />
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <AuthGuard>
                    {children}
                </AuthGuard>
            </main>
        </SidebarInset>
    </Sidebar>
  );
}
