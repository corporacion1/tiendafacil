
"use client";

import { CurrencyRatesProvider } from "@/contexts/currency-rates-context";
import { FamiliesProvider } from "@/contexts/families-context";
import { ProductProvider } from "@/contexts/product-context";
import { PurchasesProvider } from "@/contexts/purchases-context";
import { SalesProvider } from "@/contexts/sales-context";
import { SettingsProvider } from "@/contexts/settings-context";
import { UnitsProvider } from "@/contexts/units-context";
import { WarehousesProvider } from "@/contexts/warehouses-context";

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
