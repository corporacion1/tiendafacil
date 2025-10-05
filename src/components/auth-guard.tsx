
"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Logo } from "./logo";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "./pin-modal";
import { usePathname } from "next/navigation";

/**
 * AuthGuard es ahora el único punto de control para la autenticación y el bloqueo de la app.
 * 1. Espera a que la sesión de Firebase esté resuelta.
 * 2. Si no hay usuario, redirige a /login.
 * 3. Si hay usuario, espera a que el estado del PIN esté resuelto.
 * 4. Si la app está bloqueada, muestra el modal de PIN.
 * 5. Solo cuando el usuario está autenticado y la app desbloqueada, renderiza el contenido.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const { isPinLoading, lockApp, hasPin, isLocked, isSecurityReady } = useSecurity();
    const router = useRouter();
    const pathname = usePathname();
    const previousPathname = useRef(pathname);

    // Efecto para redirigir si no hay usuario
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [isUserLoading, user, router]);

    // Efecto para bloquear la app al salir del POS
    useEffect(() => {
      if (!isSecurityReady || !hasPin) return;
      
      if (previousPathname.current === '/pos' && pathname !== '/pos') {
        lockApp();
      }
      previousPathname.current = pathname;
    }, [pathname, lockApp, hasPin, isSecurityReady]);

    // Muestra pantalla de carga mientras se verifica el usuario o el PIN
    if (isUserLoading || isPinLoading || !isSecurityReady) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando seguridad...</p>
            </div>
        );
    }
    
    // Si no hay usuario (y ya no está cargando), muestra la carga hasta que redirija
    if (!user) {
         return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Redirigiendo...</p>
            </div>
        );
    }

    // Si hay usuario pero la app está bloqueada, muestra el modal de PIN
    if (user && isLocked) {
        return <PinModal />;
    }

    // Si hay usuario y la app no está bloqueada, renderiza los hijos
    return <>{children}</>;
}
