// Currency state — values are stored in USD, displayed in selected currency.
export const AED_PER_USD = 3.65;
let _displayCurrency: 'USD' | 'AED' = 'USD';
const listeners = new Set<() => void>();
export const setDisplayCurrency = (c: 'USD' | 'AED') => {
  if (_displayCurrency === c) return;
  _displayCurrency = c;
  listeners.forEach(fn => fn());
};
export const getDisplayCurrency = () => _displayCurrency;
export const onCurrencyChange = (fn: () => void) => { listeners.add(fn); return () => listeners.delete(fn); };

// Convert a USD amount to display currency
export const toDisplay = (usd: number) => _displayCurrency === 'AED' ? usd * AED_PER_USD : usd;
// Convert from display currency back to USD (for storage)
export const fromDisplay = (v: number) => _displayCurrency === 'AED' ? v / AED_PER_USD : v;

export const fmtMoney = (n: number, opts: { sign?: boolean; compact?: boolean } = {}) => {
  const v = toDisplay(n);
  const abs = Math.abs(v);
  const formatted = opts.compact && abs >= 1000
    ? abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)}M` : `${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`
    : abs.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const sign = v < 0 ? '−' : opts.sign && v > 0 ? '+' : '';
  const symbol = _displayCurrency === 'AED' ? 'AED ' : '$';
  return _displayCurrency === 'AED' ? `${sign}${symbol}${formatted}` : `${sign}${symbol}${formatted}`;
};
export const fmtPct = (n: number, digits = 1) => `${n >= 0 ? '' : ''}${n.toFixed(digits)}%`;
export const monthLabel = (m: string) => {
  const [y, mo] = m.split('-');
  const d = new Date(Number(y), Number(mo) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};
export const todayMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
export const monthsBetween = (from: string, to: string) => {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
};
export const sortMonths = (a: string, b: string) => a.localeCompare(b);
