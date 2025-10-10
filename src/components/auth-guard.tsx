
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "./pin-modal";
import { useSettings } from "@/contexts/settings-context";

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

    // This effect handles redirection logic once Firebase auth state is known.
    useEffect(() => {
        // Wait until Firebase has determined the auth state.
        if (isUserLoading) {
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
        
    }, [isUserLoading, user, isPublicPage, isRootPage, pathname, router]);


    // The master loading gate is now handled by SettingsProvider.
    // This component will only render its children when SettingsProvider is done.
    if (isLoadingSettings) {
        // The SettingsProvider is already showing a loading screen, so we render nothing here
        // to avoid duplicate loaders and allow the provider to be the single source of truth.
        return null;
    }
    
    // Once all loading is complete, if the app is security-locked, show the PIN modal.
    if (isLocked) {
        return <PinModal />;
    }

    // Render the children once all checks are passed
    return <>{children}</>;
}
