
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
    const pathname = usePathname();

    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        // When auth is done loading...
        if (!isUserLoading) {
            // ...and there is no user, redirect to login.
            if (!user) {
                router.replace('/login');
                return;
            }
            
            // SUPER ADMIN OVERRIDE: If the user is the super admin, they have access.
            // Do not perform any other checks or redirects.
            if (user.email === 'corporacion1@gmail.com') {
                return;
            }

            // ...if there IS a user, but we are still waiting for their profile from Firestore...
            if (isProfileLoading) {
                // ...we do nothing and wait for the profile to load.
                // The loading screen below will be displayed.
                return;
            }

            // ...if we have the user and their profile...
            if (userProfile) {
                // ...and their role is just 'user', redirect them to the catalog.
                if (userProfile.role === 'user') {
                    router.replace('/catalog');
                }
                // 'admin' and 'superAdmin' roles are allowed, so we do nothing.
            }
        }
    }, [isUserLoading, isProfileLoading, user, userProfile, router, pathname]);

    // Show loading screen while auth is resolving or profile is fetching
    if (isUserLoading || (user && isProfileLoading)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando sesión y permisos...</p>
            </div>
        );
    }
    
    // Once everything is loaded, if the user is the Super Admin, grant access.
    if (user && user.email === 'corporacion1@gmail.com') {
        return <>{children}</>;
    }

    // Or if the user has a profile and is an admin, grant access.
    if (userProfile && userProfile.role !== 'user') {
        return <>{children}</>;
    }
    
    // Fallback loading screen to prevent any content flashing until redirect is complete.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
        <Logo className="w-64 h-20" />
        <p className="text-muted-foreground animate-pulse">Verificando sesión y permisos...</p>
      </div>
    );
}
