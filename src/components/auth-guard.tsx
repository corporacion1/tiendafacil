
"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { Logo } from "./logo";

/**
 * AuthGuard is the single source of truth for authentication and authorization.
 * It ensures a user is logged in for protected routes and has the correct role.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isUserLoading, user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const pathname = usePathname();

    const isPublicPage = pathname.startsWith('/catalog');
    const isLoginPage = pathname === '/login';

    // Fetch user profile from Firestore
    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        // If it's the login page, we let it render without checks for now.
        // The login page itself will handle redirecting logged-in users.
        if (isLoginPage) {
            return;
        }

        const isAuthCheckComplete = !isUserLoading && !isProfileLoading;
        
        // If auth check is done and there's no user, redirect to login (unless on a public page)
        if (isAuthCheckComplete && !user && !isPublicPage) {
            router.replace('/login');
            return;
        }

        // If user is logged in, but we are on a public page, check their role.
        if (isAuthCheckComplete && user && isPublicPage) {
            // No action needed, public pages are for everyone.
            return;
        }

        // If user is logged in and tries to access a protected page
        if (isAuthCheckComplete && user && !isPublicPage) {
            // If the profile exists, check the role
            if (userProfile) {
                // If a basic 'user' tries to access the backend, send them to the catalog
                if (userProfile.role === 'user') {
                    router.replace('/catalog');
                }
                // 'admin' and 'superAdmin' are allowed, so we do nothing.
            } else {
                // Profile is still loading or doesn't exist. This case is covered by the loading screen.
                // If it doesn't exist after loading, they might be stuck, but the loading screen handles it.
            }
        }

    }, [isUserLoading, isProfileLoading, user, userProfile, router, pathname, isPublicPage, isLoginPage]);
    
    // If it's the login page and we're not loading, just render it.
    if (isLoginPage && !isUserLoading) {
        return <>{children}</>;
    }

    // Show a loading screen while user/profile data is being fetched for any other page.
    if (isUserLoading || (user && isProfileLoading)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando sesión y permisos...</p>
            </div>
        );
    }
    
    // If it's a public page, render it immediately if auth is done.
    if (isPublicPage) {
        return <>{children}</>;
    }

    // For protected routes, only render if the user exists and has a valid profile with a role other than 'user'.
    if (user && userProfile && userProfile.role !== 'user') {
        return <>{children}</>;
    }

    // Fallback in case of an invalid state, prevents rendering protected content.
    return null;
}
