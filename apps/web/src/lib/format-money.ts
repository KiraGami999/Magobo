/** Formats integer minor units for display (e.g. 150000 → "1,500.00 MWK"). */
export function formatMinorCurrency(minor: number | null, currency = 'MWK'): string {
  if (minor === null) return '—';
  const major = minor / 100;
  return `${major.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatGigBudget(minMinor: number | null, maxMinor: number | null, currency: string): string {
  if (minMinor !== null && maxMinor !== null && minMinor !== maxMinor) {
    return `${formatMinorCurrency(minMinor, currency)} – ${formatMinorCurrency(maxMinor, currency)}`;
  }
  return formatMinorCurrency(maxMinor ?? minMinor, currency);
}
