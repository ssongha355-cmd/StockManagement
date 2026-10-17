import React, { useState, useEffect, useMemo } from 'react';
import {
  Currency,
  CashTransaction,
  WalletBalances,
  CashTransactionType,
  PortfolioItem
} from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/format';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  depositCash,
  withdrawCash,
  deleteCashTransaction,
  editCashTransaction,
  subscribeToCashTransactions
} from '../services/portfolioService';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Minus,
  X,
  AlertTriangle,
  Loader2,
  Trash2,
  CheckCircle2,
  Pencil,
  Download
} from 'lucide-react';
import { downloadCSV } from '../utils/export';

interface WalletScreenProps {
  portfolio?: PortfolioItem[];
  walletBalances: WalletBalances;
  cashTransactions?: CashTransaction[];
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  portfolio,
  walletBalances,
  cashTransactions: propCashTransactions
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  // Internal state for transactions if not passed or to stay synced
  const [localCashTransactions, setLocalCashTransactions] = useState<CashTransaction[]>(
    propCashTransactions || []
  );

  useEffect(() => {
    if (propCashTransactions) {
      setLocalCashTransactions(propCashTransactions);
      return;
    }
    if (!user) return;
    const unsub = subscribeToCashTransactions(user.uid, (data) => {
      setLocalCashTransactions(data);
    });
    return () => unsub();
  }, [user, propCashTransactions]);

  // Modal State (Supports Create & Edit modes)
  const [modalType, setModalType] = useState<CashTransactionType | null>(null);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [dateStr, setDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [modalCurrency, setModalCurrency] = useState<Currency>(selectedCurrency || 'KHR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentAvailableCash = walletBalances[selectedCurrency] || 0;
  const numAmount = parseFloat(amount) || 0;
  const isOverdrawing =
    modalType === 'WITHDRAW' && numAmount > (walletBalances[modalCurrency] || 0);

  // Filter funding history by the selected currency tab
  const filteredCashTransactions = useMemo(() => {
    return localCashTransactions.filter(
      (tx) => (tx.currency || 'KHR') === selectedCurrency
    );
  }, [localCashTransactions, selectedCurrency]);

  // Calculate Total Invested for the selected currency
  const totalInvested = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return 0;
    return portfolio.reduce((sum, item) => {
      const itemCurrency = item.currency || 'KHR';
      if (itemCurrency === selectedCurrency && item.totalQuantity > 0) {
        return sum + item.averageBuyPrice * item.totalQuantity;
      }
      return sum;
    }, 0);
  }, [portfolio, selectedCurrency]);

  // Calculate Total Deposited & Total Withdrawn for the selected currency
  const { totalDeposited, totalWithdrawn } = useMemo(() => {
    let dep = 0;
    let wit = 0;
    filteredCashTransactions.forEach((tx) => {
      if (tx.type === 'DEPOSIT') {
        dep += tx.amount || 0;
      } else if (tx.type === 'WITHDRAW') {
        wit += tx.amount || 0;
      }
    });
    return { totalDeposited: dep, totalWithdrawn: wit };
  }, [filteredCashTransactions]);

  // Total Capital & Cash Utilization Ratio
  const totalCapital = Math.max(0, currentAvailableCash) + totalInvested;
  const utilizationRatio =
    totalCapital > 0
      ? Math.min(100, Math.max(0, (totalInvested / totalCapital) * 100))
      : 0;

  // Group funding history by Month/Year descending
  const groupedTransactions = useMemo(() => {
    const groups: {
      [key: string]: { label: string; dateVal: number; items: CashTransaction[] };
    } = {};

    filteredCashTransactions.forEach((tx) => {
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
          year: 'numeric'
        }
      );

      if (!groups[key]) {
        groups[key] = {
          label,
          dateVal: new Date(year, month, 1).getTime(),
          items: []
        };
      }
      groups[key].items.push(tx);
    });

