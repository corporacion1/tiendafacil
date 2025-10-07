
"use client";

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "./pin-modal";

/**
 * AuthGuard is the FIRST checkpoint for authentication.
 * Its only job is to wait for the Firebase auth state to be resolved AND for a user to exist.
 * If there is no user, it would redirect. In this demo, we assume a user
 * will always exist for the main app. Once the user state is confirmed,
 * it renders its children (which should include the AppLoader).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    // We can simulate an authenticated user or use the real one.
    const { isUserLoading, user } = useUser();
    const router = useRouter();
    
    // This effect can be used to redirect if the user is not logged in after loading.
    // For this demo, we are assuming a logged-in state for all protected routes.

    // Primary loading state: wait for Firebase to confirm auth status AND for the user object to be available.
    // This is the key fix: we don't proceed until 'user' is truthy.
    if (isUserLoading || !user) {
        return (
            <div className="flex flex-col items-center justify-center pt-20 gap-4">
                <Logo className="w-64 h-20" />
                <p className="text-muted-foreground animate-pulse">Verificando sesión...</p>
            </div>
        );
    }
    
    // If all checks pass (i.e., user is "loaded" and exists), render the children.
    // The AppLoader inside will then handle PIN logic.
    return <>{children}</>;
}
