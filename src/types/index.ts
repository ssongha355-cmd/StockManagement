import { Timestamp } from 'firebase/firestore';

export type TradeType = 'BUY' | 'SELL' | 'DIVIDEND';
export type Currency = 'USD' | 'KHR';

export interface Transaction {
  id?: string;
  date: Timestamp | Date;
  ticker: string;
  type: TradeType;
  quantity: number;
  price: number;
  fee: number;
  amount?: number;
  currency?: Currency;
  realizedProfit?: number; // Realized P&L produced by this trade if SELL or DIVIDEND
  createdAt?: Timestamp;
}

export interface PortfolioItem {
  ticker: string; // Document ID (uppercase)
  totalQuantity: number;
  averageBuyPrice: number;
  realizedProfit: number;
  manualCurrentPrice: number;
  currency?: Currency;
  updatedAt?: Timestamp;
}

export interface PortfolioSummary {
  totalCostBasis: number;
  totalCurrentValue: number;
  totalUnrealizedProfit: number;
  totalRealizedProfit: number;
  totalNetProfit: number;
  totalReturnPercentage: number;
}

export type CashTransactionType = 'DEPOSIT' | 'WITHDRAW';

export interface CashTransaction {
  id?: string;
  type: CashTransactionType;
  amount: number;
  currency: Currency;
  date: Timestamp | Date;
  createdAt?: Timestamp;
}

export interface WalletBalance {
  balance: number;
  updatedAt?: Timestamp;
}

export type WalletBalances = Record<Currency, number>;

export interface InitialTradeData {
  action?: 'BUY' | 'SELL';
  type?: TradeType;
  ticker?: string;
  quantity?: number;
  price?: number;
  currency?: Currency;
}

export interface UserSettings {
  targetNetWorth?: number;
  targetNetWorthUSD?: number;
  targetNetWorthKHR?: number;
  isAppLockEnabled?: boolean;
  pinCode?: string;
  updatedAt?: Timestamp | Date;
}


