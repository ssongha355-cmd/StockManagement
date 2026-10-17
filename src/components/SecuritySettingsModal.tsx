import React, { useState, useEffect } from 'react';
import { Shield, Lock, X, Check, KeyRound, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { UserSettings } from '../types';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  onLockNow: () => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  userSettings,
  onUpdateSettings,
  onLockNow,
}) => {
  const { t } = useLanguage();
  const [isEnabled, setIsEnabled] = useState<boolean>(!!userSettings.isAppLockEnabled);
  const [pin, setPin] = useState<string>(userSettings.pinCode || '');
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsEnabled(!!userSettings.isAppLockEnabled);
      setPin(userSettings.pinCode || '');
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen, userSettings]);

  if (!isOpen) return null;

  const handleToggleLock = async () => {
    const nextState = !isEnabled;
    if (nextState && pin.trim().length !== 4) {
      setErrorMsg(t('pin_four_digits_required'));
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      await onUpdateSettings({
        isAppLockEnabled: nextState,
        pinCode: pin.trim(),
      });
      setIsEnabled(nextState);
      setSuccessMsg(nextState ? t('pin_saved_success') : null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update security settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().length !== 4 || !/^\d{4}$/.test(pin.trim())) {
      setErrorMsg(t('pin_four_digits_required'));
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      await onUpdateSettings({
        pinCode: pin.trim(),
      });
      setSuccessMsg(t('pin_saved_success'));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save PIN');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-white/10 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t('security_settings')}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t('biometric_pin_lock')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-5">
          {/* Toggle App Lock Card */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <div className="pr-3">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {t('enable_app_lock')}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                {t('biometric_pin_desc')}
              </div>
            </div>

            {/* iOS Style Switch */}
            <button
              type="button"
              onClick={handleToggleLock}
              disabled={saving}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={isEnabled}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* PIN Setup Form */}
          <form onSubmit={handleSavePin} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5 mb-1.5">
                <KeyRound size={14} className="text-blue-500" />
                {t('set_pin')}
              </span>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                }}
                placeholder="••••"
                className="w-full text-center text-2xl tracking-[0.6em] font-mono py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </label>

            <button
              type="submit"
              disabled={saving || pin.length !== 4}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-xs tracking-wide transition active:scale-[0.99] shadow-sm shadow-blue-500/20"
            >
              {t('save')}
            </button>
          </form>

          {/* Notifications */}
          {successMsg && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
              <Check size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200/50 dark:border-rose-800/30">
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Lock Now Button */}
          {isEnabled && (
            <div className="pt-2 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={onLockNow}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-semibold text-xs transition active:scale-[0.99] border border-rose-200/60 dark:border-rose-800/30"
              >
                <Lock size={15} />
                {t('lock_now')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
