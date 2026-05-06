import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import type { WealthData } from '../types';
import { card, Heading, Label, Mono, KpiCard, Empty, TabButton, baseChartOpts, chartColors } from '../ui';
import { fmtMoney, fmtPct, monthLabel } from '../format';
import {
  budgetMonths, totalIncome, totalSpend, savingsRate, surplus, rollingSurplus,
  cryptoExposurePct, totalNWForMonth, annualSpend, fiTarget,
} from '../calc';

export const AnalyticsTab: React.FC<{ d: WealthData }> = ({ d }) => {
  const [view, setView] = useState<'health' | 'trends' | 'savings'>('health');
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Heading className="text-3xl">Analytics</Heading>
        <div className="flex gap-2">
          <TabButton active={view === 'health'} onClick={() => setView('health')}>Health check</TabButton>
          <TabButton active={view === 'trends'} onClick={() => setView('trends')}>Trends</TabButton>
          <TabButton active={view === 'savings'} onClick={() => setView('savings')}>Savings rate</TabButton>
        </div>
      </div>
      {view === 'health' && <HealthCheck d={d} />}
      {view === 'trends' && <Trends d={d} />}
      {view === 'savings' && <SavingsRate d={d} />}
    </div>
  );
};

type Insight = { tone: 'green' | 'amber' | 'red'; title: string; msg: string };
const generateInsights = (d: WealthData): Insight[] => {
  const out: Insight[] = [];
  const months = budgetMonths(d);
  const last = months[months.length - 1];

  // Crypto exposure
  const invMonths = Array.from(new Set(d.investmentSnapshots.map(s => s.month))).sort();
  const lastInv = invMonths[invMonths.length - 1];
  if (lastInv) {
    const pct = cryptoExposurePct(d, lastInv);
    if (pct > 50) out.push({ tone: 'red', title: 'High crypto exposure', msg: `${pct.toFixed(0)}% of portfolio is in crypto. Consider rebalancing.` });
    else if (pct > 30) out.push({ tone: 'amber', title: 'Elevated crypto exposure', msg: `${pct.toFixed(0)}% of portfolio is in crypto — monitor closely.` });
  }

  // Negative NW
  const nwM = Array.from(new Set(d.nwSnapshots.map(s => s.month))).sort();
  const lastNW = nwM[nwM.length - 1];
  if (lastNW) {
    const total = totalNWForMonth(d, lastNW);
    if (total < 0) out.push({ tone: 'amber', title: 'Net worth is negative', msg: `Currently ${fmtMoney(total)} due to outstanding debt. Focus on debt reduction alongside savings.` });
  }

  // Savings rate
  if (last) {
    const sr = savingsRate(d, last);
    const target = Number(d.settings?.savings_rate_target ?? 30);
    if (sr < target * 0.7) out.push({ tone: 'red', title: 'Savings rate below target', msg: `Last month saved ${sr.toFixed(0)}% vs target ${target}%.` });
    else if (sr >= target) out.push({ tone: 'green', title: 'Savings rate on target', msg: `${sr.toFixed(0)}% saved last month — keep it up.` });
  }

  // Aggressive goal check
  d.goals.forEach(g => {
    const cur = g.linked_account_id
      ? Math.abs(Number(d.nwSnapshots.filter(s => s.account_id === g.linked_account_id).sort((a, b) => b.month.localeCompare(a.month))[0]?.value ?? 0))
      : d.bonusAllocations.filter(a => a.goal_id === g.id).reduce((a, x) => a + Number(x.amount), 0);
    const totalNW = lastNW ? totalNWForMonth(d, lastNW) : 0;
    if (g.name.includes('2026') && Number(g.target_amount) - totalNW > 50000) {
      out.push({ tone: 'amber', title: 'Aggressive 2026 NW target', msg: `Gap of ${fmtMoney(Number(g.target_amount) - totalNW)} in remaining months — review allocation.` });
    }
  });

  return out.slice(0, 5);
};

