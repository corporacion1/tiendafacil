import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase';
import { SecurityProvider } from '@/contexts/security-context';
import { SettingsProvider } from '@/contexts/settings-context';
import { ProductProvider } from '@/contexts/product-context';
import { SalesProvider } from '@/contexts/sales-context';
import { PurchasesProvider } from '@/contexts/purchases-context';
import { UnitsProvider } from '@/contexts/units-context';
import { FamiliesProvider } from '@/contexts/families-context';
import { WarehousesProvider } from '@/contexts/warehouses-context';
import { CurrencyRatesProvider } from '@/contexts/currency-rates-context';


export const metadata: Metadata = {
  title: 'TIENDA FACIL WEB',
  description: 'Sistema de inventario y punto de venta',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>TF</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
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
                              <AppShell>
                                  {children}
                              </AppShell>
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
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
