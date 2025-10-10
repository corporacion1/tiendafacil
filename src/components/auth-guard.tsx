
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSecurity } from "@/contexts/security-context";
import { useSettings } from "@/contexts/settings-context";
import { PinModal } from "./pin-modal";
import { Logo } from "./logo";
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

    const isLoading = isUserLoading || !isSecurityReady || isLoadingSettings;
    
    useEffect(() => {
        if (isLoading) return;
        
        // If there's no user and we are on a private page, redirect to login
        if (!user && !isPublicPage && !isRootPage) {
            router.replace('/login');
        }
        
        // If there is a user and they are on a public page (that isn't the catalog), redirect to dashboard
        if (user && (isPublicPage || isRootPage) && !pathname.startsWith('/catalog')) {
            router.replace('/dashboard');
        }
        
    }, [isLoading, user, isPublicPage, isRootPage, pathname, router]);

    if (isLoading) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
            <div className="p-4 bg-muted rounded-full">
                <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground animate-pulse">Iniciando aplicación...</p>
        </div>
      );
    }
    
    // Special handling for root, which should redirect based on user state
    if (isRootPage) {
        if (user) {
             router.replace('/dashboard');
        } else {
             router.replace('/login');
        }
        // Return loading state while redirecting
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
                <div className="p-4 bg-muted rounded-full">
                    <Package className="w-12 h-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground animate-pulse">Redirigiendo...</p>
            </div>
        );
    }

    if (isPublicPage && !user) {
        return <>{children}</>;
    }
    
    if (!user) {
        // This case handles private routes when user is not logged in,
        // which should be caught by the useEffect redirect, but this is a fallback.
        return null;
    }

    if (isLocked) {
        return <PinModal />;
    }

    return <>{children}</>;
}
