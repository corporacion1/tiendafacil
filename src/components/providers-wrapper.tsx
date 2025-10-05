
"use client";

import { SettingsProvider } from "@/contexts/settings-context";
import { ProductProvider } from "@/contexts/product-context";
import { SalesProvider } from "@/contexts/sales-context";
import { PurchasesProvider } from "@/contexts/purchases-context";
import { UnitsProvider } from "@/contexts/units-context";
import { FamiliesProvider } from "@/contexts/families-context";
import { WarehousesProvider } from "@/contexts/warehouses-context";
import { CurrencyRatesProvider } from "@/contexts/currency-rates-context";


export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyRatesProvider>
      <SettingsProvider>
        <ProductProvider>
          <SalesProvider>
            <PurchasesProvider>
              <UnitsProvider>
                <FamiliesProvider>
                  <WarehousesProvider>
                    {children}
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
