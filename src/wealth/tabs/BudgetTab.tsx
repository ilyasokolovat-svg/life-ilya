import React, { useMemo, useState } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { WealthData, ExtraType } from '../types';
import { card, kpi, inputCls, btn, btnPrimary, Heading, Label, Mono, KpiCard, Empty, TabButton, baseChartOpts, chartColors } from '../ui';
import { fmtMoney, fmtPct, monthLabel, todayMonth, toDisplay, fromDisplay } from '../format';
import { budgetMonths, totalIncome, totalSpend, surplus, savingsRate } from '../calc';

const sb = supabase as any;

import { CategoriesManager } from '../Managers';

export const BudgetTab: React.FC<{ d: WealthData; onChange: () => void; onToast: (m: string) => void }> = ({ d, onChange, onToast }) => {
  const [view, setView] = useState<'monthly' | 'yearly' | 'bonus' | 'log'>('monthly');
  const [manage, setManage] = useState(false);
  const months = budgetMonths(d);
  const [selectedMonth, setSelectedMonth] = useState<string>(months[months.length - 1] || todayMonth());

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <Heading className="text-3xl">Budget</Heading>
        <div className="flex gap-2 flex-wrap">
          <TabButton active={view === 'monthly'} onClick={() => setView('monthly')}>Monthly</TabButton>
          <TabButton active={view === 'yearly'} onClick={() => setView('yearly')}>Yearly</TabButton>
          <TabButton active={view === 'bonus'} onClick={() => setView('bonus')}>Bonus history</TabButton>
          <TabButton active={view === 'log'} onClick={() => setView('log')}>+ Log month</TabButton>
          <button onClick={() => setManage(true)} className="px-3 py-1.5 text-sm rounded-[8px] text-w-muted hover:text-w-text border border-w-border">Manage categories</button>
        </div>
      </div>
      {manage && <CategoriesManager d={d} onClose={() => setManage(false)} onChange={onChange} />}

      {view === 'monthly' && <BudgetMonthly d={d} months={months} month={selectedMonth} setMonth={setSelectedMonth} onChange={onChange} onToast={onToast} />}
      {view === 'yearly' && <BudgetYearly d={d} onChange={onChange} />}
      {view === 'bonus' && <BonusHistory d={d} />}
      {view === 'log' && <BudgetLog d={d} onSaved={() => { onChange(); onToast('Month saved'); setView('monthly'); }} />}
    </div>
  );
};

