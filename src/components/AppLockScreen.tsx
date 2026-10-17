import React, { useState, useEffect, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { updateUserSettings } from '../services/portfolioService';
import { Lock, Fingerprint, Delete, AlertCircle, LogOut, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AppLockScreenProps {
  pinCode?: string;
  onUnlock: () => void;
  onLogout?: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({ pinCode, onUnlock, onLogout }) => {
  const { t } = useLanguage();
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const attemptBiometric = useCallback(async () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return;
    }

    try {
      setIsAuthenticating(true);

      const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.();
      if (!isAvailable) {
        return;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Trigger native biometric prompt if platform supports it
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'preferred',
        },
      });

      if (assertion) {
        onUnlock();
      }
    } catch (err) {
      // Gracefully catch cancellation, timeout, or lack of enrolled passkeys
      console.debug('Biometric prompt dismissed or not configured:', err);
    } finally {
      setIsAuthenticating(false);
    }
  }, [onUnlock]);

  // Try biometric prompt automatically once on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      attemptBiometric();
    }, 400);
    return () => clearTimeout(timer);
  }, [attemptBiometric]);

  // Handle PIN verification
  const handleDigitPress = (digit: string) => {
    if (pin.length >= 4) return;
    setIsError(false);

    const nextPin = pin + digit;
    setPin(nextPin);

    if (nextPin.length === 4) {
      // Verify PIN
      if (!pinCode || nextPin === pinCode) {
        setTimeout(() => {
          onUnlock();
        }, 150);
      } else {
        // Incorrect PIN
        setTimeout(() => {
          setIsError(true);
          setShake(true);
          if (navigator.vibrate) {
            navigator.vibrate([80, 50, 80]);
          }
          setTimeout(() => {
            setShake(false);
            setPin('');
          }, 600);
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setIsError(false);
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleLogoutToReset = async () => {
    if (isResetting) return;
    try {
      setIsResetting(true);
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Crucial: Update settings to disable app lock and reset PIN before signing out.
        // This ensures the write succeeds under Firestore security rules (auth.uid === userId).
        await updateUserSettings(currentUser.uid, {
          isAppLockEnabled: false,
          pinCode: '',
        });
      }
      sessionStorage.removeItem('app_unlocked');
      if (onLogout) {
        onLogout();
      }
      await signOut(auth);
    } catch (err) {
      console.error('Failed to reset app lock and sign out:', err);
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 dark:bg-black/95 backdrop-blur-2xl flex flex-col justify-between items-center py-10 px-6 text-white select-none">
      {/* Top Header */}
      <div className="flex flex-col items-center mt-6 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-5 border border-white/10">
          <Lock size={36} className="text-white drop-shadow-md" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
          {t('app_locked')}
        </h1>
        <p className="text-sm text-slate-400 max-w-xs">
          {t('authenticate_to_unlock')}
        </p>

        {/* 4-Digit PIN Indicators */}
        <div className={`flex items-center space-x-5 mt-8 mb-2 transition-transform ${shake ? 'translate-x-[-8px] animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isError
                    ? 'bg-rose-500 border-2 border-rose-400 scale-110 shadow-lg shadow-rose-500/50'
                    : isFilled
                    ? 'bg-blue-500 border-2 border-blue-400 scale-125 shadow-lg shadow-blue-500/50'
                    : 'border-2 border-slate-600 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        <div className="h-6 flex items-center justify-center">
          {isError && (
            <p className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 animate-pulse">
              <AlertCircle size={14} />
              {t('incorrect_pin')}
            </p>
          )}
        </div>

        {/* Secure Recovery: Forgot PIN / Log out */}
        <button
          type="button"
          onClick={handleLogoutToReset}
          disabled={isResetting}
          className="mt-3 text-xs text-slate-400 hover:text-white transition active:scale-95 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 disabled:opacity-50"
        >
          {isResetting ? (
            <>
              <Loader2 size={13} className="animate-spin text-blue-400" />
              <span className="text-slate-400">{t('please_wait')}</span>
            </>
          ) : (
            <>
              <LogOut size={13} className="text-slate-400" />
              <span className="font-medium text-slate-300 hover:text-white">{t('forgot_pin')}</span>
              <span className="text-slate-600">•</span>
              <span className="underline underline-offset-4 text-blue-400 hover:text-blue-300 font-medium">
                {t('logout_to_reset')}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Touch Keypad */}
      <div className="w-full max-w-xs flex flex-col gap-4 mb-4">
        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-4">
          {['1', '2', '3'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitPress(num)}
              className="h-18 aspect-square rounded-full bg-white/10 hover:bg-white/15 active:bg-white/25 active:scale-90 transition-all duration-150 flex items-center justify-center font-semibold text-2xl text-white shadow-sm border border-white/5 mx-auto w-full max-w-[76px]"
            >
              {num}
            </button>
          ))}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-4">
          {['4', '5', '6'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitPress(num)}
              className="h-18 aspect-square rounded-full bg-white/10 hover:bg-white/15 active:bg-white/25 active:scale-90 transition-all duration-150 flex items-center justify-center font-semibold text-2xl text-white shadow-sm border border-white/5 mx-auto w-full max-w-[76px]"
            >
              {num}
            </button>
          ))}
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-3 gap-4">
          {['7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitPress(num)}
              className="h-18 aspect-square rounded-full bg-white/10 hover:bg-white/15 active:bg-white/25 active:scale-90 transition-all duration-150 flex items-center justify-center font-semibold text-2xl text-white shadow-sm border border-white/5 mx-auto w-full max-w-[76px]"
            >
              {num}
            </button>
          ))}
        </div>

        {/* Row 4 (Biometrics, 0, Backspace) */}
        <div className="grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={attemptBiometric}
            disabled={isAuthenticating}
            title={t('use_biometrics')}
            className="h-18 aspect-square rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 active:scale-90 transition-all duration-150 flex flex-col items-center justify-center font-medium shadow-sm border border-blue-500/20 mx-auto w-full max-w-[76px]"
          >
            <Fingerprint size={28} className={isAuthenticating ? 'animate-pulse' : ''} />
          </button>

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="h-18 aspect-square rounded-full bg-white/10 hover:bg-white/15 active:bg-white/25 active:scale-90 transition-all duration-150 flex items-center justify-center font-semibold text-2xl text-white shadow-sm border border-white/5 mx-auto w-full max-w-[76px]"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            aria-label="Delete"
            className="h-18 aspect-square rounded-full hover:bg-white/10 active:scale-90 transition-all duration-150 flex items-center justify-center text-slate-300 mx-auto w-full max-w-[76px]"
          >
            <Delete size={26} />
          </button>
        </div>
      </div>
    </div>
  );
};
