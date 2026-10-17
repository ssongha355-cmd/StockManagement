import {
  collection,
  doc,
  runTransaction,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  PortfolioItem,
  Transaction,
  TradeType,
  Currency,
  CashTransaction,
  WalletBalances,
  UserSettings
} from '../types';

export interface TradeInput {
  ticker: string;
  type: TradeType;
  quantity?: number;
  price?: number;
  fee?: number;
  amount?: number;
  currency?: Currency;
  date?: Date;
}

/**
 * Executes a trade atomically using Firestore runTransaction.
 * Enforces:
 * 1. BUY: Updates Average Buy Price using Weighted Average.
 * 2. SELL: Validates sufficient quantity, locks in Realized Profit, DOES NOT alter Average Buy Price.
 * 3. DIVIDEND: Adds cash dividend amount directly to Realized Profit, DOES NOT alter Quantity or Average Buy Price.
 */
export async function recordTrade(userId: string, trade: TradeInput): Promise<void> {
  const cleanTicker = trade.ticker.trim().toUpperCase();
  if (!cleanTicker) throw new Error('Ticker is required.');

  const isDividend = trade.type === 'DIVIDEND';
  const dividendAmount = trade.amount ?? trade.price ?? 0;

  if (isDividend) {
    if (dividendAmount <= 0) {
      throw new Error('Dividend amount must be greater than zero.');
    }
  } else {
    if (!trade.quantity || trade.quantity <= 0) throw new Error('Quantity must be greater than zero.');
    if (!trade.price || trade.price <= 0) throw new Error('Price must be greater than zero.');
    if (trade.fee !== undefined && trade.fee < 0) throw new Error('Fee cannot be negative.');
  }

  const portfolioRef = doc(db, 'users', userId, 'portfolio', cleanTicker);
  const transactionsCollectionRef = collection(db, 'users', userId, 'transactions');
  const newTxDocRef = doc(transactionsCollectionRef);

  let recordedCurrency: Currency = 'KHR';

  await runTransaction(db, async (tx) => {
    const portfolioSnap = await tx.get(portfolioRef);

    let oldQty = 0;
    let oldAvgBuyPrice = 0;
    let oldRealizedProfit = 0;
    let oldManualPrice = isDividend ? 0 : trade.price || 0; // default fallback
    let existingCurrency: Currency | undefined;

    if (portfolioSnap.exists()) {
      const data = portfolioSnap.data() as PortfolioItem;
      oldQty = data.totalQuantity || 0;
      oldAvgBuyPrice = data.averageBuyPrice || 0;
      oldRealizedProfit = data.realizedProfit || 0;
      oldManualPrice = data.manualCurrentPrice || (isDividend ? 0 : trade.price || 0);
      existingCurrency = data.currency;
    }

    const finalCurrency: Currency = existingCurrency || trade.currency || 'KHR';
    recordedCurrency = finalCurrency;

    let newTotalQty = oldQty;
    let newAvgBuyPrice = oldAvgBuyPrice;
    let newRealizedProfit = oldRealizedProfit;
    let thisTradeRealizedProfit = 0;

    if (trade.type === 'BUY') {
      const qty = trade.quantity || 0;
      const price = trade.price || 0;
      newTotalQty = oldQty + qty;
      // Formula: ((Old Qty * Old Avg Price) + (New Qty * New Price)) / (Old Qty + New Qty)
      newAvgBuyPrice =
        ((oldQty * oldAvgBuyPrice) + (qty * price)) / newTotalQty;
      // If no manual current price was ever set, default to this buy price
      if (!portfolioSnap.exists() || !portfolioSnap.data()?.manualCurrentPrice) {
        oldManualPrice = price;
      }
    } else if (trade.type === 'SELL') {
      const qty = trade.quantity || 0;
      const price = trade.price || 0;
      const fee = trade.fee || 0;
      if (oldQty < qty) {
        throw new Error(
          `Insufficient shares to sell. You currently hold ${oldQty} shares of ${cleanTicker}.`
        );
      }
      newTotalQty = oldQty - qty;
      // Formula: ((Sell Price - Avg Buy Price) * Sell Qty) - Fees
      thisTradeRealizedProfit =
        ((price - oldAvgBuyPrice) * qty) - fee;
      newRealizedProfit = oldRealizedProfit + thisTradeRealizedProfit;
      
      // Average Buy Price DOES NOT change on sell!
      // If position is completely closed (qty = 0), reset average buy price to 0
      if (newTotalQty === 0) {
        newAvgBuyPrice = 0;
      }
    } else if (trade.type === 'DIVIDEND') {
      thisTradeRealizedProfit = dividendAmount;
      newRealizedProfit = oldRealizedProfit + dividendAmount;
      // DO NOT modify totalQuantity or averageBuyPrice
    }

    // 1. Write the new transaction record
    tx.set(newTxDocRef, {
      ticker: cleanTicker,
      type: trade.type,
      quantity: isDividend ? 0 : trade.quantity || 0,
      price: isDividend ? dividendAmount : trade.price || 0,
      fee: isDividend ? 0 : trade.fee || 0,
      amount: isDividend ? dividendAmount : undefined,
      currency: finalCurrency,
      realizedProfit: trade.type === 'BUY' ? 0 : thisTradeRealizedProfit,
      date: trade.date ? Timestamp.fromDate(trade.date) : serverTimestamp(),
      createdAt: serverTimestamp()
    });

    // 2. Update the portfolio document
    tx.set(portfolioRef, {
      ticker: cleanTicker,
      totalQuantity: newTotalQty,
      averageBuyPrice: Number(newAvgBuyPrice.toFixed(4)),
      realizedProfit: Number(newRealizedProfit.toFixed(4)),
      manualCurrentPrice: oldManualPrice,
      currency: finalCurrency,
      updatedAt: serverTimestamp()
    });
  });

  if (trade.date) {
    await recalculateTickerPortfolio(userId, cleanTicker);
  }

  await recalculateWalletBalance(userId, recordedCurrency);
}

