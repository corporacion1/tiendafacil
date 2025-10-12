"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const defaultStoreId = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || 'default';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/catalog/${defaultStoreId}`);
  }, [router]);

  return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando catálogo...</p>
      </div>
  );
}
