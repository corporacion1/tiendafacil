
"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export default function HomePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading) {
        if (user) {
            router.replace('/dashboard');
        } else {
            router.replace('/login');
        }
    }
  }, [router, user, isUserLoading]);

  // Render a loading state while checking for user auth
  if (isUserLoading) {
    return <div className="flex h-screen w-full items-center justify-center"><p>Cargando...</p></div>;
  }
  
  // If not loading and still on this page, it means redirection is happening.
  // A loading indicator can be shown here as well.
  return <div className="flex h-screen w-full items-center justify-center"><p>Cargando...</p></div>;
}