const BudgetMonthly: React.FC<{ d: WealthData; months: string[]; month: string; setMonth: (m: string) => void }> = ({ d, months, month, setMonth }) => {
  if (!months.length) return <Empty msg="No budget data yet — log your first month." />;
  const m = d.budgetMonths.find(b => b.month === month);
  const salary = m ? Number(m.salary) : 0;
  const extras = d.budgetExtras.filter(e => e.month === month);
  const inc = totalIncome(d, month);
  const spend = totalSpend(d, month);
  const sr = savingsRate(d, month);
  const sur = surplus(d, month);
  const target = Number(d.settings?.savings_rate_target ?? 30);
  const srTone: 'green' | 'amber' | 'red' = sr >= target ? 'green' : sr >= target - 10 ? 'amber' : 'red';
  const cats = [...d.budgetCategories].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {months.map(mm => (
          <button key={mm} onClick={() => setMonth(mm)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${mm === month ? 'border-w-text bg-w-surface2 text-w-text' : 'border-w-border text-w-muted hover:text-w-text'}`}>{monthLabel(mm)}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <KpiCard label="Base salary" value={fmtMoney(salary)} />
        <KpiCard label="Total income" value={fmtMoney(inc)} />
        <KpiCard label="Total spent" value={fmtMoney(spend)} />
        <KpiCard label="Savings rate" value={`${sr.toFixed(0)}%`} tone={srTone} sub={`target ${target}%`} />
        <KpiCard label="Surplus" value={fmtMoney(sur, { sign: true })} tone={sur >= 0 ? 'green' : 'red'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <div className={card}>
          <Label>Income breakdown</Label>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-w-border"><span className="text-w-text">Salary</span><Mono>{fmtMoney(salary)}</Mono></div>
            {extras.map(e => (
              <div key={e.id} className="flex justify-between py-2 border-b border-w-border">
                <span className="text-w-text flex items-center gap-2">{e.description}<span className="text-[10px] uppercase tracking-wider text-w-muted px-1.5 py-0.5 border border-w-border rounded">{e.type}</span></span>
                <Mono>{fmtMoney(Number(e.amount))}</Mono>
              </div>
            ))}
            <div className="flex justify-between py-2 font-semibold"><span className="text-w-text">Total</span><Mono className="text-w-green">{fmtMoney(inc)}</Mono></div>
          </div>
        </div>

        <div className={`${card} lg:col-span-2`}>
          <Label>Categories — actual vs budget</Label>
          <div className="mt-3 space-y-3">
            {cats.map(c => {
              const actual = Number(d.budgetSpending.find(s => s.month === month && s.category_id === c.id)?.actual ?? 0);
              const pct = c.budget > 0 ? (actual / Number(c.budget)) * 100 : 0;
              const over = pct > 100;
              return (
                <div key={c.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-w-text">{c.label}</span>
                    <Mono className={over ? 'text-w-red' : 'text-w-muted'}>{fmtMoney(actual)} / {fmtMoney(Number(c.budget))}</Mono>
                  </div>
                  <div className="h-1.5 bg-w-surface2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: over ? chartColors.red : c.color }} />
                  </div>
                </div>
              );
            })}
            {(() => {
              const totalActual = cats.reduce((a, c) => a + Number(d.budgetSpending.find(s => s.month === month && s.category_id === c.id)?.actual ?? 0), 0);
              const totalBudget = cats.reduce((a, c) => a + Number(c.budget), 0);
              const overAll = totalActual > totalBudget;
              return (
                <div className="pt-3 border-t border-w-border flex justify-between text-sm">
                  <span className="text-w-text font-semibold">Total</span>
                  <Mono className={overAll ? 'text-w-red' : 'text-w-text'}>{fmtMoney(totalActual)} / {fmtMoney(totalBudget)}</Mono>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className={card}>
          <Label>Spend breakdown</Label>
          <div className="h-64 mt-3">
            <Doughnut
              data={{
                labels: cats.map(c => c.label),
                datasets: [{
                  data: cats.map(c => Number(d.budgetSpending.find(s => s.month === month && s.category_id === c.id)?.actual ?? 0)),
                  backgroundColor: cats.map(c => c.color), borderColor: chartColors.bg, borderWidth: 2,
                }],
              }}
              options={{ ...baseChartOpts, scales: undefined as any, cutout: '60%', plugins: { ...baseChartOpts.plugins, legend: { ...baseChartOpts.plugins.legend, position: 'right' as const } } }}
            />
          </div>
        </div>
        <div className={card}>
          <Label>Savings rate trend</Label>
          <div className="h-64 mt-3">
            <Line
              data={{
                labels: months.map(monthLabel),
                datasets: [{
                  label: 'Savings rate %',
                  data: months.map(mm => savingsRate(d, mm)),
                  borderColor: chartColors.green, backgroundColor: chartColors.green + '22', fill: true, tension: 0.3,
                  pointBackgroundColor: months.map(mm => savingsRate(d, mm) >= target ? chartColors.green : savingsRate(d, mm) >= target - 10 ? chartColors.amber : chartColors.red),
                  pointRadius: 4,
                }],
              }}
              options={{ ...baseChartOpts, scales: { x: baseChartOpts.scales.x, y: { ...baseChartOpts.scales.y, ticks: { ...baseChartOpts.scales.y.ticks, callback: (v: any) => `${v}%` } } } }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const BudgetYearly: React.FC<{ d: WealthData; onChange?: () => void }> = ({ d, onChange }) => {
  const { user } = useAuth();
  const months = budgetMonths(d);
  const years = Array.from(new Set(months.map(m => m.slice(0, 4)))).sort();
  const [year, setYear] = useState(years[years.length - 1] || String(new Date().getFullYear()));
  if (!years.length) return <Empty />;

  // Always show all 12 months for a stacked view
  const yearMonths = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
  const totalInc = yearMonths.reduce((a, m) => a + totalIncome(d, m), 0);
  const irregular = d.budgetExtras.filter(e => e.month.startsWith(year)).reduce((a, e) => a + Number(e.amount), 0);
  const totalSp = yearMonths.reduce((a, m) => a + totalSpend(d, m), 0);
  const filledMonths = yearMonths.filter(m => d.budgetMonths.find(b => b.month === m) || d.budgetSpending.find(s => s.month === m));
  const avgSr = filledMonths.length ? filledMonths.reduce((a, m) => a + savingsRate(d, m), 0) / filledMonths.length : 0;

  const cats = [...d.budgetCategories].sort((a, b) => a.sort_order - b.sort_order);

  const saveCell = async (catId: string, month: string, raw: string) => {
    if (!user) return;
    const actual = fromDisplay(Number(raw) || 0);
    const existing = d.budgetSpending.find(s => s.month === month && s.category_id === catId);
    if (existing) await sb.from('budget_spending').update({ actual }).eq('id', existing.id);
    else if (actual > 0) await sb.from('budget_spending').insert({ user_id: user.id, month, category_id: catId, actual });
    onChange?.();
  };

  return (
    <>
      <div className="flex gap-2 mb-4">
        {years.map(y => <TabButton key={y} active={y === year} onClick={() => setYear(y)}>{y}</TabButton>)}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Total income" value={fmtMoney(totalInc)} />
        <KpiCard label="Irregular income" value={fmtMoney(irregular)} />
        <KpiCard label="Total spend" value={fmtMoney(totalSp)} />
        <KpiCard label="Avg savings rate" value={`${avgSr.toFixed(0)}%`} tone={avgSr >= 30 ? 'green' : avgSr >= 20 ? 'amber' : 'red'} />
      </div>

      <div className={`${card} overflow-x-auto`}>
        <Label>Categories × month — click any value to edit</Label>
        <table className="w-full mt-3 text-sm">
          <thead><tr className="text-left text-xs text-w-muted">
            <th className="py-2 pr-2">Category</th>
            {yearMonths.map(m => <th key={m} className="px-2 text-right">{monthLabel(m)}</th>)}
            <th className="px-2 text-right text-w-text">YTD avg</th>
          </tr></thead>
          <tbody>
            {cats.map(c => {
              const vals = yearMonths.map(m => Number(d.budgetSpending.find(s => s.month === m && s.category_id === c.id)?.actual ?? 0));
              const filled = vals.filter(v => v > 0);
              const avg = filled.length ? filled.reduce((a, v) => a + v, 0) / filled.length : 0;
              return (
                <tr key={c.id} className="border-t border-w-border">
                  <td className="py-2 pr-2 text-w-text"><span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: c.color }} />{c.label}</td>
                  {yearMonths.map((m, i) => {
                    const v = vals[i];
                    const ratio = c.budget > 0 ? v / Number(c.budget) : 0;
                    const tone = ratio > 1 ? 'text-w-red' : ratio < 0.7 && v > 0 ? 'text-w-green' : 'text-w-text';
                    return (
                      <td key={m} className="px-1 text-right">
                        <input
                          key={`${m}-${v}`}
                          defaultValue={v ? Math.round(toDisplay(v)) : ''}
                          placeholder="—"
                          onBlur={e => { const newDisplay = Number(e.target.value || 0); if (Math.round(toDisplay(v)) !== newDisplay) saveCell(c.id, m, String(newDisplay)); }}
                          className={`w-20 bg-transparent text-right font-mono-w text-xs ${tone} hover:bg-w-surface2 focus:bg-w-surface2 rounded px-1 py-0.5 outline-none`}
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 text-right font-mono-w text-w-text">{avg ? fmtMoney(avg, { compact: true }) : '—'}</td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-w-border font-semibold">
              <td className="py-2 pr-2 text-w-text">Total spend</td>
              {yearMonths.map(m => {
                const v = totalSpend(d, m);
                return <td key={m} className="px-2 text-right font-mono-w text-w-text">{v ? fmtMoney(v, { compact: true }) : '—'}</td>;
              })}
              <td className="px-2 text-right font-mono-w text-w-green">{filledMonths.length ? fmtMoney(totalSp / filledMonths.length, { compact: true }) : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

const BonusHistory: React.FC<{ d: WealthData }> = ({ d }) => {
  const extras = [...d.budgetExtras].sort((a, b) => b.month.localeCompare(a.month));
  const total = extras.reduce((a, e) => a + Number(e.amount), 0);
  const commissions = extras.filter(e => /commission/i.test(e.description)).reduce((a, e) => a + Number(e.amount), 0);
  const bonuses = extras.filter(e => e.type === 'bonus').reduce((a, e) => a + Number(e.amount), 0);
  const best = extras.reduce<{ m: string; v: number }>((acc, e) => Number(e.amount) > acc.v ? { m: e.month, v: Number(e.amount) } : acc, { m: '', v: 0 });

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KpiCard label="Total irregular" value={fmtMoney(total)} />
        <KpiCard label="Commissions" value={fmtMoney(commissions)} />
        <KpiCard label="Bonuses" value={fmtMoney(bonuses)} />
        <KpiCard label="Best month" value={best.m ? fmtMoney(best.v) : '—'} sub={best.m ? monthLabel(best.m) : ''} />
      </div>
      <div className={card}>
        <Label>All entries</Label>
        <table className="w-full mt-3 text-sm">
          <thead><tr className="text-left text-xs text-w-muted border-b border-w-border">
            <th className="py-2">Month</th><th className="py-2">Description</th><th className="py-2">Type</th><th className="py-2 text-right">Amount</th>
          </tr></thead>
          <tbody>
            {extras.map(e => (
              <tr key={e.id} className="border-b border-w-border/50">
                <td className="py-2 text-w-text font-mono-w">{monthLabel(e.month)}</td>
                <td className="py-2 text-w-text">{e.description}</td>
                <td className="py-2 text-w-muted text-xs uppercase tracking-wider">{e.type}</td>
                <td className="py-2 text-right"><Mono className="text-w-green">{fmtMoney(Number(e.amount))}</Mono></td>
              </tr>
            ))}
            {!extras.length && <tr><td colSpan={4} className="py-6 text-center text-w-muted text-sm">No bonus history yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
};

const BudgetLog: React.FC<{ d: WealthData; onSaved: () => void }> = ({ d, onSaved }) => {
  const { user } = useAuth();
  const months = budgetMonths(d);
  const lastMonth = months[months.length - 1];
  const [month, setMonth] = useState(todayMonth());
  const lastBM = lastMonth ? d.budgetMonths.find(b => b.month === lastMonth) : null;
  const [salary, setSalary] = useState(lastBM ? String(Math.round(toDisplay(Number(lastBM.salary)))) : '0');
  const [extras, setExtras] = useState<{ description: string; amount: string; type: ExtraType }[]>([]);
  const cats = [...d.budgetCategories].sort((a, b) => a.sort_order - b.sort_order);
  const [spend, setSpend] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    cats.forEach(c => { init[c.id] = '0'; });
    return init;
  });

  const addExtra = () => setExtras([...extras, { description: '', amount: '0', type: 'bonus' }]);
  const removeExtra = (i: number) => setExtras(extras.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!user) return;
    const sal = fromDisplay(parseFloat(salary || '0'));
    const existingBM = d.budgetMonths.find(b => b.month === month);
    if (existingBM) await sb.from('budget_months').update({ salary: sal }).eq('id', existingBM.id);
    else await sb.from('budget_months').insert({ user_id: user.id, month, salary: sal });

    for (const e of extras) {
      if (!e.description.trim()) continue;
      const amt = fromDisplay(parseFloat(e.amount || '0'));
      const { data: ex } = await sb.from('budget_extras').insert({
        user_id: user.id, month, description: e.description, amount: amt, type: e.type,
      }).select().single();
      if (ex && (e.type === 'bonus' || e.type === 'freelance' || e.type === 'dividend')) {
        await sb.from('bonus_pools').insert({
          user_id: user.id, month, description: e.description, source_extra_id: ex.id, total_amount: amt,
        });
      }
    }
    for (const c of cats) {
      const actual = fromDisplay(parseFloat(spend[c.id] || '0'));
      if (!actual) continue;
      const existing = d.budgetSpending.find(s => s.month === month && s.category_id === c.id);
      if (existing) await sb.from('budget_spending').update({ actual }).eq('id', existing.id);
      else await sb.from('budget_spending').insert({ user_id: user.id, month, category_id: c.id, actual });
    }
    onSaved();
  };

  return (
    <div className={card}>
      <Label>Log month</Label>
      <div className="mt-3 grid sm:grid-cols-2 gap-3 max-w-md">
        <input type="month" className={inputCls} value={month} onChange={e => setMonth(e.target.value)} />
        <input className={inputCls} value={salary} onChange={e => setSalary(e.target.value)} placeholder="Salary" />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <Label>Irregular income</Label>
          <button onClick={addExtra} className="text-xs text-w-blue hover:underline">+ add entry</button>
        </div>
        {extras.map((e, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 mb-2">
            <input className={`${inputCls} col-span-5`} placeholder="Description" value={e.description} onChange={ev => setExtras(extras.map((x, idx) => idx === i ? { ...x, description: ev.target.value } : x))} />
            <input className={`${inputCls} col-span-3`} placeholder="Amount" value={e.amount} onChange={ev => setExtras(extras.map((x, idx) => idx === i ? { ...x, amount: ev.target.value } : x))} />
            <select className={`${inputCls} col-span-3`} value={e.type} onChange={ev => setExtras(extras.map((x, idx) => idx === i ? { ...x, type: ev.target.value as ExtraType } : x))}>
              <option value="bonus">bonus</option><option value="freelance">freelance</option>
              <option value="dividend">dividend</option><option value="tax-refund">tax-refund</option><option value="other">other</option>
            </select>
            <button onClick={() => removeExtra(i)} className="col-span-1 text-w-red text-sm">×</button>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Label>Spending by category</Label>
        <div className="mt-3 grid sm:grid-cols-2 gap-3 max-w-2xl">
          {cats.map(c => (
            <div key={c.id}>
              <div className="text-xs text-w-muted mb-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.label}</div>
              <input className={inputCls} value={spend[c.id]} onChange={e => setSpend({ ...spend, [c.id]: e.target.value })} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <button onClick={save} className={btnPrimary}>Save month</button>
      </div>
    </div>
  );
};