/**
 * Updates manual market price for a given ticker.
 */
export async function updateTickerPrice(
  userId: string,
  ticker: string,
  newPrice: number
): Promise<void> {
  if (newPrice <= 0) throw new Error('Price must be greater than zero');
  const cleanTicker = ticker.trim().toUpperCase();
  const portfolioRef = doc(db, 'users', userId, 'portfolio', cleanTicker);

  await updateDoc(portfolioRef, {
    manualCurrentPrice: newPrice,
    updatedAt: serverTimestamp()
  });
}

/**
 * Real-time listener for user portfolio holdings.
 */
export function subscribeToPortfolio(
  userId: string,
  callback: (items: PortfolioItem[]) => void
) {
  const portfolioRef = collection(db, 'users', userId, 'portfolio');
  return onSnapshot(portfolioRef, (snapshot) => {
    const items: PortfolioItem[] = [];
    snapshot.forEach((doc) => {
      items.push(doc.data() as PortfolioItem);
    });
    callback(items);
  });
}

/**
 * Real-time listener for user transactions ledger.
 */
export function subscribeToTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void
) {
  const txRef = collection(db, 'users', userId, 'transactions');
  const q = query(txRef, orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Transaction[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...(doc.data() as Omit<Transaction, 'id'>) });
    });
    callback(list);
  });
}

/**
 * Replays all transactions for a ticker in ascending date order
 * to completely recalculate the average cost basis, total quantity, and realized profit.
 * If 0 transactions remain, deletes the portfolio document entirely.
 */
