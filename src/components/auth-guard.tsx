
"use client";

import { useUser, useDoc, useFirestore } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { Logo } from "./logo";
import { useSecurity } from "@/contexts/security-context";
import { useSettings } from "@/contexts/settings-context";
import { PinModal } from "./pin-modal";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isUserLoading, user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const pathname = usePathname();
    const { isSecurityReady, isLocked, hasPin, lockApp } = useSecurity();
    const { isLoadingSettings, switchStore } = useSettings();
    
    const isPublicPage = pathname === '/login' || pathname.startsWith('/catalog');

    const userProfileRef = useMemo(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        // This effect handles store switching based on user profile
        if (userProfile && userProfile.storeId && localStorage.getItem('tienda_facil_active_store_id') !== userProfile.storeId) {
             if (userProfile.role === 'admin') {
                switchStore(userProfile.storeId);
             }
        }
    }, [userProfile, switchStore]);

     useEffect(() => {
        // This effect handles POS locking
        if (!isSecurityReady || !hasPin) return;
        if (pathname !== '/pos' && localStorage.getItem('last_path_was_pos') === 'true') {
            lockApp();
        }
        localStorage.setItem('last_path_was_pos', (pathname === '/pos').toString());
    }, [pathname, lockApp, hasPin, isSecurityReady]);

    const isLoading = isUserLoading || isProfileLoading || isLoadingSettings || !isSecurityReady;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando sesión y permisos...</p>
            </div>
        );
    }

    // --- All loading is complete at this point ---

    // Handle redirections
    if (!isPublicPage && !user) {
        router.replace('/login');
        return null; // Render nothing while redirecting
    }

    if (user && pathname === '/login') {
        router.replace('/dashboard');
        return null; // Render nothing while redirecting
    }
    
    if (user && userProfile && userProfile.role === 'user' && !pathname.startsWith('/catalog')) {
        router.replace('/catalog');
        return null; // Render nothing while redirecting
    }
    
    // Handle security lock
    if (isLocked && !isPublicPage) {
        return <PinModal />;
    }

    return <>{children}</>;
}

    