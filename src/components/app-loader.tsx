
"use client";

import { useUser } from "@/firebase";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "./pin-modal";
import { Logo } from "./logo";

/**
 * AppLoader runs AFTER AuthGuard has confirmed there is a user.
 * Its job is to handle the application's internal loading and locking logic,
 * such as waiting for the PIN state to be ready and handling the PIN modal.
 */
export function AppLoader({ children }: { children: React.ReactNode }) {
    const { user } = useUser(); // We can assume user exists because AuthGuard is the parent.
    const { isPinLoading, lockApp, hasPin, isLocked, isSecurityReady } = useSecurity();
    const pathname = usePathname();
    const previousPathname = useRef(pathname);

    // This effect handles app locking when navigating away from the POS.
    useEffect(() => {
      if (!isSecurityReady || !hasPin) return;
      
      if (previousPathname.current === '/pos' && pathname !== '/pos') {
        lockApp();
      }
      previousPathname.current = pathname;
    }, [pathname, lockApp, hasPin, isSecurityReady]);

    // Until the security state (PIN, etc.) is resolved, render the loading screen.
    // This prevents hydration errors and ensures all security checks are done.
    if (isPinLoading || !isSecurityReady) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Cargando aplicación...</p>
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
