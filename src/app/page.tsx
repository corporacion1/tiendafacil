"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { defaultStoreId } from '@/lib/data';

// This page now acts as an entry point, redirecting directly to the default catalog page with a query parameter.
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/catalog?storeId=${defaultStoreId}`);
  }, [router]);

  // Render nothing, or a loading indicator while redirecting.
  return null;
}