export async function recalculateTickerPortfolio(
  userId: string,
  ticker: string
): Promise<void> {
  const cleanTicker = ticker.trim().toUpperCase();
  if (!cleanTicker) return;

  const portfolioRef = doc(db, 'users', userId, 'portfolio', cleanTicker);
  const txCollectionRef = collection(db, 'users', userId, 'transactions');
  const q = query(txCollectionRef, where('ticker', '==', cleanTicker));
  const snap = await getDocs(q);

  if (snap.empty) {
    // If the loop yields 0 remaining transactions (e.g. user deleted the only trade), delete document entirely
    await deleteDoc(portfolioRef);
    return;
  }

  const txList: (Transaction & { id: string })[] = [];
  snap.forEach((docSnap) => {
    txList.push({ id: docSnap.id, ...(docSnap.data() as Omit<Transaction, 'id'>) });
  });

  // Sort by date ASCENDING
  txList.sort((a, b) => {
    const getMillis = (val: any): number => {
      if (!val) return 0;
      if (typeof val.toMillis === 'function') return val.toMillis();
      if (typeof val.toDate === 'function') return val.toDate().getTime();
      if (val instanceof Date) return val.getTime();
      return new Date(val).getTime() || 0;
    };
    return getMillis(a.date) - getMillis(b.date);
  });

  // Check if portfolio doc already exists to preserve manualCurrentPrice or currency
  const portfolioSnap = await getDoc(portfolioRef);
  let existingManualPrice = 0;
  let existingCurrency: Currency | undefined;

  if (portfolioSnap.exists()) {
    const data = portfolioSnap.data() as PortfolioItem;
    existingManualPrice = data.manualCurrentPrice || 0;
    existingCurrency = data.currency;
  }

  let runningQty = 0;
  let runningAvgBuyPrice = 0;
  let runningRealizedProfit = 0;
  let lastPrice = 0;
  let detectedCurrency: Currency | undefined = existingCurrency;

  for (const tx of txList) {
    if (tx.currency) {
      detectedCurrency = tx.currency;
    }
    lastPrice = tx.price;

    if (tx.type === 'BUY') {
      const newQty = runningQty + tx.quantity;
      if (newQty > 0) {
        runningAvgBuyPrice =
          ((runningQty * runningAvgBuyPrice) + (tx.quantity * tx.price)) / newQty;
      }
      runningQty = newQty;

      // Clean up realizedProfit on BUY in case this tx was previously a SELL
      if (tx.id && tx.realizedProfit && tx.realizedProfit !== 0) {
        const txDocRef = doc(db, 'users', userId, 'transactions', tx.id);
        await updateDoc(txDocRef, { realizedProfit: 0 });
      }
    } else if (tx.type === 'SELL') {
      const thisTradeRealizedProfit =
        ((tx.price - runningAvgBuyPrice) * tx.quantity) - (tx.fee || 0);
      runningRealizedProfit += thisTradeRealizedProfit;
      runningQty = Math.max(0, runningQty - tx.quantity);

      // Average Buy Price DOES NOT change on sell!
      // If position is completely closed (qty = 0), reset average buy price to 0
      if (runningQty === 0) {
        runningAvgBuyPrice = 0;
      }

      // Update the transaction doc with its recalculated realized profit
      if (tx.id && Number(tx.realizedProfit?.toFixed(4)) !== Number(thisTradeRealizedProfit.toFixed(4))) {
        const txDocRef = doc(db, 'users', userId, 'transactions', tx.id);
        await updateDoc(txDocRef, {
          realizedProfit: Number(thisTradeRealizedProfit.toFixed(4))
        });
      }
    } else if (tx.type === 'DIVIDEND') {
      const divAmount = tx.amount ?? tx.price ?? 0;
      runningRealizedProfit += divAmount;
      // DO NOT modify runningQty or runningAvgBuyPrice!

      // Update the transaction doc with its dividend realized profit
      if (tx.id && Number(tx.realizedProfit?.toFixed(4)) !== Number(divAmount.toFixed(4))) {
        const txDocRef = doc(db, 'users', userId, 'transactions', tx.id);
        await updateDoc(txDocRef, {
          realizedProfit: Number(divAmount.toFixed(4))
        });
      }
    }
  }

  const finalCurrency: Currency = detectedCurrency || 'KHR';
  const finalManualPrice = existingManualPrice > 0 ? existingManualPrice : lastPrice;

  await setDoc(portfolioRef, {
    ticker: cleanTicker,
    totalQuantity: Number(runningQty.toFixed(4)),
    averageBuyPrice: Number(runningAvgBuyPrice.toFixed(4)),
    realizedProfit: Number(runningRealizedProfit.toFixed(4)),
    manualCurrentPrice: finalManualPrice,
    currency: finalCurrency,
    updatedAt: serverTimestamp()
  });
}

/**
 * Deletes a transaction doc from Firestore, then triggers recalculation of the ticker's portfolio and wallet balance.
 */
