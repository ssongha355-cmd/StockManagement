import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { PortfolioItem, Currency } from '../types';
import { formatCurrency } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

interface AssetAllocationChartProps {
  portfolio: PortfolioItem[];
  availableCash: number;
  currency?: Currency;
}

const PALETTE = [
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // purple-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f59e0b', // amber-500
  '#14b8a6', // teal-500
  '#f43f5e', // rose-500
  '#84cc16', // lime-500
  '#a855f7', // violet-500
];

const CASH_COLOR = '#10b981'; // emerald-500

const CustomTooltip = ({ active, payload, currency }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const percent = item.payload?.percent ?? 0;
    return (
      <div className="bg-slate-900/90 dark:bg-black/90 backdrop-blur-md text-white px-3 py-2 rounded-2xl text-xs shadow-xl border border-white/10">
        <div className="font-extrabold text-sm">{item.name}</div>
        <div className="text-slate-200 font-semibold mt-0.5">
          {formatCurrency(item.value, currency)}
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          {percent.toFixed(1)}%
        </div>
      </div>
    );
  }
  return null;
};

const renderCustomLegend = (props: any) => {
  const { payload } = props;
  if (!payload || !payload.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-white/5">
      {payload.map((entry: any, index: number) => {
        const percent = entry.payload?.percent ?? 0;
        return (
          <div
            key={`legend-item-${index}`}
            className="flex items-center justify-between text-xs px-1 min-w-0"
          >
            <div
              className="flex items-center space-x-1.5 min-w-0 flex-1 mr-2"
              title={entry.value}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span
                title={entry.value}
                className="font-bold text-slate-800 dark:text-slate-200 truncate cursor-help"
              >
                {entry.value}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              {percent.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
  portfolio,
  availableCash,
  currency,
}) => {
  const { t } = useLanguage();
  const { selectedCurrency } = useCurrency();
  const activeCurrency = currency || selectedCurrency || 'KHR';

  const chartData = useMemo(() => {
    const items: { name: string; value: number; percent: number; color: string }[] = [];

    // Filter portfolio items for currently active currency with open holdings
    const activeHoldings = portfolio.filter(
      (item) => (item.currency || 'KHR') === activeCurrency && item.totalQuantity > 0
    );

    let totalVal = 0;

    activeHoldings.forEach((item, index) => {
      // Calculate current value of holding: quantity * (manualCurrentPrice or averageBuyPrice)
      const currentPrice = item.manualCurrentPrice > 0 ? item.manualCurrentPrice : item.averageBuyPrice;
      const val = item.totalQuantity * currentPrice;
      if (val > 0) {
        totalVal += val;
        items.push({
          name: item.ticker,
          value: Number(val.toFixed(2)),
          percent: 0,
          color: PALETTE[index % PALETTE.length],
        });
      }
    });

    // Append Available Cash as its own slice
    const cash = Math.max(0, availableCash);
    if (cash > 0) {
      totalVal += cash;
      items.push({
        name: t('available_cash'),
        value: Number(cash.toFixed(2)),
        percent: 0,
        color: CASH_COLOR,
      });
    }

    if (totalVal > 0) {
      items.forEach((item) => {
        item.percent = (item.value / totalVal) * 100;
      });
    }

    // Sort descending by value
    items.sort((a, b) => b.value - a.value);

    return { data: items, totalVal };
  }, [portfolio, availableCash, activeCurrency, t]);

  if (chartData.data.length === 0 || chartData.totalVal === 0) {
    return (
      <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
        {t('no_allocation_data')}
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData.data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="42%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            stroke="none"
          >
            {chartData.data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip currency={activeCurrency} />} />
          <Legend content={renderCustomLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
