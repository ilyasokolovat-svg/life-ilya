import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { WealthData } from '../types';
import { card, kpi, inputCls, btn, btnPrimary, Heading, Label, Mono, KpiCard, Empty, TabButton, baseChartOpts, chartColors } from '../ui';
import { fmtMoney, fmtPct, monthLabel, todayMonth, monthsBetween } from '../format';
import {
  rollingSurplus, goalCurrentValue, needPerMonth, goalStatus, monthsUntil, fiTarget, totalNWForMonth, annualSpend,
} from '../calc';
import { NW_PROJECTION_TARGETS } from '../seed';

const sb = supabase as any;

import { GoalsManager } from '../Managers';

export const GoalsTab: React.FC<{ d: WealthData; onChange: () => void; onToast: (m: string) => void }> = ({ d, onChange, onToast }) => {
  const [view, setView] = useState<'goals' | 'fi' | 'bridge' | 'boost'>('goals');
  const [manage, setManage] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <Heading className="text-3xl">Goals</Heading>
        <div className="flex gap-2 flex-wrap">
          <TabButton active={view === 'goals'} onClick={() => setView('goals')}>Goals</TabButton>
          <TabButton active={view === 'fi'} onClick={() => setView('fi')}>FI projection</TabButton>
          <TabButton active={view === 'bridge'} onClick={() => setView('bridge')}>NW bridge</TabButton>
          <TabButton active={view === 'boost'} onClick={() => setView('boost')}>Boost log</TabButton>
          <button onClick={() => setManage(true)} className="px-3 py-1.5 text-sm rounded-[8px] text-w-muted hover:text-w-text border border-w-border">Manage goals</button>
        </div>
      </div>
      {manage && <GoalsManager d={d} onClose={() => setManage(false)} onChange={onChange} />}

      {view === 'goals' && <GoalsList d={d} onChange={onChange} onToast={onToast} />}
      {view === 'fi' && <FIProjection d={d} />}
      {view === 'bridge' && <NWBridge d={d} />}
      {view === 'boost' && <BoostLog d={d} onChange={onChange} onToast={onToast} />}
    </div>
  );
};

