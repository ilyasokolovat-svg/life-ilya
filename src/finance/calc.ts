import type { WealthData, InvestmentSnapshot, NWSnapshot } from '@/wealth/types';
import { parseEntryDate, sortByDateAsc, sortByDateDesc, monthOf } from './utils';
import { VIRTUAL_INVESTMENT_ACCOUNT_ID } from '@/wealth/useWealthData';

// All unique entry dates (months) where investments were logged, ascending.
export const investmentDates = (d: WealthData): string[] =>
  Array.from(new Set(d.investmentSnapshots.map(s => s.month)))
    .sort((a, b) => parseEntryDate(a).getTime() - parseEntryDate(b).getTime());

// Sum of investment_snapshots for a given entry date.
export const totalInvestmentsAt = (d: WealthData, entryDate: string): number =>
  d.investmentSnapshots
    .filter(s => s.month === entryDate)
    .reduce((a, s) => a + Number(s.value), 0);

// Latest investments total (most recent date).
export const latestInvestmentDate = (d: WealthData): string | null => {
  const dates = investmentDates(d);
  return dates.length ? dates[dates.length - 1] : null;
};

export const latestInvestmentsTotal = (d: WealthData): number => {
  const dt = latestInvestmentDate(d);
  return dt ? totalInvestmentsAt(d, dt) : 0;
};

// Real (non-synthetic) NW snapshots only.
export const realNwSnapshots = (d: WealthData): NWSnapshot[] =>
  d.nwSnapshots.filter(s => s.account_id !== VIRTUAL_INVESTMENT_ACCOUNT_ID);

// Find the credit card / car loan account by name (case-insensitive).
export const findAccount = (d: WealthData, predicate: (label: string) => boolean) =>
  d.accounts.find(a => a.id !== VIRTUAL_INVESTMENT_ACCOUNT_ID && predicate(a.label.toLowerCase()));

export const ccAccount = (d: WealthData) => findAccount(d, l => l.includes('credit'));
export const carLoanAccount = (d: WealthData) => findAccount(d, l => l.includes('car') && l.includes('loan'));
export const cashAccount = (d: WealthData) => findAccount(d, l => l.includes('cash'));

// Latest balance for a given account (returns raw stored value — debts are negative).
export const latestAccountValue = (d: WealthData, accountId: string | undefined): { value: number; date: string | null } => {
  if (!accountId) return { value: 0, date: null };
  const snaps = sortByDateDesc(realNwSnapshots().concat([] as any) ? [] : []);
  const filtered = sortByDateDesc(d.nwSnapshots.filter(s => s.account_id === accountId));
  if (!filtered.length) return { value: 0, date: null };
  return { value: Number(filtered[0].value), date: filtered[0].month };
};

// Net worth = sum of investments - credit card balance (absolute).
// Car loan EXCLUDED from NW calc per spec.
export const computeNetWorth = (investments: number, ccBalanceAbs: number): number =>
  investments - ccBalanceAbs;

// Net worth series across all historical entries. We treat investment snapshot dates
// as the canonical timeline; for each date we use the latest CC balance ≤ that date.
export const netWorthSeries = (d: WealthData): { date: string; value: number; investments: number; cc: number }[] => {
  const cc = ccAccount(d);
  const ccSnaps = cc ? sortByDateAsc(d.nwSnapshots.filter(s => s.account_id === cc.id)) : [];

  const ccBalanceAt = (entryDate: string): number => {
    if (!ccSnaps.length) return 0;
    const t = parseEntryDate(entryDate).getTime();
    let bal = 0;
    for (const s of ccSnaps) {
      if (parseEntryDate(s.month).getTime() <= t) bal = Math.abs(Number(s.value));
      else break;
    }
    return bal;
  };

  return investmentDates(d).map(dt => {
    const inv = totalInvestmentsAt(d, dt);
    const ccB = ccBalanceAt(dt);
    return { date: dt, investments: inv, cc: ccB, value: computeNetWorth(inv, ccB) };
  });
};

// Latest net worth and previous (for delta).
export const latestNetWorth = (d: WealthData): { value: number; prev: number; date: string | null; investments: number; cc: number } => {
  const series = netWorthSeries(d);
  if (!series.length) return { value: 0, prev: 0, date: null, investments: 0, cc: 0 };
  const last = series[series.length - 1];
  const prev = series.length > 1 ? series[series.length - 2].value : last.value;
  return { value: last.value, prev, date: last.date, investments: last.investments, cc: last.cc };
};

// Latest value per bucket (most recent snapshot for that bucket).
export const latestBucketValues = (d: WealthData): { bucketId: string; value: number }[] => {
  return d.investmentBuckets.map(b => {
    const snaps = sortByDateDesc(d.investmentSnapshots.filter(s => s.bucket_id === b.id));
    return { bucketId: b.id, value: snaps.length ? Number(snaps[0].value) : 0 };
  });
};

