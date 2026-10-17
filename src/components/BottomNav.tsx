import { LayoutDashboard, Wallet, PlusCircle, RefreshCw, History, Coins } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type ScreenTab = 'dashboard' | 'dividends' | 'wallet' | 'add-trade' | 'update-prices' | 'history';

interface BottomNavProps {
  currentTab: ScreenTab;
  onChangeTab: (tab: ScreenTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab }) => {
  const { t } = useLanguage();

  const tabs = [
    { id: 'dashboard' as ScreenTab, labelKey: 'nav_portfolio' as const, icon: LayoutDashboard },
    { id: 'dividends' as ScreenTab, labelKey: 'nav_dividends' as const, icon: Coins },
    { id: 'wallet' as ScreenTab, labelKey: 'nav_wallet' as const, icon: Wallet },
    { id: 'add-trade' as ScreenTab, labelKey: 'nav_trade' as const, icon: PlusCircle },
    { id: 'update-prices' as ScreenTab, labelKey: 'nav_prices' as const, icon: RefreshCw },
    { id: 'history' as ScreenTab, labelKey: 'nav_ledger' as const, icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/90 dark:bg-[#121214]/90 border-t border-slate-200/60 dark:border-white/10 bottom-nav-safe">
      <div className="max-w-md mx-auto px-1 flex justify-around items-center h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={19} strokeWidth={isActive ? 2.4 : 1.9} />
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-full px-0.5">{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
