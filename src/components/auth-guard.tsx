
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "./logo";

/**
 * AuthGuard's primary responsibility is to ensure a user is authenticated
 * *after* the initial Firebase user loading is complete.
 * It gates the rendering of the entire authenticated app.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isUserLoading, user } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    const isPublicPage = pathname === '/login' || pathname.startsWith('/catalog');

    useEffect(() => {
        // If loading is finished, there's no user, and we are not on a public page, redirect to login.
        if (!isUserLoading && !user && !isPublicPage) {
            router.replace('/login');
        }
    }, [isUserLoading, user, router, pathname, isPublicPage]);

    // If it's a public page, render it immediately without waiting for user state.
    if (isPublicPage) {
        return <>{children}</>;
    }

    // While Firebase is determining the auth state for protected routes, show a global loading screen.
    if (isUserLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando sesión...</p>
            </div>
        );
    }
    
    // If a user exists for a protected route, render the children.
    // If there's no user, we are in the process of redirecting, so return null.
    return user ? <>{children}</> : null;
}