// Per-bucket stacked area chart series across all snapshot dates.
// For each date, returns { date, [bucketId]: value }.
export const bucketStackSeries = (d: WealthData) => {
  const dates = investmentDates(d);
  return dates.map(dt => {
    const row: any = { date: dt };
    for (const b of d.investmentBuckets) {
      const snap = d.investmentSnapshots.find(s => s.month === dt && s.bucket_id === b.id);
      row[b.id] = snap ? Number(snap.value) : 0;
    }
    return row;
  });
};

// Goal current value resolution per spec.
export const goalCurrent = (d: WealthData, g: any): number => {
  const source = g.value_source || 'net_worth';
  if (source === 'net_worth') return latestNetWorth(d).value;
  if (source === 'total_portfolio') return latestInvestmentsTotal(d);
  if (source === 'linked_bucket' || (source === 'linked_account' && g.linked_account_id)) {
    // linked_account_id holds either bucket id or account id; try bucket first
    const bucketSnap = sortByDateDesc(d.investmentSnapshots.filter(s => s.bucket_id === g.linked_account_id));
    if (bucketSnap.length) return Number(bucketSnap[0].value);
    const accSnap = sortByDateDesc(d.nwSnapshots.filter(s => s.account_id === g.linked_account_id));
    if (accSnap.length) return Math.abs(Number(accSnap[0].value));
    return Number(g.manual_current_value) || 0;
  }
  return Number(g.manual_current_value) || 0;
};

// Goal status — On track if projected completion <= deadline, Behind if >20% behind pace, At risk otherwise.
// Pace = current / target. Time elapsed % = elapsed / total duration.
// We approximate "projected completion" using linear pace from project start (= goal creation or 6 months ago).
export type GoalStatus = 'complete' | 'on-track' | 'at-risk' | 'behind';

export const goalStatus = (d: WealthData, g: any): GoalStatus => {
  const target = Number(g.target_amount) || 0;
  const current = goalCurrent(d, g);
  if (target > 0 && current >= target) return 'complete';

  const deadline = parseEntryDate(g.target_date);
  const now = new Date();
  const monthsLeft = Math.max(0, (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (monthsLeft <= 0) return current >= target ? 'complete' : 'behind';

  // Assume 36-month default planning window if no anchor. Use NW series to get pace.
  const series = netWorthSeries(d);
  let monthlyPace = 0;
  if (series.length >= 2) {
    const first = series[0];
    const last = series[series.length - 1];
    const months = Math.max(1, (parseEntryDate(last.date).getTime() - parseEntryDate(first.date).getTime()) / (1000 * 60 * 60 * 24 * 30));
    monthlyPace = (last.value - first.value) / months;
  }
  const remaining = Math.max(0, target - current);
  const monthsNeeded = monthlyPace > 0 ? remaining / monthlyPace : Infinity;
  const ratio = monthsNeeded / monthsLeft;

  if (ratio <= 1) return 'on-track';
  if (ratio <= 1.2) return 'at-risk';
  return 'behind';
};

export const goalProjectedDate = (d: WealthData, g: any): Date | null => {
  const target = Number(g.target_amount) || 0;
  const current = goalCurrent(d, g);
  const remaining = Math.max(0, target - current);
  const series = netWorthSeries(d);
  if (series.length < 2) return null;
  const first = series[0];
  const last = series[series.length - 1];
  const months = Math.max(1, (parseEntryDate(last.date).getTime() - parseEntryDate(first.date).getTime()) / (1000 * 60 * 60 * 24 * 30));
  const monthlyPace = (last.value - first.value) / months;
  if (monthlyPace <= 0) return null;
  const monthsNeeded = remaining / monthlyPace;
  const d2 = new Date();
  d2.setMonth(d2.getMonth() + Math.ceil(monthsNeeded));
  return d2;
};

// Compounding projection per spec.
export type ProjectionResult = { year: number; value: number }[];

export const projectPortfolio = (params: {
  startBalance: number;
  monthlySavings: number;
  quarterlyBonus: number;
  annualReturnPct: number;
  startYear: number;
  endYear: number;
}): ProjectionResult => {
  const { startBalance, monthlySavings, quarterlyBonus, annualReturnPct, startYear, endYear } = params;
  const monthlyRate = annualReturnPct / 100 / 12;
  let balance = startBalance;
  const out: ProjectionResult = [{ year: startYear, value: balance }];
  let month = 0;
  for (let y = startYear; y < endYear; y++) {
    for (let mIdx = 0; mIdx < 12; mIdx++) {
      balance = balance * (1 + monthlyRate) + monthlySavings;
      month++;
      if (month % 3 === 0) balance += quarterlyBonus;
    }
    out.push({ year: y + 1, value: balance });
  }
  return out;
};

// Find first year a projection crosses target.
export const yearAtTarget = (proj: ProjectionResult, target: number): number | null => {
  for (const p of proj) if (p.value >= target) return p.year;
  return null;
};
