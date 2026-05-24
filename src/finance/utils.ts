import { format, parseISO, isValid } from 'date-fns';

// month column is text — may be YYYY-MM or YYYY-MM-DD
export const parseEntryDate = (m: string): Date => {
  if (!m) return new Date();
  const s = m.length === 7 ? `${m}-01` : m;
  const d = parseISO(s);
  return isValid(d) ? d : new Date();
};

export const monthOf = (m: string) => (m || '').slice(0, 7);
export const todayISO = () => format(new Date(), 'yyyy-MM-dd');
export const todayMonth = () => format(new Date(), 'yyyy-MM');

export const fmtUSD = (v: number, opts: { compact?: boolean; sign?: boolean } = {}) => {
  const sign = opts.sign && v > 0 ? '+' : '';
  const abs = Math.abs(v);
  if (opts.compact) {
    if (abs >= 1_000_000) return `${sign}${v < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(2)}M`;
    if (abs >= 1_000) return `${sign}${v < 0 ? '-' : ''}$${Math.round(abs / 1000)}K`;
  }
  return `${sign}${v < 0 ? '-' : ''}$${Math.round(abs).toLocaleString('en-US')}`;
};

export const fmtPct = (v: number, digits = 1) => `${v >= 0 ? '' : ''}${v.toFixed(digits)}%`;

export const fmtDate = (m: string, pattern = 'MMM d, yyyy') => format(parseEntryDate(m), pattern);
export const fmtMonth = (m: string) => format(parseEntryDate(m), 'MMM yyyy');

export const sortByDateAsc = <T extends { month: string }>(arr: T[]) =>
  [...arr].sort((a, b) => parseEntryDate(a.month).getTime() - parseEntryDate(b.month).getTime());

export const sortByDateDesc = <T extends { month: string }>(arr: T[]) =>
  [...arr].sort((a, b) => parseEntryDate(b.month).getTime() - parseEntryDate(a.month).getTime());
