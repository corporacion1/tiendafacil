
"use client";

import { PinModal } from "@/components/pin-modal";
import { SiteSidebar } from "@/components/site-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/ui/footer";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useSecurity } from "@/contexts/security-context";
import { useUser } from '@/firebase';
import { SettingsProvider } from '@/contexts/settings-context';
import { ProductProvider } from '@/contexts/product-context';
import { SalesProvider } from '@/contexts/sales-context';
import { PurchasesProvider } from '@/contexts/purchases-context';
import { UnitsProvider } from '@/contexts/units-context';
import { FamiliesProvider } from '@/contexts/families-context';
import { WarehousesProvider } from '@/contexts/warehouses-context';
import { CurrencyRatesProvider } from '@/contexts/currency-rates-context';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isLocked, lockApp, hasPin } = useSecurity();
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, isUserLoading, pathname, router]);

  useEffect(() => {
    if (!hasPin) return;

    if (previousPathname.current === '/pos' && pathname !== '/pos') {
      lockApp();
    }
    
    previousPathname.current = pathname;
  }, [pathname, lockApp, hasPin]);
  
  if (isUserLoading || (!user && pathname !== '/login')) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <p>Cargando aplicación...</p>
      </div>
    );
  }
  
  if (pathname === '/login') {
      return <>{children}</>;
  }
  
  if (!user) {
    // This case is unlikely to be hit due to the loading check above, but it's a safeguard.
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <p>Verificando sesión...</p>
        </div>
    );
  }

  if (isLocked) {
      return <PinModal />;
  }

  return (
    <CurrencyRatesProvider>
      <SettingsProvider>
        <ProductProvider>
          <SalesProvider>
            <PurchasesProvider>
              <UnitsProvider>
                <FamiliesProvider>
                  <WarehousesProvider>
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
                  </WarehousesProvider>
                </FamiliesProvider>
              </UnitsProvider>
            </PurchasesProvider>
          </SalesProvider>
        </ProductProvider>
      </SettingsProvider>
    </CurrencyRatesProvider>
  );
}
