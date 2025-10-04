
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

  return <div className="flex h-screen w-full items-center justify-center"><p>Cargando...</p></div>;
}

    