    return Object.entries(groups)
      .sort((a, b) => b[1].dateVal - a[1].dateVal)
      .map(([key, group]) => ({
        key,
        label: group.label,
        transactions: group.items
      }));
  }, [filteredCashTransactions, language]);

  const handleOpenModal = (type: CashTransactionType) => {
    setEditingTxId(null);
    setModalType(type);
    setAmount('');
    setDateStr(new Date().toISOString().split('T')[0]);
    setModalCurrency(selectedCurrency || 'KHR');
    setError(null);
  };

  const handleOpenEdit = (tx: CashTransaction) => {
    if (!tx.id) return;
    setEditingTxId(tx.id);
    setModalType(tx.type);
    setAmount(tx.amount.toString());
    setModalCurrency(tx.currency || selectedCurrency || 'KHR');
    setError(null);

    let formattedDate = new Date().toISOString().split('T')[0];
    if (tx.date) {
      const d =
        typeof (tx.date as any).toDate === 'function'
          ? (tx.date as any).toDate()
          : new Date(tx.date as any);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      }
    }
    setDateStr(formattedDate);
  };

  const handleCloseModal = () => {
    if (loading) return;
    setModalType(null);
    setEditingTxId(null);
    setAmount('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !modalType) return;

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    setLoading(true);
    setError(null);

    let parsedDate: Date | undefined;
    if (dateStr) {
      const [y, m, d] = dateStr.split('-').map(Number);
      parsedDate = new Date(y, m - 1, d, 12, 0, 0);
    }

    try {
      if (editingTxId) {
        // Edit Mode
        await editCashTransaction(user.uid, editingTxId, modalCurrency, {
          type: modalType,
          amount: numAmount,
          currency: modalCurrency,
          date: parsedDate
        });
        setSuccessMsg(t('edit_success'));
      } else {
        // Create Mode
        if (modalType === 'DEPOSIT') {
          await depositCash(user.uid, numAmount, modalCurrency, parsedDate);
          setSuccessMsg(
            `${t('deposit')} ${formatCurrency(numAmount, modalCurrency)} successfully!`
          );
        } else if (modalType === 'WITHDRAW') {
          await withdrawCash(user.uid, numAmount, modalCurrency, parsedDate);
          setSuccessMsg(
            `${t('withdraw')} ${formatCurrency(numAmount, modalCurrency)} successfully!`
          );
        }
      }

      setModalType(null);
      setEditingTxId(null);
      setAmount('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCashTx = async (tx: CashTransaction) => {
    if (!user || !tx.id) return;
    if (!window.confirm(t('confirm_delete_cash'))) return;

    setDeletingId(tx.id);
    try {
      await deleteCashTransaction(user.uid, tx.id, tx.currency);
      setSuccessMsg(`${t('delete')} successfully!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete transaction.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    const listToExport: CashTransaction[] =
      filteredCashTransactions.length > 0 ? filteredCashTransactions : localCashTransactions;
    if (!listToExport || listToExport.length === 0) return;

    const formattedData = listToExport.map((tx: CashTransaction) => {
      const dateObj =
        tx.date && typeof (tx.date as any).toDate === 'function'
          ? (tx.date as any).toDate()
          : new Date((tx.date as any) || Date.now());

      const formattedDate = !isNaN(dateObj.getTime())
        ? dateObj.toISOString().split('T')[0]
        : '';

      const typeLabel =
        tx.type === 'DEPOSIT'
          ? t('deposit')
          : t('withdraw');

      return {
        Date: formattedDate,
        Type: typeLabel,
        Amount: tx.amount,
        Currency: tx.currency || selectedCurrency || 'KHR',
      };
    });

    downloadCSV('wallet_history.csv', formattedData);
  };

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto">
      {/* Top Header & Currency Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {t('wallet_title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('wallet_subtitle')}
          </p>
        </div>

        <div className="flex bg-slate-200/80 dark:bg-[#2c2c2e] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setSelectedCurrency('KHR')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              selectedCurrency === 'KHR'
                ? 'bg-emerald-600 text-white shadow-sm'
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
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            USD ($)
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Available Cash Card with Utilization Bar */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-xl shadow-emerald-600/20">
        <div className="flex justify-between items-center opacity-90 text-xs font-semibold uppercase tracking-wider">
          <div className="flex items-center space-x-1.5">
            <Wallet size={16} />
            <span>
              {t('available_cash')} ({selectedCurrency})
            </span>
          </div>
        </div>

        <div className="text-3xl font-extrabold tracking-tight mt-2">
          {formatCurrency(currentAvailableCash, selectedCurrency)}
        </div>

        {/* Cash Utilization Progress Bar */}
        <div className="mt-4 pt-3 border-t border-white/20">
          <div className="flex justify-between items-center text-[11px] font-semibold text-emerald-100/90 mb-1.5">
            <span>{t('cash_utilization')}</span>
            <span>
              {utilizationRatio.toFixed(0)}% {t('invested')}
            </span>
          </div>
          <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden flex">
            <div
              className="bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${utilizationRatio}%` }}
              title={`Invested: ${utilizationRatio.toFixed(1)}%`}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-emerald-100/70 mt-1">
            <span>
              {formatCurrency(totalInvested, selectedCurrency)} {t('invested')}
            </span>
            <span>
              {formatCurrency(currentAvailableCash, selectedCurrency)} {t('available_cash')}
            </span>
          </div>
        </div>

        {/* Deposit & Withdraw Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/20">
          <button
            type="button"
            onClick={() => handleOpenModal('DEPOSIT')}
            className="py-2.5 px-4 rounded-2xl bg-white text-emerald-700 font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center space-x-1.5 hover:bg-emerald-50"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>{t('deposit')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal('WITHDRAW')}
            className="py-2.5 px-4 rounded-2xl bg-emerald-800/60 hover:bg-emerald-800/80 text-white font-bold text-xs border border-white/20 transition active:scale-95 flex items-center justify-center space-x-1.5"
          >
            <Minus size={15} strokeWidth={2.5} />
            <span>{t('withdraw')}</span>
          </button>
        </div>
      </div>

      {/* Grid of 3 Financial Breakdown Metrics */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-2xl border border-slate-200/80 dark:border-white/5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {t('total_deposited')}
          </span>
          <div className="mt-1.5">
            <span className="text-sm font-black tracking-tight text-emerald-600 dark:text-emerald-400 block truncate">
              {formatCurrency(totalDeposited, selectedCurrency)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-2xl border border-slate-200/80 dark:border-white/5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {t('total_invested')}
          </span>
          <div className="mt-1.5">
            <span className="text-sm font-black tracking-tight text-blue-600 dark:text-blue-400 block truncate">
              {formatCurrency(totalInvested, selectedCurrency)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-2xl border border-slate-200/80 dark:border-white/5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {t('total_withdrawn')}
          </span>
          <div className="mt-1.5">
            <span className="text-sm font-black tracking-tight text-rose-600 dark:text-rose-400 block truncate">
              {formatCurrency(totalWithdrawn, selectedCurrency)}
            </span>
          </div>
        </div>
      </div>

      {/* Funding History Ledger Grouped by Month */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {t('funding_history')}
            </h2>
            <span className="text-xs text-slate-400 font-normal">
              ({filteredCashTransactions.length})
            </span>
          </div>

          {filteredCashTransactions.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-[#2c2c2e] hover:bg-slate-200 dark:hover:bg-[#3a3a3c] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
              title={t('export_csv')}
            >
              <Download size={13} />
              <span>{t('export')}</span>
            </button>
          )}
        </div>

        {groupedTransactions.length === 0 ? (
          <div className="bg-white dark:bg-[#1c1c1e] p-8 rounded-3xl text-center border border-slate-200/80 dark:border-white/5">
            <p className="text-xs text-slate-500">{t('no_cash_transactions_yet')}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedTransactions.map((group) => (
              <div key={group.key} className="space-y-2">
                {/* Month Group Header */}
                <div className="sticky top-0 z-10 py-1 bg-slate-50/90 dark:bg-black/90 backdrop-blur-md px-1 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {group.label}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {group.transactions.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {group.transactions.map((tx) => {
                    const isDeposit = tx.type === 'DEPOSIT';
                    const isDeleting = deletingId === tx.id;
                    const dateObj =
                      tx.date && typeof (tx.date as any).toDate === 'function'
                        ? (tx.date as any).toDate()
                        : new Date((tx.date as any) || Date.now());

                    return (
                      <div
                        key={tx.id || Math.random().toString()}
                        className="bg-white dark:bg-[#1c1c1e] p-4 rounded-3xl shadow-sm border border-slate-200/80 dark:border-white/5 flex items-center justify-between transition"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                              isDeposit
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isDeposit ? (
                              <ArrowDownLeft size={20} />
                            ) : (
                              <ArrowUpRight size={20} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {isDeposit ? t('deposit') : t('withdraw')}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {tx.currency}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {dateObj.toLocaleDateString(
                                language === 'km' ? 'km-KH' : 'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-bold text-sm ${
                              isDeposit
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isDeposit ? '+' : '-'}
                            {formatCurrency(tx.amount, tx.currency)}
                          </span>

                          {/* Edit & Delete Action Buttons */}
                          <div className="flex items-center space-x-0.5 ml-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(tx)}
                              disabled={isDeleting}
                              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                              title={t('edit')}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCashTx(tx)}
                              disabled={isDeleting}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 disabled:opacity-50"
                              title={t('delete')}
                            >
                              {isDeleting ? (
                                <Loader2 size={14} className="animate-spin text-rose-500" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
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

      {/* Deposit / Withdraw / Edit Modal */}
      {modalType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200/80 dark:border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingTxId
                  ? t('edit_cash_transaction')
                  : modalType === 'DEPOSIT'
                  ? t('deposit_cash')
                  : t('withdraw_cash')}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={loading}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Action Toggle (Deposit / Withdraw) */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {t('action')}
                </label>
                <div className="flex bg-slate-100 dark:bg-[#2c2c2e] p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setModalType('DEPOSIT')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      modalType === 'DEPOSIT'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {t('deposit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalType('WITHDRAW')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      modalType === 'WITHDRAW'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {t('withdraw')}
                  </button>
                </div>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {t('currency')}
                </label>
                <div className="flex bg-slate-100 dark:bg-[#2c2c2e] p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setModalCurrency('KHR')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      modalCurrency === 'KHR'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    KHR (៛)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalCurrency('USD')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      modalCurrency === 'USD'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    USD ($)
                  </button>
                </div>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  {t('date')}
                </label>
                <input
                  type="date"
                  required
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {t('amount')} ({getCurrencySymbol(modalCurrency)})
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {t('available_cash')}:{' '}
                    {formatCurrency(
                      walletBalances[modalCurrency] || 0,
                      modalCurrency
                    )}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">
                    {getCurrencySymbol(modalCurrency)}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder={modalCurrency === 'KHR' ? '0' : '0.00'}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Insufficient Cash Warning for Withdrawal */}
              {isOverdrawing && (
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center space-x-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{t('insufficient_cash_warning')}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-[#2c2c2e] hover:bg-slate-200 dark:hover:bg-[#3a3a3c] text-slate-700 dark:text-slate-300 font-bold text-sm transition active:scale-95 disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-3 rounded-2xl text-white font-bold text-sm shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-1.5 ${
                    modalType === 'DEPOSIT'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{t('saving')}</span>
                    </>
                  ) : (
                    <span>
                      {editingTxId
                        ? t('save_changes')
                        : modalType === 'DEPOSIT'
                        ? t('deposit')
                        : t('withdraw')}
                    </span>
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
