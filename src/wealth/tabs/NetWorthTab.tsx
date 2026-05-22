import React, { useMemo, useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { WealthData, Account } from '../types';
import {
  card, card2, kpi, inputCls, btn, btnPrimary, btnAmber,
  Heading, Label, Mono, KpiCard, Empty, TabButton, baseChartOpts, chartColors,
} from '../ui';
import { fmtMoney, fmtPct, monthLabel, todayMonth, toDisplay, fromDisplay } from '../format';
import {
  nwMonths, totalNWForMonth, liquidNWForMonth, totalAssetsForMonth, debtRatio,
  totalPortfolio, cryptoExposurePct,
} from '../calc';

const sb = supabase as any;

import { VIRTUAL_INVESTMENT_ACCOUNT_ID } from '../useWealthData';

const sortedAccounts = (d: WealthData) => [...d.accounts].sort((a, b) => a.sort_order - b.sort_order);
const editableAccounts = (d: WealthData) => sortedAccounts(d).filter(a => a.id !== VIRTUAL_INVESTMENT_ACCOUNT_ID);

// =========================== NET WORTH TAB ===========================
import { AccountsManager } from '../Managers';

export const NetWorthTab: React.FC<{ d: WealthData; onChange: () => void; onToast: (m: string) => void }> = ({ d, onChange, onToast }) => {
  const [view, setView] = useState<'overview' | 'log' | 'archive'>('overview');
  const [manage, setManage] = useState(false);
  const months = nwMonths(d);
  const latest = months[months.length - 1];
  const prev = months[months.length - 2];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <Heading className="text-3xl">Net worth</Heading>
        <div className="flex gap-2">
          <TabButton active={view === 'overview'} onClick={() => setView('overview')}>Overview</TabButton>
          <TabButton active={view === 'archive'} onClick={() => setView('archive')}>Archive</TabButton>
          <TabButton active={view === 'log'} onClick={() => setView('log')}>+ Log month</TabButton>
          <button onClick={() => setManage(true)} className="px-3 py-1.5 text-sm rounded-[8px] text-w-muted hover:text-w-text border border-w-border">Manage accounts</button>
        </div>
      </div>
      {manage && <AccountsManager d={d} onClose={() => setManage(false)} onChange={onChange} />}

      {view === 'overview' && (
        <NetWorthOverview d={d} months={months} latest={latest} prev={prev} />
      )}
      {view === 'archive' && (
        <NWArchive d={d} onChange={onChange} onToast={onToast} />
      )}
      {view === 'log' && (
        <LogMonthForm d={d} onSaved={() => { onChange(); onToast('Snapshot saved'); setView('overview'); }} />
      )}
    </div>
  );
};

