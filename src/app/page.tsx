
"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard, AuthGuard will handle if user needs to login
    router.replace('/dashboard');
  }, [router]);

  return null; // Return null or a loading indicator while redirecting
}
