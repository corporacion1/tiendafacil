
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "./logo";

/**
 * AuthGuard is the FIRST and ONLY checkpoint for authentication.
 * Its sole responsibility is to ensure a user is authenticated before any
 * part of the protected application is rendered.
 * If there is no user after the initial check, it redirects to the login page.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isUserLoading, user } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // If loading is finished and there's still no user, redirect to login.
        // We also check to prevent a redirect loop if we're already on the login page.
        if (!isUserLoading && !user && pathname !== '/login') {
            router.replace('/login');
        }
    }, [isUserLoading, user, router, pathname]);

    // While Firebase is determining the auth state, show a global loading screen.
    // This is the critical step that prevents any child components from rendering
    // and attempting to access Firestore prematurely.
    if (isUserLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando sesión...</p>
            </div>
        );
    }
    
    // If a user exists, render the children (the rest of the app).
    // If no user exists, this will be null for a brief moment before the useEffect redirects.
    return user ? <>{children}</> : null;
}
