
"use client";

import { useUser, useDoc, useFirestore } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { useSecurity } from "@/contexts/security-context";
import { useSettings } from "@/contexts/settings-context";
import { PinModal } from "./pin-modal";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isUserLoading, user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const pathname = usePathname();
    const { isSecurityReady, isLocked, hasPin, lockApp } = useSecurity();
    const { userProfile } = useSettings();
    
    const isPublicPage = pathname === '/' || pathname.startsWith('/catalog') || pathname.startsWith('/login');

    useEffect(() => {
        // This effect handles POS locking
        if (!isSecurityReady || !hasPin) return;
        if (pathname !== '/pos' && localStorage.getItem('last_path_was_pos') === 'true') {
            lockApp();
        }
        localStorage.setItem('last_path_was_pos', (pathname === '/pos').toString());
    }, [pathname, lockApp, hasPin, isSecurityReady]);

    const isLoading = isUserLoading || !isSecurityReady;
    
    // Handle redirections after loading is complete
    useEffect(() => {
        if (isLoading) return;

        if (!isPublicPage && !user) {
            router.replace('/');
        }
    
        if (user && (pathname === '/' || pathname === '/login')) {
            router.replace('/dashboard');
        }
        
        // This check needs to happen after we know the user's role.
        if (user && userProfile && userProfile.role === 'user' && !pathname.startsWith('/catalog') && pathname !== '/') {
            router.replace('/catalog');
        }

    }, [isLoading, isPublicPage, user, userProfile, pathname, router]);

    if (isPublicPage) {
        return <>{children}</>;
    }

    if (isLoading) {
        // This is handled by the FirebaseProvider's global loading screen
        return null;
    }

    if (isLocked) {
        return <PinModal />;
    }

    return <>{children}</>;
}
