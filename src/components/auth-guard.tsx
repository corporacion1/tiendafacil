
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "./pin-modal";
import { Logo } from "./logo";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const { isPinLoading, lockApp, hasPin, isMounted, isLocked } = useSecurity();
    const router = useRouter();
    const pathname = usePathname();
    const previousPathname = useRef(pathname);

    // This state will prevent rendering children until we are certain about the auth state
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        if (!isUserLoading && isMounted && !isPinLoading) {
            if (!user) {
                router.replace('/login');
            } else {
                setIsAuthReady(true);
            }
        }
    }, [isUserLoading, user, router, isMounted, isPinLoading]);

    useEffect(() => {
      if (!hasPin || !isMounted) return;
      if (previousPathname.current === '/pos' && pathname !== '/pos') {
        lockApp();
      }
      previousPathname.current = pathname;
    }, [pathname, lockApp, hasPin, isMounted]);

    // Global loading state. Prevents any child components from rendering prematurely.
    if (!isAuthReady) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando sesión...</p>
            </div>
        );
    }
    
    // If auth is ready but app is locked, show PIN modal.
    if (isLocked) {
        return <PinModal />;
    }

    // Only when auth is ready and app is not locked, render children.
    return <>{children}</>;
}
