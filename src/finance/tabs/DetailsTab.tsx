import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Lock, Unlock } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, LineChart, Line, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { WealthData } from '@/wealth/types';
import { fmtUSD, fmtDate, fmtMonth, parseEntryDate, sortByDateAsc, sortByDateDesc } from '../utils';
import { COLORS } from '../constants';
import { bucketStackSeries, ccAccount, carLoanAccount, investmentDates, netWorthSeries, totalInvestmentsAt, bonusVsInvestedSeries, cumulativeContributions } from '../calc';
import { ImportDialog, type ImportSummary } from '../import/ImportDialog';
import { CoachCard } from '../import/CoachCard';

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

      <TabsContent value="income" className="mt-4"><IncomeView d={d} onChange={onChange} /></TabsContent>
      <TabsContent value="assets" className="mt-4"><AssetsView d={d} /></TabsContent>
      <TabsContent value="flows" className="mt-4"><FlowsView d={d} onChange={onChange} /></TabsContent>
      <TabsContent value="debt" className="mt-4"><DebtView d={d} /></TabsContent>
      <TabsContent value="spending" className="mt-4"><SpendingView d={d} onChange={onChange} /></TabsContent>
      <TabsContent value="archive" className="mt-4"><ArchiveView d={d} onChange={onChange} /></TabsContent>
    </Tabs>
  );
};

