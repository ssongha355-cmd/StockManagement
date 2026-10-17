import React, { useMemo, useState, useEffect } from 'react';
import { PortfolioItem, Currency, WalletBalances, CashTransaction, InitialTradeData, UserSettings } from '../types';
import { StatCard } from '../components/StatCard';
import { HoldingCard } from '../components/HoldingCard';
import { AssetAllocationChart } from '../components/AssetAllocationChart';
import { SmartAnalysisModal } from '../components/SmartAnalysisModal';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { subscribeToUserSettings, updateUserSettings } from '../services/portfolioService';
import { PieChart as PieChartIcon, Plus, Layers, ArrowUp, ArrowDown, Sparkles, Target, Pencil, X, Clock, HelpCircle } from 'lucide-react';

interface DashboardProps {
  portfolio: PortfolioItem[];
  walletBalances: WalletBalances;
  cashTransactions?: CashTransaction[];
  onNavigateAddTrade: (tradeData?: InitialTradeData | string) => void;
  onNavigateUpdatePrice: (ticker?: string) => void;
}

export const DashboardScreen: React.FC<DashboardProps> = ({
  portfolio,
  walletBalances,
  cashTransactions = [],
  onNavigateAddTrade,
  onNavigateUpdatePrice,
}) => {
  const { t } = useLanguage();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const [analyzingItem, setAnalyzingItem] = useState<PortfolioItem | null>(null);

  // Active open holdings (quantity > 0)
  const activeHoldings = useMemo(() => {
    return portfolio.filter((item) => item.totalQuantity > 0);
  }, [portfolio]);

  // Total Deposited for currently selected currency from cash_transactions
  const totalDeposited = useMemo(() => {
    return (cashTransactions || [])
      .filter(
        (tx) =>
          (tx.currency || 'KHR') === selectedCurrency && tx.type === 'DEPOSIT'
      )
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  }, [cashTransactions, selectedCurrency]);

  // Summaries per currency
  const summaries = useMemo(() => {
    const calcTotals = (curr: Currency) => {
      let totalUnrealized = 0;
      let allTimeRealized = 0;
      let totalValue = 0;
      let totalCost = 0;
      let activeCount = 0;

      portfolio.forEach((item) => {
        const itemCurrency: Currency = item.currency === 'USD' ? 'USD' : 'KHR';
        if (itemCurrency !== curr) return;

        // All-Time Realized Profit: Sum of realizedProfit from ALL portfolio items
        // (including closed positions where totalQuantity === 0)
        allTimeRealized += item.realizedProfit || 0;

        // Open positions
        if (item.totalQuantity > 0) {
          const value = item.totalQuantity * (item.manualCurrentPrice || 0);
          const cost = item.totalQuantity * item.averageBuyPrice;
          totalValue += value;
          totalCost += cost;
          totalUnrealized += value - cost;
          activeCount += 1;
        }
      });

      // All-Time Net P&L = All-Time Realized Profit + Total Unrealized Profit
      const allTimeNetPnL = allTimeRealized + totalUnrealized;

      return {
        totalValue,
        totalCost,
        totalUnrealized,
        allTimeRealized,
        allTimeNetPnL,
        activeCount,
      };
    };

    return { KHR: calcTotals('KHR'), USD: calcTotals('USD') };
  }, [portfolio]);

  const currentSummary = summaries[selectedCurrency];
  const availableCash = walletBalances[selectedCurrency] || 0;
  // Total Net Worth = Total Stock Value + Available Cash
  const totalNetWorth = currentSummary.totalValue + availableCash;

  // Financial Goal Settings
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    targetNetWorth: 40000000,
    targetNetWorthKHR: 40000000,
    targetNetWorthUSD: 10000,
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToUserSettings(user.uid, (data) => {
      setSettings(data);
    });
    return () => unsub();
  }, [user]);

  const currentTargetNetWorth = useMemo(() => {
    if (selectedCurrency === 'USD') {
      return (
        settings.targetNetWorthUSD ??
        (settings.targetNetWorth && settings.targetNetWorth < 1000000
          ? settings.targetNetWorth
          : 10000)
      );
    }
    return (
      settings.targetNetWorthKHR ??
      (settings.targetNetWorth && settings.targetNetWorth >= 1000000
        ? settings.targetNetWorth
        : 40000000)
    );
  }, [settings, selectedCurrency]);

  const goalPercentage = useMemo(() => {
    if (currentTargetNetWorth > 0) {
      return (totalNetWorth / currentTargetNetWorth) * 100;
    }
    return 0;
  }, [totalNetWorth, currentTargetNetWorth]);

  const clampedProgress = Math.min(100, Math.max(0, goalPercentage));
  const remainingToGoal = Math.max(0, currentTargetNetWorth - totalNetWorth);

  const handleOpenEditGoal = () => {
    setGoalInput(String(currentTargetNetWorth));
    setIsEditingGoal(true);
  };

  const handleSaveGoal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    const parsed = parseFloat(goalInput);
    if (isNaN(parsed) || parsed <= 0) return;

    setSavingGoal(true);
    try {
      await updateUserSettings(user.uid, {
        [selectedCurrency === 'USD' ? 'targetNetWorthUSD' : 'targetNetWorthKHR']: parsed,
        targetNetWorth: parsed,
      });
      setIsEditingGoal(false);
    } catch (err) {
      console.error('Failed to update target net worth:', err);
    } finally {
      setSavingGoal(false);
    }
  };

  // All-Time ROI %: (All-Time Net P&L / Total Deposited) * 100
  // Gracefully handles division by zero if totalDeposited is 0
  const allTimeRoiPercentage = useMemo(() => {
    if (totalDeposited > 0) {
      return (currentSummary.allTimeNetPnL / totalDeposited) * 100;
    }
    return 0;
  }, [currentSummary.allTimeNetPnL, totalDeposited]);

  // Average Monthly Deposit calculation
  const depositStats = useMemo(() => {
    const deposits = (cashTransactions || []).filter(
      (tx) => (tx.currency || 'KHR') === selectedCurrency && tx.type === 'DEPOSIT'
    );
    if (deposits.length === 0) {
      return { totalDeposits: 0, monthlyDeposit: 0, monthsCount: 1 };
    }

    const timestamps = deposits.map((tx) => {
      const d =
        tx.date && typeof (tx.date as any).toDate === 'function'
          ? (tx.date as any).toDate()
          : new Date((tx.date as any) || Date.now());
      return d.getTime();
    });

    const minTime = Math.min(...timestamps);
    const nowTime = Date.now();
    const firstDate = new Date(minTime);
    const nowDate = new Date(nowTime);

    const monthsSpan = Math.max(
      1,
      (nowDate.getFullYear() - firstDate.getFullYear()) * 12 +
        (nowDate.getMonth() - firstDate.getMonth()) +
        1
    );

    const total = deposits.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const monthlyDeposit = total / monthsSpan;

    return { totalDeposits: total, monthlyDeposit, monthsCount: monthsSpan };
  }, [cashTransactions, selectedCurrency]);

  // Financial Goal TVM Compound Interest Forecasting
  const goalForecast = useMemo(() => {
    if (totalNetWorth >= currentTargetNetWorth) {
      return { status: 'ACHIEVED', totalMonths: 0, years: 0, months: 0 };
    }

    const pmt = depositStats.monthlyDeposit;

    // Use conservative annual rate: blend current portfolio ROI (if reasonable) or 5% conservative default
    let annualRate = 0.05;
    if (allTimeRoiPercentage > 0) {
      annualRate = Math.max(0.02, Math.min(0.20, allTimeRoiPercentage / 100));
    }

    const r = annualRate / 12; // Monthly rate
    const pv = totalNetWorth;
    const fv = currentTargetNetWorth;

    // Edge case: No recurring monthly deposits
    if (pmt <= 0) {
      if (pv <= 0 || r <= 0) {
        return { status: 'IMPOSSIBLE', totalMonths: 0, years: 0, months: 0 };
      }
      // Compounding only: FV = PV * (1 + r)^n => n = ln(FV / PV) / ln(1 + r)
      const n = Math.log(fv / pv) / Math.log(1 + r);
      if (isNaN(n) || !isFinite(n) || n > 600) {
        return { status: 'IMPOSSIBLE', totalMonths: 0, years: 0, months: 0 };
      }
      const rounded = Math.ceil(n);
      return {
        status: 'OK',
        totalMonths: rounded,
        years: Math.floor(rounded / 12),
        months: rounded % 12,
      };
    }

    // Standard TVM NPER formula:
    // n = (ln(FV * r + PMT) - ln(PV * r + PMT)) / ln(1 + r)
    const numerator = fv * r + pmt;
    const denominator = pv * r + pmt;

    if (denominator <= 0 || numerator <= 0) {
      return { status: 'IMPOSSIBLE', totalMonths: 0, years: 0, months: 0 };
    }

    const n = (Math.log(numerator) - Math.log(denominator)) / Math.log(1 + r);

    if (isNaN(n) || !isFinite(n) || n < 0 || n > 600) {
      return { status: 'IMPOSSIBLE', totalMonths: 0, years: 0, months: 0 };
    }

    const roundedMonths = Math.ceil(n);
    const years = Math.floor(roundedMonths / 12);
    const months = roundedMonths % 12;

    return {
      status: 'OK',
      totalMonths: roundedMonths,
      years,
      months,
    };
  }, [totalNetWorth, currentTargetNetWorth, depositStats, allTimeRoiPercentage]);

  // Formatted forecast duration string
  const formattedForecastTime = useMemo(() => {
    if (goalForecast.status !== 'OK') return '';
    const { years, months } = goalForecast;
    if (years > 0 && months > 0) {
      const yearLabel = years === 1 ? t('year') : t('years');
      const monthLabel = months === 1 ? t('month') : t('months');
      return `${years} ${yearLabel} ${t('and')} ${months} ${monthLabel}`;
    }
    if (years > 0) {
      return `${years} ${years === 1 ? t('year') : t('years')}`;
    }
    if (months > 0) {
      return `${months} ${months === 1 ? t('month') : t('months')}`;
    }
    return `< 1 ${t('month')}`;
  }, [goalForecast, t]);

  // Performance Insights: Find Top Gainer and Biggest Loser in selected currency
  const performanceInsights = useMemo(() => {
    const currencyItems = portfolio.filter(
      (item) => (item.currency || 'KHR') === selectedCurrency
    );

    if (currencyItems.length === 0) {
      return { topGainer: null, biggestLoser: null };
    }

    const itemsWithPerformance = currencyItems.map((item) => {
      const realized = item.realizedProfit || 0;
      const unrealized =
        item.totalQuantity > 0
          ? item.totalQuantity * (item.manualCurrentPrice || 0) -
            item.totalQuantity * item.averageBuyPrice
          : 0;
      const combinedPnL = realized + unrealized;
      return {
        ticker: item.ticker,
        realized,
        unrealized,
        combinedPnL,
        totalQuantity: item.totalQuantity,
      };
    });

    // Sort descending by combinedPnL
    itemsWithPerformance.sort((a, b) => b.combinedPnL - a.combinedPnL);

    const highest = itemsWithPerformance[0];
    const lowest = itemsWithPerformance[itemsWithPerformance.length - 1];

    if (itemsWithPerformance.length === 1) {
      if (highest.combinedPnL >= 0) {
        return { topGainer: highest, biggestLoser: null };
      } else {
        return { topGainer: null, biggestLoser: highest };
      }
    }

    return {
      topGainer: highest,
      biggestLoser: lowest,
    };
  }, [portfolio, selectedCurrency]);

  return (
    <div className="space-y-6 pb-24">
      {/* Header & Currency Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {t('dashboard_title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('dashboard_subtitle')}
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

      {/* Top Hero Banner - All-Time Performance & Net Worth */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 rounded-3xl p-5 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header: Net Worth label and active asset count */}
        <div className="flex justify-between items-center opacity-85 text-xs font-semibold uppercase tracking-wider">
          <span>{t('total_net_worth')} ({selectedCurrency})</span>
          <span className="bg-white/15 px-2.5 py-0.5 rounded-full text-[11px] font-bold backdrop-blur-sm">
            {currentSummary.activeCount}{' '}
            {currentSummary.activeCount === 1 ? t('asset') : t('assets')}
          </span>
        </div>

        {/* Prominently displayed Total Net Worth */}
        <div className="text-3xl sm:text-4xl font-black tracking-tight mt-1.5">
          {formatCurrency(totalNetWorth, selectedCurrency)}
        </div>

        {/* All-Time Performance Section */}
        <div className="mt-3.5 pt-3.5 border-t border-white/15">
          <div className="text-[11px] font-medium opacity-80 mb-1">
            {t('all_time_net_pnl')}
          </div>
          <div className="flex items-center flex-wrap gap-2.5">
            <span
              className={`text-2xl font-black tracking-tight ${
                currentSummary.allTimeNetPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {formatCurrency(currentSummary.allTimeNetPnL, selectedCurrency, { includeSign: true })}
            </span>

            {/* All-Time ROI % Badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black shadow-sm backdrop-blur-sm ${
                allTimeRoiPercentage >= 0
                  ? 'bg-emerald-400/25 text-emerald-200 border border-emerald-400/35'
                  : 'bg-rose-400/25 text-rose-200 border border-rose-400/35'
              }`}
            >
              {allTimeRoiPercentage >= 0 ? '+' : ''}
              {allTimeRoiPercentage.toFixed(2)}% {t('roi')}
            </span>
          </div>
        </div>

        {/* Breakdown Row: Available Cash, Stock Value, Total Deposited */}
        <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="opacity-75 block text-[11px] truncate">{t('available_cash')}</span>
            <span className="font-bold text-sm text-emerald-300 truncate block">
              {formatCurrency(availableCash, selectedCurrency)}
            </span>
          </div>
          <div>
            <span className="opacity-75 block text-[11px] truncate">{t('total_portfolio_value')}</span>
            <span className="font-bold text-sm text-white truncate block">
              {formatCurrency(currentSummary.totalValue, selectedCurrency)}
            </span>
          </div>
          <div>
            <span className="opacity-75 block text-[11px] truncate">{t('total_deposited')}</span>
            <span className="font-bold text-sm text-indigo-200 truncate block">
              {formatCurrency(totalDeposited, selectedCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Goal Tracker Card */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Target size={16} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {t('financial_goal')}
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">
                {formatCurrency(currentTargetNetWorth, selectedCurrency)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                goalPercentage >= 100
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
              }`}
            >
              {goalPercentage.toFixed(1)}% {t('achieved')}
            </span>

            <button
              type="button"
              onClick={handleOpenEditGoal}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={t('edit_goal')}
            >
              <Pencil size={14} />
            </button>
          </div>
        </div>

        {/* Inline Edit Form or Progress Bar */}
        {isEditingGoal ? (
          <form onSubmit={handleSaveGoal} className="pt-1 flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                step="any"
                required
                autoFocus
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder={t('target_net_worth')}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={savingGoal}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 active:scale-95 transition disabled:opacity-50"
            >
              {savingGoal ? '...' : t('save')}
            </button>
            <button
              type="button"
              onClick={() => setIsEditingGoal(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={15} />
            </button>
          </form>
        ) : (
          <>
            {/* Progress Bar Container */}
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  goalPercentage >= 100
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                    : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'
                }`}
                style={{ width: `${clampedProgress}%` }}
              />
            </div>

            {/* Bottom Status Row */}
            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-0.5">
              <span>{formatCurrency(totalNetWorth, selectedCurrency)}</span>
              <span>
                {goalPercentage >= 100
                  ? '🎉 ' + t('achieved') + '!'
                  : `${formatCurrency(remainingToGoal, selectedCurrency)} ${t('remaining_to_goal')}`}
              </span>
            </div>

            {/* Dynamic Forecast Layer */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-start justify-between text-xs">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock size={12} />
                </div>
                <div>
                  {goalForecast.status === 'ACHIEVED' ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      🎉 {t('achieved')}!
                    </span>
                  ) : goalForecast.status === 'IMPOSSIBLE' ? (
                    <span className="font-medium text-slate-500 dark:text-slate-400 text-xs">
                      {t('increase_deposits_to_forecast')}
                    </span>
                  ) : (
                    <div>
                      <div className="text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {t('estimated_time_to_goal')}{' '}
                        </span>
                        <span className="font-black text-blue-600 dark:text-blue-400">
                          {formattedForecastTime}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        ({t('based_on_savings_and_roi')})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div
                className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5 shrink-0"
                title={t('forecast_info_tooltip')}
              >
                <HelpCircle size={14} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Stat Cards - Unrealized & Realized P&L */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title={t('unrealized_pnl')}
          amount={currentSummary.totalUnrealized}
          isProfit={true}
          currency={selectedCurrency}
          subtitle={t('open_positions_currency')}
        />
        <StatCard
          title={t('realized_pnl')}
          amount={currentSummary.allTimeRealized}
          isProfit={true}
          currency={selectedCurrency}
          subtitle={t('locked_in_gains')}
        />
      </div>

      {/* Performance Insights Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles size={16} className="text-amber-500" />
            <span>{t('performance_insights')}</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Top Gainer Card */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-3.5 border border-slate-200/80 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {t('top_gainer')}
              </span>
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowUp size={13} className="stroke-[2.5]" />
              </div>
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white truncate">
              {performanceInsights.topGainer ? performanceInsights.topGainer.ticker : '—'}
            </div>
            <div
              className={`text-xs font-bold mt-0.5 truncate ${
                performanceInsights.topGainer && performanceInsights.topGainer.combinedPnL >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {performanceInsights.topGainer
                ? formatCurrency(performanceInsights.topGainer.combinedPnL, selectedCurrency, {
                    includeSign: true,
                  })
                : formatCurrency(0, selectedCurrency)}
            </div>
          </div>

          {/* Biggest Loser Card */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-3.5 border border-slate-200/80 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {t('biggest_loser')}
              </span>
              <div className="w-6 h-6 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ArrowDown size={13} className="stroke-[2.5]" />
              </div>
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white truncate">
              {performanceInsights.biggestLoser ? performanceInsights.biggestLoser.ticker : '—'}
            </div>
            <div
              className={`text-xs font-bold mt-0.5 truncate ${
                performanceInsights.biggestLoser && performanceInsights.biggestLoser.combinedPnL < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {performanceInsights.biggestLoser
                ? formatCurrency(performanceInsights.biggestLoser.combinedPnL, selectedCurrency, {
                    includeSign: true,
                  })
                : formatCurrency(0, selectedCurrency)}
            </div>
          </div>
        </div>
      </div>

      {/* Asset Allocation Section */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-5 border border-slate-200/80 dark:border-white/5 shadow-sm space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <PieChartIcon size={18} className="text-blue-500" />
            <span>{t('asset_allocation')}</span>
          </h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {formatCurrency(totalNetWorth, selectedCurrency)}
          </span>
        </div>

        <AssetAllocationChart
          portfolio={portfolio}
          availableCash={availableCash}
          currency={selectedCurrency}
        />
      </div>

      {/* Active Holdings */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-1.5">
            <Layers size={18} className="text-blue-500" />
            <span>{t('active_holdings')}</span>
            <span className="text-xs text-slate-400 font-normal">
              ({activeHoldings.length})
            </span>
          </h2>
          {activeHoldings.length > 0 && (
            <button
              onClick={() => onNavigateUpdatePrice()}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400"
            >
              {t('update_all_prices')}
            </button>
          )}
        </div>

        {activeHoldings.length === 0 ? (
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-8 text-center border border-slate-200/80 dark:border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center mx-auto mb-3">
              <PieChartIcon size={24} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white">{t('no_open_holdings')}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {t('no_holdings_desc')}
            </p>
            <button
              type="button"
              onClick={() => onNavigateAddTrade()}
              className="mt-4 px-4 py-2.5 bg-blue-600 text-white rounded-2xl font-semibold text-sm inline-flex items-center space-x-1.5 shadow-md shadow-blue-500/25 active:scale-95 transition"
            >
              <Plus size={16} />
              <span>{t('add_first_trade')}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeHoldings.map((item) => (
              <HoldingCard
                key={item.ticker}
                item={item}
                onQuickUpdate={() => onNavigateUpdatePrice(item.ticker)}
                onAnalyze={(analyzed) => setAnalyzingItem(analyzed)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Smart Analysis Modal */}
      <SmartAnalysisModal
        item={analyzingItem}
        isOpen={!!analyzingItem}
        onClose={() => setAnalyzingItem(null)}
        onNavigateTrade={(tradeData) => {
          setAnalyzingItem(null);
          onNavigateAddTrade(tradeData);
        }}
      />
    </div>
  );
};
