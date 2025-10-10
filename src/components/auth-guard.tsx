
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "./pin-modal";
import { Package } from "lucide-react";
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

    useEffect(() => {
        if (isUserLoading) return;
        
        if (!user && !isPublicPage) {
            router.replace('/login');
        }
        
        if (user && (isPublicPage || isRootPage)) {
           if (pathname.startsWith('/catalog')) return;
           router.replace('/dashboard');
        }
        
    }, [isUserLoading, user, isPublicPage, isRootPage, pathname, router]);

    if (isUserLoading || (!isPublicPage && !user)) {
      return (
         <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
            <div className="p-4 bg-muted rounded-full">
                <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground animate-pulse">Iniciando aplicación...</p>
        </div>
      );
    }
    
    if (isLocked) {
        return <PinModal />;
    }

    if (isLoadingSettings && !isPublicPage) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
                <div className="p-4 bg-muted rounded-full">
                    <Package className="w-12 h-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground animate-pulse">Cargando configuración de la tienda...</p>
            </div>
        );
    }

    return <>{children}</>;
}
