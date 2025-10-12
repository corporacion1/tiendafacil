
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the public catalog page
    router.replace(`/catalog`);
  }, [router]);

  return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando catálogo...</p>
      </div>
  );
}

    