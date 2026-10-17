import React from 'react';
import { PortfolioItem } from '../types';
import { formatCurrency } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles } from 'lucide-react';

interface HoldingCardProps {
  item: PortfolioItem;
  onQuickUpdate?: (ticker: string) => void;
  onAnalyze?: (item: PortfolioItem) => void;
}

export const HoldingCard: React.FC<HoldingCardProps> = ({ item, onQuickUpdate, onAnalyze }) => {
  const { t } = useLanguage();
  const currentValue = item.totalQuantity * (item.manualCurrentPrice || 0);
  const costBasis = item.totalQuantity * item.averageBuyPrice;
  const unrealizedProfit = currentValue - costBasis;
  const unrealizedPct = costBasis > 0 ? (unrealizedProfit / costBasis) * 100 : 0;
  const isPositive = unrealizedProfit >= 0;

  return (
    <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-3xl shadow-sm border border-slate-200/80 dark:border-white/5 transition active:scale-[0.99]">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              {item.ticker}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
              {item.currency || 'KHR'}
            </span>
            <span className="text-xs px-2 py-0.5 font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {item.totalQuantity.toLocaleString()} {t('shares')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('avg')}: {formatCurrency(item.averageBuyPrice, item.currency)} • {t('now')}: {formatCurrency(item.manualCurrentPrice || 0, item.currency)}
          </p>
        </div>

        <div className="text-right">
          <div className="text-base font-bold text-slate-900 dark:text-white">
            {formatCurrency(currentValue, item.currency)}
          </div>
          <div
            className={`text-xs font-semibold mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(unrealizedProfit, item.currency, { includeSign: true })} ({isPositive ? '+' : ''}
            {unrealizedPct.toFixed(2)}%)
          </div>
        </div>
      </div>

      {(onAnalyze || onQuickUpdate) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          {onAnalyze ? (
            <button
              type="button"
              onClick={() => onAnalyze(item)}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition active:scale-95"
            >
              <Sparkles size={13} className="text-amber-500 fill-amber-500/20" />
              <span>{t('smart_analysis')}</span>
            </button>
          ) : (
            <div />
          )}

          {onQuickUpdate && (
            <button
              type="button"
              onClick={() => onQuickUpdate(item.ticker)}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 active:underline"
            >
              {t('update_price_arrow')}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
