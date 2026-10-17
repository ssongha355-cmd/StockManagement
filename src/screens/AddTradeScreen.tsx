import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { recordTrade } from '../services/portfolioService';
import { TradeType, Currency, PortfolioItem, InitialTradeData } from '../types';
import { formatCurrency } from '../utils/format';
import { CheckCircle2, AlertCircle } from 'lucide-react';

type FeeType = 'AMOUNT' | 'PERCENTAGE';

interface AddTradeProps {
  onTradeSuccess: () => void;
  portfolio: PortfolioItem[];
  initialTicker?: string;
  initialTradeData?: InitialTradeData;
}

export const AddTradeScreen: React.FC<AddTradeProps> = ({
  onTradeSuccess,
  portfolio,
  initialTicker,
  initialTradeData,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { selectedCurrency } = useCurrency();

  const initialAction = initialTradeData?.action || initialTradeData?.type || 'BUY';
  const [type, setType] = useState<TradeType>(
    initialAction === 'DIVIDEND' ? 'DIVIDEND' : initialAction === 'SELL' ? 'SELL' : 'BUY'
  );
  const [currency, setCurrency] = useState<Currency>(
    initialTradeData?.currency || selectedCurrency || 'KHR'
  );
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [ticker, setTicker] = useState(initialTradeData?.ticker || initialTicker || '');
  const [quantity, setQuantity] = useState(
    initialTradeData?.quantity != null && initialTradeData.quantity > 0
      ? String(initialTradeData.quantity)
      : ''
  );
  const [price, setPrice] = useState(
    initialTradeData?.price != null && initialTradeData.price > 0
      ? String(initialTradeData.price)
      : ''
  );
  const [dividendAmount, setDividendAmount] = useState('');
  const [fee, setFee] = useState('0');
  const [feeType, setFeeType] = useState<FeeType>('AMOUNT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Synchronize state when initialTradeData or initialTicker prop updates
  useEffect(() => {
    if (initialTradeData) {
      const act = initialTradeData.action || initialTradeData.type;
      if (act) {
        setType(act === 'DIVIDEND' ? 'DIVIDEND' : act === 'SELL' ? 'SELL' : 'BUY');
      }
      if (initialTradeData.ticker) {
        setTicker(initialTradeData.ticker);
      }
      if (initialTradeData.currency) {
        setCurrency(initialTradeData.currency);
      }
      if (initialTradeData.quantity != null && initialTradeData.quantity > 0) {
        setQuantity(String(initialTradeData.quantity));
      }
      if (initialTradeData.price != null && initialTradeData.price > 0) {
        setPrice(String(initialTradeData.price));
      }
    } else if (initialTicker) {
      setTicker(initialTicker);
    }
  }, [initialTradeData, initialTicker]);

  // Extract unique ticker symbols from the portfolio, sorted alphabetically
  const existingHoldings = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return [];
    const tickerMap = new Map<string, PortfolioItem>();
    portfolio.forEach((item) => {
      const clean = item.ticker?.trim().toUpperCase();
      if (clean && !tickerMap.has(clean)) {
        tickerMap.set(clean, item);
      }
    });
    return Array.from(tickerMap.values()).sort((a, b) =>
      a.ticker.localeCompare(b.ticker)
    );
  }, [portfolio]);

  const handleSelectChip = (item: PortfolioItem) => {
    const cleanTicker = item.ticker.trim().toUpperCase();
    setTicker(cleanTicker);
    if (item.currency) {
      setCurrency(item.currency);
    }
  };

  const handleTickerChange = (val: string) => {
    const clean = val.toUpperCase();
    setTicker(clean);
    if (portfolio) {
      const existing = portfolio.find(
        (p) => p.ticker.toUpperCase() === clean.trim()
      );
      if (existing?.currency) {
        setCurrency(existing.currency);
      } else {
        setCurrency(selectedCurrency || 'KHR');
      }
    }
  };

  const numQty = parseFloat(quantity) || 0;
  const numPrice = parseFloat(price) || 0;
  const numFeeInput = parseFloat(fee) || 0;
  const numDividend = parseFloat(dividendAmount) || 0;
  const subtotal = numQty * numPrice;

  // Calculated fee: flat amount or % of subtotal
  const calculatedFee =
    feeType === 'PERCENTAGE' ? subtotal * (numFeeInput / 100) : numFeeInput;

  const totalTradeAmount =
    type === 'BUY' ? subtotal + calculatedFee : subtotal - calculatedFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSuccess(false);

    if (!ticker.trim()) {
      setError(t('error_ticker_required'));
      return;
    }

    if (type === 'DIVIDEND') {
      if (numDividend <= 0) {
        setError(t('error_dividend_zero'));
        return;
      }
    } else {
      if (numQty <= 0) {
        setError(t('error_quantity_zero'));
        return;
      }
      if (numPrice <= 0) {
        setError(t('error_price_zero'));
        return;
      }
    }

    let parsedDate: Date | undefined;
    if (tradeDate) {
      const [y, m, d] = tradeDate.split('-').map(Number);
      parsedDate = new Date(y, m - 1, d, 12, 0, 0);
    }

    setLoading(true);
    try {
      if (type === 'DIVIDEND') {
        await recordTrade(user.uid, {
          ticker: ticker.trim().toUpperCase(),
          type: 'DIVIDEND',
          quantity: 0,
          price: numDividend,
          amount: numDividend,
          fee: 0,
          currency,
          date: parsedDate,
        });
      } else {
        await recordTrade(user.uid, {
          ticker: ticker.trim().toUpperCase(),
          type,
          quantity: numQty,
          price: numPrice,
          fee: calculatedFee, // always flat amount passed to backend
          currency,
          date: parsedDate,
        });
      }

      setSuccess(true);
      setTicker('');
      setQuantity('');
      setPrice('');
      setDividendAmount('');
      setFee('0');
      setFeeType('AMOUNT');
      setCurrency(selectedCurrency || 'KHR');
      setTradeDate(new Date().toISOString().split('T')[0]);
      setTimeout(() => {
        onTradeSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err.message || t('error_trade_failed'));
    } finally {
      setLoading(false);
    }
  };

  const currencySymbol = currency === 'KHR' ? '៛' : '$';

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {t('record_trade')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('record_trade_subtitle')}
        </p>
      </div>

      <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-white/5">
        {/* BUY / SELL / DIVIDEND Toggle */}
        <div className="flex bg-slate-100 dark:bg-[#2c2c2e] p-1.5 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => setType('BUY')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
              type === 'BUY'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            BUY
          </button>
          <button
            type="button"
            onClick={() => setType('SELL')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
              type === 'SELL'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            SELL
          </button>
          <button
            type="button"
            onClick={() => setType('DIVIDEND')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${
              type === 'DIVIDEND'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {t('dividend')}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center space-x-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center space-x-2">
            <CheckCircle2 size={16} />
            <span>{t('trade_success')}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trade Date Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {t('trade_date')}
            </label>
            <input
              type="date"
              required
              value={tradeDate}
              onChange={(e) => setTradeDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Ticker Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {t('ticker_symbol')}
            </label>
            <input
              type="text"
              required
              placeholder={t('ticker_placeholder')}
              value={ticker}
              onChange={(e) => handleTickerChange(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-bold tracking-wider uppercase text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck="false"
            />

            {/* Quick Select Chips */}
            {existingHoldings.length > 0 && (
              <div className="mt-2.5">
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {t('quick_select')}
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5">
                  {existingHoldings.map((item) => {
                    const isSelected =
                      ticker.trim().toUpperCase() === item.ticker.toUpperCase();
                    return (
                      <button
                        key={item.ticker}
                        type="button"
                        onClick={() => handleSelectChip(item)}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 active:scale-95 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                            : 'bg-slate-100 dark:bg-[#2c2c2e] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#3a3a3c]'
                        }`}
                      >
                        <span>{item.ticker}</span>
                        <span
                          className={`text-[9px] px-1 py-0.5 rounded font-extrabold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200/80 dark:bg-[#3a3a3c] text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.currency || 'KHR'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Currency Segmented Control */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {t('currency')}
            </label>
            <div className="flex bg-slate-100 dark:bg-[#2c2c2e] p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setCurrency('KHR')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  currency === 'KHR'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                KHR (៛)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  currency === 'USD'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                USD ($)
              </button>
            </div>
          </div>

          {/* Conditional Input Fields: If DIVIDEND, show only Dividend Amount */}
          {type === 'DIVIDEND' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {t('dividend_amount')} ({currencySymbol})
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder={currency === 'KHR' ? '0' : '0.00'}
                value={dividendAmount}
                onChange={(e) => setDividendAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          ) : (
            <>
              {/* Quantity & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {t('quantity')}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="0.00"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {t('price_per_share')} ({currencySymbol})
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder={currency === 'KHR' ? '0' : '0.00'}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Commission Fee with Amount / % toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {t('commission_fee')}
                  </label>
                  {/* Fee type inline toggle */}
                  <div className="flex bg-slate-100 dark:bg-[#2c2c2e] p-0.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFeeType('AMOUNT')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                        feeType === 'AMOUNT'
                          ? 'bg-white dark:bg-[#3a3a3c] text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {t('fee_type_amount')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeeType('PERCENTAGE')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                        feeType === 'PERCENTAGE'
                          ? 'bg-white dark:bg-[#3a3a3c] text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {t('fee_type_percent')}
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-slate-400 font-bold text-sm">
                    {feeType === 'PERCENTAGE' ? '%' : currencySymbol}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder={feeType === 'PERCENTAGE' ? '0.00' : currency === 'KHR' ? '0' : '0.00'}
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {/* Show calculated fee when using % */}
                {feeType === 'PERCENTAGE' && numFeeInput > 0 && subtotal > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1 text-right">
                    {t('calculated_fee')}: {formatCurrency(calculatedFee, currency)}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Trade Preview Summary */}
          {type === 'DIVIDEND' ? (
            <div className="bg-amber-500/10 dark:bg-amber-500/15 p-3.5 rounded-2xl text-xs space-y-1.5 border border-amber-500/20 text-amber-800 dark:text-amber-200">
              <div className="flex justify-between font-bold">
                <span>{t('dividend_amount')}:</span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  +{formatCurrency(numDividend, currency)}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-[#2c2c2e] p-3.5 rounded-2xl text-xs space-y-1.5 border border-slate-200/60 dark:border-white/5">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>{t('subtotal')}:</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>
                  {t('fees')}
                  {feeType === 'PERCENTAGE' && numFeeInput > 0
                    ? ` (${numFeeInput}%)`
                    : ''}
                  :
                </span>
                <span>{formatCurrency(calculatedFee, currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/5">
                <span>{type === 'BUY' ? t('total_cost_basis') : t('net_proceeds')}:</span>
                <span className={type === 'BUY' ? 'text-blue-500' : 'text-emerald-500'}>
                  {formatCurrency(Math.max(0, totalTradeAmount), currency)}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-white font-bold tracking-tight text-base shadow-lg transition active:scale-98 disabled:opacity-50 ${
              type === 'BUY'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                : type === 'SELL'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25'
            }`}
          >
            {loading
              ? t('processing')
              : type === 'BUY'
              ? t('submit_buy_order')
              : type === 'SELL'
              ? t('submit_sell_order')
              : t('record_dividend')}
          </button>
        </form>
      </div>
    </div>
  );
};
