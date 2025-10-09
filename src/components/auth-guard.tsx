
"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
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
    const { isLoadingSettings } = useSettings();
    
    const isPublicPage = pathname === '/login' || pathname.startsWith('/catalog');

    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        const isLoading = isUserLoading || isProfileLoading || isLoadingSettings || !isSecurityReady;
        if (isLoading) return;

        // If trying to access a protected page without being logged in, redirect to login
        if (!isPublicPage && !user) {
            router.replace('/login');
            return;
        }

        // If logged in, handle role-based redirection
        if (user && userProfile) {
            if (pathname === '/login') {
                router.replace('/dashboard');
                return;
            }
            if (userProfile.role === 'user' && !pathname.startsWith('/catalog')) {
                router.replace('/catalog');
                return;
            }
        }
        
    }, [isUserLoading, isProfileLoading, isLoadingSettings, isSecurityReady, user, userProfile, router, pathname, isPublicPage]);
    
    useEffect(() => {
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
    
    if (isLocked && !isPublicPage) {
        return <PinModal />;
    }

    return <>{children}</>;
}
