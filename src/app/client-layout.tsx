"use client";

import { usePathname } from 'next/navigation';
import { AppShell } from "@/app/app-shell"; // Updated import path
import { Footer } from '@/components/footer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = pathname === '/' || pathname.startsWith('/catalog');

  if (isPublicPage) {
    return (
      <>
        {children}
        <Footer />
      </>
    );
  }

  return <AppShell>{children}</AppShell>;
}
