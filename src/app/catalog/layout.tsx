
"use client";
import React from 'react';

// This layout now needs to wrap children in a Suspense boundary
// because the child page `page.tsx` is now using `useSearchParams`,
// which opts the page into dynamic rendering.
export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      <div className="flex min-h-screen w-full flex-col">
        <main className="flex-1">{children}</main>
      </div>
    </React.Suspense>
  );
}