const FlowsView: React.FC<{ d: WealthData; onChange: () => void }> = ({ d, onChange }) => {
  const { user } = useAuth();
  const bars = useMemo(() => bonusVsInvestedSeries(d), [d]);
  const cum = useMemo(() => cumulativeContributions(d), [d]);
  const totalNet = bars.reduce((a, r) => a + r.net, 0);
  const totalBonus = bars.reduce((a, r) => a + r.bonus, 0);
  const totalWithdrawn = bars.reduce((a, r) => a + Math.min(0, r.net), 0);

  const saveContribution = async (month: string, bucketId: string, raw: string) => {
    if (!user) return;
    const v = Number(raw) || 0;
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
    onChange();
  };

  // Replace all bonus entries for that month with a single entry (or delete if zero).
  const saveBonus = async (month: string, raw: string) => {
    if (!user) return;
    const v = Number(raw) || 0;
    const { data: existing } = await sb
      .from('budget_extras')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'bonus')
      .like('month', `${month}%`);
    if (existing?.length) {
      await sb.from('budget_extras').delete().in('id', existing.map((e: any) => e.id));
    }
    if (v !== 0) {
      await sb.from('budget_extras').insert({
        user_id: user.id,
        month: `${month}-01`,
        type: 'bonus',
        amount: v,
        description: 'Commission / bonus',
      });
    }
    onChange();
  };

  if (!bars.length) {
    return (
      <Card><CardContent className="p-10 text-center">
        <div className="text-sm text-muted-foreground">Log a monthly snapshot to start tracking flows. You can backfill past contributions, withdrawals, and bonuses directly in the table below once snapshots exist.</div>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-[11px] text-muted-foreground uppercase">Total bonuses received</div><div className="text-lg font-semibold tabular-nums mt-1 text-emerald-600">{fmtUSD(totalBonus, { compact: true })}</div><div className="text-[10px] text-muted-foreground mt-0.5">Reference only — not added to net flow</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-[11px] text-muted-foreground uppercase">Net invested</div><div className={`text-lg font-semibold tabular-nums mt-1 ${totalNet >= 0 ? '' : 'text-destructive'}`}>{fmtUSD(totalNet, { sign: true, compact: true })}</div><div className="text-[10px] text-muted-foreground mt-0.5">Contributions − withdrawals</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-[11px] text-muted-foreground uppercase">Total withdrawn</div><div className="text-lg font-semibold tabular-nums mt-1 text-destructive">{fmtUSD(totalWithdrawn, { compact: true })}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Net invested per month</CardTitle>
          <p className="text-[11px] text-muted-foreground mt-1">Green = net contribution. Red = net withdrawal (bar drops below zero). Bonuses are tracked separately in the table.</p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => fmtMonth(v)} />
                <YAxis tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => `$${Math.round(v / 1000)}K`} width={50} />
                <Tooltip formatter={(v: any) => [fmtUSD(Number(v)), 'Net invested']} labelFormatter={(l) => fmtMonth(String(l))} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="net" name="Net invested" radius={[4, 4, 4, 4]} barSize={28}>
                  {bars.map((r, i) => <Cell key={i} fill={r.net >= 0 ? '#10b981' : '#ef4444'} />)}
                </Bar>
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
          <strong className="text-foreground">Central source of truth.</strong> Every cell is editable — backfill bonuses and per-bucket contributions for any past month. Use <span className="text-emerald-600 font-medium">positive</span> for money added and <span className="text-destructive font-medium">negative</span> for withdrawals. Bonus is reference only and does <em>not</em> add to net flow.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border"><tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5">Month</th>
              <th className="px-4 py-2.5 text-right">Bonus received</th>
              {d.investmentBuckets.map(b => (
                <th key={b.id} className="px-4 py-2.5 text-right"><span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: b.color }} />{b.label}</span></th>
              ))}
              <th className="px-4 py-2.5 text-right">Net flow</th>
            </tr></thead>
            <tbody>{[...bars].reverse().map(r => {
              const net = r.net;
              return (
                <tr key={r.month} className="border-b border-border/50">
                  <td className="px-4 py-2 font-mono text-xs">{fmtMonth(r.month)}</td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      defaultValue={r.bonus || ''}
                      placeholder="0"
                      onBlur={e => { const nv = Number(e.target.value) || 0; if (nv !== r.bonus) saveBonus(r.month, e.target.value); }}
                      className="w-24 bg-transparent text-right text-xs tabular-nums text-emerald-600 hover:bg-accent focus:bg-accent rounded px-1 py-0.5 outline-none"
                    />
                  </td>
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

const IncomeView: React.FC<{ d: WealthData; onChange: () => void }> = ({ d, onChange }) => {
  const { user } = useAuth();
  const saveSalary = async (month: string, raw: string) => {
    if (!user) return;
    const v = Number(raw) || 0;
    const monthKey = month.length === 7 ? `${month}-01` : month;
    const { data: existing } = await sb.from('budget_months').select('id').eq('user_id', user.id).like('month', `${month.slice(0, 7)}%`).maybeSingle();
    if (existing) await sb.from('budget_months').update({ salary: v }).eq('id', existing.id);
    else await sb.from('budget_months').insert({ user_id: user.id, month: monthKey, salary: v });
    onChange();
  };

  const data = useMemo(() => {
    const raw = Array.from(new Set([
      ...d.budgetMonths.map(b => b.month.slice(0, 7)),
      ...d.budgetExtras.map(b => b.month.slice(0, 7)),
      ...d.investmentSnapshots.map(s => s.month.slice(0, 7)),
    ])).sort();
    if (!raw.length) return [];
    // Gap-fill every month from earliest to latest (or current)
    const [sy, sm] = raw[0].split('-').map(Number);
    const nowKey = new Date().toISOString().slice(0, 7);
    const endKey = raw[raw.length - 1] > nowKey ? raw[raw.length - 1] : nowKey;
    const [ey, em] = endKey.split('-').map(Number);
    const months: string[] = [];
    let y = sy, m = sm;
    while (y < ey || (y === ey && m <= em)) {
      months.push(`${y}-${String(m).padStart(2, '0')}`);
      m++; if (m > 12) { m = 1; y++; }
    }
    return months.map(mm => {
      const salaryAED = Number(d.budgetMonths.find(b => b.month.slice(0, 7) === mm)?.salary ?? 0);
      const salaryUSD = salaryAED / 3.65;
      const commission = d.budgetExtras.filter(e => e.month.slice(0, 7) === mm).reduce((a, e) => a + Number(e.amount), 0);
      return { month: mm, salaryAED, salaryUSD, commission, total: salaryUSD + commission };
    });
  }, [d]);


  const thisYear = String(new Date().getFullYear());
  const ytdCommission = data.filter(r => r.month.startsWith(thisYear)).reduce((a, r) => a + r.commission, 0);
  const bestMonth = data.reduce((a, r) => r.total > a.total ? r : a, { total: 0, month: '' } as any);

  const fmtAED = (v: number) => `AED ${Math.round(v).toLocaleString('en-US')}`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Commission / bonus per month ($)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => fmtMonth(v)} />
                <YAxis tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => `$${Math.round(v / 1000)}K`} width={50} />
                <Tooltip formatter={(v: any) => fmtUSD(Number(v))} labelFormatter={(l) => fmtMonth(String(l))} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="commission" radius={[4, 4, 0, 0]}>
                  {data.map((r, i) => <Cell key={i} fill={r.commission > 0 ? COLORS.etfs : '#e2e8f0'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-4"><div className="text-[11px] text-muted-foreground uppercase">Total commission {thisYear}</div><div className="text-xl font-semibold tabular-nums mt-1">{fmtUSD(ytdCommission)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-[11px] text-muted-foreground uppercase">Best single month</div><div className="text-xl font-semibold tabular-nums mt-1">{fmtUSD(bestMonth.total)}</div><div className="text-xs text-muted-foreground">{bestMonth.month ? fmtMonth(bestMonth.month) : '—'}</div></CardContent></Card>
      </div>

      <Card><CardContent className="p-0">
        <div className="px-4 py-2 text-[11px] text-muted-foreground border-b border-border">Salary stored & shown in AED · Commission in USD · Total in USD (rate 1 USD = 3.65 AED)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border"><tr className="text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5">Month</th><th className="px-4 py-2.5 text-right">Salary (AED)</th><th className="px-4 py-2.5 text-right">Commission ($)</th><th className="px-4 py-2.5 text-right">Total ($)</th>
            </tr></thead>
            <tbody>{[...data].reverse().map(r => (
              <tr key={r.month} className="border-b border-border/50">
                <td className="px-4 py-2 font-mono text-xs">{fmtMonth(r.month)}</td>
                <td className="px-4 py-2 text-right tabular-nums">
                  <input
                    type="number"
                    defaultValue={r.salaryAED || ''}
                    placeholder="0"
                    onBlur={e => { const nv = Number(e.target.value) || 0; if (nv !== r.salaryAED) saveSalary(r.month, e.target.value); }}
                    className="w-28 bg-transparent text-right text-sm tabular-nums hover:bg-accent focus:bg-accent rounded px-1 py-0.5 outline-none"
                  />
                </td>
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

const SpendingView: React.FC<{ d: WealthData; onChange: () => void }> = ({ d, onChange }) => {
  const { user } = useAuth();
  const cats = d.budgetCategories;

  // Build the last 12 months (ending current month), gap-filled.
  const months = useMemo(() => {
    const now = new Date();
    const arr: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-01`);
    }
    // Also include any historical months already logged that fall outside the window
    const extra = Array.from(new Set(d.budgetSpending.map(s => s.month.slice(0, 7) + '-01')))
      .filter(m => !arr.includes(m));
    return [...extra, ...arr].sort();
  }, [d.budgetSpending]);

  const spendAt = (month: string, catId: string) =>
    Number(d.budgetSpending.find(s => s.month.slice(0, 7) === month.slice(0, 7) && s.category_id === catId)?.actual ?? 0);

  const saveCell = async (month: string, catId: string, raw: string) => {
    if (!user) return;
    const v = Number(raw) || 0;
    const { data: existing } = await sb
      .from('budget_spending')
      .select('id')
      .eq('user_id', user.id)
      .eq('category_id', catId)
      .like('month', `${month.slice(0, 7)}%`)
      .maybeSingle();
    if (existing) {
      if (v === 0) await sb.from('budget_spending').delete().eq('id', existing.id);
      else await sb.from('budget_spending').update({ actual: v }).eq('id', existing.id);
    } else if (v > 0) {
      await sb.from('budget_spending').insert({ user_id: user.id, month, category_id: catId, actual: v });
    }
    onChange();
  };

  // Chart series: per-month totals + per-category outlier detection (>1.5σ from that category's mean).
  const chartData = useMemo(() => {
    const rows = months.map(m => {
      const row: any = { month: m, total: 0 };
      for (const c of cats) {
        const v = spendAt(m, c.id);
        row[c.id] = v;
        row.total += v;
      }
      return row;
    });
    // Compute outliers per category
    const outliers: Record<string, Set<string>> = {};
    for (const c of cats) {
      const vals = rows.map(r => r[c.id]).filter(v => v > 0);
      if (vals.length < 3) { outliers[c.id] = new Set(); continue; }
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length);
      outliers[c.id] = new Set(rows.filter(r => sd > 0 && Math.abs(r[c.id] - mean) > 1.5 * sd && r[c.id] > 0).map(r => r.month));
    }
    // Total outliers
    const totals = rows.map(r => r.total).filter(v => v > 0);
    let totalOutliers = new Set<string>();
    if (totals.length >= 3) {
      const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
      const sd = Math.sqrt(totals.reduce((a, b) => a + (b - mean) ** 2, 0) / totals.length);
      totalOutliers = new Set(rows.filter(r => sd > 0 && Math.abs(r.total - mean) > 1.5 * sd && r.total > 0).map(r => r.month));
    }
    return { rows, outliers, totalOutliers };
  }, [months, cats, d.budgetSpending]);

  const [focusCat, setFocusCat] = useState<string>('__total__');

  const focusOutliers = focusCat === '__total__' ? chartData.totalOutliers : chartData.outliers[focusCat];
  const focusColor = focusCat === '__total__' ? '#3b82f6' : (cats.find(c => c.id === focusCat)?.color ?? '#3b82f6');
  const focusKey = focusCat === '__total__' ? 'total' : focusCat;
  const focusLabel = focusCat === '__total__' ? 'Total' : (cats.find(c => c.id === focusCat)?.label ?? '');

  if (!cats.length) {
    return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Add spending categories in the Plan tab first.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base">Spending — {focusLabel}</CardTitle>
            <p className="text-[11px] text-muted-foreground mt-1">Larger dots = outlier months (&gt;1.5σ from the average).</p>
          </div>
          <select
            value={focusCat}
            onChange={e => setFocusCat(e.target.value)}
            className="text-xs bg-transparent border border-border rounded px-2 py-1 outline-none"
          >
            <option value="__total__">Total spending</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => fmtMonth(v)} />
                <YAxis tick={{ fontSize: 10 }} stroke={COLORS.muted} tickFormatter={(v) => `$${Math.round(v / 1000)}K`} width={44} />
                <Tooltip formatter={(v: any) => fmtUSD(Number(v))} labelFormatter={(l) => fmtMonth(String(l))} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey={focusKey}
                  stroke={focusColor}
                  strokeWidth={2}
                  isAnimationActive={false}
                  dot={(props: any) => {
                    const isOut = focusOutliers?.has(props.payload.month);
                    return (
                      <circle
                        key={props.index}
                        cx={props.cx}
                        cy={props.cy}
                        r={isOut ? 5 : 2.5}
                        fill={isOut ? focusColor : 'hsl(var(--background))'}
                        stroke={focusColor}
                        strokeWidth={isOut ? 0 : 1.5}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card><CardContent className="p-0">
        <div className="px-4 py-2.5 border-b border-border text-[11px] text-muted-foreground">
          <strong className="text-foreground">Backfill past spending.</strong> Every cell is editable — enter actual spend per category per month. Leave blank / 0 to remove.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border"><tr className="text-left text-xs text-muted-foreground">
              <th className="px-3 py-2.5 sticky left-0 bg-card">Month</th>
              {cats.map(c => (
                <th key={c.id} className="px-3 py-2.5 text-right whitespace-nowrap">
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.label}</span>
                </th>
              ))}
              <th className="px-3 py-2.5 text-right">Total</th>
            </tr></thead>
            <tbody>{[...chartData.rows].reverse().map(r => (
              <tr key={r.month} className="border-b border-border/50">
                <td className="px-3 py-2 text-xs font-mono sticky left-0 bg-card">{fmtMonth(r.month)}</td>
                {cats.map(c => {
                  const v = r[c.id] as number;
                  const isOut = chartData.outliers[c.id]?.has(r.month);
                  return (
                    <td key={c.id} className="px-3 py-2 text-right">
                      <input
                        type="number"
                        defaultValue={v || ''}
                        placeholder="0"
                        onBlur={e => { const nv = Number(e.target.value) || 0; if (nv !== v) saveCell(r.month, c.id, e.target.value); }}
                        className={`w-20 bg-transparent text-right text-xs tabular-nums hover:bg-accent focus:bg-accent rounded px-1 py-0.5 outline-none ${isOut ? 'font-semibold' : ''}`}
                        style={isOut ? { color: c.color } : {}}
                      />
                    </td>
                  );
                })}
                <td className={`px-3 py-2 text-right tabular-nums font-medium ${chartData.totalOutliers.has(r.month) ? 'text-primary' : ''}`}>{r.total ? fmtUSD(r.total) : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </CardContent></Card>
    </div>
  );
};

const ArchiveView: React.FC<{ d: WealthData; onChange: () => void }> = ({ d, onChange }) => {
  const { user } = useAuth();
  const series = netWorthSeries(d);
  const buckets = d.investmentBuckets;
  const ccA = ccAccount(d);

  const saveCell = async (date: string, bucketId: string, raw: string) => {
    if (!user) return;
    const v = Number(raw) || 0;
    const { data: existing } = await sb.from('investment_snapshots').select('id').eq('user_id', user.id).eq('month', date).eq('bucket_id', bucketId).maybeSingle();
    if (existing) {
      await sb.from('investment_snapshots').update({ value: v }).eq('id', existing.id);
    } else {
      await sb.from('investment_snapshots').insert({ user_id: user.id, month: date, bucket_id: bucketId, value: v, contribution: 0 });
    }
    onChange();
  };
  const saveCC = async (date: string, raw: string) => {
    if (!ccA || !user) return;
    const v = -Math.abs(Number(raw) || 0);
    const { data: existing } = await sb.from('nw_snapshots').select('id').eq('user_id', user.id).eq('month', date).eq('account_id', ccA.id).maybeSingle();
    if (existing) {
      await sb.from('nw_snapshots').update({ value: v }).eq('id', existing.id);
    } else {
      await sb.from('nw_snapshots').insert({ user_id: user.id, month: date, account_id: ccA.id, value: v });
    }
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
