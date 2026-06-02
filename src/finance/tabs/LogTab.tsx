import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { WealthData } from '@/wealth/types';
import { fmtUSD, todayISO, todayMonth } from '../utils';
import { AED_TO_USD } from '../constants';
import { ccAccount, carLoanAccount, cashAccount, latestBucketValues } from '../calc';

const sb = supabase as any;

export const LogTab: React.FC<{ d: WealthData; onSaved: () => void }> = ({ d, onSaved }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const [salary, setSalary] = useState('');
  const [bonus, setBonus] = useState('');

  const latestBuckets = useMemo(() => latestBucketValues(d), [d]);
  const initialBucketVals: Record<string, string> = useMemo(() => {
    const o: Record<string, string> = {};
    for (const b of d.investmentBuckets) {
      const v = latestBuckets.find(x => x.bucketId === b.id)?.value ?? 0;
      o[b.id] = String(Math.round(v));
    }
    return o;
  }, [d.investmentBuckets, latestBuckets]);
  const [bucketVals, setBucketVals] = useState<Record<string, string>>(initialBucketVals);
  const [bucketContribs, setBucketContribs] = useState<Record<string, string>>({});
  React.useEffect(() => { setBucketVals(initialBucketVals); }, [initialBucketVals]);
  const [otherCash, setOtherCash] = useState('');

  const cc = ccAccount(d); const car = carLoanAccount(d); const cash = cashAccount(d);
  const lastCC = cc ? Math.abs(Number([...d.nwSnapshots].filter(s => s.account_id === cc.id).sort((a, b) => (b.month > a.month ? 1 : -1))[0]?.value ?? 0)) : 0;
  const lastCar = car ? Math.abs(Number([...d.nwSnapshots].filter(s => s.account_id === car.id).sort((a, b) => (b.month > a.month ? 1 : -1))[0]?.value ?? 0)) : 0;
  const [ccBal, setCcBal] = useState(String(lastCC));
  const [carBal, setCarBal] = useState(String(lastCar));
  const [carValue, setCarValue] = useState('');

  const totalInv = d.investmentBuckets.reduce((a, b) => a + (Number(bucketVals[b.id]) || 0), 0) + (Number(otherCash) || 0);
  const incomeUSD = (Number(salary) || 0) * AED_TO_USD + (Number(bonus) || 0);
  const netWorthPreview = totalInv - (Number(ccBal) || 0);

  const next = () => setStep(s => Math.min(3, s + 1));
  const back = () => setStep(s => Math.max(0, s - 1));

  const saveAll = async () => {
    if (!user) return;
    const today = todayISO();
    const month = todayMonth();

    if (Number(salary) > 0) {
      const { data: existing } = await sb.from('budget_months').select('id').eq('user_id', user.id).eq('month', month).maybeSingle();
      if (existing) await sb.from('budget_months').update({ salary: Number(salary) }).eq('id', existing.id);
      else await sb.from('budget_months').insert({ user_id: user.id, month, salary: Number(salary) });
    }
    if (Number(bonus) > 0) {
      await sb.from('budget_extras').insert({ user_id: user.id, month, description: 'Commission / bonus', amount: Number(bonus), type: 'bonus' });
    }

    for (const b of d.investmentBuckets) {
      const v = Number(bucketVals[b.id]) || 0;
      await sb.from('investment_snapshots').insert({ user_id: user.id, month: today, bucket_id: b.id, value: v, contribution: 0 });
    }

    if (Number(otherCash) > 0 && cash) {
      const { data: existing } = await sb.from('nw_snapshots').select('id').eq('user_id', user.id).eq('account_id', cash.id).eq('month', today).maybeSingle();
      if (existing) await sb.from('nw_snapshots').update({ value: Number(otherCash) }).eq('id', existing.id);
      else await sb.from('nw_snapshots').insert({ user_id: user.id, account_id: cash.id, month: today, value: Number(otherCash) });
    }

    const writeDebt = async (acc: any, abs: number) => {
      if (!acc) return;
      await sb.from('nw_snapshots').insert({ user_id: user.id, account_id: acc.id, month: today, value: -Math.abs(abs) });
    };
    if (Number(ccBal) !== lastCC) await writeDebt(cc, Number(ccBal));
    if (Number(carBal) !== lastCar) await writeDebt(car, Number(carBal));

    onSaved();
  };

  const StepDots = (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-primary' : i < step ? 'w-1.5 bg-primary/60' : 'w-1.5 bg-muted'}`} />
      ))}
    </div>
  );

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          {step > 0 && (
            <Button variant="ghost" size="sm" onClick={back} className="-ml-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          <div className="ml-auto text-xs text-muted-foreground">Step {step + 1} of 4</div>
        </div>

        <h2 className="text-xl font-semibold text-center mb-1">Monthly snapshot — {monthLabel}</h2>
        <p className="text-center text-sm text-muted-foreground mb-5">
          {['Income', 'Investments & assets', 'Debts', 'Confirm'][step]}
        </p>

        {StepDots}

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label>Salary (AED)</Label>
              <Input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="0" className="mt-1.5 tabular-nums" />
            </div>
            <div>
              <Label>Commission / bonus ($)</Label>
              <Input type="number" value={bonus} onChange={e => setBonus(e.target.value)} placeholder="0" className="mt-1.5 tabular-nums" />
            </div>
            <div className="text-sm text-muted-foreground bg-muted rounded-md p-3">
              Total this month: <span className="font-semibold tabular-nums text-foreground">~{fmtUSD(incomeUSD)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground italic">Saved to income history.</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            {d.investmentBuckets.map(b => (
              <div key={b.id}>
                <Label className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />{b.label} ($)
                </Label>
                <Input type="number" value={bucketVals[b.id] ?? '0'} onChange={e => setBucketVals({ ...bucketVals, [b.id]: e.target.value })} className="mt-1.5 tabular-nums" />
              </div>
            ))}
            <div>
              <Label>Other savings / cash ($)</Label>
              <Input type="number" value={otherCash} onChange={e => setOtherCash(e.target.value)} placeholder="0" className="mt-1.5 tabular-nums" />
            </div>
            <div className="text-sm text-muted-foreground bg-muted rounded-md p-3">
              Total investments: <span className="font-semibold tabular-nums text-foreground">{fmtUSD(totalInv)}</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Credit card balance ($)</Label>
              <Input type="number" value={ccBal} onChange={e => setCcBal(e.target.value)} className="mt-1.5 tabular-nums" />
            </div>
            <div>
              <Label>Car loan balance ($)</Label>
              <Input type="number" value={carBal} onChange={e => setCarBal(e.target.value)} className="mt-1.5 tabular-nums" />
            </div>
            <div>
              <Label>Car market value ($) <span className="text-muted-foreground font-normal">— optional, not used in NW calculation</span></Label>
              <Input type="number" value={carValue} onChange={e => setCarValue(e.target.value)} className="mt-1.5 tabular-nums" />
            </div>
            <div className="text-sm bg-muted rounded-md p-3">
              Net worth after this entry: <span className="font-semibold tabular-nums">{fmtUSD(netWorthPreview)}</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="rounded-md border border-border divide-y divide-border">
              <Row label="Income (USD)" value={fmtUSD(incomeUSD)} />
              <Row label="Investments" value={fmtUSD(totalInv)} />
              <Row label="Credit card" value={`−${fmtUSD(Number(ccBal) || 0)}`} cls="text-destructive" />
              <Row label="Net worth" value={fmtUSD(netWorthPreview)} bold />
            </div>
            <Button className="w-full" onClick={async () => { await saveAll(); }}>
              <Check className="w-4 h-4 mr-1.5" /> Save all entries
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          {step < 3 && (
            <>
              <Button variant="ghost" onClick={next}>Skip</Button>
              <Button onClick={next}>Next</Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Row: React.FC<{ label: string; value: string; cls?: string; bold?: boolean }> = ({ label, value, cls, bold }) => (
  <div className="flex items-center justify-between px-4 py-2.5">
    <span className={`text-sm ${bold ? 'font-semibold' : 'text-muted-foreground'}`}>{label}</span>
    <span className={`text-sm tabular-nums ${bold ? 'font-bold' : ''} ${cls || ''}`}>{value}</span>
  </div>
);
