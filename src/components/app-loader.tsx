
"use client";

import { useUser } from "@/firebase";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "./pin-modal";
import { Logo } from "./logo";
import { useSettings } from "@/contexts/settings-context";

/**
 * AppLoader runs AFTER AuthGuard has confirmed there is a user.
 * Its job is to handle the application's internal loading and locking logic,
 * such as waiting for the PIN state to be ready and handling the PIN modal.
 */
export function AppLoader({ children }: { children: React.ReactNode }) {
    const { lockApp, hasPin, isLocked, isSecurityReady } = useSecurity();
    const { isLoadingSettings } = useSettings();
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

    // Until the security state (PIN, etc.) and settings are resolved, render the loading screen.
    if (!isSecurityReady || isLoadingSettings) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Cargando aplicación y configuración...</p>
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
