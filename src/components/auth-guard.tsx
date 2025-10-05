
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "./pin-modal";
import { Logo } from "./logo";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const { isPinLoading, lockApp, hasPin, isMounted: isSecurityMounted, isLocked } = useSecurity();
    const router = useRouter();
    const pathname = usePathname();
    const previousPathname = useRef(pathname);

    // This state ensures we don't render client-specific UI until hydration is complete.
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      // This effect runs only on the client, after the initial render.
      setIsMounted(true);
    }, []);

    useEffect(() => {
        // Wait until component is mounted and auth state is resolved.
        if (!isMounted || isUserLoading || isPinLoading) return;
        
        if (!user) {
            router.replace('/login');
        }
    }, [isMounted, isUserLoading, isPinLoading, user, router]);

    useEffect(() => {
      if (!isMounted || !hasPin || !isSecurityMounted) return;
      
      if (previousPathname.current === '/pos' && pathname !== '/pos') {
        lockApp();
      }
      previousPathname.current = pathname;
    }, [pathname, lockApp, hasPin, isSecurityMounted, isMounted]);

    // Until the component is mounted on the client, render the loading screen.
    // This guarantees the server and initial client render are identical.
    if (!isMounted || isUserLoading || isPinLoading) {
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

    // If user is not present after loading, continue showing loading screen while redirect happens.
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
