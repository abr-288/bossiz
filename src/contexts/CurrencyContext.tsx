import React, { useContext } from 'react';
import { singletonContext } from "@/lib/singletonContext";

interface CurrencyContextType {
  selectedCurrency: string;
  formatPrice: (amount: number, currency?: string) => string;
}

const CurrencyContext = singletonContext<CurrencyContextType | undefined>("Currency", undefined);

// Single currency: XOF (Franc CFA)
const FIXED_CURRENCY = {
  code: 'XOF',
  symbol: 'FCFA',
  name: 'Franc CFA'
};

export const currencies = [FIXED_CURRENCY];

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const selectedCurrency = FIXED_CURRENCY.code;

  const formatPrice = (amount: number, currency?: string): string => {
    // Always format as XOF
    return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
  };

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
