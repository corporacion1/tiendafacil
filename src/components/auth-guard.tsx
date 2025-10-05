
"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProvidersWrapper } from "./providers-wrapper";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [isUserLoading, user, router]);

    if (isUserLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <p>Verificando sesión...</p>
            </div>
        );
    }
    
    if (!user) {
        // This will be shown briefly while the redirect happens.
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <p>Redirigiendo a la página de inicio de sesión...</p>
            </div>
        );
    }

    // If we have a user, wrap the children with all necessary data providers.
    return <ProvidersWrapper>{children}</ProvidersWrapper>;
}
