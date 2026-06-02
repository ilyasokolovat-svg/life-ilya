import type { WealthData, NWSnapshot } from '@/wealth/types';
import { parseEntryDate, sortByDateAsc, sortByDateDesc } from './utils';
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

const linkedAccountForGoal = (d: WealthData, g: any) =>
  g.linked_account_id ? d.accounts.find(a => a.id === g.linked_account_id) : undefined;

const isDebtAccount = (account: ReturnType<typeof linkedAccountForGoal>): boolean => {
  if (!account) return false;
  const label = account.label.toLowerCase();
  return account.type === 'debt' || label.includes('loan') || label.includes('debt') || label.includes('credit');
};

// Latest balance for a given account (returns raw stored value — debts are negative).
export const latestAccountValue = (d: WealthData, accountId: string | undefined): { value: number; date: string | null } => {
  if (!accountId) return { value: 0, date: null };
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

// Starting value of the metric a goal tracks, at (or closest before) the goal's creation date.
const goalStartingValue = (d: WealthData, g: any): number => {
  const source = g.value_source || 'net_worth';
  const createdAt = g.created_at ? new Date(g.created_at) : null;
  const ts = createdAt ? createdAt.getTime() : Date.now();

  if (source === 'net_worth') {
    const series = netWorthSeries(d);
    let v = series.length ? series[0].value : 0;
    for (const s of series) {
      if (parseEntryDate(s.date).getTime() <= ts) v = s.value;
      else break;
    }
    return v;
  }
  if (source === 'total_portfolio') {
    const dates = investmentDates(d);
    let v = dates.length ? totalInvestmentsAt(d, dates[0]) : 0;
    for (const dt of dates) {
      if (parseEntryDate(dt).getTime() <= ts) v = totalInvestmentsAt(d, dt);
      else break;
    }
    return v;
  }
  if (source === 'linked_bucket' || source === 'linked_account') {
    const bucketSnaps = sortByDateAsc(d.investmentSnapshots.filter(s => s.bucket_id === g.linked_account_id));
    if (bucketSnaps.length) {
      let v = Number(bucketSnaps[0].value);
      for (const s of bucketSnaps) {
        if (parseEntryDate(s.month).getTime() <= ts) v = Number(s.value);
        else break;
      }
      return v;
    }

    const accountSnaps = sortByDateAsc(d.nwSnapshots.filter(s => s.account_id === g.linked_account_id));
    if (accountSnaps.length) {
      let v = Math.abs(Number(accountSnaps[0].value));
      for (const s of accountSnaps) {
        if (parseEntryDate(s.month).getTime() <= ts) v = Math.abs(Number(s.value));
        else break;
      }
      return v;
    }
  }
  return goalCurrent(d, g);
};

const monthsSince = (iso: string | null | undefined): number => {
  if (!iso) return 0;
  const start = new Date(iso);
  const now = new Date();
  return Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
};

const isPaydownGoal = (d: WealthData, g: any, start: number, target: number): boolean =>
  isDebtAccount(linkedAccountForGoal(d, g)) || start > target;

const effectiveGoalTarget = (d: WealthData, g: any, target: number): number =>
  isDebtAccount(linkedAccountForGoal(d, g)) ? 0 : target;

export type GoalProgressDetails = {
  current: number;
  target: number;
  effectiveTarget: number;
  baseline: number;
  progressValue: number;
  remaining: number;
  pct: number;
  isPaydown: boolean;
};

export const goalProgressDetails = (d: WealthData, g: any): GoalProgressDetails => {
  const target = Number(g.target_amount) || 0;
  const current = goalCurrent(d, g);
  const start = goalStartingValue(d, g);
  const isPaydown = isPaydownGoal(d, g, start, target);
  const effectiveTarget = isPaydown ? effectiveGoalTarget(d, g, target) : target;

  if (isPaydown) {
    const baseline = Math.max(start, current, target, 1);
    const totalPaydown = Math.max(1, baseline - effectiveTarget);
    const progressValue = Math.min(totalPaydown, Math.max(0, baseline - current));
    return {
      current,
      target,
      effectiveTarget,
      baseline,
      progressValue,
      remaining: Math.max(0, current - effectiveTarget),
      pct: Math.min(100, Math.max(0, (progressValue / totalPaydown) * 100)),
      isPaydown,
    };
  }

  const safeTarget = Math.max(1, target);
  return {
    current,
    target,
    effectiveTarget,
    baseline: 0,
    progressValue: current,
    remaining: Math.max(0, target - current),
    pct: Math.min(100, Math.max(0, (current / safeTarget) * 100)),
    isPaydown,
  };
};

export const goalStatus = (d: WealthData, g: any): GoalStatus => {
  const storedTarget = Number(g.target_amount) || 0;
  const current = goalCurrent(d, g);
  const planned = Number(g.planned_monthly_contribution) || 0;
  const start = goalStartingValue(d, g);
  const isPaydown = isPaydownGoal(d, g, start, storedTarget);
  const target = isPaydown ? effectiveGoalTarget(d, g, storedTarget) : storedTarget;

  if (isPaydown ? current <= target : current >= target) return 'complete';

  if (planned > 0) {
    const months = monthsSince(g.created_at);
    if (isPaydown) {
      const expected = Math.max(target, start - planned * months);
      const plannedProgress = start - expected;
      const actualProgress = start - current;
      if (plannedProgress <= 0) return 'on-track';
      const ratio = actualProgress / plannedProgress;
      if (ratio >= 0.9) return 'on-track';
      if (ratio >= 0.7) return 'at-risk';
      return 'behind';
    }
    const expected = start + planned * months;
    if (expected <= 0) return 'on-track';
    const ratio = current / expected;
    if (ratio >= 0.9) return 'on-track';
    if (ratio >= 0.7) return 'at-risk';
    return 'behind';
  }

  const deadline = parseEntryDate(g.target_date);
  const now = new Date();
  const monthsLeft = Math.max(0, (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (monthsLeft <= 0) return (isPaydown ? current <= target : current >= target) ? 'complete' : 'behind';

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
  const storedTarget = Number(g.target_amount) || 0;
  const current = goalCurrent(d, g);
  const start = goalStartingValue(d, g);
  const isPaydown = isPaydownGoal(d, g, start, storedTarget);
  const target = isPaydown ? effectiveGoalTarget(d, g, storedTarget) : storedTarget;
  const remaining = isPaydown ? Math.max(0, current - target) : Math.max(0, target - current);

  const planned = Number(g.planned_monthly_contribution) || 0;
  if (planned > 0) {
    const monthsNeeded = remaining / planned;
    const d2 = new Date();
    d2.setMonth(d2.getMonth() + Math.ceil(monthsNeeded));
    return d2;
  }

  if (isPaydown) return null;

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


// === Investment flows (contributions / withdrawals) ===

// Per-month sum of contributions across all buckets (negative = withdrawal).
export const monthlyContributions = (d: WealthData): { month: string; contribution: number }[] => {
  const map = new Map<string, number>();
  for (const s of d.investmentSnapshots) {
    const m = s.month;
    map.set(m, (map.get(m) ?? 0) + Number(s.contribution || 0));
  }
  return Array.from(map.entries())
    .map(([month, contribution]) => ({ month, contribution }))
    .sort((a, b) => parseEntryDate(a.month).getTime() - parseEntryDate(b.month).getTime());
};

// Cumulative contributions over time (running sum). One point per investment date.
export const cumulativeContributions = (d: WealthData): { date: string; cumulative: number; portfolio: number }[] => {
  const dates = investmentDates(d);
  let running = 0;
  return dates.map(dt => {
    const c = d.investmentSnapshots
      .filter(s => s.month === dt)
      .reduce((a, s) => a + Number(s.contribution || 0), 0);
    running += c;
    return { date: dt, cumulative: running, portfolio: totalInvestmentsAt(d, dt) };
  });
};

// Combined series: bonus received, contribution (positive), withdrawal (negative bar).
export const bonusVsInvestedSeries = (d: WealthData): {
  month: string;
  bonus: number;
  contribution: number;
  withdrawal: number;
  perBucket: Record<string, number>;
}[] => {
  const months = new Set<string>();
  d.budgetExtras.filter(e => e.type === 'bonus').forEach(e => months.add(e.month.slice(0, 7)));
  d.investmentSnapshots.forEach(s => { if (Number(s.contribution || 0) !== 0) months.add(s.month.slice(0, 7)); });

  const rows = Array.from(months).sort();
  return rows.map(m => {
    const bonus = d.budgetExtras
      .filter(e => e.type === 'bonus' && e.month.slice(0, 7) === m)
      .reduce((a, e) => a + Number(e.amount), 0);
    const snaps = d.investmentSnapshots.filter(s => s.month.slice(0, 7) === m);
    const net = snaps.reduce((a, s) => a + Number(s.contribution || 0), 0);
    const perBucket: Record<string, number> = {};
    for (const b of d.investmentBuckets) {
      perBucket[b.id] = snaps
        .filter(s => s.bucket_id === b.id)
        .reduce((a, s) => a + Number(s.contribution || 0), 0);
    }
    return {
      month: m,
      bonus,
      contribution: Math.max(0, net),
      withdrawal: Math.min(0, net),
      perBucket,
    };
  });
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
