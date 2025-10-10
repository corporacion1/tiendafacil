
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "./pin-modal";
import { useSettings } from "@/contexts/settings-context";
import { Package } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    // TODA LA LÓGICA DE SEGURIDAD HA SIDO DESHABILITADA PARA PERMITIR EL ACCESO.
    
    // const { isUserLoading, user } = useUser();
    // const router = useRouter();
    // const pathname = usePathname();
    // const { isSecurityReady, isLocked, hasPin, lockApp } = useSecurity();
    // const { isLoadingSettings } = useSettings();
    
    // const isPublicPage = pathname.startsWith('/catalog') || pathname.startsWith('/login');
    // const isRootPage = pathname === '/';

    // useEffect(() => {
    //     if (!isSecurityReady || !hasPin) return;
    //     if (pathname !== '/pos' && localStorage.getItem('last_path_was_pos') === 'true') {
    //         lockApp();
    //     }
    //     localStorage.setItem('last_path_was_pos', (pathname === '/pos').toString());
    // }, [pathname, lockApp, hasPin, isSecurityReady]);

    // useEffect(() => {
    //     if (isLoadingSettings || isUserLoading) {
    //         return;
    //     }
        
    //     if (!user && !isPublicPage) {
    //         router.replace('/login');
    //         return;
    //     }
        
    //     if (user && isRootPage) {
    //        router.replace('/dashboard');
    //        return;
    //     }
        
    // }, [isLoadingSettings, isUserLoading, user, isPublicPage, isRootPage, pathname, router]);

    // if (isLoadingSettings || isUserLoading) {
    //     return (
    //         <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
    //             <div className="p-4 bg-muted rounded-full">
    //                 <Package className="w-12 h-12 text-muted-foreground animate-pulse" />
    //             </div>
    //             <p className="text-muted-foreground animate-pulse">Iniciando aplicación y cargando datos...</p>
    //         </div>
    //     );
    // }
    
    // if (isLocked) {
    //     return <PinModal />;
    // }

    return <>{children}</>;
}
