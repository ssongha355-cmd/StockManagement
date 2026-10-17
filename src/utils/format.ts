import { Currency } from '../types';

export function getCurrencySymbol(currency?: Currency): string {
  return currency === 'USD' ? '$' : '៛';
}

export function getCurrencyDecimals(currency?: Currency): number {
  return currency === 'USD' ? 2 : 0;
}

export function formatCurrency(
  amount: number,
  currency?: Currency,
  options?: {
    includeSign?: boolean;
  }
): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const symbol = getCurrencySymbol(currency);
  const decimals = getCurrencyDecimals(currency);
  const isNegative = safeAmount < 0;
  const absAmount = Math.abs(safeAmount);

  const formattedAbs = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  if (options?.includeSign) {
    if (safeAmount > 0) return `+${symbol}${formattedAbs}`;
    if (safeAmount < 0) return `-${symbol}${formattedAbs}`;
    return `${symbol}${formattedAbs}`;
  }

  if (isNegative) {
    return `-${symbol}${formattedAbs}`;
  }

  return `${symbol}${formattedAbs}`;
}
