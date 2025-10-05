
"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./logo";

/**
 * AuthGuard is the first line of defense.
 * Its ONLY job is to check for a logged-in user. If a user is not logged in,
 * it redirects to the /login page. It does NOT handle PIN locking or app loading states.
 * This component runs before the main AppLoader.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // This effect handles redirection based on user authentication status.
    useEffect(() => {
        // Wait until the component is mounted and the user loading state is resolved.
        if (!isMounted || isUserLoading) return;
        
        // If, after loading, there is no user, redirect to the login page.
        if (!user) {
            router.replace('/login');
        }
    }, [isMounted, isUserLoading, user, router]);

    // While loading or before the redirect can happen, show a generic loading screen.
    // This prevents any child components from rendering prematurely.
    if (isUserLoading || !user) {
        return (
            <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando sesión...</p>
            </div>
        );
    }
    
    // If a user is found, render the children (which will be the AppLoader).
    return <>{children}</>;
}
