
"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { SecurityProvider, useSecurity } from "@/contexts/security-context";
import { SettingsProvider } from "@/contexts/settings-context";
import { ProductProvider } from "@/contexts/product-context";
import { SalesProvider } from "@/contexts/sales-context";
import { PurchasesProvider } from "@/contexts/purchases-context";
import { UnitsProvider } from "@/contexts/units-context";
import { FamiliesProvider } from "@/contexts/families-context";
import { WarehousesProvider } from "@/contexts/warehouses-context";
import { CurrencyRatesProvider } from "@/contexts/currency-rates-context";
import { PinModal } from "@/components/pin-modal";
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/ui/footer";
import { Toaster } from "@/components/ui/toaster";
import { usePathname, useRouter, redirect } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { FirebaseClientProvider, useUser } from "@/firebase";


function MainApp({ children }: { children: React.ReactNode }) {
  const { isLocked, lockApp, hasPin } = useSecurity();
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // If loading, do nothing. If not loading and no user, redirect to login unless already there.
    if (!isUserLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, isUserLoading, pathname, router]);

  useEffect(() => {
    if (!hasPin) return;

    // Lock the app only when navigating away from the POS page
    if (previousPathname.current === '/pos' && pathname !== '/pos') {
      lockApp();
    }
    
    previousPathname.current = pathname;
  }, [pathname, lockApp, hasPin]);
  
  if (isUserLoading) {
     return <div className="flex h-screen w-full items-center justify-center"><p>Cargando...</p></div>;
  }

  if (!user && pathname !== '/login') {
      return <div className="flex h-screen w-full items-center justify-center"><p>Redirigiendo al login...</p></div>;
  }

  if (pathname === '/login') {
      return <>{children}</>;
  }

  if (isLocked) {
      return <PinModal />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <SiteSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <SiteHeader />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <FirebaseClientProvider>
        <SecurityProvider>
          <CurrencyRatesProvider>
            <SettingsProvider>
              <ProductProvider>
                <SalesProvider>
                  <PurchasesProvider>
                    <UnitsProvider>
                      <FamiliesProvider>
                        <WarehousesProvider>
                          <MainApp>{children}</MainApp>
                          <Toaster />
                        </WarehousesProvider>
                      </FamiliesProvider>
                    </UnitsProvider>
                  </PurchasesProvider>
                </SalesProvider>
              </ProductProvider>
            </SettingsProvider>
          </CurrencyRatesProvider>
        </SecurityProvider>
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}
