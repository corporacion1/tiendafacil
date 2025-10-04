
"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page now acts as a simple redirector.
// The auth state is handled by the providers and AppShell.
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null; // Return null or a loading indicator while redirecting
}
