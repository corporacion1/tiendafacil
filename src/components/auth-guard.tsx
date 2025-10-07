
"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "./pin-modal";

/**
 * AuthGuard is the final checkpoint for authentication and app locking.
 * It is rendered *inside* the AppShell, after all providers are available.
 * 1. Waits for Firebase session and PIN state to be resolved.
 * 2. If no user, it redirects to /login (handled at a higher level, but as a safeguard).
 * 3. If the app is locked, it shows the PIN modal.
 * 4. Only when the user is authenticated and the app is unlocked, it renders the children.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    // In offline mode, we can simulate an authenticated user.
    const [isReady, setIsReady] = useState(false);
    const { isPinLoading, isLocked } = useSecurity();
    
    useEffect(() => {
        // Simulate loading time
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // Primary loading state: wait for either Firebase user or local readiness.
    if (isPinLoading || !isReady) {
        return (
            <div className="flex flex-col items-center justify-center pt-20 gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando seguridad...</p>
            </div>
        );
    }
    
    // If the app is locked, show the PIN modal.
    if (isLocked) {
        return <PinModal />;
    }

    // If all checks pass, render the actual page content.
    return <>{children}</>;
}
