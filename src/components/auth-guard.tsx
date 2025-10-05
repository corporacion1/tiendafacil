
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ProvidersWrapper } from "./providers-wrapper";
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

    if (isUserLoading || isPinLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <p>Verificando sesión...</p>
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <p>Redirigiendo...</p>
            </div>
        );
    }

    if (isLocked) {
        return <PinModal />;
    }

    return (
        <ProvidersWrapper>
            {children}
        </ProvidersWrapper>
    );
}
