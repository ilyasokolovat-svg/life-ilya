import React, { useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { WealthData } from '../types';
import { card, kpi, inputCls, btn, btnPrimary, Heading, Label, Mono, KpiCard, Empty, TabButton, baseChartOpts, chartColors } from '../ui';
import { fmtMoney, fmtPct, monthLabel, todayMonth, toDisplay, fromDisplay } from '../format';
import { investmentMonths, totalPortfolio, totalContributed, cryptoExposurePct } from '../calc';
import { CryptoMeter } from './NetWorthTab';

const sb = supabase as any;
const sortedBuckets = (d: WealthData) => [...d.investmentBuckets].sort((a, b) => a.sort_order - b.sort_order);

import { BucketsManager } from '../Managers';

export const InvestmentsTab: React.FC<{ d: WealthData; onChange: () => void; onToast: (m: string) => void }> = ({ d, onChange, onToast }) => {
  const [view, setView] = useState<'overview' | 'growth' | 'projection' | 'archive' | 'log'>('overview');
  const [manage, setManage] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <Heading className="text-3xl">Investments</Heading>
        <div className="flex gap-2 flex-wrap">
          <TabButton active={view === 'overview'} onClick={() => setView('overview')}>Overview</TabButton>
          <TabButton active={view === 'growth'} onClick={() => setView('growth')}>Growth</TabButton>
          <TabButton active={view === 'projection'} onClick={() => setView('projection')}>Projection</TabButton>
          <TabButton active={view === 'archive'} onClick={() => setView('archive')}>Archive</TabButton>
          <TabButton active={view === 'log'} onClick={() => setView('log')}>+ Log month</TabButton>
          <button onClick={() => setManage(true)} className="px-3 py-1.5 text-sm rounded-[8px] text-w-muted hover:text-w-text border border-w-border">Manage buckets</button>
        </div>
      </div>
      {manage && <BucketsManager d={d} onClose={() => setManage(false)} onChange={onChange} />}

      {view === 'overview' && <InvOverview d={d} />}
      {view === 'growth' && <InvGrowth d={d} />}
      {view === 'projection' && <InvProjection d={d} />}
      {view === 'archive' && <InvArchive d={d} onChange={onChange} />}
      {view === 'log' && <InvLog d={d} onSaved={() => { onChange(); onToast('Snapshot saved'); setView('overview'); }} />}
    </div>
  );
};

