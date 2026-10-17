import React from 'react';
import { Currency } from '../types';
import { getCurrencySymbol, getCurrencyDecimals } from '../utils/format';

interface StatCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  isProfit?: boolean;
  prefix?: string;
  currency?: Currency;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  subtitle,
  isProfit,
  prefix,
  currency = 'KHR'
}) => {
  const isPositive = amount > 0;
  const isZero = amount === 0;
  const isNegative = amount < 0;
  const symbol = prefix ?? getCurrencySymbol(currency);
  const decimals = getCurrencyDecimals(currency);

  const colorClass =
    isProfit === undefined
      ? 'text-slate-900 dark:text-white'
      : isZero
      ? 'text-slate-500'
      : isPositive
      ? 'text-emerald-500'
      : 'text-rose-500';

  const sign = isProfit && isPositive ? '+' : isNegative ? '-' : '';

  return (
    <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-3xl shadow-sm border border-slate-200/80 dark:border-white/5 flex flex-col justify-between">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <div className="mt-2">
        <h3 className={`text-2xl font-bold tracking-tight ${colorClass}`}>
          {sign}
          {symbol}
          {Math.abs(amount).toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          })}
        </h3>
        {subtitle && (
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
