
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "./pin-modal";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const { isPinLoading, lockApp, hasPin, isMounted, isLocked } = useSecurity();
    const router = useRouter();
    const pathname = usePathname();
    const previousPathname = useRef(pathname);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [isUserLoading, user, router]);

    useEffect(() => {
      if (!hasPin || !isMounted) return;
      if (previousPathname.current === '/pos' && pathname !== '/pos') {
        lockApp();
      }
      previousPathname.current = pathname;
    }, [pathname, lockApp, hasPin, isMounted]);

    // This is the loading state. It will be shown until Firebase determines
    // the user's auth state.
    if (isUserLoading || (isMounted && isPinLoading)) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <p>Verificando sesión...</p>
            </div>
        );
    }
    
    // After loading, if there's no user, we show a redirecting message
    // while the useEffect above handles the redirect. This prevents children
    // from rendering.
    if (!user) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <p>Redirigiendo a inicio de sesión...</p>
            </div>
        );
    }

    // If we have a user, check if the app is locked by PIN.
    if (isLocked) {
        return <PinModal />;
    }

    // Only if loading is false, a user exists, and the app is not locked,
    // do we render the children.
    return <>{children}</>;
}