const InvOverview: React.FC<{ d: WealthData }> = ({ d }) => {
  const months = investmentMonths(d);
  if (!months.length) return <Empty />;
  const latest = months[months.length - 1];
  const prev = months[months.length - 2];
  const total = totalPortfolio(d, latest);
  const contrib = totalContributed(d);
  const gains = total - contrib;
  const cryptoPct = cryptoExposurePct(d, latest);
  const monthlyContrib = d.investmentSnapshots.filter(s => s.month === latest).reduce((a, s) => a + Number(s.contribution), 0);
  const currentYear = latest.slice(0, 4);
  const ytdContrib = d.investmentSnapshots.filter(s => s.month.startsWith(currentYear)).reduce((a, s) => a + Number(s.contribution), 0);
  const buckets = sortedBuckets(d);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <KpiCard label="Total portfolio" value={fmtMoney(total)} sub={monthLabel(latest)} />
        <KpiCard label="Market gains" value={fmtMoney(gains, { sign: true })} tone={gains >= 0 ? 'green' : 'red'} />
        <KpiCard label="Crypto exposure" value={fmtPct(cryptoPct)} tone={cryptoPct < 30 ? 'green' : cryptoPct < 50 ? 'amber' : 'red'} />
        <KpiCard label="Monthly contribution" value={fmtMoney(monthlyContrib)} sub={monthLabel(latest)} />
        <KpiCard label={`YTD contributions ${currentYear}`} value={fmtMoney(ytdContrib)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <div className={`${card} lg:col-span-2`}>
          <Label>Buckets</Label>
          <div className="mt-3 space-y-3">
            {buckets.map(b => {
              const v = Number(d.investmentSnapshots.find(s => s.month === latest && s.bucket_id === b.id)?.value ?? 0);
              const pv = prev ? Number(d.investmentSnapshots.find(s => s.month === prev && s.bucket_id === b.id)?.value ?? 0) : 0;
              const delta = v - pv;
              const pct = total > 0 ? (v / total) * 100 : 0;
              return (
                <div key={b.id}>
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <div className="text-sm text-w-text flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: b.color }} />{b.label}</div>
                      {b.description && <div className="text-[10px] text-w-muted ml-4">{b.description}</div>}
                    </div>
                    <div className="text-right">
                      <Mono className="text-base text-w-text">{fmtMoney(v)}</Mono>
                      {prev && <div className={`text-[10px] font-mono-w ${delta >= 0 ? 'text-w-green' : 'text-w-red'}`}>{fmtMoney(delta, { sign: true })}</div>}
                    </div>
                  </div>
                  <div className="h-1.5 bg-w-surface2 rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${pct}%`, background: b.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={card}>
          <Label>Allocation</Label>
          <div className="h-56 mt-3">
            <Doughnut
              data={{
                labels: buckets.map(b => b.label),
                datasets: [{
                  data: buckets.map(b => Number(d.investmentSnapshots.find(s => s.month === latest && s.bucket_id === b.id)?.value ?? 0)),
                  backgroundColor: buckets.map(b => b.color), borderColor: chartColors.bg, borderWidth: 2,
                }],
              }}
              options={{ ...baseChartOpts, scales: undefined as any, cutout: '65%', plugins: { ...baseChartOpts.plugins, legend: { ...baseChartOpts.plugins.legend, position: 'bottom' as const } } }}
            />
          </div>
        </div>
      </div>

      <CryptoMeter pct={cryptoPct} />
    </>
  );
};

const InvGrowth: React.FC<{ d: WealthData }> = ({ d }) => {
  const months = investmentMonths(d);
  if (!months.length) return <Empty />;
  const latest = months[months.length - 1];
  const value = totalPortfolio(d, latest);
  const contrib = totalContributed(d);
  const gains = value - contrib;
  const ret = contrib > 0 ? (gains / contrib) * 100 : 0;

  // cumulative contributions per month
  let running = 0;
  const cumulative = months.map(m => {
    running += d.investmentSnapshots.filter(s => s.month === m).reduce((a, s) => a + Number(s.contribution), 0);
    return running;
  });

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Portfolio value" value={fmtMoney(value)} />
        <KpiCard label="Total contributed" value={fmtMoney(contrib)} />
        <KpiCard label="Market gains" value={fmtMoney(gains, { sign: true })} sub={fmtPct(ret)} tone={gains >= 0 ? 'green' : 'red'} />
        <KpiCard label="Est. XIRR" value={contrib > 0 ? `${(ret / Math.max(1, months.length / 12)).toFixed(1)}%` : '—'} />
      </div>

      <div className={card + ' mb-4'}>
        <Label>Portfolio value vs invested</Label>
        <div className="h-80 mt-3">
          <Line
            data={{
              labels: months.map(monthLabel),
              datasets: [
                { label: 'Portfolio value', data: months.map(m => totalPortfolio(d, m)), borderColor: chartColors.green, backgroundColor: chartColors.green + '22', fill: true, tension: 0.3 },
                { label: 'Cumulative contributions', data: cumulative, borderColor: chartColors.muted, borderDash: [4, 4], fill: false },
              ],
            }}
            options={{ ...baseChartOpts, scales: { x: baseChartOpts.scales.x, y: { ...baseChartOpts.scales.y, ticks: { ...baseChartOpts.scales.y.ticks, callback: (v: any) => fmtMoney(Number(v), { compact: true }) } } } }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className={card}>
          <Label>Monthly contributions</Label>
          <div className="h-64 mt-3">
            <Bar
              data={{
                labels: months.map(monthLabel),
                datasets: [{ label: 'Contribution', data: months.map(m => d.investmentSnapshots.filter(s => s.month === m).reduce((a, s) => a + Number(s.contribution), 0)), backgroundColor: chartColors.blue }],
              }}
              options={baseChartOpts}
            />
          </div>
        </div>
        <div className={card}>
          <Label>Gains vs contributions</Label>
          <div className="h-64 mt-3 flex items-center justify-center">
            <Doughnut
              data={{ labels: ['Contributed', 'Market gains'], datasets: [{ data: [contrib, Math.max(0, gains)], backgroundColor: [chartColors.blue, chartColors.green], borderColor: chartColors.bg, borderWidth: 2 }] }}
              options={{ ...baseChartOpts, scales: undefined as any, cutout: '60%' }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const InvProjection: React.FC<{ d: WealthData }> = ({ d }) => {
  const months = investmentMonths(d);
  const latest = months[months.length - 1];
  const value = latest ? totalPortfolio(d, latest) : 0;
  const [eqRet, setEqRet] = useState(8);
  const [crRet, setCrRet] = useState(15);
  const [contrib, setContrib] = useState(3450);

  const project = (years: number, blend = 0.5) => {
    const monthlyR = (eqRet * (1 - blend) + crRet * blend) / 100 / 12;
    let v = value;
    const series: number[] = [v];
    for (let i = 1; i <= years * 12; i++) {
      v = v * (1 + monthlyR) + contrib;
      series.push(v);
    }
    return series;
  };

  const milestones = [
    { v: 50000, label: '$50k' }, { v: 100000, label: '$100k' },
    { v: 250000, label: '$250k' }, { v: 500000, label: '$500k' }, { v: 1000000, label: '$1M' },
  ];
  const monthsTo = (target: number) => {
    if (value >= target) return 0;
    const r = (eqRet + crRet) / 2 / 100 / 12;
    let v = value, m = 0;
    while (v < target && m < 600) { v = v * (1 + r) + contrib; m++; }
    return m;
  };

  const baseline = project(10, 0.4);
  const optimistic = project(10, 0.6);
  const conservative = (() => {
    const monthlyR = (eqRet * 0.7 + crRet * 0.3) * 0.5 / 100 / 12;
    let v = value; const s: number[] = [v];
    for (let i = 1; i <= 120; i++) { v = v * (1 + monthlyR) + contrib * 0.8; s.push(v); }
    return s;
  })();

  const labels = Array.from({ length: 121 }, (_, i) => `${(i / 12).toFixed(1)}y`);

  return (
    <>
      <div className={card + ' mb-4'}>
        <Label>Projection assumptions</Label>
        <div className="mt-4 grid lg:grid-cols-3 gap-5">
          <div>
            <div className="text-xs text-w-muted">Equities return: <Mono className="text-w-text">{eqRet}%</Mono></div>
            <input type="range" min="0" max="20" step="0.5" value={eqRet} onChange={e => setEqRet(parseFloat(e.target.value))} className="w-full mt-2 accent-w-green" />
          </div>
          <div>
            <div className="text-xs text-w-muted">Crypto return: <Mono className="text-w-text">{crRet}%</Mono></div>
            <input type="range" min="-20" max="50" step="1" value={crRet} onChange={e => setCrRet(parseFloat(e.target.value))} className="w-full mt-2 accent-w-amber" />
          </div>
          <div>
            <div className="text-xs text-w-muted">Monthly contribution: <Mono className="text-w-text">{fmtMoney(contrib)}</Mono></div>
            <input type="range" min="0" max="10000" step="100" value={contrib} onChange={e => setContrib(parseFloat(e.target.value))} className="w-full mt-2 accent-w-blue" />
          </div>
        </div>
      </div>

      <div className={card + ' mb-4'}>
        <Label>10-year scenarios</Label>
        <div className="h-80 mt-3">
          <Line
            data={{
              labels,
              datasets: [
                { label: 'Optimistic', data: optimistic, borderColor: chartColors.green, fill: false, pointRadius: 0 },
                { label: 'Baseline', data: baseline, borderColor: chartColors.blue, fill: false, pointRadius: 0 },
                { label: 'Conservative', data: conservative, borderColor: chartColors.amber, fill: false, pointRadius: 0 },
              ],
            }}
            options={{ ...baseChartOpts, scales: { x: baseChartOpts.scales.x, y: { ...baseChartOpts.scales.y, ticks: { ...baseChartOpts.scales.y.ticks, callback: (v: any) => fmtMoney(Number(v), { compact: true }) } } } }}
          />
        </div>
      </div>

      <div className={card}>
        <Label>Milestones</Label>
        <table className="w-full mt-3 text-sm">
          <thead><tr className="text-left text-xs text-w-muted border-b border-w-border">
            <th className="py-2">Milestone</th><th className="py-2 text-right">Months to reach</th><th className="py-2 text-right">Years</th>
          </tr></thead>
          <tbody>
            {milestones.map(m => {
              const mo = monthsTo(m.v);
              const reached = value >= m.v;
              return (
                <tr key={m.v} className="border-b border-w-border/50">
                  <td className="py-2 text-w-text">{m.label}</td>
                  <td className={`py-2 text-right font-mono-w ${reached ? 'text-w-green' : 'text-w-text'}`}>{reached ? 'reached' : mo}</td>
                  <td className="py-2 text-right font-mono-w text-w-muted">{reached ? '—' : (mo / 12).toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

const InvArchive: React.FC<{ d: WealthData }> = ({ d }) => {
  const months = investmentMonths(d);
  if (!months.length) return <Empty />;
  const buckets = sortedBuckets(d);
  const reverse = [...months].reverse();
  return (
    <>
      <div className={card + ' overflow-x-auto mb-4'}>
        <Label>All snapshots</Label>
        <table className="w-full mt-3 text-sm">
          <thead><tr className="text-left text-xs text-w-muted border-b border-w-border">
            <th className="py-2">Month</th><th className="py-2 text-right">Total</th>
            {buckets.map(b => <th key={b.id} className="py-2 text-right">{b.label}</th>)}
            <th className="py-2 text-right">Crypto %</th><th className="py-2 text-right">Contribution</th><th className="py-2 text-right">vs prev</th>
          </tr></thead>
          <tbody>
            {reverse.map((m, i) => {
              const total = totalPortfolio(d, m);
              const prev = i < reverse.length - 1 ? totalPortfolio(d, reverse[i + 1]) : 0;
              const delta = total - prev;
              const cryptoPct = cryptoExposurePct(d, m);
              const c = d.investmentSnapshots.filter(s => s.month === m).reduce((a, s) => a + Number(s.contribution), 0);
              return (
                <tr key={m} className="border-b border-w-border/50">
                  <td className="py-2 text-w-text font-mono-w">{monthLabel(m)}</td>
                  <td className="py-2 text-right font-mono-w text-w-text">{fmtMoney(total)}</td>
                  {buckets.map(b => {
                    const v = Number(d.investmentSnapshots.find(s => s.month === m && s.bucket_id === b.id)?.value ?? 0);
                    return <td key={b.id} className="py-2 text-right font-mono-w text-w-muted">{fmtMoney(v)}</td>;
                  })}
                  <td className={`py-2 text-right font-mono-w ${cryptoPct > 50 ? 'text-w-red' : cryptoPct > 30 ? 'text-w-amber' : 'text-w-green'}`}>{fmtPct(cryptoPct, 0)}</td>
                  <td className="py-2 text-right font-mono-w text-w-muted">{fmtMoney(c)}</td>
                  <td className={`py-2 text-right font-mono-w ${delta >= 0 ? 'text-w-green' : 'text-w-red'}`}>{i < reverse.length - 1 ? fmtMoney(delta, { sign: true }) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={card}>
        <Label>Crypto % over time</Label>
        <div className="h-64 mt-3">
          <Line
            data={{
              labels: months.map(monthLabel),
              datasets: [
                { label: 'Crypto %', data: months.map(m => cryptoExposurePct(d, m)), borderColor: chartColors.amber, backgroundColor: chartColors.amber + '22', fill: true, tension: 0.3 },
                { label: '20% target', data: months.map(() => 20), borderColor: chartColors.green, borderDash: [4, 4], fill: false, pointRadius: 0 },
                { label: '30% caution', data: months.map(() => 30), borderColor: chartColors.red, borderDash: [4, 4], fill: false, pointRadius: 0 },
              ],
            }}
            options={{ ...baseChartOpts, scales: { x: baseChartOpts.scales.x, y: { ...baseChartOpts.scales.y, ticks: { ...baseChartOpts.scales.y.ticks, callback: (v: any) => `${v}%` } } } }}
          />
        </div>
      </div>
    </>
  );
};

const InvLog: React.FC<{ d: WealthData; onSaved: () => void }> = ({ d, onSaved }) => {
  const { user } = useAuth();
  const months = investmentMonths(d);
  const lastMonth = months[months.length - 1];
  const buckets = sortedBuckets(d);
  const [month, setMonth] = useState(todayMonth());
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    buckets.forEach(b => {
      const v = lastMonth ? d.investmentSnapshots.find(s => s.month === lastMonth && s.bucket_id === b.id) : null;
      init[b.id] = v ? String(v.value) : '0';
    });
    return init;
  });
  const [contribs, setContribs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    buckets.forEach(b => { init[b.id] = '0'; });
    return init;
  });
  const totalContrib = buckets.reduce((a, b) => a + (parseFloat(contribs[b.id] || '0') || 0), 0);

  const save = async () => {
    if (!user) return;
    for (const b of buckets) {
      const value = parseFloat(vals[b.id] || '0');
      const contribution = parseFloat(contribs[b.id] || '0');
      const existing = d.investmentSnapshots.find(s => s.month === month && s.bucket_id === b.id);
      if (existing) await sb.from('investment_snapshots').update({ value, contribution }).eq('id', existing.id);
      else await sb.from('investment_snapshots').insert({ user_id: user.id, month, bucket_id: b.id, value, contribution });
    }
    onSaved();
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className={`${card} lg:col-span-2`}>
        <Label>Log month</Label>
        <div className="mt-3 max-w-md">
          <input type="month" className={inputCls} value={month} onChange={e => setMonth(e.target.value)} />
        </div>
        <div className="mt-5 space-y-3 max-w-md">
          {buckets.map(b => (
            <div key={b.id} className="grid grid-cols-2 gap-2">
              <div>
                <Label>{b.label} — value</Label>
                <input className={`${inputCls} mt-1`} value={vals[b.id]} onChange={e => setVals({ ...vals, [b.id]: e.target.value })} />
              </div>
              <div>
                <Label>Contribution</Label>
                <input className={`${inputCls} mt-1`} value={contribs[b.id]} onChange={e => setContribs({ ...contribs, [b.id]: e.target.value })} />
              </div>
            </div>
          ))}
          <div className="text-xs text-w-muted pt-2">Total contribution: <Mono className="text-w-text">{fmtMoney(totalContrib)}</Mono></div>
        </div>
        <div className="mt-5">
          <button onClick={save} className={btnPrimary}>Save snapshot</button>
        </div>
      </div>
      <div className={card}>
        <Label>Routine</Label>
        <ol className="mt-3 text-sm text-w-muted space-y-2 list-decimal list-inside">
          <li>IBKR → total portfolio value</li>
          <li>Trading 212 → total value</li>
          <li>eToro → portfolio value</li>
          <li>KuCoin, OKX, Bybit, Binance, MM, Gate, MEXC, Bitget → sum all crypto totals</li>
          <li>Enter monthly contribution</li>
        </ol>
        <div className="mt-3 text-[10px] text-w-faint">~8 minutes</div>
      </div>
    </div>
  );
};
