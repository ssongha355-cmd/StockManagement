import React, { useState, useMemo, useEffect } from 'react';
import { PortfolioItem, InitialTradeData } from '../types';
import { formatCurrency } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';
import {
  X,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Calculator,
  ArrowRight,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

export interface SmartAnalysisModalProps {
  item: PortfolioItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateTrade?: (tradeData: InitialTradeData) => void;
}

export const SmartAnalysisModal: React.FC<SmartAnalysisModalProps> = ({
  item,
  isOpen,
  onClose,
  onNavigateTrade,
}) => {
  const { t } = useLanguage();

  // Basic Metrics
  const currentShares = item?.totalQuantity || 0;
  const avgPrice = item?.averageBuyPrice || 0;
  const marketPrice = item?.manualCurrentPrice || 0;
  const currency = item?.currency || 'KHR';

  const costBasis = currentShares * avgPrice;
  const currentValue = currentShares * marketPrice;
  const unrealizedPnL = currentValue - costBasis;
  const unrealizedPct = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0;
  const isLoss = unrealizedPnL < 0;

  // Active tab: 'DCA' or 'TAKE_PROFIT'
  const [activeTab, setActiveTab] = useState<'DCA' | 'TAKE_PROFIT'>('DCA');

  // DCA State: Simulated shares to buy
  const [simulatedSharesInput, setSimulatedSharesInput] = useState<string>('50');

  // Take Profit State: Selected scenario percent or custom
  const [takeProfitPct, setTakeProfitPct] = useState<number>(50);

  // Synchronize initial tab and simulated shares when modal opens for a holding
  useEffect(() => {
    if (item) {
      if (isLoss) {
        setActiveTab('DCA');
      } else {
        setActiveTab('TAKE_PROFIT');
      }
      // Reasonable initial simulated shares for DCA
      const defaultSim = Math.max(10, Math.round(currentShares * 0.25));
      setSimulatedSharesInput(String(defaultSim));
      setTakeProfitPct(50);
    }
  }, [item?.ticker, isLoss, currentShares]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // DCA Calculations
  const simSharesNum = Math.max(0, parseFloat(simulatedSharesInput) || 0);
  const dcaCalculations = useMemo(() => {
    const newTotalShares = currentShares + simSharesNum;
    const additionalCost = simSharesNum * marketPrice;
    const newTotalCost = costBasis + additionalCost;
    const newAveragePrice = newTotalShares > 0 ? newTotalCost / newTotalShares : avgPrice;
    const priceReduction = avgPrice - newAveragePrice;
    const reductionPct = avgPrice > 0 ? (priceReduction / avgPrice) * 100 : 0;

    return {
      simSharesNum,
      newTotalShares,
      additionalCost,
      newAveragePrice,
      priceReduction,
      reductionPct,
      breakEvenPoint: newAveragePrice,
    };
  }, [currentShares, simSharesNum, marketPrice, costBasis, avgPrice]);

  // Take Profit Scenarios
  const scenarioOptions = [25, 50, 75, 100];
  const scenariosData = useMemo(() => {
    return scenarioOptions.map((pct) => {
      const sharesToSell =
        pct === 100 ? currentShares : Math.max(1, Math.floor(currentShares * (pct / 100)));
      const remainingShares = Math.max(0, currentShares - sharesToSell);
      const lockedInProfit = sharesToSell * (marketPrice - avgPrice);
      const cashProceeds = sharesToSell * marketPrice;
      const remainingValue = remainingShares * marketPrice;

      return {
        pct,
        sharesToSell,
        remainingShares,
        lockedInProfit,
        cashProceeds,
        remainingValue,
      };
    });
  }, [currentShares, marketPrice, avgPrice]);

  // Custom Take Profit dynamic values
  const activeCustomScenario = useMemo(() => {
    const sharesToSell =
      takeProfitPct === 100
        ? currentShares
        : Math.max(1, Math.round(currentShares * (takeProfitPct / 100)));
    const remainingShares = Math.max(0, currentShares - sharesToSell);
    const lockedInProfit = sharesToSell * (marketPrice - avgPrice);
    const cashProceeds = sharesToSell * marketPrice;
    const remainingValue = remainingShares * marketPrice;

    return {
      pct: takeProfitPct,
      sharesToSell,
      remainingShares,
      lockedInProfit,
      cashProceeds,
      remainingValue,
    };
  }, [takeProfitPct, currentShares, marketPrice, avgPrice]);

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-white/10 max-h-[92vh] overflow-y-auto space-y-5">
        {/* Modal Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Sparkles size={18} className="text-amber-500 fill-amber-500/20" />
              </span>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                {t('smart_analysis')}
              </h2>
              <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {item.ticker}
              </span>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                  isLoss
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {unrealizedPct >= 0 ? '+' : ''}
                {unrealizedPct.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isLoss ? t('in_loss_dca_hint') : t('in_profit_tp_hint')}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Holding Stats Strip */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e]/60 border border-slate-200/70 dark:border-white/5 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block truncate">
              {t('current_avg_price')}
            </span>
            <span className="font-bold text-slate-900 dark:text-white block mt-0.5 truncate">
              {formatCurrency(avgPrice, currency)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium block truncate">
              {t('current_market_price')}
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400 block mt-0.5 truncate">
              {formatCurrency(marketPrice, currency)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium block truncate">
              {t('shares_owned')}
            </span>
            <span className="font-bold text-slate-900 dark:text-white block mt-0.5 truncate">
              {currentShares.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Tab Toggle: DCA Calculator vs Take Profit */}
        <div className="flex bg-slate-100 dark:bg-[#2c2c2e] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('DCA')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'DCA'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingDown size={14} />
            <span>{t('dollar_cost_averaging')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TAKE_PROFIT')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'TAKE_PROFIT'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp size={14} />
            <span>{t('take_profit_scenarios')}</span>
          </button>
        </div>

        {/* Tab 1: Dollar Cost Averaging (DCA) */}
        {activeTab === 'DCA' && (
          <div className="space-y-4">
            {/* Input & Slider for Simulated Shares */}
            <div className="bg-slate-50 dark:bg-[#252528] p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calculator size={14} className="text-blue-500" />
                  <span>{t('simulated_shares')}</span>
                </label>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                  +{simSharesNum.toLocaleString()} {t('shares')}
                </span>
              </div>

              {/* Number Input */}
              <input
                type="number"
                min="1"
                step="1"
                value={simulatedSharesInput}
                onChange={(e) => setSimulatedSharesInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />

              {/* Slider for smooth dragging */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="0"
                  max={Math.max(200, currentShares * 2)}
                  step="5"
                  value={simSharesNum}
                  onChange={(e) => setSimulatedSharesInput(e.target.value)}
                  className="w-full accent-blue-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                  <span>0</span>
                  <span>{Math.round(currentShares * 0.5)}</span>
                  <span>{currentShares}</span>
                  <span>{Math.max(200, currentShares * 2)}</span>
                </div>
              </div>

              {/* Quick increment chip buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[10, 50, 100, 200, 500].map((addAmount) => (
                  <button
                    key={addAmount}
                    type="button"
                    onClick={() =>
                      setSimulatedSharesInput(String((parseFloat(simulatedSharesInput) || 0) + addAmount))
                    }
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-[#1c1c1e] hover:bg-slate-100 dark:hover:bg-[#2c2c2e] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition active:scale-95"
                  >
                    +{addAmount}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSimulatedSharesInput(String(currentShares))}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 transition active:scale-95"
                  title="Double your current position"
                >
                  2x {t('shares_owned')}
                </button>
              </div>
            </div>

            {/* DCA Results Banner */}
            <div className="bg-gradient-to-br from-indigo-900/30 to-blue-900/20 dark:from-indigo-950/50 dark:to-blue-950/40 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {t('new_average_price')}
                </span>
                {dcaCalculations.priceReduction > 0 && (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <TrendingDown size={11} />
                    <span>-{dcaCalculations.reductionPct.toFixed(2)}%</span>
                  </span>
                )}
              </div>

              {/* Large Highlighted New Average Price */}
              <div className="flex items-baseline space-x-2">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(dcaCalculations.newAveragePrice, currency)}
                </div>
                <div className="text-xs text-slate-400 font-medium line-through">
                  {formatCurrency(avgPrice, currency)}
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/40 dark:border-white/10 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">{t('capital_required')}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">
                    {formatCurrency(dcaCalculations.additionalCost, currency)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">{t('break_even_point')}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm block mt-0.5">
                    {formatCurrency(dcaCalculations.breakEvenPoint, currency)}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span>
                  {t('new_average_price')}: {formatCurrency(dcaCalculations.newAveragePrice, currency)} (
                  {dcaCalculations.newTotalShares.toLocaleString()} {t('shares')})
                </span>
              </div>
            </div>

            {/* Quick Action to Trade */}
            {onNavigateTrade && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTrade({
                    action: 'BUY',
                    type: 'BUY',
                    ticker: item.ticker,
                    quantity: dcaCalculations.simSharesNum,
                    price: marketPrice,
                    currency: currency,
                  });
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition"
              >
                <span>{t('execute_trade')} (BUY {item.ticker})</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {/* Tab 2: Take Profit Analyzer */}
        {activeTab === 'TAKE_PROFIT' && (
          <div className="space-y-4">
            {/* Scenarios Grid (25%, 50%, 75%, 100%) */}
            <div>
              <div className="flex justify-between items-center mb-2 px-0.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('take_profit_scenarios')}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {t('shares_owned')}: {currentShares.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {scenariosData.map((scenario) => {
                  const isSelected = takeProfitPct === scenario.pct;
                  const isGain = scenario.lockedInProfit >= 0;

                  return (
                    <button
                      key={scenario.pct}
                      type="button"
                      onClick={() => setTakeProfitPct(scenario.pct)}
                      className={`text-left p-3.5 rounded-2xl border transition relative ${
                        isSelected
                          ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/50 shadow-md ring-1 ring-emerald-500'
                          : 'bg-slate-50 dark:bg-[#252528] border-slate-200/80 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15'
                      }`}
                    >
                      {scenario.pct === 50 && (
                        <span className="absolute top-2 right-2 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-500 text-white">
                          Balanced
                        </span>
                      )}

                      <div className="flex items-center space-x-1.5 mb-1.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {scenario.pct === 25
                            ? t('sell_25')
                            : scenario.pct === 50
                            ? t('sell_50')
                            : scenario.pct === 75
                            ? t('sell_75')
                            : t('sell_100')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({scenario.sharesToSell.toLocaleString()} {t('shares')})
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">{t('locked_in_profit')}:</span>
                          <span
                            className={`font-black ${
                              isGain
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {formatCurrency(scenario.lockedInProfit, currency, {
                              includeSign: true,
                            })}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">{t('remaining_shares')}:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {scenario.remainingShares.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Interactive Slider Details */}
            <div className="bg-slate-50 dark:bg-[#252528] p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sliders size={14} className="text-emerald-500" />
                  <span>{t('action')}: {takeProfitPct}%</span>
                </span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  {activeCustomScenario.sharesToSell.toLocaleString()} {t('shares')}
                </span>
              </div>

              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={takeProfitPct}
                onChange={(e) => setTakeProfitPct(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">{t('cash_proceeds')}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">
                    {formatCurrency(activeCustomScenario.cashProceeds, currency)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block">{t('locked_in_profit')}</span>
                  <span
                    className={`font-black text-sm block mt-0.5 ${
                      activeCustomScenario.lockedInProfit >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatCurrency(activeCustomScenario.lockedInProfit, currency, {
                      includeSign: true,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action to Trade */}
            {onNavigateTrade && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTrade({
                    action: 'SELL',
                    type: 'SELL',
                    ticker: item.ticker,
                    quantity: activeCustomScenario.sharesToSell,
                    price: marketPrice,
                    currency: currency,
                  });
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition"
              >
                <span>{t('execute_trade')} (SELL {item.ticker})</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
