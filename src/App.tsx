import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav, ScreenTab } from './components/BottomNav';
import { AuthScreen } from './screens/AuthScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { WalletScreen } from './screens/WalletScreen';
import { AddTradeScreen } from './screens/AddTradeScreen';
import { UpdatePricesScreen } from './screens/UpdatePricesScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { DividendScreen } from './screens/DividendScreen';
import { AppLockScreen } from './components/AppLockScreen';
import { SecuritySettingsModal } from './components/SecuritySettingsModal';
import {
  subscribeToPortfolio,
  subscribeToTransactions,
  subscribeToWallet,
  subscribeToCashTransactions,
  subscribeToUserSettings,
  updateUserSettings
} from './services/portfolioService';
import { PortfolioItem, Transaction, CashTransaction, WalletBalances, InitialTradeData, UserSettings } from './types';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<ScreenTab>('dashboard');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletBalances, setWalletBalances] = useState<WalletBalances>({ KHR: 0, USD: 0 });
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [highlightTicker, setHighlightTicker] = useState<string | undefined>();
  const [pendingTradeData, setPendingTradeData] = useState<InitialTradeData | null>(null);

  // Security / App Lock state
  const [userSettings, setUserSettings] = useState<UserSettings>({
    isAppLockEnabled: false,
    pinCode: ''
  });
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('app_unlocked') === 'true';
  });
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  // Real-time Firestore subscriptions tied to logged in User UID
  useEffect(() => {
    if (!user) {
      setPortfolio([]);
      setTransactions([]);
      setWalletBalances({ KHR: 0, USD: 0 });
      setCashTransactions([]);
      setUserSettings({ isAppLockEnabled: false, pinCode: '' });
      sessionStorage.removeItem('app_unlocked');
      setIsUnlocked(false);
      return;
    }

    const unsubPortfolio = subscribeToPortfolio(user.uid, (data) => {
      setPortfolio(data);
    });

    const unsubTx = subscribeToTransactions(user.uid, (data) => {
      setTransactions(data);
    });

    const unsubWallet = subscribeToWallet(user.uid, (data) => {
      setWalletBalances(data);
    });

    const unsubCash = subscribeToCashTransactions(user.uid, (data) => {
      setCashTransactions(data);
    });

    const unsubSettings = subscribeToUserSettings(user.uid, (data) => {
      setUserSettings(data);
    });

    return () => {
      unsubPortfolio();
      unsubTx();
      unsubWallet();
      unsubCash();
      unsubSettings();
    };
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black text-slate-600 dark:text-slate-400">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const handleQuickUpdateFromDashboard = (ticker?: string) => {
    setHighlightTicker(ticker);
    setCurrentTab('update-prices');
  };

  const handleUnlock = () => {
    sessionStorage.setItem('app_unlocked', 'true');
    setIsUnlocked(true);
  };

  const handleLockNow = () => {
    sessionStorage.removeItem('app_unlocked');
    setIsUnlocked(false);
    setIsSecurityModalOpen(false);
  };

  const handleUpdateSettings = async (updated: Partial<UserSettings>) => {
    if (!user) return;
    await updateUserSettings(user.uid, updated);
  };

  // Full-screen biometric / PIN lock barrier
  if (userSettings.isAppLockEnabled && !isUnlocked) {
    return (
      <AppLockScreen
        pinCode={userSettings.pinCode}
        onUnlock={handleUnlock}
        onLogout={handleLockNow}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col font-sans text-slate-900 dark:text-white">
      <Navbar onOpenSecurity={() => setIsSecurityModalOpen(true)} />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4">
        {currentTab === 'dashboard' && (
          <DashboardScreen
            portfolio={portfolio}
            walletBalances={walletBalances}
            cashTransactions={cashTransactions}
            onNavigateAddTrade={(tradeData) => {
              if (tradeData) {
                if (typeof tradeData === 'string') {
                  setHighlightTicker(tradeData);
                  setPendingTradeData({ ticker: tradeData });
                } else {
                  setHighlightTicker(tradeData.ticker);
                  setPendingTradeData(tradeData);
                }
              } else {
                setHighlightTicker(undefined);
                setPendingTradeData(null);
              }
              setCurrentTab('add-trade');
            }}
            onNavigateUpdatePrice={handleQuickUpdateFromDashboard}
          />
        )}

        {currentTab === 'dividends' && (
          <DividendScreen
            transactions={transactions}
            portfolio={portfolio}
            cashTransactions={cashTransactions}
            onNavigateAddTrade={(ticker) => {
              if (ticker) {
                setHighlightTicker(ticker);
                setPendingTradeData({ ticker, action: 'BUY' });
              }
              setCurrentTab('add-trade');
            }}
          />
        )}

        {currentTab === 'wallet' && (
          <WalletScreen
            portfolio={portfolio}
            walletBalances={walletBalances}
            cashTransactions={cashTransactions}
          />
        )}

        {currentTab === 'add-trade' && (
          <AddTradeScreen
            portfolio={portfolio}
            initialTicker={highlightTicker}
            initialTradeData={pendingTradeData || undefined}
            onTradeSuccess={() => {
              setHighlightTicker(undefined);
              setPendingTradeData(null);
              setCurrentTab('dashboard');
            }}
          />
        )}

        {currentTab === 'update-prices' && (
          <UpdatePricesScreen
            portfolio={portfolio}
            highlightTicker={highlightTicker}
          />
        )}

        {currentTab === 'history' && (
          <HistoryScreen transactions={transactions} />
        )}
      </main>

      <BottomNav
        currentTab={currentTab}
        onChangeTab={(tab) => {
          if (tab !== 'add-trade') {
            setHighlightTicker(undefined);
            setPendingTradeData(null);
          }
          setCurrentTab(tab);
        }}
      />

      <SecuritySettingsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        userSettings={userSettings}
        onUpdateSettings={handleUpdateSettings}
        onLockNow={handleLockNow}
      />
    </div>
  );
};
