import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { AlertCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot } from 'recharts';
import type { WealthData } from '@/wealth/types';
import { latestNetWorth, projectPortfolio, yearAtTarget } from '../calc';
import { fmtUSD } from '../utils';
import { COLORS, BIRTH_YEAR } from '../constants';

const LS_KEY = 'finance_plan_v1';

type SavedPlan = {
  baseMonthly: number;
  baseBonus: number;
  baseReturn: number;
  scenarioName: string;
  scenMonthly: number;
  scenBonus: number;
};

const DEFAULT_PLAN: SavedPlan = {
  baseMonthly: 2000,
  baseBonus: 5000,
  baseReturn: 10,
  scenarioName: 'Singapore move',
  scenMonthly: 4000,
  scenBonus: 10000,
};

const loadPlan = (): SavedPlan => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_PLAN;
    return { ...DEFAULT_PLAN, ...JSON.parse(raw) };
  } catch { return DEFAULT_PLAN; }
};

export const PlanTab: React.FC<{ d: WealthData }> = ({ d }) => {
  const [plan, setPlan] = useState<SavedPlan>(loadPlan);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(plan));
  }, [plan]);

  const startBalance = useMemo(() => latestNetWorth(d).value, [d]);
  const fiGoal = d.goals.find(g => g.value_source === 'net_worth') || d.goals[0];
  const fiTarget = Number(fiGoal?.target_amount ?? 1_000_000);

  const startYear = new Date().getFullYear();
  const endYear = 2045;

  const baseProj = useMemo(() => projectPortfolio({
    startBalance,
    monthlySavings: plan.baseMonthly,
    quarterlyBonus: plan.baseBonus,
    annualReturnPct: plan.baseReturn,
    startYear,
    endYear,
  }), [startBalance, plan.baseMonthly, plan.baseBonus, plan.baseReturn, startYear]);

  const scenProj = useMemo(() => projectPortfolio({
    startBalance,
    monthlySavings: plan.scenMonthly,
    quarterlyBonus: plan.scenBonus,
    annualReturnPct: plan.baseReturn,
    startYear,
    endYear,
  }), [startBalance, plan.scenMonthly, plan.scenBonus, plan.baseReturn, startYear]);

  const baseFiYear = yearAtTarget(baseProj, fiTarget);
  const scenFiYear = yearAtTarget(scenProj, fiTarget);
  const baseAge = baseFiYear ? baseFiYear - BIRTH_YEAR : null;
  const scenAge = scenFiYear ? scenFiYear - BIRTH_YEAR : null;

  const chartData = baseProj.map((p, i) => ({
    year: p.year,
    base: Math.round(p.value),
    scenario: Math.round(scenProj[i].value),
    fi: fiTarget,
  }));

  const valueAt = (proj: typeof baseProj, year: number) =>
    proj.find(p => p.year === year)?.value ?? 0;

  const fmtAxis = (v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `$${Math.round(v / 1000)}K` : `$${v}`;

  return (
    <div className="space-y-4">
      {/* FI HERO */}
      <Card>
        <CardContent className="p-8 text-center">
          {baseFiYear ? (
            <>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">You reach {fmtUSD(fiTarget, { compact: true })} in</div>
              <div className="text-6xl font-semibold tracking-tight mt-2" style={{ color: COLORS.etfs }}>{baseFiYear}</div>
              <div className="text-sm text-muted-foreground mt-1">age {baseAge} · at current savings rate</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-semibold">FI target not reached by {endYear}</div>
              <div className="text-sm text-muted-foreground mt-2">Increase monthly savings to bring it in range.</div>
            </>
          )}
        </CardContent>
      </Card>

      {/* SCENARIO ALERT */}
      {scenFiYear && baseFiYear && scenFiYear < baseFiYear && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <span className="font-medium">Scenario "{plan.scenarioName}":</span> reach {fmtUSD(fiTarget, { compact: true })} in{' '}
              <span className="font-semibold">{scenFiYear}</span> — age {scenAge}{' '}
              <span className="text-amber-700">({baseFiYear - scenFiYear} years earlier)</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CHART */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Projection {startYear}–{endYear}</CardTitle>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5"><span className="w-3 h-0.5" style={{ background: COLORS.etfs }} /> Base</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-0.5" style={{ background: COLORS.cash }} /> {plan.scenarioName || 'Scenario'}</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t-2 border-dashed" style={{ borderColor: COLORS.debt }} /> FI target</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke={COLORS.muted} />
                <YAxis tick={{ fontSize: 11 }} stroke={COLORS.muted} tickFormatter={fmtAxis} width={60} />
                <Tooltip
                  formatter={(v: any, name: string) => [fmtUSD(Number(v)), name]}
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                />
                <ReferenceLine y={fiTarget} stroke={COLORS.debt} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="base" stroke={COLORS.etfs} strokeWidth={2.5} dot={false} name="Base" isAnimationActive={false} />
                <Line type="monotone" dataKey="scenario" stroke={COLORS.cash} strokeWidth={2} dot={false} name={plan.scenarioName || 'Scenario'} isAnimationActive={false} />
                {baseFiYear && (
                  <ReferenceDot x={baseFiYear} y={fiTarget} r={5} fill={COLORS.etfs} stroke="white" strokeWidth={2}
                    label={{ value: String(baseFiYear), position: 'top', fill: COLORS.etfs, fontSize: 11 }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 gap-3">
        {([['Value at age 35 (2029)', 2029], ['Value at age 40 (2034)', 2034]] as const).map(([label, yr]) => (
          <Card key={yr}>
            <CardContent className="p-4">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-muted-foreground">Base</div>
                  <div className="text-lg font-semibold tabular-nums" style={{ color: COLORS.etfs }}>{fmtUSD(valueAt(baseProj, yr), { compact: true })}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">{plan.scenarioName || 'Scenario'}</div>
                  <div className="text-lg font-semibold tabular-nums" style={{ color: COLORS.cash }}>{fmtUSD(valueAt(scenProj, yr), { compact: true })}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* INPUTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Your current plan</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <SliderInput
              label="Monthly savings"
              value={plan.baseMonthly}
              onChange={(v) => setPlan({ ...plan, baseMonthly: v })}
              min={0} max={15000} step={50}
              accent={COLORS.etfs}
            />
            <SliderInput
              label="Quarterly bonus invested"
              value={plan.baseBonus}
              onChange={(v) => setPlan({ ...plan, baseBonus: v })}
              min={0} max={50000} step={500}
              accent={COLORS.etfs}
            />
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Annual return</Label>
                <span className="text-sm tabular-nums">{plan.baseReturn}%</span>
              </div>
              <Slider value={[plan.baseReturn]} onValueChange={([v]) => setPlan({ ...plan, baseReturn: v })} min={4} max={20} step={0.5} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Compare a scenario</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Scenario name</Label>
              <Input value={plan.scenarioName} onChange={e => setPlan({ ...plan, scenarioName: e.target.value })} className="mt-1.5" />
            </div>
            <SliderInput
              label="Monthly savings"
              value={plan.scenMonthly}
              onChange={(v) => setPlan({ ...plan, scenMonthly: v })}
              min={0} max={15000} step={50}
              accent={COLORS.cash}
            />
            <SliderInput
              label="Quarterly bonus"
              value={plan.scenBonus}
              onChange={(v) => setPlan({ ...plan, scenBonus: v })}
              min={0} max={50000} step={500}
              accent={COLORS.cash}
            />
          </CardContent>
        </Card>
      </div>

      <p className="text-[11px] text-muted-foreground italic text-center">
        Starting balance pulled from latest net worth ({fmtUSD(startBalance)}). FI target from goal "{fiGoal?.name ?? '—'}".
      </p>
    </div>
  );
};

const SliderInput: React.FC<{ label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; accent: string }> = ({ label, value, onChange, min, max, step, accent }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <Label>{label}</Label>
      <span className="text-sm tabular-nums" style={{ color: accent }}>{fmtUSD(value)}</span>
    </div>
    <div className="flex items-center gap-3">
      <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} className="flex-1" />
      <Input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="w-24 h-9 text-sm tabular-nums"
      />
    </div>
  </div>
);
