
"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
    const { user, isUserLoading } = useUser();
    const { isPinLoading, isLocked } = useSecurity();
    const router = useRouter();
    
    // This effect handles redirection if the user state is resolved and there's no user.
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [isUserLoading, user, router]);

    // Primary loading state: wait for both user and PIN status to be resolved.
    if (isUserLoading || isPinLoading) {
        return (
            <div className="flex flex-col items-center justify-center pt-20 gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando seguridad...</p>
            </div>
        );
    }
    
    // If loading is complete but there is no user, render nothing while redirecting.
    if (!user) {
         return (
            <div className="flex flex-col items-center justify-center pt-20 gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Redirigiendo...</p>
            </div>
        );
    }
    
    // If the user exists but the app is locked, show the PIN modal.
    if (isLocked) {
        return <PinModal />;
    }

    // If all checks pass (user exists and app is unlocked), render the actual page content.
    return <>{children}</>;
}
