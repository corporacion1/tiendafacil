
"use client";

import { usePathname } from 'next/navigation';
import { AppShell } from "@/app/app-shell";
import { SecurityProvider } from '@/contexts/security-context';
import { SettingsProvider } from '@/contexts/settings-context';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = pathname === '/' || pathname.startsWith('/catalog');

  // AppShell handles both public and private views internally by controlling its own rendering.
  // For public pages, it will render children without the sidebar/header.
  // For private pages, it will show the full authenticated layout.
  // We wrap everything in the providers here so they are always available.
  if (isPublicPage) {
    return (
        <SecurityProvider>
            <SettingsProvider>
                {children}
            </SettingsProvider>
        </SecurityProvider>
    );
  }

  // Private pages get the full AppShell treatment, which includes the providers internally.
  return <AppShell>{children}</AppShell>;
}
