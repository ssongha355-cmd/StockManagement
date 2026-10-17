import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PortfolioItem } from '../types';
import { updateTickerPrice } from '../services/portfolioService';
import { formatCurrency, getCurrencySymbol } from '../utils/format';
import { Check, RefreshCw } from 'lucide-react';

interface UpdatePricesProps {
  portfolio: PortfolioItem[];
  highlightTicker?: string;
}

export const UpdatePricesScreen: React.FC<UpdatePricesProps> = ({
  portfolio,
  highlightTicker,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const activeHoldings = portfolio.filter((item) => item.totalQuantity > 0);

  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    activeHoldings.forEach((h) => {
      initial[h.ticker] = (h.manualCurrentPrice || h.averageBuyPrice).toString();
    });
    return initial;
  });

  const [savingTicker, setSavingTicker] = useState<string | null>(null);
  const [successTicker, setSuccessTicker] = useState<string | null>(null);

  const handlePriceChange = (ticker: string, val: string) => {
    setPrices((prev) => ({ ...prev, [ticker]: val }));
  };

  const handleSave = async (ticker: string) => {
    if (!user) return;
    const rawVal = prices[ticker];
    const num = parseFloat(rawVal);
    if (isNaN(num) || num <= 0) return;

    setSavingTicker(ticker);
    try {
      await updateTickerPrice(user.uid, ticker, num);
      setSuccessTicker(ticker);
      setTimeout(() => setSuccessTicker(null), 1500);
    } catch {
      alert(`Failed to update price for ${ticker}`);
    } finally {
      setSavingTicker(null);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {t('update_prices_title')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('update_prices_subtitle')}
        </p>
      </div>

      {activeHoldings.length === 0 ? (
        <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-3xl text-center border border-slate-200/80 dark:border-white/5">
          <p className="text-xs text-slate-500">{t('no_active_positions')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeHoldings.map((item) => {
            const isHighlighted = highlightTicker === item.ticker;
            const isSaving = savingTicker === item.ticker;
            const isSaved = successTicker === item.ticker;

            return (
              <div
                key={item.ticker}
                className={`bg-white dark:bg-[#1c1c1e] p-4 rounded-3xl shadow-sm border transition ${
                  isHighlighted
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200/80 dark:border-white/5'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-[80px]">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {item.ticker}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.currency || 'KHR'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {t('cost')}: {formatCurrency(item.averageBuyPrice, item.currency)}
                    </p>
                  </div>

                  <div className="flex-1 flex items-center space-x-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">
                        {getCurrencySymbol(item.currency)}
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={prices[item.ticker] ?? ''}
                        onChange={(e) => handlePriceChange(item.ticker, e.target.value)}
                        placeholder={item.currency === 'KHR' ? '0' : '0.00'}
                        className="w-full pl-7 pr-3 py-2 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSave(item.ticker)}
                      disabled={isSaving}
                      className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center active:scale-95 ${
                        isSaved
                          ? 'bg-emerald-500 text-white'
                          : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                      }`}
                    >
                      {isSaving ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : isSaved ? (
                        <Check size={14} />
                      ) : (
                        t('save')
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
