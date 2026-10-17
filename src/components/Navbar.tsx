import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Moon, Sun, LogOut, TrendingUp, Shield } from 'lucide-react';

interface NavbarProps {
  onOpenSecurity?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSecurity }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-black/80 border-b border-slate-200/60 dark:border-white/10 pt-safe transition-colors">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <TrendingUp size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight">{t('app_name')}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Language Toggle */}
          <div className="flex bg-slate-100 dark:bg-[#2c2c2e] p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition ${
                language === 'en'
                  ? 'bg-white dark:bg-[#3a3a3c] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              aria-label="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('km')}
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition ${
                language === 'km'
                  ? 'bg-white dark:bg-[#3a3a3c] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              aria-label="ប្តូរទៅភាសាខ្មែរ"
            >
              ខ្មែរ
            </button>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition active:scale-95 text-slate-700 dark:text-slate-300"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {user && onOpenSecurity && (
            <button
              onClick={onOpenSecurity}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition active:scale-95 text-slate-700 dark:text-slate-300"
              title={t('security_settings')}
              aria-label={t('security_settings')}
            >
              <Shield size={19} />
            </button>
          )}

          {user && (
            <button
              onClick={() => logout()}
              className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 transition active:scale-95"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={19} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
