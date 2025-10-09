
"use client";

import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { Logo } from "./logo";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isUserLoading, user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const pathname = usePathname();
    const isPublicPage = pathname === '/login' || pathname.startsWith('/catalog');

    const userProfileRef = useMemoFirebase(() => {
        if (!user || isPublicPage) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore, isPublicPage]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

    useEffect(() => {
        // This effect only handles redirection for protected pages
        if (isPublicPage || isUserLoading) {
            return;
        }

        // If auth is done and there's no user, redirect to login
        if (!user) {
            router.replace('/login');
            return;
        }

        // Super admin check
        if (user.email === 'corporacion1@gmail.com') {
            return;
        }
        
        // When profile is loaded, check roles
        if (!isProfileLoading && userProfile) {
            if (userProfile.role === 'user') {
                router.replace('/catalog');
            }
        }

    }, [isUserLoading, isProfileLoading, user, userProfile, router, pathname, isPublicPage]);

    // If it's a public page, render it immediately.
    if (isPublicPage) {
        return <>{children}</>;
    }

    // For protected pages, show a loading screen while we verify auth and profile.
    if (isUserLoading || (user && isProfileLoading && user.email !== 'corporacion1@gmail.com')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando sesión y permisos...</p>
            </div>
        );
    }

    // If the user is authenticated and has the correct role (or is superAdmin), render the protected content.
    if (user && (user.email === 'corporacion1@gmail.com' || (userProfile && userProfile.role !== 'user'))) {
        return <>{children}</>;
    }

    // Fallback loading screen to prevent content flashing during redirects.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background gap-4">
        <Logo className="w-64 h-20" />
        <p className="text-muted-foreground animate-pulse">Verificando sesión y permisos...</p>
      </div>
    );
}
