export const fmtMoney = (n: number, opts: { sign?: boolean; compact?: boolean } = {}) => {
  const abs = Math.abs(n);
  const formatted = opts.compact && abs >= 1000
    ? abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)}M` : `${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`
    : abs.toLocaleString('en-US', { maximumFractionDigits: 0 });
  const sign = n < 0 ? '−' : opts.sign && n > 0 ? '+' : '';
  return `${sign}$${formatted}`;
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
