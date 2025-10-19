// hooks/useCurrencyRates.ts
import { useSettings } from '@/contexts/settings-context';

export function useCurrencyRates() {
  const { 
    fetchCurrencyRates,
    saveCurrencyRate,
    currencyRates
  } = useSettings();
  
  return {
    fetchCurrencyRates,
    saveCurrencyRate,
    currencyRates
  };
}