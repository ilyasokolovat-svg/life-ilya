import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Pencil, Settings2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis } from 'recharts';
import type { WealthData } from '@/wealth/types';
import { latestNetWorth, netWorthSeries, latestBucketValues, ccAccount, carLoanAccount, goalStatus, goalProjectedDate, goalProgressDetails, GoalStatus } from '../calc';
import { fmtUSD, fmtPct, fmtDate, parseEntryDate } from '../utils';
import { COLORS } from '../constants';
import { BucketsDialog, GoalsManageDialog } from '../dialogs/BucketsDialog';
import { GoalDialog } from '../dialogs/GoalDialog';
import { DebtUpdateDialog } from '../dialogs/DebtUpdateDialog';
import { B2BrokerPipeline } from '../dialogs/B2BrokerPipeline';

const STATUS_LABEL: Record<GoalStatus, string> = {
  'complete': 'Complete',
  'on-track': 'On track',
  'at-risk': 'At risk',
  'behind': 'Behind',
};
const STATUS_CLASS: Record<GoalStatus, string> = {
  'complete': 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  'on-track': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  'at-risk': 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  'behind': 'bg-red-100 text-red-700 hover:bg-red-100',
};

export const OverviewTab: React.FC<{ d: WealthData; onChange: () => void; carMarketValue: number | null; setCarMarketValue: (v: number | null) => void }> = ({ d, onChange, carMarketValue, setCarMarketValue }) => {
  const nw = useMemo(() => latestNetWorth(d), [d]);
  const series = useMemo(() => netWorthSeries(d), [d]);
  const bucketLatest = useMemo(() => latestBucketValues(d), [d]);
  const totalInvestments = bucketLatest.reduce((a, b) => a + b.value, 0);
  const delta = nw.value - nw.prev;
  const deltaPct = nw.prev !== 0 ? (delta / Math.abs(nw.prev)) * 100 : 0;

  const cc = ccAccount(d);
  const car = carLoanAccount(d);
  const ccLatest = cc ? d.nwSnapshots.filter(s => s.account_id === cc.id).sort((a, b) => parseEntryDate(b.month).getTime() - parseEntryDate(a.month).getTime())[0] : null;
  const carLatest = car ? d.nwSnapshots.filter(s => s.account_id === car.id).sort((a, b) => parseEntryDate(b.month).getTime() - parseEntryDate(a.month).getTime())[0] : null;
  const ccBalance = ccLatest ? Math.abs(Number(ccLatest.value)) : 0;
  const carBalance = carLatest ? Math.abs(Number(carLatest.value)) : 0;

  // Originals for proportion bar — use the highest observed historical balance.
  const ccHistory = cc ? d.nwSnapshots.filter(s => s.account_id === cc.id) : [];
  const carHistory = car ? d.nwSnapshots.filter(s => s.account_id === car.id) : [];
  const ccOriginal = Math.max(ccBalance, ...ccHistory.map(s => Math.abs(Number(s.value))), 1);
  const carOriginal = Math.max(carBalance, ...carHistory.map(s => Math.abs(Number(s.value))), 1);

  const [bucketsOpen, setBucketsOpen] = useState(false);
  const [goalManageOpen, setGoalManageOpen] = useState(false);
  const [goalEditOpen, setGoalEditOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any | null>(null);
  const [debtOpen, setDebtOpen] = useState(false);
  const [debtTarget, setDebtTarget] = useState<{ id?: string; label: string; prev: number } | null>(null);
  const [carValueEditing, setCarValueEditing] = useState(false);
  const [carValueInput, setCarValueInput] = useState(String(carMarketValue ?? ''));

  const openGoal = (g: any | null) => { setEditingGoal(g); setGoalEditOpen(true); };
  const openDebt = (accountId: string | undefined, label: string, prev: number) => {
    setDebtTarget({ id: accountId, label, prev });
    setDebtOpen(true);
  };

  const sparkData = series.map(s => ({ date: s.date, value: s.value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* HERO */}
      <Card className="lg:col-span-2 overflow-hidden">
        <CardContent className="p-6">
          <div className="text-sm font-medium text-muted-foreground tracking-wide uppercase">Net worth</div>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <div className="text-5xl font-semibold tabular-nums tracking-tight">{fmtUSD(nw.value)}</div>
            <div className={`text-sm font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {fmtUSD(delta, { sign: true })} ({delta >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%)
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Last updated {nw.date ? fmtDate(nw.date) : '—'}
          </div>

          <div className="h-32 mt-4 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id="nwSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.etfs} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={COLORS.etfs} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Tooltip
                  formatter={(v: any) => [fmtUSD(Number(v)), 'Net worth']}
                  labelFormatter={(l) => fmtDate(String(l))}
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="value" stroke={COLORS.etfs} strokeWidth={2} fill="url(#nwSpark)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-lg border border-border p-3">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Total investments</div>
              <div className="text-xl font-semibold tabular-nums mt-1">{fmtUSD(totalInvestments)}</div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Credit card debt</div>
              <div className="text-xl font-semibold tabular-nums mt-1 text-destructive">−{fmtUSD(ccBalance)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* INVESTMENTS */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Investments</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setBucketsOpen(true)}>
            <Settings2 className="w-4 h-4 mr-1.5" /> Edit buckets
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {bucketLatest.length === 0 && <div className="text-sm text-muted-foreground py-4">No buckets yet.</div>}
          {d.investmentBuckets.map(b => {
            const v = bucketLatest.find(x => x.bucketId === b.id)?.value ?? 0;
            const pct = totalInvestments > 0 ? (v / totalInvestments) * 100 : 0;
            return (
              <div key={b.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="text-sm font-medium">{b.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular-nums">{fmtUSD(v)}</div>
                    <div className="text-[11px] text-muted-foreground">{pct.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: b.color }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* GOALS */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Goals</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setGoalManageOpen(true)}>
            <Settings2 className="w-4 h-4 mr-1.5" /> Manage
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {d.goals.length === 0 && <div className="text-sm text-muted-foreground py-4">No goals yet.</div>}
          {d.goals.map(g => {
            const progress = goalProgressDetails(d, g);
            const cur = progress.current;
            const target = progress.isPaydown ? progress.baseline : (progress.target || 1);
            const pct = progress.pct;
            const status = goalStatus(d, g);
            const proj = goalProjectedDate(d, g);
            const progressLabel = progress.isPaydown
              ? `${fmtUSD(progress.progressValue, { compact: true })} paid down of ${fmtUSD(target, { compact: true })}`
              : `${fmtUSD(cur, { compact: true })} / ${fmtUSD(target, { compact: true })}`;
            return (
              <button
                key={g.id}
                onClick={() => openGoal(g)}
                className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                    <span className="text-sm font-medium truncate">{g.name}</span>
                  </div>
                  <Badge className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</Badge>
                </div>
                <Progress value={pct} className="h-1.5" />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5">
                  <span><span className="tabular-nums">{progressLabel}</span> · {pct.toFixed(1)}%</span>
                  <span>
                    {proj
                      ? `Est. ${proj.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`
                      : `Goal ${g.target_date}`}
                  </span>
                </div>
              </button>
            );
          })}
          <Button variant="outline" size="sm" className="w-full" onClick={() => openGoal(null)}>
            <Plus className="w-4 h-4 mr-1" /> Add goal
          </Button>
        </CardContent>
      </Card>

      {/* DEBT */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Debt</CardTitle>
          <span className="text-[11px] text-muted-foreground">tap pencil to update</span>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Credit card */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-sm font-medium">Credit card</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums text-destructive">−{fmtUSD(ccBalance)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDebt(cc?.id, 'Credit card', ccLatest ? Number(ccLatest.value) : 0)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full" style={{ width: `${(ccBalance / ccOriginal) * 100}%`, backgroundColor: COLORS.debt }} />
            </div>
          </div>

          {/* Car loan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-sm font-medium">Car loan</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums" style={{ color: COLORS.carLoan }}>−{fmtUSD(carBalance)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDebt(car?.id, 'Car loan', carLatest ? Number(carLatest.value) : 0)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full" style={{ width: `${(carBalance / carOriginal) * 100}%`, backgroundColor: COLORS.carLoan }} />
            </div>

            {/* Car market value */}
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Car market value</span>
              {carValueEditing ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    autoFocus
                    value={carValueInput}
                    onChange={e => setCarValueInput(e.target.value)}
                    className="w-24 h-7 px-2 text-xs rounded border border-border bg-background"
                    placeholder="0"
                  />
                  <Button size="sm" className="h-7" onClick={() => {
                    const n = Number(carValueInput);
                    setCarMarketValue(isNaN(n) || n <= 0 ? null : n);
                    setCarValueEditing(false);
                  }}>Save</Button>
                </div>
              ) : carMarketValue && carMarketValue > 0 ? (
                <button onClick={() => { setCarValueInput(String(carMarketValue)); setCarValueEditing(true); }} className="font-mono hover:underline">
                  {fmtUSD(carMarketValue)} <Pencil className="w-3 h-3 inline ml-0.5 text-muted-foreground" />
                </button>
              ) : (
                <button onClick={() => setCarValueEditing(true)} className="text-primary hover:underline">Enter value</button>
              )}
            </div>
            {carMarketValue && carMarketValue > 0 && (
              <div className="text-[11px] text-muted-foreground mt-1">
                Car equity: <span className="font-mono">{fmtUSD(carMarketValue - carBalance)}</span> <span className="italic">(not in NW)</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <BucketsDialog d={d} open={bucketsOpen} onClose={() => setBucketsOpen(false)} onSaved={onChange} />
      <GoalsManageDialog d={d} open={goalManageOpen} onClose={() => setGoalManageOpen(false)} onSelectGoal={(g) => openGoal(g)} />
      <GoalDialog d={d} open={goalEditOpen} onClose={() => setGoalEditOpen(false)} onSaved={onChange} goal={editingGoal} />
      <DebtUpdateDialog
        open={debtOpen}
        onClose={() => setDebtOpen(false)}
        onSaved={onChange}
        accountId={debtTarget?.id}
        accountLabel={debtTarget?.label || ''}
        previousValue={debtTarget?.prev || 0}
      />
    </div>
  );
};
