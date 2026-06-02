import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, LineChart, Line, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { WealthData } from '@/wealth/types';
import { fmtUSD, fmtDate, fmtMonth, parseEntryDate, sortByDateAsc, sortByDateDesc } from '../utils';
import { COLORS } from '../constants';
import { bucketStackSeries, ccAccount, carLoanAccount, investmentDates, netWorthSeries, totalInvestmentsAt, bonusVsInvestedSeries, cumulativeContributions } from '../calc';

const sb = supabase as any;

export const DetailsTab: React.FC<{ d: WealthData; onChange: () => void }> = ({ d, onChange }) => {
  return (
    <Tabs defaultValue="archive">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="income">Income</TabsTrigger>
        <TabsTrigger value="assets">Assets</TabsTrigger>
        <TabsTrigger value="flows">Flows</TabsTrigger>
        <TabsTrigger value="debt">Debt</TabsTrigger>
        <TabsTrigger value="spending">Spending</TabsTrigger>
        <TabsTrigger value="archive">Archive</TabsTrigger>
      </TabsList>

      <TabsContent value="income" className="mt-4"><IncomeView d={d} /></TabsContent>
      <TabsContent value="assets" className="mt-4"><AssetsView d={d} /></TabsContent>
      <TabsContent value="flows" className="mt-4"><FlowsView d={d} /></TabsContent>
      <TabsContent value="debt" className="mt-4"><DebtView d={d} /></TabsContent>
      <TabsContent value="spending" className="mt-4"><SpendingView d={d} /></TabsContent>
      <TabsContent value="archive" className="mt-4"><ArchiveView d={d} onChange={onChange} /></TabsContent>
    </Tabs>
  );
};

