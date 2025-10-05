
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "./pin-modal";
import { Logo } from "./logo";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const { isPinLoading, lockApp, hasPin, isLocked, isSecurityReady } = useSecurity();
    const router = useRouter();
    const pathname = usePathname();
    const previousPathname = useRef(pathname);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // This effect handles redirection based on user authentication status.
    useEffect(() => {
        if (!isMounted || isUserLoading) return;
        
        if (!user) {
            router.replace('/login');
        }
    }, [isMounted, isUserLoading, user, router]);
    
    // This effect handles app locking when navigating away from the POS.
    useEffect(() => {
      if (!isMounted || !hasPin) return;
      
      if (previousPathname.current === '/pos' && pathname !== '/pos') {
        lockApp();
      }
      previousPathname.current = pathname;
    }, [pathname, lockApp, hasPin, isMounted]);

    // Until the component is mounted and auth/pin state is resolved, render the loading screen.
    // This guarantees that the server and initial client render are identical, preventing hydration errors.
    if (!isMounted || isUserLoading || isPinLoading || !isSecurityReady) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando sesión...</p>
            </div>
        );
    }
    
    // If there is no user after loading, the redirect is in progress. Continue showing a loading screen.
    if (!user) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Redirigiendo...</p>
            </div>
        );
    }

    // If the app is locked after all checks, show the PIN modal.
    if (isLocked) {
        return <PinModal />;
    }

    // Only when everything is ready, unlocked, and the user is confirmed, render the children.
    return <>{children}</>;
}
