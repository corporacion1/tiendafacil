
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "./pin-modal";
import { useSettings } from "@/contexts/settings-context";
import { Package } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isUserLoading, user } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const { isSecurityReady, isLocked, hasPin, lockApp } = useSecurity();
    const { isLoadingSettings } = useSettings();
    
    const isPublicPage = pathname.startsWith('/catalog') || pathname.startsWith('/login');
    const isRootPage = pathname === '/';

    useEffect(() => {
        if (!isSecurityReady || !hasPin) return;
        if (pathname !== '/pos' && localStorage.getItem('last_path_was_pos') === 'true') {
            lockApp();
        }
        localStorage.setItem('last_path_was_pos', (pathname === '/pos').toString());
    }, [pathname, lockApp, hasPin, isSecurityReady]);

    useEffect(() => {
        // Wait until all initial loading is complete before doing any redirection.
        if (isLoadingSettings || isUserLoading) {
            return;
        }
        
        // If not logged in and trying to access a protected page, redirect.
        if (!user && !isPublicPage) {
            router.replace('/login');
        }
        
        // If logged in and on the root page, redirect to dashboard.
        if (user && isRootPage) {
           router.replace('/dashboard');
        }
        
    }, [isLoadingSettings, isUserLoading, user, isPublicPage, isRootPage, pathname, router]);


    // The master loading gate. This prevents ANY part of the app from rendering
    // until the settings (which depend on auth) are fully loaded.
    if (isLoadingSettings) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
                <div className="p-4 bg-muted rounded-full">
                    <Package className="w-12 h-12 text-muted-foreground animate-pulse" />
                </div>
                <p className="text-muted-foreground animate-pulse">Iniciando aplicación y cargando datos...</p>
            </div>
        );
    }
    
    // Once all loading is complete, if the app is security-locked, show the PIN modal.
    if (isLocked) {
        return <PinModal />;
    }

    // Render the children once all checks are passed
    return <>{children}</>;
}
