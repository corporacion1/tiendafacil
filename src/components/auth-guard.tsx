
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
        if (isPublicPage || isUserLoading || isProfileLoading) {
            return;
        }

        if (!user) {
            router.replace('/login');
            return;
        }
        
        if (userProfile && userProfile.email === 'corporacion1@gmail.com') {
            return;
        }
        
        if (userProfile) {
            if (userProfile.role === 'user') {
                router.replace('/catalog');
            }
        } else {
            router.replace('/login');
        }

    }, [isUserLoading, isProfileLoading, user, userProfile, router, pathname, isPublicPage]);
    
    // Lock app logic from previous AppLoader
    useEffect(() => {
        if (!isSecurityReady || !hasPin) return;
        if (pathname !== '/pos' && localStorage.getItem('last_path_was_pos') === 'true') {
            lockApp();
        }
        localStorage.setItem('last_path_was_pos', (pathname === '/pos').toString());
    }, [pathname, lockApp, hasPin, isSecurityReady]);

    if (isPublicPage) {
        return <>{children}</>;
    }

    const isLoading = isUserLoading || isProfileLoading || isLoadingSettings || !isSecurityReady;
    
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Cargando aplicación...</p>
            </div>
        );
    }
    
    if (isLocked) {
        return <PinModal />;
    }

    if (user && userProfile && (userProfile.role === 'admin' || userProfile.role === 'superAdmin')) {
        return <>{children}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
        <Logo className="w-64 h-20" />
        <p className="text-muted-foreground animate-pulse">Verificando sesión y permisos...</p>
      </div>
    );
}
