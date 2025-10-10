
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSecurity } from "@/contexts/security-context";
import { useSettings } from "@/contexts/settings-context";
import { PinModal } from "./pin-modal";
import { Package } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isUserLoading, user } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const { isSecurityReady, isLocked, hasPin, lockApp } = useSecurity();
    const { userProfile, isLoadingSettings } = useSettings();
    
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

        if (!user && !isPublicPage) {
            router.replace('/');
            return;
        }
    
        if (user && (pathname === '/' || pathname === '/login')) {
            router.replace('/dashboard');
            return;
        }
        
        if (user && userProfile && userProfile.role === 'user' && !pathname.startsWith('/catalog')) {
            router.replace('/catalog');
            return;
        }

    }, [isLoading, isPublicPage, user, userProfile, pathname, router]);

    if (isLoading && !isPublicPage) {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
              <div className="p-4 bg-muted rounded-full">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground animate-pulse">Cargando aplicación...</p>
          </div>
        );
    }

    if (isPublicPage) {
        return <>{children}</>;
    }

    if (isLocked) {
        return <PinModal />;
    }

    return <>{children}</>;
}
