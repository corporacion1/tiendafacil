
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

    // This state will prevent rendering children until we are certain about the auth state and component has mounted client-side
    const [isClientReady, setIsClientReady] = useState(false);

    useEffect(() => {
      // When this runs, we are on the client.
      setIsClientReady(true);
    }, []);

    useEffect(() => {
        // Wait until everything is ready on the client before redirecting.
        if (!isClientReady || isUserLoading || isPinLoading) return;
        
        if (!user) {
            router.replace('/login');
        }
    }, [isClientReady, isUserLoading, isPinLoading, user, router]);

    useEffect(() => {
      if (!isClientReady || !hasPin || !isMounted) return;
      
      if (previousPathname.current === '/pos' && pathname !== '/pos') {
        lockApp();
      }
      previousPathname.current = pathname;
    }, [pathname, lockApp, hasPin, isMounted, isClientReady]);

    // This is the crucial part. Until the client has mounted and all auth states are resolved, show a consistent loading screen.
    // This will be rendered on the server, and on the initial client render, avoiding the mismatch.
    if (!isClientReady || isUserLoading || isPinLoading) {
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

    // If user is not present after loading (and we are on the client), wait for redirect.
    if (!user) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando sesión...</p>
            </div>
        );
    }

    // Only when everything is ready and user is confirmed, render children.
    return <>{children}</>;
}
