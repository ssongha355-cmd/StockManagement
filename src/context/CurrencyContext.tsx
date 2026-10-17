import React, { createContext, useContext, useState, useCallback } from 'react';
import { Currency } from '../types';

const STORAGE_KEY = 'stockfolio_currency';

interface CurrencyContextValue {
  selectedCurrency: Currency;
  setSelectedCurrency: (curr: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCurrency, setSelectedCurrencyState] = useState<Currency>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'USD' || stored === 'KHR') {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'KHR';
  });

  const setSelectedCurrency = useCallback((curr: Currency) => {
    setSelectedCurrencyState(curr);
    try {
      localStorage.setItem(STORAGE_KEY, curr);
    } catch {
      // ignore
    }
  }, []);

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextValue => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used inside <CurrencyProvider>');
  }
  return ctx;
};
