import React, { useMemo, useState } from "react";
import { useFinanceStorage, nextId } from "./storage";
import * as Seed from "./seedData";
import type {
  NetWorthEntry, Holding, HoldingSnapshot, Liability, SalaryEntry,
  BonusEntry, SavingsEntry, ProjectionAssumptions, AllocationTarget,
  BudgetCategory, BudgetSalary, ExpensePlan, Milestone, DisciplineEntry,
} from "./types";
import { fmtMoney, fmtMoneyShort, fmtPct, fmtMonth, currentYearMonth } from "./formatters";
import { getLatestSnapshots, projectNetWorth, getAllocationByClass, classColor } from "./calculations";
import { EditableValue, DeleteButton, SectionHeader, FinCard, Badge } from "./ui";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";

interface Ctx {
  edit: boolean;
  netWorth: NetWorthEntry[]; setNetWorth: any;
  holdings: Holding[]; setHoldings: any;
  snapshots: HoldingSnapshot[]; setSnapshots: any;
  liabilities: Liability[]; setLiabilities: any;
  salary: SalaryEntry[]; setSalary: any;
  bonus: BonusEntry[]; setBonus: any;
  savings: SavingsEntry[]; setSavings: any;
  assumptions: ProjectionAssumptions; setAssumptions: any;
  allocation: AllocationTarget[]; setAllocation: any;
  categories: BudgetCategory[]; setCategories: any;
  budgetSalary: BudgetSalary; setBudgetSalary: any;
  expenses: ExpensePlan[]; setExpenses: any;
  milestones: Milestone[]; setMilestones: any;
  discipline: DisciplineEntry[]; setDiscipline: any;
}

export function useFinanceData(): Ctx & { edit: boolean; setEdit: (b: boolean) => void } {
  const [edit, setEdit] = useState(false);
  const [netWorth, setNetWorth] = useFinanceStorage("finance_networth_log", Seed.SEED_NETWORTH);
  const [holdings, setHoldings] = useFinanceStorage("finance_holdings", Seed.SEED_HOLDINGS);
  const [snapshots, setSnapshots] = useFinanceStorage("finance_holdings_snapshots", Seed.SEED_SNAPSHOTS);
  const [liabilities, setLiabilities] = useFinanceStorage("finance_liabilities", Seed.SEED_LIABILITIES);
  const [salary, setSalary] = useFinanceStorage("finance_salary_history", Seed.SEED_SALARY);
  const [bonus, setBonus] = useFinanceStorage("finance_bonus_log", Seed.SEED_BONUS);
  const [savings, setSavings] = useFinanceStorage("finance_savings_log", Seed.SEED_SAVINGS);
  const [assumptions, setAssumptions] = useFinanceStorage("finance_projection_assumptions", Seed.SEED_ASSUMPTIONS);
  const [allocation, setAllocation] = useFinanceStorage("finance_allocation_targets", Seed.SEED_ALLOCATION);
  const [categories, setCategories] = useFinanceStorage("finance_budget_categories", Seed.SEED_BUDGET_CATEGORIES);
  const [budgetSalary, setBudgetSalary] = useFinanceStorage("finance_budget_salary", Seed.SEED_BUDGET_SALARY);
  const [expenses, setExpenses] = useFinanceStorage("finance_expense_planner", Seed.SEED_EXPENSES);
  const [milestones, setMilestones] = useFinanceStorage("finance_milestones", Seed.SEED_MILESTONES);
  const [discipline, setDiscipline] = useFinanceStorage("finance_discipline_log", Seed.SEED_DISCIPLINE);

  return {
    edit, setEdit,
    netWorth, setNetWorth, holdings, setHoldings, snapshots, setSnapshots,
    liabilities, setLiabilities, salary, setSalary, bonus, setBonus,
    savings, setSavings, assumptions, setAssumptions, allocation, setAllocation,
    categories, setCategories, budgetSalary, setBudgetSalary, expenses, setExpenses,
    milestones, setMilestones, discipline, setDiscipline,
  };
}

