
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
        // This effect handles POS locking
        if (!isSecurityReady || !hasPin) return;
        if (pathname !== '/pos' && localStorage.getItem('last_path_was_pos') === 'true') {
            lockApp();
        }
        localStorage.setItem('last_path_was_pos', (pathname === '/pos').toString());
    }, [pathname, lockApp, hasPin, isSecurityReady]);

    const isLoading = isUserLoading || !isSecurityReady || isLoadingSettings;
    
    // Handle redirections after loading is complete
    useEffect(() => {
        if (isLoading) return;

        // If not logged in and not on a public page, redirect to login
        if (!isPublicPage && !user) {
            router.replace('/');
            return;
        }
    
        // If logged in, redirect away from public pages to the dashboard
        if (user && (pathname === '/' || pathname === '/login')) {
            router.replace('/dashboard');
            return;
        }
        
        // If the user has the 'user' role, they should only access the catalog
        if (user && userProfile && userProfile.role === 'user' && !pathname.startsWith('/catalog') && pathname !== '/') {
            router.replace('/catalog');
            return;
        }

        // If on a private page and for some reason we don't have a storeId, force back to login.
        // This is a critical check to ensure that no data fetching occurs without a store context.
        if (user && !isPublicPage && !activeStoreId) {
             console.error("AuthGuard: No activeStoreId found for an authenticated user on a private page. Redirecting to login.");
             router.replace('/');
             return;
        }

    }, [isLoading, isPublicPage, user, userProfile, activeStoreId, pathname, router]);

    if (isPublicPage) {
        return <>{children}</>;
    }

    if (isLoading) {
        // The FirebaseProvider shows a global loading screen, so we render nothing here while waiting.
        return null;
    }

    if (isLocked) {
        return <PinModal />;
    }

    // If we've passed all checks, render the protected content
    return <>{children}</>;
}
