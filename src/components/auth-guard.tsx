
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "./pin-modal";
import { Package } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isUserLoading, user } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const { isSecurityReady, isLocked, hasPin, lockApp } = useSecurity();
    
    const isPublicPage = pathname.startsWith('/catalog') || pathname.startsWith('/login');
    const isRootPage = pathname === '/';

    useEffect(() => {
        if (!isSecurityReady || !hasPin) return;
        if (pathname !== '/pos' && localStorage.getItem('last_path_was_pos') === 'true') {
            lockApp();
        }
        localStorage.setItem('last_path_was_pos', (pathname === '/pos').toString());
    }, [pathname, lockApp, hasPin, isSecurityReady]);

    const isLoading = isUserLoading || !isSecurityReady;
    
    useEffect(() => {
        if (isLoading) return;
        
        // If there's no user and we are on a private page, redirect to login
        if (!user && !isPublicPage) {
            router.replace('/login');
        }
        
        // If there is a user and they are on a public-like page, redirect away
        if (user && (isPublicPage || isRootPage)) {
           // Exception for catalog, anyone can see it.
           if (pathname.startsWith('/catalog')) return;
           router.replace('/dashboard');
        }
        
    }, [isLoading, user, isPublicPage, isRootPage, pathname, router]);

    // While firebase auth is initializing, show a loader
    if (isLoading) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
            <div className="p-4 bg-muted rounded-full">
                <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground animate-pulse">Cargando sesión...</p>
        </div>
      );
    }
    
    // If we're on a non-public page without a user, render nothing while redirecting.
    if (!isPublicPage && !user) {
        return null;
    }

    if (isLocked) {
        return <PinModal />;
    }

    return <>{children}</>;
}
