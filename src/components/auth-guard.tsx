
"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { Logo } from "./logo";

/**
 * AuthGuard is the gatekeeper for PROTECTED routes.
 * It assumes it will only be used on routes that require authentication.
 * It ensures a user is logged in and has the correct role.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isUserLoading, user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    // Fetch user profile from Firestore
    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        const isAuthCheckComplete = !isUserLoading;
        
        // If auth check is done and there's no user, redirect to login.
        if (isAuthCheckComplete && !user) {
            router.replace('/login');
            return;
        }

        // If user is logged in, but their profile is still loading, we wait.
        // Once the profile is loaded, check their role.
        if (isAuthCheckComplete && user && userProfile) {
            // If a basic 'user' tries to access the backend, send them to the catalog
            if (userProfile.role === 'user') {
                router.replace('/catalog');
            }
            // 'admin' and 'superAdmin' are allowed, so we do nothing.
        }

    }, [isUserLoading, isProfileLoading, user, userProfile, router]);
    
    // While checking for user or loading their profile, show a loading screen.
    if (isUserLoading || (user && isProfileLoading)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando sesión y permisos...</p>
            </div>
        );
    }
    
    // If the user is authenticated and has a role that is not 'user', render the protected content.
    if (user && userProfile && userProfile.role !== 'user') {
        return <>{children}</>;
    }

    // Fallback: This will show the loading screen until a redirect happens,
    // preventing any accidental rendering of protected content.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
        <Logo className="w-64 h-20" />
        <p className="text-muted-foreground animate-pulse">Verificando sesión y permisos...</p>
      </div>
    );
}
