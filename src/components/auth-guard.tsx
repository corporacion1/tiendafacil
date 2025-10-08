
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "./logo";

/**
 * AuthGuard's primary responsibility is to ensure a user is authenticated.
 * It waits for the Firebase SDK to confirm the user's auth status.
 * If not authenticated, it redirects to the login page.
 * It renders its children only after confirming an authenticated user.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isUserLoading, user } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // If loading is finished and there's still no user, redirect to login.
        if (!isUserLoading && !user && pathname !== '/login') {
            router.replace('/login');
        }
    }, [isUserLoading, user, router, pathname]);

    // While Firebase is determining the auth state, show a global loading screen.
    if (isUserLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando sesión...</p>
            </div>
        );
    }
    
    // If a user exists, render the children. Otherwise, return null while redirecting.
    return user ? <>{children}</> : null;
}
