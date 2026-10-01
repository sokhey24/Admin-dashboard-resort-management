export const KHR_RATE = 4100;

/**
 * Format USD amount with standard two decimals
 */
export function formatMoneyUsd(amount) {
  return `$${(Number(amount) || 0).toFixed(2)}`;
}

/**
 * Format currency with dual USD and KHR support
 * If USD: $150.00
 * If KHR: 615,000 ៛
 */
export function formatCurrency(amountUSD, currency = 'USD') {
  const amount = Number(amountUSD) || 0;
  if (currency === 'KHR') {
    const khr = Math.round(amount * KHR_RATE);
    return `${khr.toLocaleString('en-US')} ៛`;
  }
  return formatMoneyUsd(amount);
}

/**
 * Formatter function formatPrice(amountInUSD, targetCurrency = 'USD')
 */
export function formatPrice(amountInUSD, targetCurrency = 'USD') {
  return formatCurrency(amountInUSD, targetCurrency);
}

export function calculateNights(checkIn, checkOut) {
  try {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    return diff > 0 ? Math.round(diff) : 1;
  } catch {
    return 1;
  }
}
