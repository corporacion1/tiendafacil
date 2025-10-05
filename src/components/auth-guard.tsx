
"use client";

import { useUser } from "@/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ProvidersWrapper } from "./providers-wrapper";
import { useSecurity } from "@/contexts/security-context";
import { PinModal } from "@/components/pin-modal";
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const { isPinLoading, isLocked, lockApp, hasPin, isMounted } = useSecurity();
    const router = useRouter();
    const pathname = usePathname();
    const previousPathname = useRef(pathname);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/login');
        }
    }, [isUserLoading, user, router]);

    useEffect(() => {
      if (!hasPin || !isMounted) return;
      if (previousPathname.current === '/pos' && pathname !== '/pos') {
        lockApp();
      }
      previousPathname.current = pathname;
    }, [pathname, lockApp, hasPin, isMounted]);

    if (isUserLoading || isPinLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <p>Verificando sesión...</p>
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <p>Redirigiendo a la página de inicio de sesión...</p>
            </div>
        );
    }

    return (
        <ProvidersWrapper>
            <div className="flex min-h-screen w-full flex-col bg-muted/40">
                {isLocked ? (
                    <PinModal />
                ) : (
                    <>
                    <SiteSidebar />
                    <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                        <SiteHeader />
                        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                            {children}
                        </main>
                        <Footer />
                    </div>
                    </>
                )}
            </div>
        </ProvidersWrapper>
    );
}