export async function deleteTransaction(
  userId: string,
  txId: string,
  ticker: string
): Promise<void> {
  const cleanTicker = ticker.trim().toUpperCase();
  const txRef = doc(db, 'users', userId, 'transactions', txId);
  const txSnap = await getDoc(txRef);
  const txCurrency: Currency = txSnap.exists()
    ? (txSnap.data() as Transaction).currency || 'KHR'
    : 'KHR';

  await deleteDoc(txRef);
  await recalculateTickerPortfolio(userId, cleanTicker);
  await recalculateWalletBalance(userId, txCurrency);
}

export interface EditTransactionInput {
  ticker?: string;
  type: TradeType;
  quantity?: number;
  price?: number;
  fee?: number;
  amount?: number;
  currency?: Currency;
  date?: Date;
}

/**
 * Updates a transaction doc in Firestore, then triggers recalculation of the ticker's portfolio and wallet balance.
 */
export async function editTransaction(
  userId: string,
  txId: string,
  ticker: string,
  updatedData: EditTransactionInput
): Promise<void> {
  const cleanOrigTicker = ticker.trim().toUpperCase();
  const cleanNewTicker = (updatedData.ticker || ticker).trim().toUpperCase();
  const txRef = doc(db, 'users', userId, 'transactions', txId);

  const txSnap = await getDoc(txRef);
  const oldCurrency: Currency = txSnap.exists()
    ? (txSnap.data() as Transaction).currency || 'KHR'
    : 'KHR';

  const isDividend = updatedData.type === 'DIVIDEND';
  const divAmount = updatedData.amount ?? updatedData.price ?? 0;

  const updatePayload: Record<string, any> = {
    type: updatedData.type,
    quantity: isDividend ? 0 : updatedData.quantity || 0,
    price: isDividend ? divAmount : updatedData.price || 0,
    fee: isDividend ? 0 : updatedData.fee || 0,
    amount: isDividend ? divAmount : undefined,
    currency: updatedData.currency || 'KHR',
    ticker: cleanNewTicker,
    updatedAt: serverTimestamp()
  };

  if (updatedData.date) {
    updatePayload.date = Timestamp.fromDate(updatedData.date);
  }

  await updateDoc(txRef, updatePayload);

  await recalculateTickerPortfolio(userId, cleanNewTicker);
  if (cleanOrigTicker !== cleanNewTicker) {
    await recalculateTickerPortfolio(userId, cleanOrigTicker);
  }

  const newCurrency: Currency = updatedData.currency || 'KHR';
  await recalculateWalletBalance(userId, newCurrency);
  if (oldCurrency !== newCurrency) {
    await recalculateWalletBalance(userId, oldCurrency);
  }
}

/**
 * Recalculates wallet cash balance for a given currency:
 * 1. Sum all DEPOSIT and subtract all WITHDRAW amounts from cash_transactions.
 * 2. Subtract Total Cost of all BUY trades ((Qty * Price) + Fee).
 *    Add Net Proceeds of all SELL trades ((Qty * Price) - Fee).
 *    Add Dividend cash amount from DIVIDEND trades.
 * 3. Save final calculated number to users/{userId}/wallet/{currency}.
 */
export async function recalculateWalletBalance(
  userId: string,
  currency: Currency
): Promise<number> {
  // 1. Calculate net cash from cash_transactions
  const cashRef = collection(db, 'users', userId, 'cash_transactions');
  const cashSnap = await getDocs(cashRef);
  let netCashFunding = 0;
  cashSnap.forEach((docSnap) => {
    const data = docSnap.data() as CashTransaction;
    if (data.currency === currency) {
      if (data.type === 'DEPOSIT') {
        netCashFunding += data.amount || 0;
      } else if (data.type === 'WITHDRAW') {
        netCashFunding -= data.amount || 0;
      }
    }
  });

  // 2. Query all stock transactions for this currency
  const txRef = collection(db, 'users', userId, 'transactions');
  const txSnap = await getDocs(txRef);
  let netStockCashFlow = 0;
  txSnap.forEach((docSnap) => {
    const data = docSnap.data() as Transaction;
    const txCurrency: Currency = data.currency || 'KHR';
    if (txCurrency === currency) {
      const qty = data.quantity || 0;
      const price = data.price || 0;
      const fee = data.fee || 0;
      if (data.type === 'BUY') {
        netStockCashFlow -= ((qty * price) + fee);
      } else if (data.type === 'SELL') {
        netStockCashFlow += ((qty * price) - fee);
      } else if (data.type === 'DIVIDEND') {
        const divAmount = data.amount ?? price ?? 0;
        netStockCashFlow += divAmount;
      }
    }
  });

  // 3. Save final calculated balance to users/{userId}/wallet/{currency}
  const finalBalance = Number((netCashFunding + netStockCashFlow).toFixed(4));
  const walletDocRef = doc(db, 'users', userId, 'wallet', currency);
  await setDoc(walletDocRef, {
    balance: finalBalance,
    updatedAt: serverTimestamp()
  });

  return finalBalance;
}

