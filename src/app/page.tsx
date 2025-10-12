"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page now acts as an entry point, redirecting directly to the catalog page.
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/catalog');
  }, [router]);

  // Render a loading indicator while redirecting.
  return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando catálogo...</p>
      </div>
  );
}
