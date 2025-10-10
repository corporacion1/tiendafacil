
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSecurity } from "@/contexts/security-context";
import { useSettings } from "@/contexts/settings-context";
import { PinModal } from "./pin-modal";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isUserLoading, user } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const { isSecurityReady, isLocked, hasPin, lockApp } = useSecurity();
    const { userProfile, isLoadingSettings, activeStoreId } = useSettings();
    
    const isPublicPage = pathname === '/' || pathname.startsWith('/catalog') || pathname.startsWith('/login');

    useEffect(() => {
        if (!isSecurityReady || !hasPin) return;
        if (pathname !== '/pos' && localStorage.getItem('last_path_was_pos') === 'true') {
            lockApp();
        }
        localStorage.setItem('last_path_was_pos', (pathname === '/pos').toString());
    }, [pathname, lockApp, hasPin, isSecurityReady]);

    const isLoading = isUserLoading || !isSecurityReady || isLoadingSettings;
    
    useEffect(() => {
        if (isLoading) return;
        
        // If we are not on a public page and there's no active store ID, something is wrong.
        // The SettingsProvider should have handled this, but as a safeguard, we redirect.
        if (!isPublicPage && !activeStoreId) {
             router.replace('/');
             return;
        }

        if (!user && !isPublicPage) {
            router.replace('/');
            return;
        }
    
        if (user && (pathname === '/' || pathname === '/login')) {
            router.replace('/dashboard');
            return;
        }
        
        // This rule is a bit rigid, but for now, if a user has role 'user', they can only access catalog.
        if (user && userProfile && userProfile.role === 'user' && !pathname.startsWith('/catalog')) {
            router.replace('/catalog');
            return;
        }

    }, [isLoading, isPublicPage, user, userProfile, pathname, router, activeStoreId]);

    // The main loading indicator is now in SettingsProvider.
    // AuthGuard now only handles its specific responsibilities: Pin lock and routing.
    if (isLoading) {
      return null; // The SettingsProvider is already showing a loading screen.
    }

    if (isPublicPage) {
        return <>{children}</>;
    }

    if (isLocked) {
        return <PinModal />;
    }

    return <>{children}</>;
}