/**
 * Deposits cash into the wallet and recalculates balance.
 */
export async function depositCash(
  userId: string,
  amount: number,
  currency: Currency = 'KHR',
  date?: Date
): Promise<void> {
  if (amount <= 0) throw new Error('Deposit amount must be greater than zero.');
  const finalCurrency: Currency = currency || 'KHR';
  const cashRef = collection(db, 'users', userId, 'cash_transactions');
  await addDoc(cashRef, {
    type: 'DEPOSIT',
    amount,
    currency: finalCurrency,
    date: date ? Timestamp.fromDate(date) : serverTimestamp(),
    createdAt: serverTimestamp()
  });
  await recalculateWalletBalance(userId, finalCurrency);
}

/**
 * Withdraws cash from the wallet and recalculates balance.
 */
export async function withdrawCash(
  userId: string,
  amount: number,
  currency: Currency = 'KHR',
  date?: Date
): Promise<void> {
  if (amount <= 0) throw new Error('Withdrawal amount must be greater than zero.');
  const finalCurrency: Currency = currency || 'KHR';
  const cashRef = collection(db, 'users', userId, 'cash_transactions');
  await addDoc(cashRef, {
    type: 'WITHDRAW',
    amount,
    currency: finalCurrency,
    date: date ? Timestamp.fromDate(date) : serverTimestamp(),
    createdAt: serverTimestamp()
  });
  await recalculateWalletBalance(userId, finalCurrency);
}

/**
 * Deletes a cash funding transaction and recalculates wallet balance.
 */
export async function deleteCashTransaction(
  userId: string,
  cashTxId: string,
  currency: Currency = 'KHR'
): Promise<void> {
  const cashDocRef = doc(db, 'users', userId, 'cash_transactions', cashTxId);
  const snap = await getDoc(cashDocRef);
  const targetCurrency = snap.exists()
    ? (snap.data() as CashTransaction).currency || currency || 'KHR'
    : currency || 'KHR';

  await deleteDoc(cashDocRef);
  await recalculateWalletBalance(userId, targetCurrency);
  if (targetCurrency !== currency) {
    await recalculateWalletBalance(userId, currency);
  }
}

/**
 * Updates a cash funding transaction in Firestore, then recalculates wallet balance.
 */
export async function editCashTransaction(
  userId: string,
  txId: string,
  currency: Currency = 'KHR',
  updatedData: Partial<CashTransaction> = {}
): Promise<void> {
  const cashDocRef = doc(db, 'users', userId, 'cash_transactions', txId);
  const snap = await getDoc(cashDocRef);
  const oldCurrency = snap.exists()
    ? (snap.data() as CashTransaction).currency || currency || 'KHR'
    : currency || 'KHR';

  const payload: Record<string, any> = {
    updatedAt: serverTimestamp()
  };

  if (updatedData.type !== undefined) payload.type = updatedData.type;
  if (updatedData.amount !== undefined) payload.amount = updatedData.amount;
  if (updatedData.currency !== undefined) payload.currency = updatedData.currency;
  if (updatedData.date !== undefined) {
    if (updatedData.date instanceof Date) {
      payload.date = Timestamp.fromDate(updatedData.date);
    } else {
      payload.date = updatedData.date;
    }
  }

  await updateDoc(cashDocRef, payload);

  const newCurrency = updatedData.currency || currency || 'KHR';
  await recalculateWalletBalance(userId, newCurrency);
  if (oldCurrency && oldCurrency !== newCurrency) {
    await recalculateWalletBalance(userId, oldCurrency);
  }
}

