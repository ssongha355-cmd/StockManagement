import React, { useState } from 'react';
import { Transaction, TradeType, Currency } from '../types';
import { formatCurrency } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { deleteTransaction, editTransaction } from '../services/portfolioService';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CircleDollarSign,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Loader2,
  Download,
} from 'lucide-react';
import { downloadCSV } from '../utils/export';

interface HistoryProps {
  transactions: Transaction[];
}

export const HistoryScreen: React.FC<HistoryProps> = ({ transactions }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { selectedCurrency } = useCurrency();

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit Modal State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editType, setEditType] = useState<TradeType>('BUY');
  const [editCurrency, setEditCurrency] = useState<Currency>(selectedCurrency || 'KHR');
  const [editDate, setEditDate] = useState<string>('');
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editDividendAmount, setEditDividendAmount] = useState<string>('');
  const [editFee, setEditFee] = useState<string>('0');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const formatDateForInput = (dateVal: any): string => {
    try {
      const d =
        dateVal && typeof dateVal.toDate === 'function'
          ? dateVal.toDate()
          : dateVal instanceof Date
          ? dateVal
          : new Date(dateVal || Date.now());
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditType(tx.type);
    setEditCurrency(tx.currency || selectedCurrency || 'KHR');
    setEditDate(formatDateForInput(tx.date));
    setEditQuantity(tx.quantity.toString());
    setEditPrice(tx.price.toString());
    setEditDividendAmount((tx.amount ?? tx.price ?? 0).toString());
    setEditFee((tx.fee || 0).toString());
    setEditError(null);
  };

  const handleCloseEdit = () => {
    if (editSaving) return;
    setEditingTx(null);
    setEditError(null);
  };

  const handleDelete = async (tx: Transaction) => {
    if (!user || !tx.id) return;
    if (!window.confirm(t('confirmDelete'))) {
      return;
    }

    setDeletingId(tx.id);
    try {
      await deleteTransaction(user.uid, tx.id, tx.ticker);
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingTx?.id) return;

    if (editType === 'DIVIDEND') {
      const numDiv = parseFloat(editDividendAmount);
      if (isNaN(numDiv) || numDiv <= 0) {
        setEditError(t('error_dividend_zero'));
        return;
      }

      setEditSaving(true);
      setEditError(null);

      try {
        let parsedDate: Date | undefined;
        if (editDate) {
          const [year, month, day] = editDate.split('-').map(Number);
          parsedDate = new Date(year, month - 1, day, 12, 0, 0);
        }

        await editTransaction(user.uid, editingTx.id, editingTx.ticker, {
          type: 'DIVIDEND',
          quantity: 0,
          price: numDiv,
          amount: numDiv,
          fee: 0,
          currency: editCurrency,
          date: parsedDate,
        });

        setEditingTx(null);
      } catch (err: any) {
        setEditError(err.message || 'Failed to update transaction.');
      } finally {
        setEditSaving(false);
      }
      return;
    }

    const numQty = parseFloat(editQuantity);
    const numPrice = parseFloat(editPrice);
    const numFee = parseFloat(editFee) || 0;

    if (isNaN(numQty) || numQty <= 0) {
      setEditError(t('error_quantity_zero'));
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setEditError(t('error_price_zero'));
      return;
    }
    if (numFee < 0) {
      setEditError('Fee cannot be negative');
      return;
    }

    setEditSaving(true);
    setEditError(null);

    try {
      let parsedDate: Date | undefined;
      if (editDate) {
        const [year, month, day] = editDate.split('-').map(Number);
        parsedDate = new Date(year, month - 1, day, 12, 0, 0);
      }

      await editTransaction(user.uid, editingTx.id, editingTx.ticker, {
        type: editType,
        quantity: numQty,
        price: numPrice,
        fee: numFee,
        currency: editCurrency,
        date: parsedDate,
      });

      setEditingTx(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update transaction.');
    } finally {
      setEditSaving(false);
    }
  };

  // Live calculation for Edit Modal
  const editNumQty = parseFloat(editQuantity) || 0;
  const editNumPrice = parseFloat(editPrice) || 0;
  const editNumFee = parseFloat(editFee) || 0;
  const editNumDiv = parseFloat(editDividendAmount) || 0;
  const editSubtotal = editNumQty * editNumPrice;
  const editTotalAmount =
    editType === 'BUY' ? editSubtotal + editNumFee : editSubtotal - editNumFee;
  const editCurrencySymbol = editCurrency === 'KHR' ? '៛' : '$';

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) return;

    const formattedData = transactions.map((tx) => {
      const isDiv = tx.type === 'DIVIDEND';
      const isBuy = tx.type === 'BUY';
      const dateObj =
        tx.date && typeof (tx.date as any).toDate === 'function'
          ? (tx.date as any).toDate()
          : new Date(tx.date as any);

      const formattedDate = !isNaN(dateObj.getTime())
        ? dateObj.toISOString().split('T')[0]
        : '';

      const actionLabel =
        tx.type === 'DIVIDEND'
          ? t('dividend')
          : tx.type === 'BUY'
          ? 'BUY'
          : 'SELL';

      const totalAmount = isDiv
        ? (tx.amount ?? tx.price ?? 0)
        : isBuy
        ? (tx.quantity * tx.price) + (tx.fee || 0)
        : (tx.quantity * tx.price) - (tx.fee || 0);

      return {
        Date: formattedDate,
        Ticker: tx.ticker,
        Action: actionLabel,
        Quantity: isDiv ? 0 : tx.quantity,
        Price: isDiv ? (tx.amount ?? tx.price ?? 0) : tx.price,
        Fee: tx.fee || 0,
        Total: Number(totalAmount.toFixed(4)),
        Currency: tx.currency || 'KHR',
      };
    });

    downloadCSV('trades_history.csv', formattedData);
  };

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {t('ledger_title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('ledger_subtitle')}
          </p>
        </div>

        {transactions.length > 0 && (
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-[#2c2c2e] hover:bg-slate-200 dark:hover:bg-[#3a3a3c] text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition shadow-sm active:scale-95"
            title={t('export_csv')}
          >
            <Download size={14} />
            <span>{t('export_csv')}</span>
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-3xl text-center border border-slate-200/80 dark:border-white/5">
          <p className="text-xs text-slate-500">{t('no_transactions')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {transactions.map((tx) => {
            const isBuy = tx.type === 'BUY';
            const isDividend = tx.type === 'DIVIDEND';
            const isDeleting = deletingId === tx.id;
            const divAmount = tx.amount ?? tx.price ?? 0;
            const dateObj =
              tx.date && typeof (tx.date as any).toDate === 'function'
                ? (tx.date as any).toDate()
                : new Date(tx.date as any);

            return (
              <div
                key={tx.id || Math.random().toString()}
                className="bg-white dark:bg-[#1c1c1e] p-4 rounded-3xl shadow-sm border border-slate-200/80 dark:border-white/5 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isDividend
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : isBuy
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isDividend ? (
                        <CircleDollarSign size={20} />
                      ) : isBuy ? (
                        <ArrowDownLeft size={20} />
                      ) : (
                        <ArrowUpRight size={20} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {tx.ticker}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            isDividend
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                              : isBuy
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {tx.type}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {tx.currency || 'KHR'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {dateObj.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right pl-2">
                    {isDividend ? (
                      <>
                        <div className="font-extrabold text-sm text-emerald-500">
                          +{formatCurrency(divAmount, tx.currency)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          {t('dividend')}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {tx.quantity} @ {formatCurrency(tx.price, tx.currency)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {tx.fee > 0 && (
                            <span>
                              {t('fee_label')}: {formatCurrency(tx.fee, tx.currency)} •{' '}
                            </span>
                          )}
                          {isBuy ? (
                            `${t('cost_label')}: ${formatCurrency(
                              tx.quantity * tx.price + tx.fee,
                              tx.currency
                            )}`
                          ) : (
                            <span
                              className={
                                (tx.realizedProfit || 0) >= 0
                                  ? 'text-emerald-500 font-semibold'
                                  : 'text-rose-500 font-semibold'
                              }
                            >
                              {t('pnl_label')}:{' '}
                              {formatCurrency(tx.realizedProfit || 0, tx.currency, {
                                includeSign: true,
                              })}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex justify-end items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(tx)}
                    disabled={isDeleting}
                    className="px-2.5 py-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1 text-xs font-semibold active:scale-95 disabled:opacity-50"
                  >
                    <Pencil size={13} />
                    <span>{t('edit')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(tx)}
                    disabled={isDeleting}
                    className="px-2.5 py-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center space-x-1 text-xs font-semibold active:scale-95 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 size={13} className="animate-spin text-rose-500" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    <span>{t('delete')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseEdit();
          }}
        >
          <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t('edit_transaction')}
                </h2>
                <p className="text-xs text-slate-500 font-semibold">{editingTx.ticker}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={editSaving}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Action Toggle (BUY / SELL / DIVIDEND) */}
              <div>
                <div className="flex bg-slate-100 dark:bg-[#2c2c2e] p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setEditType('BUY')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      editType === 'BUY'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('SELL')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      editType === 'SELL'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    SELL
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('DIVIDEND')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      editType === 'DIVIDEND'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {t('dividend')}
                  </button>
                </div>
              </div>

              {/* Currency Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {t('currency')}
                </label>
                <div className="flex bg-slate-100 dark:bg-[#2c2c2e] p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setEditCurrency('KHR')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      editCurrency === 'KHR'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    KHR (៛)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCurrency('USD')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      editCurrency === 'USD'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    USD ($)
                  </button>
                </div>
              </div>

              {/* Date Input */}
              <div className="w-full max-w-full overflow-hidden">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {t('date')}
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full max-w-full min-w-0 box-border block px-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              {/* Conditional Inputs: If DIVIDEND, show only Dividend Amount */}
              {editType === 'DIVIDEND' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {t('dividend_amount')} ({editCurrencySymbol})
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder={editCurrency === 'KHR' ? '0' : '0.00'}
                    value={editDividendAmount}
                    onChange={(e) => setEditDividendAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        {t('price_per_share')} ({editCurrencySymbol})
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        placeholder={editCurrency === 'KHR' ? '0' : '0.00'}
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Commission Fee */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      {t('commission_fee')} ({editCurrencySymbol})
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={editCurrency === 'KHR' ? '0' : '0.00'}
                      value={editFee}
                      onChange={(e) => setEditFee(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Preview Summary */}
              {editType === 'DIVIDEND' ? (
                <div className="bg-amber-500/10 dark:bg-amber-500/15 p-3 rounded-2xl text-xs space-y-1.5 border border-amber-500/20 text-amber-800 dark:text-amber-200">
                  <div className="flex justify-between font-bold">
                    <span>{t('dividend_amount')}:</span>
                    <span className="text-emerald-500">
                      +{formatCurrency(editNumDiv, editCurrency)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-[#2c2c2e] p-3 rounded-2xl text-xs space-y-1.5 border border-slate-200/60 dark:border-white/5">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>{t('subtotal')}:</span>
                    <span>{formatCurrency(editSubtotal, editCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>{t('fees')}:</span>
                    <span>{formatCurrency(editNumFee, editCurrency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/5">
                    <span>
                      {editType === 'BUY' ? t('total_cost_basis') : t('net_proceeds')}:
                    </span>
                    <span className={editType === 'BUY' ? 'text-blue-500' : 'text-emerald-500'}>
                      {formatCurrency(Math.max(0, editTotalAmount), editCurrency)}
                    </span>
                  </div>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={editSaving}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-[#2c2c2e] hover:bg-slate-200 dark:hover:bg-[#3a3a3c] text-slate-700 dark:text-slate-300 font-bold text-sm transition active:scale-95 disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {editSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t('saving')}</span>
                    </>
                  ) : (
                    <span>{t('save_changes')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
