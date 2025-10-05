
"use client";

import { useUser } from "@/firebase";
import { ProvidersWrapper } from "./providers-wrapper";
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [user, isUserLoading, router, pathname]);

    if (isUserLoading || !user) {
        return (
            <div className="flex flex-col flex-1 h-full items-center justify-center">
                <p>Verificando sesión...</p>
            </div>
        );
    }

    return <ProvidersWrapper>{children}</ProvidersWrapper>;
}