const HealthCheck: React.FC<{ d: WealthData }> = ({ d }) => {
  const insights = generateInsights(d);
  const months = budgetMonths(d);
  const last6 = months.slice(-6);
  const surplus3 = rollingSurplus(d, 3);
  const fi = fiTarget(d);
  const yrSpend = annualSpend(d);

  return (
    <>
      <div className={card + ' mb-5'}>
        <Label>Insights</Label>
        <div className="mt-3 space-y-3">
          {insights.length ? insights.map((i, idx) => (
            <div key={idx} className={`p-3 rounded-[8px] border ${i.tone === 'green' ? 'border-w-green/40 bg-w-green/5' : i.tone === 'amber' ? 'border-w-amber/40 bg-w-amber/5' : 'border-w-red/40 bg-w-red/5'}`}>
              <div className={`text-sm font-semibold ${i.tone === 'green' ? 'text-w-green' : i.tone === 'amber' ? 'text-w-amber' : 'text-w-red'}`}>{i.title}</div>
              <div className="text-xs text-w-muted mt-1">{i.msg}</div>
            </div>
          )) : <div className="text-sm text-w-muted">No insights yet — log a few months of data.</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Annual spend" value={fmtMoney(yrSpend, { compact: true })} />
        <KpiCard label="FI target" value={fmtMoney(fi, { compact: true })} />
        <KpiCard label="Surplus (3-mo)" value={fmtMoney(surplus3, { sign: true })} tone={surplus3 > 0 ? 'green' : 'red'} />
        <KpiCard label="Months tracked" value={months.length} />
      </div>

      <div className={card}>
        <Label>6-month savings rate</Label>
        <div className="h-64 mt-3">
          {last6.length ? (
            <Line
              data={{
                labels: last6.map(monthLabel),
                datasets: [{ label: 'Savings rate', data: last6.map(m => savingsRate(d, m)), borderColor: chartColors.green, backgroundColor: chartColors.green + '22', fill: true, tension: 0.3 }],
              }}
              options={{ ...baseChartOpts, scales: { x: baseChartOpts.scales.x, y: { ...baseChartOpts.scales.y, ticks: { ...baseChartOpts.scales.y.ticks, callback: (v: any) => `${v}%` } } } }}
            />
          ) : <Empty />}
        </div>
      </div>
    </>
  );
};

const Trends: React.FC<{ d: WealthData }> = ({ d }) => {
  const months = budgetMonths(d);
  const last = months[months.length - 1];
  const last3 = months.slice(-3);
  const last12 = months.slice(-12);
  const cats = [...d.budgetCategories].sort((a, b) => a.sort_order - b.sort_order);

  const avg = (mm: string[], catId: string) => {
    if (!mm.length) return 0;
    return mm.reduce((a, m) => a + Number(d.budgetSpending.find(s => s.month === m && s.category_id === catId)?.actual ?? 0), 0) / mm.length;
  };

  return (
    <div className={card + ' overflow-x-auto'}>
      <Label>Category trends</Label>
      <table className="w-full mt-3 text-sm">
        <thead><tr className="text-left text-xs text-w-muted border-b border-w-border">
          <th className="py-2">Category</th>
          <th className="py-2 text-right">This month</th>
          <th className="py-2 text-right">3-mo avg</th>
          <th className="py-2 text-right">12-mo avg</th>
          <th className="py-2 text-right">vs budget</th>
          <th className="py-2 text-right">Momentum</th>
        </tr></thead>
        <tbody>
          {cats.map(c => {
            const tm = last ? Number(d.budgetSpending.find(s => s.month === last && s.category_id === c.id)?.actual ?? 0) : 0;
            const a3 = avg(last3, c.id);
            const a12 = avg(last12, c.id);
            const vsB = c.budget > 0 ? (tm / Number(c.budget) - 1) * 100 : 0;
            const momUp = a3 > a12;
            return (
              <tr key={c.id} className="border-b border-w-border/50">
                <td className="py-2 text-w-text">{c.label}</td>
                <td className="py-2 text-right font-mono-w text-w-text">{fmtMoney(tm)}</td>
                <td className="py-2 text-right font-mono-w text-w-muted">{fmtMoney(a3)}</td>
                <td className="py-2 text-right font-mono-w text-w-muted">{fmtMoney(a12)}</td>
                <td className={`py-2 text-right font-mono-w ${vsB > 10 ? 'text-w-red' : vsB < -10 ? 'text-w-green' : 'text-w-text'}`}>{vsB >= 0 ? '+' : ''}{vsB.toFixed(0)}%</td>
                <td className={`py-2 text-right ${momUp ? 'text-w-red' : 'text-w-green'}`}>{momUp ? '↑' : '↓'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const SavingsRate: React.FC<{ d: WealthData }> = ({ d }) => {
  const months = budgetMonths(d).slice(-24);
  if (!months.length) return <Empty />;
  return (
    <div className={card}>
      <Label>24-month savings rate</Label>
      <div className="h-80 mt-3">
        <Line
          data={{
            labels: months.map(monthLabel),
            datasets: [{ label: 'Savings rate %', data: months.map(m => savingsRate(d, m)), borderColor: chartColors.green, backgroundColor: chartColors.green + '22', fill: true, tension: 0.3 }],
          }}
          options={{ ...baseChartOpts, scales: { x: baseChartOpts.scales.x, y: { ...baseChartOpts.scales.y, ticks: { ...baseChartOpts.scales.y.ticks, callback: (v: any) => `${v}%` } } } }}
        />
      </div>
    </div>
  );
};
