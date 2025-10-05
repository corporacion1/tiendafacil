
"use client";

import { usePathname } from 'next/navigation';
import { AuthGuard } from "./auth-guard";
import { SecurityProvider } from '@/contexts/security-context';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <SecurityProvider>
        <AuthGuard>
            {children}
        </AuthGuard>
    </SecurityProvider>
  );
}