const NWArchive: React.FC<{ d: WealthData; onChange: () => void; onToast: (m: string) => void }> = ({ d, onChange, onToast }) => {
  const { user } = useAuth();
  const accs = editableAccounts(d);
  const months = nwMonths(d).slice().reverse();
  const [edits, setEdits] = useState<Record<string, string>>({});

  const cellKey = (m: string, aid: string) => `${m}::${aid}`;
  const getVal = (m: string, aid: string) => {
    const k = cellKey(m, aid);
    if (edits[k] !== undefined) return edits[k];
    const snap = d.nwSnapshots.find(s => s.month === m && s.account_id === aid);
    return snap ? String(Math.round(toDisplay(Number(snap.value)))) : '';
  };

  const saveCell = async (m: string, aid: string, raw: string) => {
    if (!user) return;
    const k = cellKey(m, aid);
    const original = (() => {
      const snap = d.nwSnapshots.find(s => s.month === m && s.account_id === aid);
      return snap ? String(Math.round(toDisplay(Number(snap.value)))) : '';
    })();
    if (raw === original) {
      const { [k]: _, ...rest } = edits; setEdits(rest); return;
    }
    const value = fromDisplay(parseFloat(raw || '0'));
    const existing = d.nwSnapshots.find(s => s.month === m && s.account_id === aid);
    if (existing) {
      await sb.from('nw_snapshots').update({ value }).eq('id', existing.id);
    } else {
      await sb.from('nw_snapshots').insert({ user_id: user.id, month: m, account_id: aid, value });
    }
    const { [k]: _, ...rest } = edits; setEdits(rest);
    onChange();
    onToast('Saved');
  };

  const deleteMonth = async (m: string) => {
    if (!confirm(`Delete all snapshots for ${monthLabel(m)}?`)) return;
    const ids = d.nwSnapshots.filter(s => s.month === m).map(s => s.id);
    if (ids.length) await sb.from('nw_snapshots').delete().in('id', ids);
    onChange();
    onToast('Month deleted');
  };

  if (!months.length) return <Empty msg="No snapshots yet." />;

  return (
    <div className={card}>
      <Label>Snapshot archive — click any cell to edit, blur to save</Label>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-w-muted border-b border-w-border">
              <th className="py-2 pr-3 sticky left-0 bg-w-bg">Month</th>
              {accs.map(a => (
                <th key={a.id} className="py-2 px-2 text-right whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                    {a.label}
                  </span>
                </th>
              ))}
              <th className="py-2 px-2 text-right">Total</th>
              <th className="py-2 pl-2"></th>
            </tr>
          </thead>
          <tbody>
            {months.map(m => {
              const total = totalNWForMonth(d, m);
              return (
                <tr key={m} className="border-b border-w-border/50 hover:bg-w-border/10">
                  <td className="py-1.5 pr-3 sticky left-0 bg-w-bg font-medium text-w-text">{monthLabel(m)}</td>
                  {accs.map(a => {
                    const k = cellKey(m, a.id);
                    return (
                      <td key={a.id} className="py-1 px-1 text-right">
                        <input
                          className={`w-24 text-right bg-transparent border border-transparent hover:border-w-border focus:border-w-text focus:bg-w-bg/50 rounded px-1.5 py-0.5 font-mono text-xs ${edits[k] !== undefined ? 'border-w-amber' : ''}`}
                          value={getVal(m, a.id)}
                          onChange={e => setEdits({ ...edits, [k]: e.target.value })}
                          onBlur={e => saveCell(m, a.id, e.target.value)}
                        />
                      </td>
                    );
                  })}
                  <td className="py-1.5 px-2 text-right font-mono text-xs text-w-muted">{fmtMoney(total, { compact: true })}</td>
                  <td className="py-1.5 pl-2 text-right">
                    <button onClick={() => deleteMonth(m)} className="text-[10px] text-w-red hover:underline">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const NetWorthOverview: React.FC<{ d: WealthData; months: string[]; latest?: string; prev?: string }> = ({ d, months, latest, prev }) => {
  if (!latest) return <Empty msg="No net worth data yet — log your first month." />;
  const total = totalNWForMonth(d, latest);
  const prevTotal = prev ? totalNWForMonth(d, prev) : 0;
  const delta = total - prevTotal;
  const assets = totalAssetsForMonth(d, latest);
  const yearStart = latest.slice(0, 4) + '-01';
  const yearStartActual = nwMonths(d).find(m => m >= yearStart) || latest;
  const ytdBase = totalNWForMonth(d, yearStartActual);
  const ytd = total - ytdBase;
  const ytdPct = ytdBase !== 0 ? (ytd / Math.abs(ytdBase)) * 100 : 0;
  const dr = debtRatio(d, latest);

  const accs = sortedAccounts(d);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Total net worth" value={fmtMoney(total)} sub={prev ? <span className={delta >= 0 ? 'text-w-green' : 'text-w-red'}>{fmtMoney(delta, { sign: true })} vs {monthLabel(prev)}</span> : null} tone={total < 0 ? 'red' : 'default'} />
        <KpiCard label="Total assets" value={fmtMoney(assets)} tone="default" />
        <KpiCard label="YTD change" value={fmtMoney(ytd, { sign: true })} sub={fmtPct(ytdPct)} tone={ytd >= 0 ? 'green' : 'red'} />
        <KpiCard label="Debt ratio" value={`${(dr * 100).toFixed(0)}%`} tone={dr > 0.5 ? 'red' : dr > 0.3 ? 'amber' : 'green'} />
      </div>

      {months.length > 1 && (
        <div className={`${card} mb-5`}>
          <Label>Net worth trend</Label>
          <div className="h-72 mt-3">
            <Line
              data={{
                labels: months.map(monthLabel),
                datasets: [{
                  label: 'Total NW',
                  data: months.map(m => totalNWForMonth(d, m)),
                  borderColor: chartColors.green, backgroundColor: chartColors.green + '22',
                  fill: true, tension: 0.3, pointRadius: 2,
                }],
              }}
              options={{
                ...baseChartOpts,
                scales: {
                  x: baseChartOpts.scales.x,
                  y: { ...baseChartOpts.scales.y, ticks: { ...baseChartOpts.scales.y.ticks, callback: (v: any) => fmtMoney(Number(v), { compact: true }) } },
                },
              }}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <div className={`${card} lg:col-span-2`}>
          <Label>Asset classes</Label>
          <div className="mt-3 divide-y divide-w-border">
            {accs.map(a => {
              const v = Number(d.nwSnapshots.find(s => s.month === latest && s.account_id === a.id)?.value ?? 0);
              const pv = prev ? Number(d.nwSnapshots.find(s => s.month === prev && s.account_id === a.id)?.value ?? 0) : 0;
              const delta = v - pv;
              const isDebt = a.type === 'debt';
              const totalPositive = accs.reduce((s, x) => {
                if (x.type === 'debt') return s;
                const xv = Number(d.nwSnapshots.find(ss => ss.month === latest && ss.account_id === x.id)?.value ?? 0);
                return s + Math.max(0, xv);
              }, 0);
              const pct = !isDebt && totalPositive > 0 ? (Math.max(0, v) / totalPositive) * 100 : 0;
              const target = Number(a.target_pct ?? 0);
              const diff = !isDebt && target > 0 ? pct - target : null;
              return (
                <div key={a.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: a.color }} />
                    <div>
                      <div className="text-sm text-w-text">{a.label}</div>
                      <div className="text-[10px] uppercase tracking-wider text-w-muted flex gap-2">
                        <span>{a.type}</span>
                        {a.is_estimated && <span className="text-w-amber">est.</span>}
                        {!a.liquid && <span>illiquid</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Mono className={`text-base ${v < 0 ? 'text-w-red' : 'text-w-text'}`}>{fmtMoney(v)}</Mono>
                    {!isDebt && (
                      <div className="text-[10px] font-mono-w text-w-muted">
                        {pct.toFixed(1)}%
                        {diff !== null && (
                          <span className={diff >= 0 ? ' text-w-green' : ' text-w-red'}> ({diff >= 0 ? '+' : ''}{diff.toFixed(1)}% vs {target}%)</span>
                        )}
                      </div>
                    )}
                    {prev && <div className={`text-[10px] font-mono-w ${delta >= 0 ? 'text-w-green' : 'text-w-red'}`}>{fmtMoney(delta, { sign: true })}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={card}>
          <Label>Asset composition</Label>
          <div className="h-56 mt-3">
            <CompositionDonut d={d} month={latest} />
          </div>
        </div>
      </div>

      <CryptoMeter pct={cryptoExposurePct(d, latest)} />
    </>
  );
};

const CompositionDonut: React.FC<{ d: WealthData; month: string }> = ({ d, month }) => {
  const accs = sortedAccounts(d).filter(a => {
    const v = Number(d.nwSnapshots.find(s => s.month === month && s.account_id === a.id)?.value ?? 0);
    return v > 0;
  });
  if (!accs.length) return <Empty msg="No positive assets to chart." />;
  return (
    <Doughnut
      data={{
        labels: accs.map(a => a.label),
        datasets: [{
          data: accs.map(a => Number(d.nwSnapshots.find(s => s.month === month && s.account_id === a.id)?.value ?? 0)),
          backgroundColor: accs.map(a => a.color),
          borderColor: chartColors.bg, borderWidth: 2,
        }],
      }}
      options={{ ...baseChartOpts, scales: undefined as any, cutout: '65%', plugins: { ...baseChartOpts.plugins, legend: { ...baseChartOpts.plugins.legend, position: 'bottom' as const } } }}
    />
  );
};

export const CryptoMeter: React.FC<{ pct: number }> = ({ pct }) => {
  const verdict = pct < 15 ? { txt: 'Low exposure — well diversified.', tone: 'text-w-green' }
    : pct < 30 ? { txt: 'Moderate exposure — within reasonable bounds.', tone: 'text-w-green' }
    : pct < 50 ? { txt: 'Elevated exposure — monitor closely.', tone: 'text-w-amber' }
    : { txt: 'High exposure — consider rebalancing.', tone: 'text-w-red' };
  return (
    <div className={card}>
      <Label>Crypto exposure</Label>
      <div className="mt-3 relative h-3 rounded-full overflow-hidden border border-w-border" style={{ background: 'linear-gradient(to right, #4ade80 0%, #4ade80 33%, #fbbf24 50%, #f87171 100%)' }}>
        <div className="absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-w-text" style={{ left: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <Mono className="text-xl text-w-text">{fmtPct(pct)}</Mono>
        <span className={`text-xs ${verdict.tone}`}>{verdict.txt}</span>
      </div>
    </div>
  );
};

const NetWorthTrend: React.FC<{ d: WealthData; months: string[]; mode: 'total' | 'liquid' | 'stacked'; setMode: (m: 'total' | 'liquid' | 'stacked') => void }> = ({ d, months, mode, setMode }) => {
  if (!months.length) return <Empty />;
  const accs = sortedAccounts(d);

  const datasets = mode === 'stacked'
    ? accs.map(a => ({
        label: a.label,
        data: months.map(m => Number(d.nwSnapshots.find(s => s.month === m && s.account_id === a.id)?.value ?? 0)),
        backgroundColor: a.color + '88', borderColor: a.color, fill: true, stack: 's',
      }))
    : [{
        label: mode === 'liquid' ? 'Liquid NW' : 'Total NW',
        data: months.map(m => mode === 'liquid' ? liquidNWForMonth(d, m) : totalNWForMonth(d, m)),
        borderColor: chartColors.green, backgroundColor: chartColors.green + '22',
        fill: true, tension: 0.3, pointRadius: 3,
      }];

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <TabButton active={mode === 'total'} onClick={() => setMode('total')}>Total</TabButton>
        <TabButton active={mode === 'liquid'} onClick={() => setMode('liquid')}>Liquid</TabButton>
        <TabButton active={mode === 'stacked'} onClick={() => setMode('stacked')}>Stacked</TabButton>
      </div>
      <div className={card}>
        <div className="h-96">
          <Line
            data={{ labels: months.map(monthLabel), datasets: datasets as any }}
            options={{
              ...baseChartOpts,
              scales: {
                x: baseChartOpts.scales.x,
                y: { ...baseChartOpts.scales.y, stacked: mode === 'stacked', ticks: { ...baseChartOpts.scales.y.ticks, callback: (v: any) => fmtMoney(Number(v), { compact: true }) } },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

const LogMonthForm: React.FC<{ d: WealthData; onSaved: () => void }> = ({ d, onSaved }) => {
  const { user } = useAuth();
  const months = nwMonths(d);
  const lastMonth = months[months.length - 1];
  const [month, setMonth] = useState(todayMonth());
  const accs = sortedAccounts(d);
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    accs.forEach(a => {
      const last = lastMonth ? d.nwSnapshots.find(s => s.month === lastMonth && s.account_id === a.id) : null;
      init[a.id] = last ? String(Math.round(toDisplay(Number(last.value)))) : '0';
    });
    return init;
  });

  const copyLast = () => {
    if (!lastMonth) return;
    const next: Record<string, string> = {};
    accs.forEach(a => {
      const v = d.nwSnapshots.find(s => s.month === lastMonth && s.account_id === a.id);
      next[a.id] = v ? String(Math.round(toDisplay(Number(v.value)))) : '0';
    });
    setVals(next);
  };

  const save = async () => {
    if (!user) return;
    for (const a of accs) {
      const value = fromDisplay(parseFloat(vals[a.id] || '0'));
      const existing = d.nwSnapshots.find(s => s.month === month && s.account_id === a.id);
      if (existing) {
        await sb.from('nw_snapshots').update({ value }).eq('id', existing.id);
      } else {
        await sb.from('nw_snapshots').insert({ user_id: user.id, month, account_id: a.id, value });
      }
    }
    onSaved();
  };

  return (
    <div className={card}>
      <Label>Log month</Label>
      <div className="mt-3 grid sm:grid-cols-2 gap-3 max-w-md">
        <input type="month" className={inputCls} value={month} onChange={e => setMonth(e.target.value)} />
        <button onClick={copyLast} className={btn}>Copy from {lastMonth ? monthLabel(lastMonth) : 'last'}</button>
      </div>
      <div className="mt-5 space-y-3 max-w-md">
        {accs.map(a => (
          <div key={a.id}>
            <Label>{a.label} {a.type === 'debt' && <span className="text-w-red">(use negative value)</span>}</Label>
            <input className={`${inputCls} mt-1`} value={vals[a.id]} onChange={e => setVals({ ...vals, [a.id]: e.target.value })} />
          </div>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={save} className={btnPrimary}>Save snapshot</button>
      </div>
    </div>
  );
};
