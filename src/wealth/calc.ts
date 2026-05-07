import type { WealthData } from './types';
import { monthsBetween, todayMonth, sortMonths } from './format';

export const allMonths = (d: WealthData): string[] => {
  const set = new Set<string>();
  d.nwSnapshots.forEach(s => set.add(s.month));
  d.investmentSnapshots.forEach(s => set.add(s.month));
  d.budgetMonths.forEach(s => set.add(s.month));
  return Array.from(set).sort(sortMonths);
};

export const nwMonths = (d: WealthData) =>
  Array.from(new Set(d.nwSnapshots.map(s => s.month))).sort(sortMonths);

export const investmentMonths = (d: WealthData) =>
  Array.from(new Set(d.investmentSnapshots.map(s => s.month))).sort(sortMonths);

export const budgetMonths = (d: WealthData) =>
  Array.from(new Set([
    ...d.budgetMonths.map(s => s.month),
    ...d.budgetExtras.map(s => s.month),
    ...d.budgetSpending.map(s => s.month),
  ])).sort(sortMonths);

export const totalNWForMonth = (d: WealthData, month: string) =>
  d.nwSnapshots.filter(s => s.month === month).reduce((a, s) => a + Number(s.value), 0);

export const liquidNWForMonth = (d: WealthData, month: string) => {
  const liquidIds = new Set(d.accounts.filter(a => a.liquid).map(a => a.id));
  return d.nwSnapshots.filter(s => s.month === month && liquidIds.has(s.account_id))
    .reduce((a, s) => a + Number(s.value), 0);
};

export const totalAssetsForMonth = (d: WealthData, month: string) =>
  d.nwSnapshots.filter(s => s.month === month && Number(s.value) > 0).reduce((a, s) => a + Number(s.value), 0);

export const debtRatio = (d: WealthData, month: string) => {
  const snaps = d.nwSnapshots.filter(s => s.month === month);
  const debts = snaps.filter(s => Number(s.value) < 0).reduce((a, s) => a + Math.abs(Number(s.value)), 0);
  const assets = snaps.filter(s => Number(s.value) > 0).reduce((a, s) => a + Number(s.value), 0);
  return assets > 0 ? debts / assets : 0;
};

export const totalIncome = (d: WealthData, month: string) => {
  const m = d.budgetMonths.find(b => b.month === month);
  const extras = d.budgetExtras.filter(e => e.month === month).reduce((a, e) => a + Number(e.amount), 0);
  return (m ? Number(m.salary) : 0) + extras;
};

export const totalSpend = (d: WealthData, month: string) =>
  d.budgetSpending.filter(s => s.month === month).reduce((a, s) => a + Number(s.actual), 0);

export const surplus = (d: WealthData, month: string) => totalIncome(d, month) - totalSpend(d, month);

export const savingsRate = (d: WealthData, month: string) => {
  const inc = totalIncome(d, month);
  if (inc <= 0) return 0;
  return (1 - totalSpend(d, month) / inc) * 100;
};

export const rollingSurplus = (d: WealthData, n = 3) => {
  const months = budgetMonths(d).slice(-n);
  if (!months.length) return 0;
  return months.reduce((a, m) => a + surplus(d, m), 0) / months.length;
};

export const totalPortfolio = (d: WealthData, month: string) =>
  d.investmentSnapshots.filter(s => s.month === month).reduce((a, s) => a + Number(s.value), 0);

export const totalContributed = (d: WealthData) =>
  d.investmentSnapshots.reduce((a, s) => a + Number(s.contribution), 0);

export const cryptoExposurePct = (d: WealthData, month: string) => {
  const total = totalPortfolio(d, month);
  if (total <= 0) return 0;
  const crypto = d.investmentBuckets.find(b => /crypto/i.test(b.label));
  if (!crypto) return 0;
  const v = d.investmentSnapshots.find(s => s.month === month && s.bucket_id === crypto.id);
  return v ? (Number(v.value) / total) * 100 : 0;
};

// Compute a goal's current value at a specific month (defaults to latest available data).
export const goalCurrentValueAt = (d: WealthData, goal: any, nwMonth?: string, invMonth?: string): number => {
  if (!goal) return 0;
  const source = goal.value_source || (goal.linked_account_id ? 'linked_account' : 'manual');

  if (source === 'net_worth') {
    const m = nwMonth ?? nwMonths(d).slice(-1)[0];
    if (!m) return 0;
    return d.nwSnapshots.filter(s => s.month === m).reduce((a, s) => a + Number(s.value), 0);
  }
  if (source === 'total_portfolio') {
    const m = invMonth ?? investmentMonths(d).slice(-1)[0];
    if (!m) return 0;
    return d.investmentSnapshots.filter(s => s.month === m).reduce((a, s) => a + Number(s.value), 0);
  }
  if (source === 'linked_account' && goal.linked_account_id) {
    const accSnaps = d.nwSnapshots.filter(s => s.account_id === goal.linked_account_id && (!nwMonth || s.month === nwMonth));
    if (!accSnaps.length) {
      // fallback to latest if filtered by month yields nothing
      if (nwMonth) {
        const all = d.nwSnapshots.filter(s => s.account_id === goal.linked_account_id);
        if (!all.length) return Number(goal.manual_current_value) || 0;
        const latest = all.sort((a, b) => sortMonths(b.month, a.month))[0];
        const v = Number(latest.value);
        if (v < 0) return Math.max(0, Number(goal.target_amount) - Math.abs(v));
        return v;
      }
      return Number(goal.manual_current_value) || 0;
    }
    const latest = accSnaps.sort((a, b) => sortMonths(b.month, a.month))[0];
    const v = Number(latest.value);
    if (v < 0) return Math.max(0, Number(goal.target_amount) - Math.abs(v));
    return v;
  }
  return Number(goal.manual_current_value) || 0;
};

export const goalCurrentValue = (d: WealthData, goalId: string): number => {
  const goal = d.goals.find(g => g.id === goalId);
  return goalCurrentValueAt(d, goal);
};

export const monthsUntil = (target: string) => Math.max(1, monthsBetween(todayMonth(), target));

export const needPerMonth = (d: WealthData, goalId: string) => {
  const g = d.goals.find(x => x.id === goalId);
  if (!g) return 0;
  return Math.max(0, (Number(g.target_amount) - goalCurrentValue(d, goalId)) / monthsUntil(g.target_date));
};

export const goalStatus = (d: WealthData, goalId: string): 'on-track' | 'at-risk' | 'off-track' => {
  const g = d.goals.find(x => x.id === goalId);
  if (!g) return 'off-track';
  const allocated = rollingSurplus(d, 3) * (Number(g.allocation_pct) / 100);
  const need = needPerMonth(d, goalId);
  if (need === 0) return 'on-track';
  if (allocated >= need * 0.9) return 'on-track';
  if (allocated >= need * 0.6) return 'at-risk';
  return 'off-track';
};

export const annualSpend = (d: WealthData) => {
  const months = budgetMonths(d).slice(-12);
  if (!months.length) return 0;
  const avg = months.reduce((a, m) => a + totalSpend(d, m), 0) / months.length;
  return avg * 12;
};

export const fiTarget = (d: WealthData) => annualSpend(d) * (Number(d.settings?.fi_multiplier ?? 25));
