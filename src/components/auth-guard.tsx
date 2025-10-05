
"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProvidersWrapper } from "./providers-wrapper";
import { useSecurity } from "@/contexts/security-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const { isPinLoading } = useSecurity();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [isUserLoading, user, router]);

    if (isUserLoading || isPinLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <p>Cargando aplicación...</p>
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <p>Redirigiendo a la página de inicio de sesión...</p>
            </div>
        );
    }

    return <ProvidersWrapper>{children}</ProvidersWrapper>;
}