const FlowsView: React.FC<{ d: WealthData }> = ({ d }) => {
  const { user } = useAuth();
  const bars = useMemo(() => bonusVsInvestedSeries(d), [d]);
  const cum = useMemo(() => cumulativeContributions(d), [d]);
  const totalContrib = bars.reduce((a, r) => a + r.contribution + r.withdrawal, 0);
  const totalBonus = bars.reduce((a, r) => a + r.bonus, 0);
  const totalWithdrawn = bars.reduce((a, r) => a + Math.abs(r.withdrawal), 0);

  const saveContribution = async (month: string, bucketId: string, raw: string) => {
    if (!user) return;
    const v = Number(raw) || 0;
    // Find any snapshot for this month+bucket (month column may be YYYY-MM or YYYY-MM-DD).
    const { data: existing } = await sb
      .from('investment_snapshots')
      .select('id')
      .eq('user_id', user.id)
      .eq('bucket_id', bucketId)
      .like('month', `${month}%`)
      .order('month', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) {
      await sb.from('investment_snapshots').update({ contribution: v }).eq('id', existing.id);
    } else {
      await sb.from('investment_snapshots').insert({
        user_id: user.id,
        month: `${month}-01`,
        bucket_id: bucketId,
        value: 0,
        contribution: v,
      });
    }
    // Trigger a refresh via window event since FlowsView has no onChange prop.
    window.dispatchEvent(new CustomEvent('finance:refresh'));
  };

  if (!bars.length) {
    return (
      <Card><CardContent className="p-10 text-center">
        <div className="text-sm text-muted-foreground">Log a monthly snapshot to start tracking flows. You can backfill past contributions and withdrawals directly in the table below once snapshots exist.</div>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-[11px] text-muted-foreground uppercase">Total bonuses</div><div className="text-lg font-semibold tabular-nums mt-1 text-emerald-600">{fmtUSD(totalBonus, { compact: true })}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-[11px] text-muted-foreground uppercase">Net invested</div><div className="text-lg font-semibold tabular-nums mt-1">{fmtUSD(totalContrib, { sign: true, compact: true })}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-[11px] text-muted-foreground uppercase">Total withdrawn</div><div className="text-lg font-semibold tabular-nums mt-1 text-destructive">{fmtUSD(totalWithdrawn, { compact: true })}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Bonus vs invested — by month</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => fmtMonth(v)} />
                <YAxis tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => `$${Math.round(v / 1000)}K`} width={50} />
                <Tooltip formatter={(v: any) => fmtUSD(Number(v))} labelFormatter={(l) => fmtMonth(String(l))} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="bonus" fill="#10b981" name="Bonus" radius={[4, 4, 0, 0]} />
                <Bar dataKey="contribution" fill="#3b82f6" name="Invested" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withdrawal" fill="#ef4444" name="Withdrawn" radius={[0, 0, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Cumulative invested vs portfolio value</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cum}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => parseEntryDate(v).toLocaleDateString('en', { month: 'short', year: '2-digit' })} />
                <YAxis tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => `$${Math.round(v / 1000)}K`} width={50} />
                <Tooltip formatter={(v: any) => fmtUSD(Number(v))} labelFormatter={(l) => fmtDate(String(l))} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="cumulative" stroke="#3b82f6" strokeWidth={2} dot={false} name="Cash deployed" isAnimationActive={false} />
                <Line type="monotone" dataKey="portfolio" stroke="#10b981" strokeWidth={2} dot={false} name="Portfolio value" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2 italic">Gap between the lines ≈ market gains/losses to date.</p>
        </CardContent>
      </Card>

      <Card><CardContent className="p-0">
        <div className="px-4 py-2.5 border-b border-border text-[11px] text-muted-foreground">
          Edit per-bucket contributions inline below. Use <span className="text-emerald-600 font-medium">positive</span> numbers for money added and <span className="text-destructive font-medium">negative</span> for withdrawals. Changes flow into the chart above.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border"><tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5">Month</th>
              <th className="px-4 py-2.5 text-right">Bonus</th>
              {d.investmentBuckets.map(b => (
                <th key={b.id} className="px-4 py-2.5 text-right"><span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: b.color }} />{b.label}</span></th>
              ))}
              <th className="px-4 py-2.5 text-right">Net flow</th>
            </tr></thead>
            <tbody>{[...bars].reverse().map(r => {
              const net = r.contribution + r.withdrawal;
              return (
                <tr key={r.month} className="border-b border-border/50">
                  <td className="px-4 py-2 font-mono text-xs">{fmtMonth(r.month)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-emerald-600">{r.bonus > 0 ? fmtUSD(r.bonus) : '—'}</td>
                  {d.investmentBuckets.map(b => {
                    const v = r.perBucket[b.id] || 0;
                    return (
                      <td key={b.id} className="px-4 py-2 text-right">
                        <input
                          type="number"
                          defaultValue={v || ''}
                          placeholder="0"
                          onBlur={e => { const nv = Number(e.target.value) || 0; if (nv !== v) saveContribution(r.month, b.id, e.target.value); }}
                          className={`w-24 bg-transparent text-right text-xs tabular-nums hover:bg-accent focus:bg-accent rounded px-1 py-0.5 outline-none ${v > 0 ? 'text-emerald-600' : v < 0 ? 'text-destructive' : 'text-muted-foreground'}`}
                        />
                      </td>
                    );
                  })}
                  <td className={`px-4 py-2 text-right tabular-nums font-medium ${net > 0 ? 'text-emerald-600' : net < 0 ? 'text-destructive' : ''}`}>{net === 0 ? '—' : fmtUSD(net, { sign: true })}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </CardContent></Card>
    </div>
  );
};

const IncomeView: React.FC<{ d: WealthData }> = ({ d }) => {
  const data = useMemo(() => {
    const months = Array.from(new Set([...d.budgetMonths.map(b => b.month), ...d.budgetExtras.map(b => b.month)])).sort();
    return months.map(m => {
      const salary = Number(d.budgetMonths.find(b => b.month === m)?.salary ?? 0);
      const commission = d.budgetExtras.filter(e => e.month === m).reduce((a, e) => a + Number(e.amount), 0);
      return { month: m, salary, commission, total: salary + commission };
    });
  }, [d]);

  const thisYear = String(new Date().getFullYear());
  const ytdCommission = data.filter(r => r.month.startsWith(thisYear)).reduce((a, r) => a + r.commission, 0);
  const bestMonth = data.reduce((a, r) => r.total > a.total ? r : a, { total: 0, month: '' } as any);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Commission / bonus per month</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke={COLORS.muted} />
                <YAxis tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => `$${Math.round(v / 1000)}K`} width={50} />
                <Tooltip formatter={(v: any) => fmtUSD(Number(v))} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="commission" radius={[4, 4, 0, 0]}>
                  {data.map((r, i) => <Cell key={i} fill={r.commission > 0 ? COLORS.etfs : '#e2e8f0'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-4"><div className="text-[11px] text-muted-foreground uppercase">Total earned {thisYear}</div><div className="text-xl font-semibold tabular-nums mt-1">{fmtUSD(ytdCommission)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-[11px] text-muted-foreground uppercase">Best single month</div><div className="text-xl font-semibold tabular-nums mt-1">{fmtUSD(bestMonth.total)}</div><div className="text-xs text-muted-foreground">{bestMonth.month ? fmtMonth(bestMonth.month) : '—'}</div></CardContent></Card>
      </div>

      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border"><tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5">Month</th><th className="px-4 py-2.5 text-right">Salary</th><th className="px-4 py-2.5 text-right">Commission</th><th className="px-4 py-2.5 text-right">Total</th>
            </tr></thead>
            <tbody>{[...data].reverse().map(r => (
              <tr key={r.month} className="border-b border-border/50">
                <td className="px-4 py-2 font-mono text-xs">{fmtMonth(r.month)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmtUSD(r.salary)}</td>
                <td className="px-4 py-2 text-right tabular-nums">{fmtUSD(r.commission)}</td>
                <td className="px-4 py-2 text-right tabular-nums font-medium">{fmtUSD(r.total)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </CardContent></Card>
    </div>
  );
};

const AssetsView: React.FC<{ d: WealthData }> = ({ d }) => {
  const data = useMemo(() => bucketStackSeries(d), [d]);
  const dates = investmentDates(d);
  const current = dates.length ? totalInvestmentsAt(d, dates[dates.length - 1]) : 0;
  const ath = dates.reduce((a, dt) => Math.max(a, totalInvestmentsAt(d, dt)), 0);
  const thisYear = String(new Date().getFullYear());
  const yearStart = dates.find(dt => dt.startsWith(thisYear));
  const ytdChange = yearStart ? current - totalInvestmentsAt(d, yearStart) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Asset composition over time</CardTitle>
            <div className="flex items-center gap-3 text-xs">
              {d.investmentBuckets.map(b => (
                <div key={b.id} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />{b.label}</div>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => parseEntryDate(v).toLocaleDateString('en', { month: 'short', year: '2-digit' })} />
                <YAxis tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => `$${Math.round(v / 1000)}K`} width={50} />
                <Tooltip formatter={(v: any, n: string) => [fmtUSD(Number(v)), n]} labelFormatter={(l) => fmtDate(String(l))} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                {d.investmentBuckets.map(b => (
                  <Area key={b.id} type="monotone" dataKey={b.id} stackId="1" stroke={b.color} fill={b.color} fillOpacity={0.6} name={b.label} isAnimationActive={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-[11px] text-muted-foreground uppercase">All-time high</div><div className="text-lg font-semibold tabular-nums mt-1">{fmtUSD(ath, { compact: true })}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-[11px] text-muted-foreground uppercase">Current</div><div className="text-lg font-semibold tabular-nums mt-1">{fmtUSD(current, { compact: true })}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-[11px] text-muted-foreground uppercase">Change YTD</div><div className={`text-lg font-semibold tabular-nums mt-1 ${ytdChange >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>{fmtUSD(ytdChange, { sign: true, compact: true })}</div></CardContent></Card>
      </div>
    </div>
  );
};

const DebtView: React.FC<{ d: WealthData }> = ({ d }) => {
  const cc = ccAccount(d), car = carLoanAccount(d);
  const dates = useMemo(() => Array.from(new Set([
    ...(cc ? d.nwSnapshots.filter(s => s.account_id === cc.id).map(s => s.month) : []),
    ...(car ? d.nwSnapshots.filter(s => s.account_id === car.id).map(s => s.month) : []),
  ])).sort(), [d, cc, car]);
  const data = dates.map(dt => ({
    date: dt,
    cc: cc ? Math.abs(Number(d.nwSnapshots.find(s => s.month === dt && s.account_id === cc.id)?.value ?? 0)) : 0,
    car: car ? Math.abs(Number(d.nwSnapshots.find(s => s.month === dt && s.account_id === car.id)?.value ?? 0)) : 0,
  }));

  const tableRows = useMemo(() => {
    const rows: { date: string; type: string; balance: number; change: number; color: string }[] = [];
    const build = (acc: any, type: string, color: string) => {
      if (!acc) return;
      const snaps = sortByDateAsc(d.nwSnapshots.filter(s => s.account_id === acc.id));
      for (let i = 0; i < snaps.length; i++) {
        const bal = Math.abs(Number(snaps[i].value));
        const prev = i > 0 ? Math.abs(Number(snaps[i - 1].value)) : bal;
        rows.push({ date: snaps[i].month, type, balance: bal, change: bal - prev, color });
      }
    };
    build(cc, 'Credit card', COLORS.debt);
    build(car, 'Car loan', COLORS.carLoan);
    return rows.sort((a, b) => parseEntryDate(b.date).getTime() - parseEntryDate(a.date).getTime());
  }, [d, cc, car]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Debt over time</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => parseEntryDate(v).toLocaleDateString('en', { month: 'short', year: '2-digit' })} />
                <YAxis tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => `$${Math.round(v / 1000)}K`} width={50} />
                <Tooltip formatter={(v: any) => fmtUSD(Number(v))} labelFormatter={(l) => fmtDate(String(l))} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="cc" stroke={COLORS.debt} strokeWidth={2} dot={false} name="Credit card" isAnimationActive={false} />
                <Line type="monotone" dataKey="car" stroke={COLORS.carLoan} strokeWidth={2} dot={false} name="Car loan" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border"><tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5">Date</th><th className="px-4 py-2.5">Account</th><th className="px-4 py-2.5 text-right">Balance</th><th className="px-4 py-2.5 text-right">Change</th>
            </tr></thead>
            <tbody>{tableRows.map((r, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-4 py-2 text-xs font-mono">{fmtDate(r.date)}</td>
                <td className="px-4 py-2"><span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: r.color }} />{r.type}</span></td>
                <td className="px-4 py-2 text-right tabular-nums">{fmtUSD(r.balance)}</td>
                <td className={`px-4 py-2 text-right tabular-nums ${r.change > 0 ? 'text-destructive' : r.change < 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>{r.change === 0 ? '—' : fmtUSD(r.change, { sign: true })}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </CardContent></Card>
    </div>
  );
};

const SpendingView: React.FC<{ d: WealthData }> = ({ d }) => {
  if (!d.budgetSpending.length) {
    return (
      <Card><CardContent className="p-10 text-center">
        <div className="text-sm text-muted-foreground">Log your monthly spending to track categories over time.</div>
      </CardContent></Card>
    );
  }
  // Compact actual vs budget bars for the latest month with data.
  const months = Array.from(new Set(d.budgetSpending.map(s => s.month))).sort();
  const last = months[months.length - 1];
  const rows = d.budgetCategories.map(c => {
    const actual = d.budgetSpending.filter(s => s.month === last && s.category_id === c.id).reduce((a, s) => a + Number(s.actual), 0);
    return { label: c.label, color: c.color, actual, budget: Number(c.budget) };
  });
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Spending — {fmtMonth(last)}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {rows.map(r => {
          const pct = r.budget > 0 ? Math.min(100, (r.actual / r.budget) * 100) : 0;
          return (
            <div key={r.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: r.color }} />{r.label}</span>
                <span className="tabular-nums">{fmtUSD(r.actual)} / {fmtUSD(r.budget)}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full" style={{ width: `${pct}%`, background: r.color }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

const ArchiveView: React.FC<{ d: WealthData; onChange: () => void }> = ({ d, onChange }) => {
  const series = netWorthSeries(d);
  const buckets = d.investmentBuckets;
  const ccA = ccAccount(d);

  const saveCell = async (date: string, bucketId: string, raw: string) => {
    const v = Number(raw) || 0;
    const { data: existing } = await sb.from('investment_snapshots').select('id').eq('month', date).eq('bucket_id', bucketId).maybeSingle();
    if (existing) await sb.from('investment_snapshots').update({ value: v }).eq('id', existing.id);
    onChange();
  };
  const saveCC = async (date: string, raw: string) => {
    if (!ccA) return;
    const v = -Math.abs(Number(raw) || 0);
    const { data: existing } = await sb.from('nw_snapshots').select('id').eq('month', date).eq('account_id', ccA.id).maybeSingle();
    if (existing) await sb.from('nw_snapshots').update({ value: v }).eq('id', existing.id);
    onChange();
  };

  const rows = [...series].reverse();
  const bucketVal = (date: string, id: string) => Number(d.investmentSnapshots.find(s => s.month === date && s.bucket_id === id)?.value ?? 0);

  return (
    <Card><CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border"><tr className="text-left text-xs text-muted-foreground">
            <th className="px-3 py-2.5">Date</th>
            <th className="px-3 py-2.5 text-right">Net worth</th>
            <th className="px-3 py-2.5 text-right">Invested</th>
            {buckets.map(b => <th key={b.id} className="px-3 py-2.5 text-right"><span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: b.color }} />{b.label}</span></th>)}
            <th className="px-3 py-2.5 text-right">CC debt</th>
          </tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r.date} className="border-b border-border/50">
              <td className="px-3 py-2 text-xs font-mono">{fmtDate(r.date)}</td>
              <td className="px-3 py-2 text-right tabular-nums font-medium">{fmtUSD(r.value)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtUSD(r.investments)}</td>
              {buckets.map(b => (
                <td key={b.id} className="px-3 py-2 text-right">
                  <input
                    defaultValue={Math.round(bucketVal(r.date, b.id))}
                    onBlur={e => { const nv = Number(e.target.value); if (nv !== Math.round(bucketVal(r.date, b.id))) saveCell(r.date, b.id, e.target.value); }}
                    className="w-20 bg-transparent text-right text-xs tabular-nums hover:bg-accent focus:bg-accent rounded px-1 outline-none"
                  />
                </td>
              ))}
              <td className="px-3 py-2 text-right">
                <input
                  defaultValue={Math.round(r.cc)}
                  onBlur={e => { const nv = Number(e.target.value); if (nv !== Math.round(r.cc)) saveCC(r.date, e.target.value); }}
                  className="w-20 bg-transparent text-right text-xs tabular-nums text-destructive hover:bg-accent focus:bg-accent rounded px-1 outline-none"
                />
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </CardContent></Card>
  );
};