/**
 * Real-time listener for user wallet balances.
 */
export function subscribeToWallet(
  userId: string,
  callback: (balances: WalletBalances) => void
) {
  const walletRef = collection(db, 'users', userId, 'wallet');
  return onSnapshot(walletRef, (snapshot) => {
    const balances: WalletBalances = { USD: 0, KHR: 0 };
    snapshot.forEach((docSnap) => {
      const id = docSnap.id as Currency;
      if (id === 'USD' || id === 'KHR') {
        balances[id] = docSnap.data().balance || 0;
      }
    });
    callback(balances);
  });
}

/**
 * Real-time listener for user cash funding transactions.
 */
export function subscribeToCashTransactions(
  userId: string,
  callback: (transactions: CashTransaction[]) => void
) {
  const cashRef = collection(db, 'users', userId, 'cash_transactions');
  const q = query(cashRef, orderBy('date', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: CashTransaction[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<CashTransaction, 'id'>) });
      });
      callback(list);
    },
    (err) => {
      console.warn('subscribeToCashTransactions fallback to unordered query:', err);
      return onSnapshot(cashRef, (snapshot) => {
        const list: CashTransaction[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<CashTransaction, 'id'>) });
        });
        list.sort((a, b) => {
          const timeA =
            a.date && typeof (a.date as any).toMillis === 'function'
              ? (a.date as any).toMillis()
              : (a.date ? new Date(a.date as any).getTime() : 0);
          const timeB =
            b.date && typeof (b.date as any).toMillis === 'function'
              ? (b.date as any).toMillis()
              : (b.date ? new Date(b.date as any).getTime() : 0);
          return timeB - timeA;
        });
        callback(list);
      });
    }
  );
}

/**
 * Fetches user settings (such as target net worth) from `users/{userId}/settings/profile`.
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const profileRef = doc(db, 'users', userId, 'settings', 'profile');
  const snap = await getDoc(profileRef);
  if (!snap.exists()) {
    return {
      targetNetWorth: 40000000,
      targetNetWorthKHR: 40000000,
      targetNetWorthUSD: 10000,
      isAppLockEnabled: false,
      pinCode: '',
    };
  }
  const data = snap.data();
  return {
    targetNetWorth: data.targetNetWorth ?? (data.targetNetWorthKHR || 40000000),
    targetNetWorthKHR: data.targetNetWorthKHR ?? data.targetNetWorth ?? 40000000,
    targetNetWorthUSD: data.targetNetWorthUSD ?? 10000,
    isAppLockEnabled: !!data.isAppLockEnabled,
    pinCode: data.pinCode || '',
    updatedAt: data.updatedAt,
  };
}

/**
 * Updates user settings at `users/{userId}/settings/profile`.
 */
export async function updateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  const profileRef = doc(db, 'users', userId, 'settings', 'profile');
  await setDoc(
    profileRef,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Subscribes to real-time updates for user settings.
 */
export function subscribeToUserSettings(
  userId: string,
  callback: (settings: UserSettings) => void
) {
  const profileRef = doc(db, 'users', userId, 'settings', 'profile');
  return onSnapshot(profileRef, (snap) => {
    if (!snap.exists()) {
      callback({
        targetNetWorth: 40000000,
        targetNetWorthKHR: 40000000,
        targetNetWorthUSD: 10000,
        isAppLockEnabled: false,
        pinCode: '',
      });
      return;
    }
    const data = snap.data();
    callback({
      targetNetWorth: data.targetNetWorth ?? (data.targetNetWorthKHR || 40000000),
      targetNetWorthKHR: data.targetNetWorthKHR ?? data.targetNetWorth ?? 40000000,
      targetNetWorthUSD: data.targetNetWorthUSD ?? 10000,
      isAppLockEnabled: !!data.isAppLockEnabled,
      pinCode: data.pinCode || '',
      updatedAt: data.updatedAt,
    });
  });
}



