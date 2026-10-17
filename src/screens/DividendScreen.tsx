import React, { useMemo } from 'react';
import { Transaction, CashTransaction, PortfolioItem } from '../types';
import { formatCurrency } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  Coins,
  Plus,
  Calendar,
  TrendingUp,
  Award,
  Sparkles,
} from 'lucide-react';

interface DividendScreenProps {
  transactions: Transaction[];
  portfolio?: PortfolioItem[];
  cashTransactions?: CashTransaction[];
  onNavigateAddTrade?: (ticker?: string) => void;
}

export const DividendScreen: React.FC<DividendScreenProps> = ({
  transactions,
  cashTransactions = [],
  onNavigateAddTrade,
}) => {
  const { t, language } = useLanguage();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  // Extract all dividend transactions for the active currency
  const dividendTransactions = useMemo(() => {
    return transactions.filter(
      (tx) => tx.type === 'DIVIDEND' && (tx.currency || 'KHR') === selectedCurrency
    );
  }, [transactions, selectedCurrency]);

  // Total Dividends Received (sum of all dividend amounts)
  const totalDividendsReceived = useMemo(() => {
    return dividendTransactions.reduce((sum, tx) => {
      const amount = tx.amount ?? tx.price ?? 0;
      return sum + (typeof amount === 'number' && !isNaN(amount) ? amount : 0);
    }, 0);
  }, [dividendTransactions]);

  // Total Deposited for the selected currency
  const totalDeposited = useMemo(() => {
    return cashTransactions
      .filter((tx) => (tx.currency || 'KHR') === selectedCurrency && tx.type === 'DEPOSIT')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [cashTransactions, selectedCurrency]);

  // Dividend Yield %: (Total Dividends Received / Total Deposited) * 100
  const dividendYieldPct = useMemo(() => {
    if (totalDeposited > 0) {
      return (totalDividendsReceived / totalDeposited) * 100;
    }
    return 0;
  }, [totalDividendsReceived, totalDeposited]);

  // Top Dividend Payer Stock
  const topDividendPayer = useMemo(() => {
    if (dividendTransactions.length === 0) return null;
    const totalsByTicker: Record<string, number> = {};
    dividendTransactions.forEach((tx) => {
      const amt = tx.amount ?? tx.price ?? 0;
      totalsByTicker[tx.ticker] = (totalsByTicker[tx.ticker] || 0) + amt;
    });
    let topTicker = '';
    let maxAmt = 0;
    Object.entries(totalsByTicker).forEach(([ticker, amt]) => {
      if (amt > maxAmt) {
        maxAmt = amt;
        topTicker = ticker;
      }
    });
    return { ticker: topTicker, total: maxAmt };
  }, [dividendTransactions]);

  // Group historical dividend payments by Month/Year descending
  const groupedDividends = useMemo(() => {
    const groups: {
      [key: string]: { label: string; dateVal: number; items: Transaction[] };
    } = {};

    dividendTransactions.forEach((tx) => {
      const dateObj =
        tx.date && typeof (tx.date as any).toDate === 'function'
          ? (tx.date as any).toDate()
          : new Date((tx.date as any) || Date.now());

      const year = dateObj.getFullYear();
      const month = dateObj.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      const label = dateObj.toLocaleDateString(
        language === 'km' ? 'km-KH' : 'en-US',
        {
          month: 'long',
          year: 'numeric',
        }
      );

      if (!groups[key]) {
        groups[key] = {
          label,
          dateVal: new Date(year, month, 1).getTime(),
          items: [],
        };
      }
      groups[key].items.push(tx);
    });

    return Object.entries(groups)
      .sort((a, b) => b[1].dateVal - a[1].dateVal)
      .map(([key, group]) => {
        const sortedItems = [...group.items].sort((a, b) => {
          const timeA =
            a.date && typeof (a.date as any).toDate === 'function'
              ? (a.date as any).toDate().getTime()
              : new Date((a.date as any) || 0).getTime();
          const timeB =
            b.date && typeof (b.date as any).toDate === 'function'
              ? (b.date as any).toDate().getTime()
              : new Date((b.date as any) || 0).getTime();
          return timeB - timeA;
        });

        const monthTotal = sortedItems.reduce(
          (acc, curr) => acc + (curr.amount ?? curr.price ?? 0),
          0
        );

        return {
          key,
          label: group.label,
          total: monthTotal,
          items: sortedItems,
        };
      });
  }, [dividendTransactions, language]);

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto">
      {/* Header & Currency Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <span>{t('dividend_dashboard')}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('dividend_dashboard_subtitle')}
          </p>
        </div>

        <div className="flex bg-slate-200/80 dark:bg-[#2c2c2e] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setSelectedCurrency('KHR')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              selectedCurrency === 'KHR'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            KHR (៛)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCurrency('USD')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              selectedCurrency === 'USD'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            USD ($)
          </button>
        </div>
      </div>

      {/* Hero Banner - Total Dividends Received & Yield */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 rounded-3xl p-5 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-center opacity-85 text-xs font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Coins size={14} className="text-emerald-200" />
            <span>{t('total_dividends_received')} ({selectedCurrency})</span>
          </span>
          <span className="bg-white/15 px-2.5 py-0.5 rounded-full text-[11px] font-bold backdrop-blur-sm">
            {dividendTransactions.length} {t('dividend_events')}
          </span>
        </div>

        <div className="text-3xl sm:text-4xl font-black tracking-tight mt-1.5">
          {formatCurrency(totalDividendsReceived, selectedCurrency)}
        </div>

        {/* Dividend Yield % Badge */}
        <div className="mt-3.5 pt-3.5 border-t border-white/15 flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-[11px] font-medium opacity-80 block">
              {t('dividend_yield')}
            </span>
            <span className="inline-flex items-center space-x-1 font-black text-lg text-emerald-100">
              <TrendingUp size={16} />
              <span>{dividendYieldPct.toFixed(2)}%</span>
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-medium opacity-80 block">
              {t('total_deposited')}
            </span>
            <span className="font-bold text-sm text-white">
              {formatCurrency(totalDeposited, selectedCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Metrics Cards: Top Payer & Passive Income Highlights */}
      <div className="grid grid-cols-2 gap-3">
        {/* Top Dividend Payer Card */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-3.5 border border-slate-200/80 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {t('top_dividend_payer')}
            </span>
            <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Award size={13} />
            </div>
          </div>
          <div className="text-base font-black text-slate-900 dark:text-white truncate">
            {topDividendPayer ? topDividendPayer.ticker : '—'}
          </div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
            {topDividendPayer
              ? formatCurrency(topDividendPayer.total, selectedCurrency)
              : formatCurrency(0, selectedCurrency)}
          </div>
        </div>

        {/* Payout Events Card */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-3.5 border border-slate-200/80 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {t('passive_income')}
            </span>
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles size={13} />
            </div>
          </div>
          <div className="text-base font-black text-slate-900 dark:text-white truncate">
            {dividendTransactions.length} {t('dividend_events')}
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {selectedCurrency}
          </div>
        </div>
      </div>

      {/* Historical Dividend Payouts Grouped by Month */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-1.5">
            <Calendar size={17} className="text-emerald-500" />
            <span>{t('passive_income')}</span>
            <span className="text-xs text-slate-400 font-normal">
              ({dividendTransactions.length})
            </span>
          </h2>

          {onNavigateAddTrade && (
            <button
              type="button"
              onClick={() => onNavigateAddTrade()}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center space-x-1 hover:underline"
            >
              <Plus size={14} />
              <span>{t('record_dividend')}</span>
            </button>
          )}
        </div>

        {groupedDividends.length === 0 ? (
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-8 text-center border border-slate-200/80 dark:border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <Coins size={24} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">
              {t('no_dividends_yet')}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {t('no_dividends_desc')}
            </p>
            {onNavigateAddTrade && (
              <button
                type="button"
                onClick={() => onNavigateAddTrade()}
                className="mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-semibold text-sm inline-flex items-center space-x-1.5 shadow-md shadow-emerald-500/25 active:scale-95 transition"
              >
                <Plus size={16} />
                <span>{t('record_dividend')}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {groupedDividends.map((group) => (
              <div key={group.key} className="space-y-2">
                {/* Month Header Banner */}
                <div className="flex justify-between items-center px-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="uppercase tracking-wider">{group.label}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">
                    +{formatCurrency(group.total, selectedCurrency)}
                  </span>
                </div>

                {/* List of Dividend Items in this Month */}
                <div className="space-y-2">
                  {group.items.map((tx) => {
                    const amount = tx.amount ?? tx.price ?? 0;
                    const dateObj =
                      tx.date && typeof (tx.date as any).toDate === 'function'
                        ? (tx.date as any).toDate()
                        : new Date((tx.date as any) || Date.now());

                    const formattedDate = dateObj.toLocaleDateString(
                      language === 'km' ? 'km-KH' : 'en-US',
                      {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }
                    );

                    return (
                      <div
                        key={tx.id || `${tx.ticker}-${dateObj.getTime()}`}
                        className="bg-white dark:bg-[#1c1c1e] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">
                            <Coins size={18} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-black text-sm text-slate-900 dark:text-white">
                                {tx.ticker}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                                {t('dividend')}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                              {formattedDate}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(amount, selectedCurrency)}
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            {selectedCurrency}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