const GoalsList: React.FC<{ d: WealthData; onChange: () => void; onToast: (m: string) => void }> = ({ d, onChange, onToast }) => {
  const surplus = rollingSurplus(d, 3);
  const fi = fiTarget(d);
  const onTrack = d.goals.filter(g => goalStatus(d, g.id) === 'on-track').length;
  const totalBoosted = d.bonusAllocations.reduce((a, x) => a + Number(x.amount), 0);

  const unallocatedPools = d.bonusPools.filter(p => {
    const used = d.bonusAllocations.filter(a => a.pool_id === p.id).reduce((a, x) => a + Number(x.amount), 0);
    return used < Number(p.total_amount);
  });

  return (
    <>
      {!!unallocatedPools.length && (
        <div className="mb-4 p-4 border border-w-amber rounded-[14px] bg-w-amber/5 flex items-center justify-between">
          <div>
            <div className="text-sm text-w-amber font-semibold">Unallocated bonus pool</div>
            <div className="text-xs text-w-muted mt-1">{unallocatedPools.length} pool{unallocatedPools.length > 1 ? 's' : ''} ready to allocate to goals.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="FI target" value={fmtMoney(fi, { compact: true })} sub={`${d.settings?.fi_multiplier ?? 25}× annual spend`} />
        <KpiCard label="Goals on track" value={`${onTrack}/${d.goals.length}`} tone={onTrack === d.goals.length ? 'green' : onTrack > d.goals.length / 2 ? 'amber' : 'red'} />
        <KpiCard label="Monthly surplus" value={fmtMoney(surplus, { sign: true })} sub="3-mo rolling avg" tone={surplus > 0 ? 'green' : 'red'} />
        <KpiCard label="Boosted total" value={fmtMoney(totalBoosted)} />
      </div>

      <div className={card + ' mb-5'}>
        <Label>Surplus allocator</Label>
        <div className="mt-3 space-y-3">
          {d.goals.map(g => {
            const allocated = surplus * (Number(g.allocation_pct) / 100);
            const need = needPerMonth(d, g.id);
            const ratio = need > 0 ? allocated / need : 1;
            const status = goalStatus(d, g.id);
            return (
              <div key={g.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-w-text">{g.name} <span className="text-w-muted">({g.allocation_pct}%)</span></span>
                  <Mono className={status === 'on-track' ? 'text-w-green' : status === 'at-risk' ? 'text-w-amber' : 'text-w-red'}>
                    {fmtMoney(allocated)} / need {fmtMoney(need)}
                  </Mono>
                </div>
                <div className="h-1.5 bg-w-surface2 rounded-full overflow-hidden">
                  <div className="h-full" style={{ width: `${Math.min(100, ratio * 100)}%`, background: status === 'on-track' ? chartColors.green : status === 'at-risk' ? chartColors.amber : chartColors.red }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {d.goals.map(g => <GoalCard key={g.id} d={d} goal={g} onChange={onChange} onToast={onToast} />)}
      </div>
    </>
  );
};

const GoalCard: React.FC<{ d: WealthData; goal: any; onChange: () => void; onToast: (m: string) => void }> = ({ d, goal, onChange, onToast }) => {
  const { user } = useAuth();
  const cur = goalCurrentValue(d, goal.id);
  const target = Number(goal.target_amount);
  const pct = target > 0 ? Math.max(0, Math.min(100, (cur / target) * 100)) : 0;
  const need = needPerMonth(d, goal.id);
  const status = goalStatus(d, goal.id);
  const months = monthsUntil(goal.target_date);
  const boosts = d.bonusAllocations.filter(a => a.goal_id === goal.id);
  const [showBoost, setShowBoost] = useState(false);
  const [amt, setAmt] = useState('');
  const [poolId, setPoolId] = useState<string>('');
  const [note, setNote] = useState('');

  const availablePools = d.bonusPools.filter(p => {
    const used = d.bonusAllocations.filter(a => a.pool_id === p.id).reduce((a, x) => a + Number(x.amount), 0);
    return used < Number(p.total_amount);
  });

  const saveBoost = async () => {
    if (!user || !poolId || !amt) return;
    await sb.from('bonus_allocations').insert({
      user_id: user.id, pool_id: poolId, goal_id: goal.id, amount: parseFloat(amt), note: note || null,
    });
    setAmt(''); setPoolId(''); setNote(''); setShowBoost(false);
    onChange(); onToast('Boost logged');
  };

  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: goal.color }} />
            <h3 className="text-base font-serif-w text-w-text">{goal.name}</h3>
          </div>
          <div className="text-xs text-w-muted mt-1">target {fmtMoney(target)} by {monthLabel(goal.target_date + (goal.target_date.length === 7 ? '' : ''))}</div>
        </div>
        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded border ${status === 'on-track' ? 'border-w-green text-w-green' : status === 'at-risk' ? 'border-w-amber text-w-amber' : 'border-w-red text-w-red'}`}>{status}</span>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <Mono className="text-w-text">{fmtMoney(cur)}</Mono>
          <span className="text-w-muted">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-w-surface2 rounded-full overflow-hidden">
          <div className="h-full" style={{ width: `${pct}%`, background: goal.color }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div><Label>Need / month</Label><Mono className="text-w-text text-base mt-1 block">{fmtMoney(need)}</Mono></div>
        <div><Label>Months left</Label><Mono className="text-w-text text-base mt-1 block">{months}</Mono></div>
      </div>

      <div className="mt-4 pt-4 border-t border-w-border">
        <div className="flex items-center justify-between">
          <Label>Boosts ({boosts.length})</Label>
          <button onClick={() => setShowBoost(!showBoost)} className="text-xs text-w-blue hover:underline">+ Log boost</button>
        </div>
        {showBoost && (
          <div className="mt-3 space-y-2">
            <select className={inputCls} value={poolId} onChange={e => setPoolId(e.target.value)}>
              <option value="">Select bonus pool</option>
              {availablePools.map(p => {
                const used = d.bonusAllocations.filter(a => a.pool_id === p.id).reduce((a, x) => a + Number(x.amount), 0);
                return <option key={p.id} value={p.id}>{p.description} — {fmtMoney(Number(p.total_amount) - used)} avail</option>;
              })}
            </select>
            <input className={inputCls} placeholder="Amount" value={amt} onChange={e => setAmt(e.target.value)} />
            <input className={inputCls} placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} />
            <button onClick={saveBoost} className={btnPrimary}>Save boost</button>
          </div>
        )}
        {boosts.length > 0 && (
          <div className="mt-3 space-y-1 text-xs">
            {boosts.map(b => (
              <div key={b.id} className="flex justify-between">
                <span className="text-w-muted">{b.note || 'Boost'}</span>
                <Mono className="text-w-green">+{fmtMoney(Number(b.amount))}</Mono>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FIProjection: React.FC<{ d: WealthData }> = ({ d }) => {
  const fi = fiTarget(d);
  const annual = annualSpend(d);
  const projectionYears = Object.keys(NW_PROJECTION_TARGETS).map(Number).sort();

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <KpiCard label="FI target" value={fmtMoney(fi, { compact: true })} sub={`${d.settings?.fi_multiplier ?? 25}× annual spend`} />
        <KpiCard label="Annual spend" value={fmtMoney(annual, { compact: true })} sub="last 12 months avg" />
        <KpiCard label="2030 NW target" value={fmtMoney(NW_PROJECTION_TARGETS[2030] || 0, { compact: true })} />
      </div>

      <div className={card}>
        <Label>5-year NW targets</Label>
        <div className="h-72 mt-3">
          <Line
            data={{
              labels: projectionYears.map(String),
              datasets: [{
                label: 'Target NW', data: projectionYears.map(y => NW_PROJECTION_TARGETS[y]),
                borderColor: chartColors.green, backgroundColor: chartColors.green + '22', fill: true, tension: 0.3,
              }],
            }}
            options={{ ...baseChartOpts, scales: { x: baseChartOpts.scales.x, y: { ...baseChartOpts.scales.y, ticks: { ...baseChartOpts.scales.y.ticks, callback: (v: any) => fmtMoney(Number(v), { compact: true }) } } } }}
          />
        </div>
      </div>
    </>
  );
};

const NWBridge: React.FC<{ d: WealthData }> = ({ d }) => {
  const months = Array.from(new Set(d.nwSnapshots.map(s => s.month))).sort();
  if (months.length < 2) return <Empty msg="Need at least 2 snapshots to render the bridge." />;
  const first = months[0], last = months[months.length - 1];
  const accs = [...d.accounts].sort((a, b) => a.sort_order - b.sort_order);
  const startTotal = totalNWForMonth(d, first);
  const endTotal = totalNWForMonth(d, last);

  return (
    <div className={card}>
      <Label>Net worth bridge — {monthLabel(first)} → {monthLabel(last)}</Label>
      <div className="mt-3 space-y-3">
        <div className="flex justify-between text-sm border-b border-w-border pb-2">
          <span className="text-w-muted">Starting NW</span>
          <Mono className={startTotal < 0 ? 'text-w-red' : 'text-w-text'}>{fmtMoney(startTotal)}</Mono>
        </div>
        {accs.map(a => {
          const sv = Number(d.nwSnapshots.find(s => s.month === first && s.account_id === a.id)?.value ?? 0);
          const ev = Number(d.nwSnapshots.find(s => s.month === last && s.account_id === a.id)?.value ?? 0);
          const delta = ev - sv;
          return (
            <div key={a.id} className="flex justify-between text-sm">
              <span className="text-w-text flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: a.color }} />{a.label}</span>
              <Mono className={delta >= 0 ? 'text-w-green' : 'text-w-red'}>{fmtMoney(delta, { sign: true })}</Mono>
            </div>
          );
        })}
        <div className="flex justify-between text-sm font-semibold border-t border-w-border pt-2">
          <span className="text-w-text">Ending NW</span>
          <Mono className={endTotal < 0 ? 'text-w-red' : 'text-w-green'}>{fmtMoney(endTotal)}</Mono>
        </div>
      </div>
    </div>
  );
};

const BoostLog: React.FC<{ d: WealthData; onChange: () => void; onToast: (m: string) => void }> = ({ d, onChange, onToast }) => {
  const allocs = [...d.bonusAllocations].sort((a, b) => b.id.localeCompare(a.id));
  const removeBoost = async (id: string) => {
    if (!confirm('Delete this boost entry?')) return;
    await sb.from('bonus_allocations').delete().eq('id', id);
    onChange(); onToast('Boost removed');
  };
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <Label>All boosts</Label>
        <span className="text-xs text-w-muted">Add new boosts from Goals → any goal card → "+ Log boost"</span>
      </div>
      <table className="w-full mt-3 text-sm">
        <thead><tr className="text-left text-xs text-w-muted border-b border-w-border">
          <th className="py-2">Pool</th><th className="py-2">Goal</th><th className="py-2">Note</th><th className="py-2 text-right">Amount</th><th className="py-2"></th>
        </tr></thead>
        <tbody>
          {allocs.map(a => {
            const pool = d.bonusPools.find(p => p.id === a.pool_id);
            const goal = d.goals.find(g => g.id === a.goal_id);
            return (
              <tr key={a.id} className="border-b border-w-border/50">
                <td className="py-2 text-w-text">{pool?.description || '—'}</td>
                <td className="py-2 text-w-text">{goal?.name || '—'}</td>
                <td className="py-2 text-w-muted">{a.note || ''}</td>
                <td className="py-2 text-right"><Mono className="text-w-green">+{fmtMoney(Number(a.amount))}</Mono></td>
                <td className="py-2 text-right">
                  <button onClick={() => removeBoost(a.id)} className="text-xs text-w-red hover:underline">Delete</button>
                </td>
              </tr>
            );
          })}
          {!allocs.length && <tr><td colSpan={5} className="py-6 text-center text-w-muted text-sm">No boosts logged yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};
