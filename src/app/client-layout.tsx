
"use client";

import { usePathname } from 'next/navigation';
import { AppShell } from "@/app/app-shell";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = pathname === '/' || pathname.startsWith('/catalog');

  if (isPublicPage) {
    return <>{children}</>;
  }

  // Private pages get the full AppShell treatment.
  return <AppShell>{children}</AppShell>;
}