// ============== OVERVIEW ==============
export function Overview({ ctx }: { ctx: Ctx }) {
  const totalAssets = useMemo(() => {
    const latest = getLatestSnapshots(ctx.snapshots);
    return Array.from(latest.values()).reduce((s, x) => s + x.value, 0);
  }, [ctx.snapshots]);
  const totalLiabilities = ctx.liabilities.reduce((s, l) => s + l.value, 0);
  const netWorth = totalAssets - totalLiabilities;
  const monthlySaved = ctx.savings.length ? ctx.savings[ctx.savings.length - 1].actualAmount : 0;

  const goalMilestone = ctx.milestones.find(m => m.label.toLowerCase().includes("2026")) ?? ctx.milestones[1];
  const goal = goalMilestone?.value ?? 111000;
  const monthsRemaining = (() => {
    const now = new Date();
    const target = new Date(2026, 11, 1);
    return Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
  })();
  const progress = Math.max(0, Math.min(100, ((netWorth - 0) / (goal - 0)) * 100));

  // Allocation bar
  const byClass = getAllocationByClass(ctx.holdings, ctx.snapshots);
  const segments = Array.from(byClass.entries()).map(([c, v]) => ({ c, v, color: classColor(c) }));

  return (
    <section id="overview" className="scroll-mt-6">
      <SectionHeader>Overview</SectionHeader>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI label="Net Worth" value={fmtMoney(netWorth)} positive={netWorth >= 0} />
        <KPI label="Total Assets" value={fmtMoney(totalAssets)} />
        <KPI label="Total Liabilities" value={fmtMoney(totalLiabilities)} negative />
        <KPI label="Monthly Saved" value={fmtMoney(monthlySaved)} />
      </div>

      <FinCard className="mb-5">
        <SectionHeader>Composition</SectionHeader>
        <div className="flex h-3 rounded overflow-hidden bg-fin-bg">
          {segments.map((s, i) => (
            <div key={i} style={{ width: `${(s.v / (totalAssets + totalLiabilities)) * 100}%`, background: s.color }} />
          ))}
          <div style={{ width: `${(totalLiabilities / (totalAssets + totalLiabilities)) * 100}%`, background: "#C0392B" }} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-fin-secondary font-sans-fin">
          {segments.map((s, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              {s.c}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-fin-red" />
            Liabilities
          </span>
        </div>
      </FinCard>

      <FinCard>
        <SectionHeader>2026 Goal</SectionHeader>
        <div className="flex items-baseline justify-between mb-2">
          <div className="font-sans-fin text-fin-primary text-sm">
            {goalMilestone?.label ?? "2026 goal"}
          </div>
          <div className="font-mono-fin text-xs text-fin-secondary">
            {monthsRemaining} months remaining
          </div>
        </div>
        <div className="flex items-baseline gap-3 mb-3">
          <div className="font-mono-fin text-fin-primary text-2xl">{fmtMoney(netWorth)}</div>
          <div className="font-mono-fin text-fin-tertiary">/ {fmtMoney(goal)}</div>
          <div className="font-mono-fin text-fin-tertiary text-xs">gap {fmtMoney(goal - netWorth)}</div>
        </div>
        <div className="h-1.5 bg-fin-bg rounded-full overflow-hidden">
          <div className="h-full bg-fin-blue" style={{ width: `${progress}%` }} />
        </div>
      </FinCard>
    </section>
  );
}

function KPI({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  const color = negative ? "text-fin-red" : positive ? "text-fin-green" : "text-fin-primary";
  return (
    <div className="bg-white border border-fin-border rounded-lg p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-fin-tertiary mb-1.5">{label}</div>
      <div className={`font-mono-fin text-xl ${color}`}>{value}</div>
    </div>
  );
}

// ============== NET WORTH ==============
export function NetWorthSection({ ctx }: { ctx: Ctx }) {
  const { netWorth, assumptions, milestones } = ctx;
  const sorted = [...netWorth].sort((a, b) => a.date.localeCompare(b.date));
  const last = sorted[sorted.length - 1];

  const projection = useMemo(() => {
    if (!last) return { base: [], strong: [], conservative: [] };
    const months = 60;
    return {
      base: projectNetWorth(last.netWorth, last.date, months, assumptions.base),
      strong: projectNetWorth(last.netWorth, last.date, months, assumptions.strong),
      conservative: projectNetWorth(last.netWorth, last.date, months, assumptions.conservative),
    };
  }, [last, assumptions]);

  const chartData = useMemo(() => {
    const map = new Map<string, any>();
    for (const e of sorted) map.set(e.date, { date: e.date, actual: e.netWorth });
    if (last) map.set(last.date, { ...(map.get(last.date) ?? {}), date: last.date, base: last.netWorth, strong: last.netWorth, conservative: last.netWorth });
    for (const p of projection.base) map.set(p.date, { ...(map.get(p.date) ?? {}), date: p.date, base: p.value });
    for (const p of projection.strong) map.set(p.date, { ...(map.get(p.date) ?? {}), date: p.date, strong: p.value });
    for (const p of projection.conservative) map.set(p.date, { ...(map.get(p.date) ?? {}), date: p.date, conservative: p.value });
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [sorted, last, projection]);

  const [showAssumptions, setShowAssumptions] = useState(false);

  return (
    <section id="networth" className="scroll-mt-6 mt-10">
      <SectionHeader>Net Worth Timeline</SectionHeader>
      <FinCard>
        {chartData.length < 2 ? (
          <div className="h-64 flex items-center justify-center text-fin-tertiary italic font-sans-fin text-sm">
            Add at least 2 months of data to see the chart.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#F0F0EE" vertical={false} />
              <XAxis
                dataKey="date" stroke="#A0A0A0"
                tick={{ fontSize: 10, fontFamily: "DM Mono" }}
                tickFormatter={(d) => d.endsWith("-01") ? d.split("-")[0] : ""}
              />
              <YAxis
                stroke="#A0A0A0"
                tick={{ fontSize: 10, fontFamily: "DM Mono" }}
                tickFormatter={(v) => fmtMoneyShort(v)}
              />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #E8E8E4", borderRadius: 6, fontFamily: "DM Mono", fontSize: 11 }}
                formatter={(v: number) => fmtMoney(v)}
                labelFormatter={(l) => fmtMonth(l)}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "DM Sans" }} />
              <ReferenceLine y={0} stroke="#A0A0A0" strokeDasharray="3 3" label={{ value: "Debt-free", position: "insideTopLeft", fontSize: 10, fill: "#A0A0A0" }} />
              {milestones.map(m => (
                <ReferenceLine key={m.id} y={m.value} stroke="#E8E8E4" strokeDasharray="2 4" label={{ value: m.label, position: "insideTopRight", fontSize: 10, fill: "#A0A0A0" }} />
              ))}
              <Line type="monotone" dataKey="actual" name="Actual" stroke="#1A56DB" strokeWidth={1.5} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="base" name="Base" stroke="#6B6B6B" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="strong" name="Strong" stroke="#2D7D4F" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="conservative" name="Conservative" stroke="#B45309" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </FinCard>

      <button
        onClick={() => setShowAssumptions(s => !s)}
        className="text-xs text-fin-blue mt-3 font-sans-fin hover:underline"
      >
        {showAssumptions ? "Hide" : "Edit"} assumptions
      </button>

      {showAssumptions && (
        <FinCard className="mt-3">
          <div className="grid grid-cols-3 gap-4">
            {(["base", "strong", "conservative"] as const).map(k => (
              <div key={k}>
                <SectionHeader>{k}</SectionHeader>
                <div className="space-y-2 text-xs font-sans-fin text-fin-secondary">
                  <div className="flex justify-between items-center">
                    <span>Monthly saved</span>
                    <EditableValue
                      mono editMode value={ctx.assumptions[k].monthlySaved}
                      onChange={v => ctx.setAssumptions({ ...ctx.assumptions, [k]: { ...ctx.assumptions[k], monthlySaved: Number(v) || 0 } })}
                      type="number" className="w-20 text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Annual bonus</span>
                    <EditableValue
                      mono editMode value={ctx.assumptions[k].annualBonus}
                      onChange={v => ctx.setAssumptions({ ...ctx.assumptions, [k]: { ...ctx.assumptions[k], annualBonus: Number(v) || 0 } })}
                      type="number" className="w-20 text-right"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Return %</span>
                    <EditableValue
                      mono editMode value={(ctx.assumptions[k].returnRate * 100).toFixed(1)}
                      onChange={v => ctx.setAssumptions({ ...ctx.assumptions, [k]: { ...ctx.assumptions[k], returnRate: (Number(v) || 0) / 100 } })}
                      type="number" className="w-20 text-right"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FinCard>
      )}

      <div className="mt-5">
        <SectionHeader>Historical Snapshots</SectionHeader>
        <FinCard>
          <table className="w-full text-sm font-sans-fin">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-fin-tertiary text-left">
                <th className="py-2 font-medium">Month</th>
                <th className="font-medium">Net Worth</th>
                <th className="font-medium">Δ $</th>
                <th className="font-medium">Δ %</th>
                <th className="font-medium">Note</th>
                {ctx.edit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map((e, i) => {
                const prev = sorted[i - 1];
                const dl = prev ? e.netWorth - prev.netWorth : 0;
                const dp = prev && prev.netWorth !== 0 ? (dl / Math.abs(prev.netWorth)) * 100 : 0;
                return (
                  <tr key={e.id} className="border-t border-fin-row">
                    <td className="py-2 font-mono-fin text-fin-primary">{fmtMonth(e.date)}</td>
                    <td className="font-mono-fin text-fin-primary">
                      <EditableValue mono editMode={ctx.edit} value={e.netWorth} type="number"
                        onChange={v => ctx.setNetWorth(ctx.netWorth.map((x: NetWorthEntry) => x.id === e.id ? { ...x, netWorth: Number(v) || 0 } : x))} />
                    </td>
                    <td className={`font-mono-fin ${dl >= 0 ? "text-fin-green" : "text-fin-red"}`}>{prev ? fmtMoney(dl, { sign: true }) : "—"}</td>
                    <td className={`font-mono-fin ${dp >= 0 ? "text-fin-green" : "text-fin-red"}`}>{prev ? fmtPct(dp) : "—"}</td>
                    <td className="text-fin-secondary">
                      <EditableValue editMode={ctx.edit} value={e.note}
                        onChange={v => ctx.setNetWorth(ctx.netWorth.map((x: NetWorthEntry) => x.id === e.id ? { ...x, note: v } : x))} />
                    </td>
                    {ctx.edit && (
                      <td><DeleteButton onDelete={() => ctx.setNetWorth(ctx.netWorth.filter((x: NetWorthEntry) => x.id !== e.id))} /></td>
                    )}
                  </tr>
                );
              })}
              {ctx.edit && <AddNetWorthRow ctx={ctx} />}
            </tbody>
          </table>
        </FinCard>
      </div>

      <div className="mt-5">
        <SectionHeader>Milestones</SectionHeader>
        <FinCard>
          <ul className="space-y-2">
            {milestones.map(m => (
              <li key={m.id} className="flex items-center justify-between text-sm font-sans-fin">
                <EditableValue editMode={ctx.edit} value={m.label}
                  onChange={v => ctx.setMilestones(milestones.map(x => x.id === m.id ? { ...x, label: v } : x))} />
                <div className="flex items-center gap-3">
                  <EditableValue mono editMode={ctx.edit} value={m.value} type="number"
                    onChange={v => ctx.setMilestones(milestones.map(x => x.id === m.id ? { ...x, value: Number(v) || 0 } : x))} />
                  {ctx.edit && <DeleteButton onDelete={() => ctx.setMilestones(milestones.filter(x => x.id !== m.id))} />}
                </div>
              </li>
            ))}
          </ul>
          {ctx.edit && (
            <button
              className="mt-3 text-xs text-fin-blue font-sans-fin hover:underline"
              onClick={() => ctx.setMilestones([...milestones, { id: nextId(milestones), label: "New milestone", value: 0 }])}
            >+ Add milestone</button>
          )}
        </FinCard>
      </div>
    </section>
  );
}

function AddNetWorthRow({ ctx }: { ctx: Ctx }) {
  const [date, setDate] = useState(currentYearMonth());
  const [val, setVal] = useState("");
  const [note, setNote] = useState("");
  return (
    <tr className="border-t border-dashed border-fin-border">
      <td className="py-2"><input type="month" value={date} onChange={e => setDate(e.target.value)} className="font-mono-fin text-xs bg-transparent border-b border-fin-border focus:border-fin-blue outline-none" /></td>
      <td><input type="number" value={val} onChange={e => setVal(e.target.value)} placeholder="0" className="font-mono-fin w-24 bg-transparent border-b border-fin-border focus:border-fin-blue outline-none" /></td>
      <td colSpan={2}></td>
      <td><input value={note} onChange={e => setNote(e.target.value)} placeholder="note" className="bg-transparent border-b border-fin-border focus:border-fin-blue outline-none w-full" /></td>
      <td>
        <button className="text-xs text-fin-blue px-2"
          onClick={() => {
            if (!val) return;
            ctx.setNetWorth([...ctx.netWorth, { id: nextId(ctx.netWorth), date, netWorth: Number(val), note }]);
            setVal(""); setNote("");
          }}>Save</button>
      </td>
    </tr>
  );
}

// ============== HOLDINGS ==============
export function HoldingsSection({ ctx }: { ctx: Ctx }) {
  const latest = getLatestSnapshots(ctx.snapshots);
  const lastDate = Array.from(latest.values()).reduce((d, s) => s.date > d ? s.date : d, "");
  const totalAssets = Array.from(latest.values()).reduce((s, x) => s + x.value, 0);

  const setSnapshotValue = (holdingId: number, value: number) => {
    const date = currentYearMonth();
    const existing = ctx.snapshots.find((s: HoldingSnapshot) => s.holdingId === holdingId && s.date === date);
    if (existing) {
      ctx.setSnapshots(ctx.snapshots.map((s: HoldingSnapshot) => s.id === existing.id ? { ...s, value } : s));
    } else {
      ctx.setSnapshots([...ctx.snapshots, { id: nextId(ctx.snapshots), holdingId, date, value }]);
    }
  };

  const byClassMap = getAllocationByClass(ctx.holdings, ctx.snapshots);

  return (
    <section id="holdings" className="scroll-mt-6 mt-10">
      <SectionHeader>Holdings Snapshot</SectionHeader>

      {lastDate && (
        <div className="text-xs text-fin-secondary font-sans-fin mb-3">
          Last logged: <span className="font-mono-fin text-fin-primary">{fmtMonth(lastDate)}</span>
        </div>
      )}

      <FinCard>
        <table className="w-full text-sm font-sans-fin">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-fin-tertiary text-left">
              <th className="py-2 font-medium">Platform</th>
              <th className="font-medium">Class</th>
              <th className="font-medium">This month</th>
              <th className="font-medium">Last month</th>
              <th className="font-medium">Δ %</th>
              <th className="font-medium">Note</th>
              {ctx.edit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {ctx.holdings.map(h => {
              const cur = latest.get(h.id);
              const prev = ctx.snapshots
                .filter((s: HoldingSnapshot) => s.holdingId === h.id && (!cur || s.date < cur.date))
                .sort((a: HoldingSnapshot, b: HoldingSnapshot) => b.date.localeCompare(a.date))[0];
              const dPct = prev && prev.value ? ((cur!.value - prev.value) / prev.value) * 100 : 0;
              return (
                <tr key={h.id} className="border-t border-fin-row">
                  <td className="py-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: h.color }} />
                    <EditableValue editMode={ctx.edit} value={h.platform}
                      onChange={v => ctx.setHoldings(ctx.holdings.map((x: Holding) => x.id === h.id ? { ...x, platform: v } : x))} />
                  </td>
                  <td className="text-fin-secondary text-xs">{h.assetClass}</td>
                  <td className="font-mono-fin text-fin-primary">
                    <EditableValue mono editMode={ctx.edit} value={cur?.value ?? 0} type="number"
                      onChange={v => setSnapshotValue(h.id, Number(v) || 0)} />
                  </td>
                  <td className="font-mono-fin text-fin-secondary">{prev ? fmtMoney(prev.value) : "—"}</td>
                  <td className={`font-mono-fin ${dPct >= 0 ? "text-fin-green" : "text-fin-red"}`}>{prev ? fmtPct(dPct) : "—"}</td>
                  <td className="text-fin-secondary text-xs">
                    <EditableValue editMode={ctx.edit} value={h.note}
                      onChange={v => ctx.setHoldings(ctx.holdings.map((x: Holding) => x.id === h.id ? { ...x, note: v } : x))} />
                  </td>
                  {ctx.edit && <td><DeleteButton onDelete={() => ctx.setHoldings(ctx.holdings.filter((x: Holding) => x.id !== h.id))} /></td>}
                </tr>
              );
            })}
            {ctx.edit && <AddHoldingRow ctx={ctx} />}
          </tbody>
          <tfoot>
            {Array.from(byClassMap.entries()).map(([cls, val]) => (
              <tr key={cls} className="border-t border-fin-row text-xs">
                <td className="py-2 text-fin-tertiary uppercase tracking-wider">{cls}</td>
                <td></td>
                <td className="font-mono-fin text-fin-primary">{fmtMoney(val)}</td>
                <td colSpan={3} className="text-fin-tertiary font-mono-fin">{totalAssets ? fmtPct((val / totalAssets) * 100) : "—"}</td>
              </tr>
            ))}
          </tfoot>
        </table>

        <div className="mt-3 pt-3 border-t border-fin-row flex justify-between text-xs font-sans-fin">
          <div>
            <SectionHeader>Liabilities</SectionHeader>
            <ul className="space-y-1">
              {ctx.liabilities.map(l => (
                <li key={l.id} className="flex items-center gap-3">
                  <EditableValue editMode={ctx.edit} value={l.name}
                    onChange={v => ctx.setLiabilities(ctx.liabilities.map((x: Liability) => x.id === l.id ? { ...x, name: v } : x))} />
                  <EditableValue mono editMode={ctx.edit} value={l.value} type="number" className="text-fin-red"
                    onChange={v => ctx.setLiabilities(ctx.liabilities.map((x: Liability) => x.id === l.id ? { ...x, value: Number(v) || 0 } : x))} />
                  {ctx.edit && <DeleteButton onDelete={() => ctx.setLiabilities(ctx.liabilities.filter((x: Liability) => x.id !== l.id))} />}
                </li>
              ))}
              {ctx.edit && (
                <li>
                  <button className="text-fin-blue text-xs hover:underline"
                    onClick={() => ctx.setLiabilities([...ctx.liabilities, { id: nextId(ctx.liabilities), name: "New liability", value: 0, note: "" }])}
                  >+ Add liability</button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </FinCard>
    </section>
  );
}

function AddHoldingRow({ ctx }: { ctx: Ctx }) {
  const [platform, setPlatform] = useState("");
  const [assetClass, setAssetClass] = useState("ETFs & Stocks");
  const [color, setColor] = useState("#1A56DB");
  return (
    <tr className="border-t border-dashed border-fin-border">
      <td className="py-2"><input value={platform} onChange={e => setPlatform(e.target.value)} placeholder="Platform" className="bg-transparent border-b border-fin-border focus:border-fin-blue outline-none w-full text-xs" /></td>
      <td>
        <select value={assetClass} onChange={e => setAssetClass(e.target.value)} className="bg-transparent border-b border-fin-border focus:border-fin-blue outline-none text-xs">
          <option>ETFs & Stocks</option><option>Crypto</option><option>Cash & Savings</option><option>Other</option>
        </select>
      </td>
      <td><input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-6 h-6 rounded" /></td>
      <td colSpan={3}></td>
      <td>
        <button className="text-xs text-fin-blue px-2"
          onClick={() => {
            if (!platform) return;
            ctx.setHoldings([...ctx.holdings, { id: nextId(ctx.holdings), platform, assetClass, color, note: "" }]);
            setPlatform("");
          }}>Save</button>
      </td>
    </tr>
  );
}

// ============== ALLOCATION ==============
export function AllocationSection({ ctx }: { ctx: Ctx }) {
  const byClass = getAllocationByClass(ctx.holdings, ctx.snapshots);
  const totalAssets = Array.from(byClass.values()).reduce((s, x) => s + x, 0);
  const sumTargets = ctx.allocation.reduce((s, a) => s + a.targetPct, 0);

  return (
    <section id="allocation" className="scroll-mt-6 mt-10">
      <SectionHeader>Allocation & Rebalancing</SectionHeader>
      <FinCard>
        <div className="space-y-4">
          {ctx.allocation.map(a => {
            const actual = byClass.get(a.assetClass) ?? 0;
            const actualPct = totalAssets ? (actual / totalAssets) * 100 : 0;
            const diff = actualPct - a.targetPct;
            let badge = { label: "On target", color: "#2D7D4F" };
            if (diff > 10) badge = { label: "Breach", color: "#C0392B" };
            else if (diff > 3) badge = { label: "Over", color: "#B45309" };
            else if (diff < -5) badge = { label: "Underfunded", color: "#C0392B" };
            const targetDollars = (a.targetPct / 100) * totalAssets;
            const delta = actual - targetDollars;
            return (
              <div key={a.assetClass}>
                <div className="flex items-center justify-between text-sm font-sans-fin mb-1.5">
                  <span className="text-fin-primary">{a.assetClass}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono-fin text-fin-secondary">{fmtMoney(actual)}</span>
                    <span className="font-mono-fin text-fin-secondary">{fmtPct(actualPct)}</span>
                    <span className="text-fin-tertiary">target&nbsp;
                      <EditableValue mono editMode={ctx.edit} value={a.targetPct} type="number" className="w-12 text-right"
                        onChange={v => ctx.setAllocation(ctx.allocation.map(x => x.assetClass === a.assetClass ? { ...x, targetPct: Number(v) || 0 } : x))} />%
                    </span>
                    <Badge color={badge.color}>{badge.label}</Badge>
                  </div>
                </div>
                <div className="relative h-2 bg-fin-bg rounded-full overflow-hidden">
                  <div className="h-full" style={{ width: `${Math.min(100, actualPct)}%`, background: classColor(a.assetClass) }} />
                  <div className="absolute top-0 bottom-0 w-px bg-fin-primary" style={{ left: `${Math.min(100, a.targetPct)}%` }} />
                </div>
                {Math.abs(delta) > 50 && (
                  <div className="text-xs text-fin-tertiary font-sans-fin mt-1">
                    {delta > 0 ? `Reduce ${a.assetClass} by ~${fmtMoney(delta)}` : `Add ~${fmtMoney(-delta)} to ${a.assetClass}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {ctx.edit && Math.abs(sumTargets - 100) > 0.1 && (
          <div className="mt-4 text-xs text-fin-amber font-sans-fin">
            Targets sum to {fmtPct(sumTargets)} — should equal 100%.
          </div>
        )}
      </FinCard>
    </section>
  );
}

// ============== EXPENSE PLANNER ==============
export function ExpenseSection({ ctx }: { ctx: Ctx }) {
  return (
    <section id="expenses" className="scroll-mt-6 mt-10">
      <SectionHeader>Large Expense Planner</SectionHeader>
      <FinCard>
        {ctx.expenses.length === 0 && !ctx.edit ? (
          <p className="text-fin-tertiary italic text-sm font-sans-fin">No planned expenses yet.</p>
        ) : (
          <table className="w-full text-sm font-sans-fin">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-fin-tertiary text-left">
                <th className="py-2 font-medium">Name</th>
                <th className="font-medium">Date</th>
                <th className="font-medium">Amount</th>
                <th className="font-medium">Priority</th>
                <th className="font-medium">Note</th>
                {ctx.edit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {ctx.expenses.map(e => {
                const pcolor = e.priority === "high" ? "#C0392B" : e.priority === "medium" ? "#B45309" : "#2D7D4F";
                return (
                  <tr key={e.id} className="border-t border-fin-row">
                    <td className="py-2"><EditableValue editMode={ctx.edit} value={e.name}
                      onChange={v => ctx.setExpenses(ctx.expenses.map(x => x.id === e.id ? { ...x, name: v } : x))} /></td>
                    <td className="font-mono-fin text-fin-secondary">{fmtMonth(e.targetDate)}</td>
                    <td><EditableValue mono editMode={ctx.edit} value={e.amount} type="number"
                      onChange={v => ctx.setExpenses(ctx.expenses.map(x => x.id === e.id ? { ...x, amount: Number(v) || 0 } : x))} /></td>
                    <td><Badge color={pcolor}>{e.priority}</Badge></td>
                    <td className="text-fin-secondary text-xs"><EditableValue editMode={ctx.edit} value={e.note}
                      onChange={v => ctx.setExpenses(ctx.expenses.map(x => x.id === e.id ? { ...x, note: v } : x))} /></td>
                    {ctx.edit && <td><DeleteButton onDelete={() => ctx.setExpenses(ctx.expenses.filter(x => x.id !== e.id))} /></td>}
                  </tr>
                );
              })}
              {ctx.edit && <AddExpenseRow ctx={ctx} />}
            </tbody>
          </table>
        )}
      </FinCard>
    </section>
  );
}
function AddExpenseRow({ ctx }: { ctx: Ctx }) {
  const [name, setName] = useState(""); const [date, setDate] = useState(currentYearMonth());
  const [amount, setAmount] = useState(""); const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  return (
    <tr className="border-t border-dashed border-fin-border">
      <td className="py-2"><input value={name} onChange={e => setName(e.target.value)} placeholder="Expense" className="bg-transparent border-b border-fin-border focus:border-fin-blue outline-none w-full text-xs" /></td>
      <td><input type="month" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent border-b border-fin-border focus:border-fin-blue outline-none text-xs font-mono-fin" /></td>
      <td><input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="bg-transparent border-b border-fin-border focus:border-fin-blue outline-none w-20 text-xs font-mono-fin" /></td>
      <td>
        <select value={priority} onChange={e => setPriority(e.target.value as any)} className="bg-transparent border-b border-fin-border focus:border-fin-blue outline-none text-xs">
          <option value="high">high</option><option value="medium">medium</option><option value="low">low</option>
        </select>
      </td>
      <td colSpan={1}></td>
      <td>
        <button className="text-xs text-fin-blue px-2"
          onClick={() => {
            if (!name) return;
            ctx.setExpenses([...ctx.expenses, { id: nextId(ctx.expenses), name, targetDate: date, amount: Number(amount) || 0, priority, note: "" }]);
            setName(""); setAmount("");
          }}>Save</button>
      </td>
    </tr>
  );
}

// ============== DISCIPLINE ==============
const DISCIPLINE_KEYS: { key: keyof DisciplineEntry["checks"]; label: string }[] = [
  { key: "savingsHit", label: "Savings target hit" },
  { key: "cryptoWithinLimit", label: "Crypto within 20% of portfolio" },
  { key: "etfsFunded", label: "ETFs funded this month" },
  { key: "debtRepaid", label: "Debt repayment made" },
  { key: "noUnplannedSpend", label: "No unplanned large spend" },
  { key: "sheetUpdated", label: "Dashboard updated" },
];

export function DisciplineSection({ ctx }: { ctx: Ctx }) {
  const month = currentYearMonth();
  const current = ctx.discipline.find(d => d.date === month);
  const [draft, setDraft] = useState<DisciplineEntry>(current ?? {
    id: nextId(ctx.discipline), date: month,
    checks: { savingsHit: false, cryptoWithinLimit: false, etfsFunded: false, debtRepaid: false, noUnplannedSpend: false, sheetUpdated: false },
    note: "",
  });

  const save = () => {
    if (current) ctx.setDiscipline(ctx.discipline.map(d => d.id === current.id ? draft : d));
    else ctx.setDiscipline([...ctx.discipline, draft]);
  };

  const recent = [...ctx.discipline].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12).reverse();

  return (
    <section id="discipline" className="scroll-mt-6 mt-10">
      <SectionHeader>Monthly Discipline</SectionHeader>
      <FinCard>
        <div className="text-xs text-fin-secondary mb-3 font-sans-fin">{fmtMonth(month)}</div>
        <ul className="space-y-2">
          {DISCIPLINE_KEYS.map(({ key, label }) => (
            <li key={key} className="flex items-center justify-between text-sm font-sans-fin">
              <span className="text-fin-primary">{label}</span>
              <button
                onClick={() => setDraft({ ...draft, checks: { ...draft.checks, [key]: !draft.checks[key] } })}
                className="w-3 h-3 rounded-full"
                style={{ background: draft.checks[key] ? "#2D7D4F" : "#C0392B" }}
              />
            </li>
          ))}
        </ul>
        <textarea
          value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })}
          placeholder="Monthly note"
          className="mt-3 w-full bg-transparent border-b border-fin-border focus:border-fin-blue outline-none text-sm font-sans-fin py-1"
        />
        <button onClick={save} className="mt-3 text-xs bg-fin-primary text-white px-3 py-1.5 rounded hover:opacity-90">Save month</button>
      </FinCard>

      {recent.length > 0 && (
        <FinCard className="mt-4">
          <SectionHeader>History</SectionHeader>
          <div className="overflow-x-auto">
            <table className="text-xs font-sans-fin">
              <thead>
                <tr>
                  <th></th>
                  {recent.map(r => <th key={r.id} className="px-2 text-fin-tertiary font-mono-fin font-normal">{r.date.split("-")[1]}</th>)}
                </tr>
              </thead>
              <tbody>
                {DISCIPLINE_KEYS.map(({ key, label }) => (
                  <tr key={key}>
                    <td className="text-fin-secondary pr-3 py-1">{label}</td>
                    {recent.map(r => (
                      <td key={r.id} className="px-2 text-center">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: r.checks[key] ? "#2D7D4F" : "#E8E8E4" }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FinCard>
      )}
    </section>
  );
}

// ============== INCOME ==============
export function IncomeSection({ ctx }: { ctx: Ctx }) {
  const salaryChart = ctx.salary.map(s => ({ year: s.date.split("-")[0], salary: s.monthlySalary }));
  const year = new Date().getFullYear();
  const yearBonuses = ctx.bonus.filter(b => b.date.startsWith(String(year)));
  const totalBonus = yearBonuses.filter(b => b.type === "bonus").reduce((s, b) => s + b.amount, 0);
  const totalCommission = yearBonuses.filter(b => b.type === "commission").reduce((s, b) => s + b.amount, 0);
  const totalExtra = yearBonuses.reduce((s, b) => s + b.amount, 0);

  return (
    <section id="income" className="scroll-mt-6 mt-10">
      <SectionHeader>Income</SectionHeader>

      <FinCard className="mb-5">
        <SectionHeader>Salary History</SectionHeader>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={salaryChart}>
            <CartesianGrid stroke="#F0F0EE" vertical={false} />
            <XAxis dataKey="year" stroke="#A0A0A0" tick={{ fontSize: 10, fontFamily: "DM Mono" }} />
            <YAxis stroke="#A0A0A0" tick={{ fontSize: 10, fontFamily: "DM Mono" }} tickFormatter={v => fmtMoneyShort(v)} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E8E8E4", borderRadius: 6, fontFamily: "DM Mono", fontSize: 11 }} formatter={(v: number) => fmtMoney(v)} />
            <Bar dataKey="salary" fill="#1A56DB" />
          </BarChart>
        </ResponsiveContainer>
        <table className="w-full text-sm font-sans-fin mt-4">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-fin-tertiary text-left">
              <th className="py-2 font-medium">Date</th><th className="font-medium">Monthly Salary</th><th className="font-medium">Note</th>{ctx.edit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {ctx.salary.map(s => (
              <tr key={s.id} className="border-t border-fin-row">
                <td className="py-2 font-mono-fin">{fmtMonth(s.date)}</td>
                <td><EditableValue mono editMode={ctx.edit} value={s.monthlySalary} type="number"
                  onChange={v => ctx.setSalary(ctx.salary.map((x: SalaryEntry) => x.id === s.id ? { ...x, monthlySalary: Number(v) || 0 } : x))} /></td>
                <td className="text-fin-secondary text-xs"><EditableValue editMode={ctx.edit} value={s.note}
                  onChange={v => ctx.setSalary(ctx.salary.map((x: SalaryEntry) => x.id === s.id ? { ...x, note: v } : x))} /></td>
                {ctx.edit && <td><DeleteButton onDelete={() => ctx.setSalary(ctx.salary.filter((x: SalaryEntry) => x.id !== s.id))} /></td>}
              </tr>
            ))}
            {ctx.edit && (
              <tr className="border-t border-dashed border-fin-border">
                <td colSpan={ctx.edit ? 4 : 3} className="py-2">
                  <button className="text-xs text-fin-blue hover:underline"
                    onClick={() => ctx.setSalary([...ctx.salary, { id: nextId(ctx.salary), date: currentYearMonth(), monthlySalary: 0, note: "" }])}
                  >+ Add salary entry</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </FinCard>

      <FinCard className="mb-5">
        <SectionHeader>Bonus & Commission</SectionHeader>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <KPI label={`${year} bonuses`} value={fmtMoney(totalBonus)} />
          <KPI label={`${year} commissions`} value={fmtMoney(totalCommission)} />
          <KPI label={`${year} extra income`} value={fmtMoney(totalExtra)} positive />
        </div>
        <table className="w-full text-sm font-sans-fin">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-fin-tertiary text-left">
              <th className="py-2 font-medium">Date</th><th className="font-medium">Type</th><th className="font-medium">Amount</th><th className="font-medium">Allocated to</th><th className="font-medium">Note</th>{ctx.edit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {ctx.bonus.map(b => (
              <tr key={b.id} className="border-t border-fin-row">
                <td className="py-2 font-mono-fin">{fmtMonth(b.date)}</td>
                <td><Badge color={b.type === "bonus" ? "#1A56DB" : b.type === "commission" ? "#2D7D4F" : "#A0A0A0"}>{b.type}</Badge></td>
                <td><EditableValue mono editMode={ctx.edit} value={b.amount} type="number"
                  onChange={v => ctx.setBonus(ctx.bonus.map((x: BonusEntry) => x.id === b.id ? { ...x, amount: Number(v) || 0 } : x))} /></td>
                <td className="text-fin-secondary text-xs"><EditableValue editMode={ctx.edit} value={b.allocatedTo}
                  onChange={v => ctx.setBonus(ctx.bonus.map((x: BonusEntry) => x.id === b.id ? { ...x, allocatedTo: v } : x))} /></td>
                <td className="text-fin-secondary text-xs"><EditableValue editMode={ctx.edit} value={b.note}
                  onChange={v => ctx.setBonus(ctx.bonus.map((x: BonusEntry) => x.id === b.id ? { ...x, note: v } : x))} /></td>
                {ctx.edit && <td><DeleteButton onDelete={() => ctx.setBonus(ctx.bonus.filter((x: BonusEntry) => x.id !== b.id))} /></td>}
              </tr>
            ))}
            {ctx.edit && (
              <tr className="border-t border-dashed border-fin-border">
                <td colSpan={6} className="py-2">
                  <button className="text-xs text-fin-blue hover:underline"
                    onClick={() => ctx.setBonus([...ctx.bonus, { id: nextId(ctx.bonus), date: currentYearMonth(), type: "bonus", amount: 0, allocatedTo: "", note: "" }])}
                  >+ Add entry</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </FinCard>

      <FinCard>
        <SectionHeader>Monthly Savings</SectionHeader>
        <table className="w-full text-sm font-sans-fin">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-fin-tertiary text-left">
              <th className="py-2 font-medium">Month</th><th className="font-medium">Target</th><th className="font-medium">Actual</th><th className="font-medium">Hit?</th><th className="font-medium">Rate</th><th className="font-medium">Note</th>{ctx.edit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {ctx.savings.map(s => {
              const hit = s.actualAmount >= s.targetAmount;
              const rate = s.targetAmount ? (s.actualAmount / s.targetAmount) * 100 : 0;
              return (
                <tr key={s.id} className="border-t border-fin-row">
                  <td className="py-2 font-mono-fin">{fmtMonth(s.date)}</td>
                  <td><EditableValue mono editMode={ctx.edit} value={s.targetAmount} type="number"
                    onChange={v => ctx.setSavings(ctx.savings.map((x: SavingsEntry) => x.id === s.id ? { ...x, targetAmount: Number(v) || 0 } : x))} /></td>
                  <td><EditableValue mono editMode={ctx.edit} value={s.actualAmount} type="number"
                    onChange={v => ctx.setSavings(ctx.savings.map((x: SavingsEntry) => x.id === s.id ? { ...x, actualAmount: Number(v) || 0 } : x))} /></td>
                  <td className={hit ? "text-fin-green" : "text-fin-red"}>{hit ? "✓" : "✗"}</td>
                  <td className={`font-mono-fin ${hit ? "text-fin-green" : "text-fin-red"}`}>{fmtPct(rate)}</td>
                  <td className="text-fin-secondary text-xs"><EditableValue editMode={ctx.edit} value={s.note}
                    onChange={v => ctx.setSavings(ctx.savings.map((x: SavingsEntry) => x.id === s.id ? { ...x, note: v } : x))} /></td>
                  {ctx.edit && <td><DeleteButton onDelete={() => ctx.setSavings(ctx.savings.filter((x: SavingsEntry) => x.id !== s.id))} /></td>}
                </tr>
              );
            })}
            {ctx.edit && (
              <tr className="border-t border-dashed border-fin-border">
                <td colSpan={7} className="py-2">
                  <button className="text-xs text-fin-blue hover:underline"
                    onClick={() => ctx.setSavings([...ctx.savings, { id: nextId(ctx.savings), date: currentYearMonth(), targetAmount: 0, actualAmount: 0, note: "" }])}
                  >+ Add month</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </FinCard>
    </section>
  );
}

// ============== BUDGET ==============
export function BudgetSection({ ctx }: { ctx: Ctx }) {
  const sal = ctx.budgetSalary.currentMonthlySalary;
  const planned = (c: BudgetCategory) => c.targetPct ? Math.round((c.targetPct / 100) * sal) : 0;

  const groups: { key: BudgetCategory["type"]; label: string }[] = [
    { key: "income", label: "Income" },
    { key: "invest", label: "Wealth Building" },
    { key: "need", label: "Needs" },
    { key: "want", label: "Wants" },
  ];

  const totalBy = (t: BudgetCategory["type"]) => ctx.categories.filter(c => c.type === t).reduce((s, c) => s + planned(c), 0);

  return (
    <section id="budget" className="scroll-mt-6 mt-10 mb-16">
      <SectionHeader>Monthly Budget</SectionHeader>

      <FinCard className="mb-5">
        <div className="flex items-center gap-4">
          <label className="text-xs uppercase tracking-wider text-fin-tertiary">Monthly salary</label>
          <input
            type="range" min={1000} max={25000} step={100}
            value={sal}
            onChange={e => ctx.setBudgetSalary({ currentMonthlySalary: Number(e.target.value) })}
            className="flex-1 accent-fin-blue"
          />
          <span className="font-mono-fin text-2xl text-fin-primary">{fmtMoney(sal)}</span>
        </div>
      </FinCard>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <KPI label="Needs" value={fmtMoney(totalBy("need"))} />
        <KPI label="Wants" value={fmtMoney(totalBy("want"))} />
        <KPI label="Save & Invest" value={fmtMoney(totalBy("invest"))} positive />
      </div>

      <FinCard>
        <table className="w-full text-sm font-sans-fin">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-fin-tertiary text-left">
              <th className="py-2 font-medium">Type</th><th className="font-medium">Category</th><th className="font-medium">Sub</th><th className="font-medium">Planned</th><th className="font-medium">% Income</th>{ctx.edit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {groups.flatMap(g => [
              <tr key={`${g.key}-header`}><td colSpan={6} className="pt-4 pb-1 text-[11px] uppercase tracking-wider text-fin-tertiary">{g.label}</td></tr>,
              ...ctx.categories.filter(c => c.type === g.key).map(c => {
                const typeColor = c.type === "need" ? "#1A56DB" : c.type === "want" ? "#B45309" : c.type === "invest" ? "#2D7D4F" : "#6B6B6B";
                return (
                  <tr key={c.id} className="border-t border-fin-row">
                    <td className="py-2"><Badge color={typeColor}>{c.type}</Badge></td>
                    <td><EditableValue editMode={ctx.edit} value={c.name}
                      onChange={v => ctx.setCategories(ctx.categories.map(x => x.id === c.id ? { ...x, name: v } : x))} /></td>
                    <td className="text-fin-secondary text-xs"><EditableValue editMode={ctx.edit} value={c.subcategory}
                      onChange={v => ctx.setCategories(ctx.categories.map(x => x.id === c.id ? { ...x, subcategory: v } : x))} /></td>
                    <td className="font-mono-fin">{fmtMoney(planned(c))}</td>
                    <td>
                      <EditableValue mono editMode={ctx.edit} value={c.targetPct ?? ""} type="number" className="w-14 text-right"
                        onChange={v => ctx.setCategories(ctx.categories.map(x => x.id === c.id ? { ...x, targetPct: v === "" ? null : Number(v) } : x))} />
                      <span className="text-fin-tertiary">%</span>
                    </td>
                    {ctx.edit && <td><DeleteButton onDelete={() => ctx.setCategories(ctx.categories.filter(x => x.id !== c.id))} /></td>}
                  </tr>
                );
              }),
              ctx.edit ? (
                <tr key={`${g.key}-add`}><td colSpan={6} className="py-1">
                  <button className="text-xs text-fin-blue hover:underline"
                    onClick={() => ctx.setCategories([...ctx.categories, { id: nextId(ctx.categories), name: "New", subcategory: "", type: g.key, targetPct: 0, note: "" }])}
                  >+ Add to {g.label}</button>
                </td></tr>
              ) : null,
            ])}
          </tbody>
        </table>
      </FinCard>
    </section>
  );
}
