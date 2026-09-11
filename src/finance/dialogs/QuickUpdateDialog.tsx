import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { WealthData } from '@/wealth/types';
import { fmtUSD, todayISO } from '../utils';
import { AED_TO_USD } from '../constants';
import { latestBucketValues, ccAccount, carLoanAccount } from '../calc';

const sb = supabase as any;

/** Canonical buckets the quick update always writes. */
const BUCKET_SPEC: { label: string; color: string; sort: number; hint: string }[] = [
  { label: 'Global ETFs & Stocks', color: '#534AB7', sort: 0, hint: 'Total value of your ETFs & stocks' },
  { label: 'Crypto', color: '#EF9F27', sort: 1, hint: 'Total value of all crypto' },
  { label: 'Cash in brokers', color: '#1D9E75', sort: 2, hint: 'IC Markets and other broker cash' },
  { label: 'Savings', color: '#2563eb', sort: 3, hint: 'Bank savings balance' },
];

export const QuickUpdateDialog: React.FC<{
  d: WealthData;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}> = ({ d, open, onOpenChange, onSaved }) => {
  const { user } = useAuth();
  const [asOf, setAsOf] = useState(todayISO());
  const [vals, setVals] = useState<Record<string, string>>({});
  const [flows, setFlows] = useState<Record<string, string>>({});
  const [bonus, setBonus] = useState('');
  const [bonusDate, setBonusDate] = useState(todayISO());
  const [salary, setSalary] = useState('');
  const [salaryDate, setSalaryDate] = useState(todayISO());
  const [ccBal, setCcBal] = useState('');
  const [carBal, setCarBal] = useState('');
  const [busy, setBusy] = useState(false);

  const latest = useMemo(() => latestBucketValues(d), [d]);
  const cc = ccAccount(d);
  const car = carLoanAccount(d);
  const lastBalance = (accId: string | undefined) => {
    if (!accId) return 0;
    const snaps = [...d.nwSnapshots].filter(s => s.account_id === accId).sort((a, b) => (b.month > a.month ? 1 : -1));
    return snaps.length ? Math.abs(Number(snaps[0].value)) : 0;
  };
  const lastCC = useMemo(() => lastBalance(cc?.id), [d.nwSnapshots, cc]);
  const lastCar = useMemo(() => lastBalance(car?.id), [d.nwSnapshots, car]);

  useEffect(() => {
    if (!open) return;
    const init: Record<string, string> = {};
    for (const spec of BUCKET_SPEC) {
      const b = d.investmentBuckets.find(x => x.label.toLowerCase() === spec.label.toLowerCase());
      const v = b ? latest.find(l => l.bucketId === b.id)?.value ?? 0 : 0;
      init[spec.label] = String(Math.round(v));
    }
    // Any extra buckets the user created beyond the canonical four
    for (const b of d.investmentBuckets) {
      if (BUCKET_SPEC.some(s => s.label.toLowerCase() === b.label.toLowerCase())) continue;
      init[b.label] = String(Math.round(latest.find(l => l.bucketId === b.id)?.value ?? 0));
    }
    setVals(init);
    setFlows({});
    setAsOf(todayISO());
    setBonus(''); setSalary('');
    setBonusDate(todayISO()); setSalaryDate(todayISO());
    setCcBal(String(Math.round(lastCC)));
    setCarBal(String(Math.round(lastCar)));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps


  const allRows = useMemo(() => {
    const extras = d.investmentBuckets
      .filter(b => !BUCKET_SPEC.some(s => s.label.toLowerCase() === b.label.toLowerCase()))
      .map(b => ({ label: b.label, color: b.color || '#94a3b8', sort: 99, hint: '' }));
    return [...BUCKET_SPEC, ...extras];
  }, [d.investmentBuckets]);

  const total = allRows.reduce((a, r) => a + (Number(vals[r.label]) || 0), 0);
  const netWorth = total - (Number(ccBal) || 0);
  const incomeUSD = (Number(salary) || 0) * AED_TO_USD + (Number(bonus) || 0);

  const ensureBucketId = async (label: string, color: string, sort: number): Promise<string> => {
    const existing = d.investmentBuckets.find(b => b.label.toLowerCase() === label.toLowerCase());
    if (existing) return existing.id;
    const { data } = await sb
      .from('investment_buckets')
      .insert({ user_id: user!.id, label, color, sort_order: sort, description: '' })
      .select()
      .single();
    return data.id as string;
  };

  const save = async () => {
    if (!user) return;
    setBusy(true);
    try {
      // 1. Portfolio values + money added/withdrawn — one snapshot per bucket at the as-of date.
      for (const row of allRows) {
        const spec = BUCKET_SPEC.find(s => s.label === row.label);
        const bucketId = await ensureBucketId(row.label, row.color, spec?.sort ?? 99);
        const value = Number(vals[row.label]) || 0;
        const contribution = Number(flows[row.label]) || 0;
        const { data: existing } = await sb
          .from('investment_snapshots')
          .select('id')
          .eq('user_id', user.id)
          .eq('bucket_id', bucketId)
          .eq('month', asOf)
          .maybeSingle();
        if (existing) await sb.from('investment_snapshots').update({ value, contribution }).eq('id', existing.id);
        else await sb.from('investment_snapshots').insert({ user_id: user.id, bucket_id: bucketId, month: asOf, value, contribution });
      }

      // 2. Debt balances (stored negative), one row per account per as-of date.
      const saveDebt = async (accountId: string, amount: number) => {
        const value = -Math.abs(amount);
        const { data: existing } = await sb
          .from('nw_snapshots')
          .select('id')
          .eq('user_id', user.id)
          .eq('account_id', accountId)
          .eq('month', asOf)
          .maybeSingle();
        if (existing) await sb.from('nw_snapshots').update({ value }).eq('id', existing.id);
        else await sb.from('nw_snapshots').insert({ user_id: user.id, account_id: accountId, month: asOf, value });
      };
      if (cc) await saveDebt(cc.id, Number(ccBal) || 0);
      if (car) await saveDebt(car.id, Number(carBal) || 0);


      // 3. Bonus — added to the month it landed, skipped if an identical entry already exists.
      const bonusAmount = Number(bonus) || 0;
      if (bonusAmount > 0) {
        const month = bonusDate.slice(0, 7);
        const { data: dupes } = await sb
          .from('budget_extras')
          .select('id, amount')
          .eq('user_id', user.id)
          .eq('type', 'bonus')
          .like('month', `${month}%`);
        const already = (dupes || []).some((x: any) => Math.round(Number(x.amount)) === Math.round(bonusAmount));
        if (!already) {
          await sb.from('budget_extras').insert({
            user_id: user.id, month: bonusDate, type: 'bonus',
            amount: bonusAmount, description: 'Commission / bonus',
          });
        }
      }

      // 4. Salary (AED) for the month it landed — one salary per month, overwritten.
      const salaryAED = Number(salary) || 0;
      if (salaryAED > 0) {
        const month = salaryDate.slice(0, 7);
        const { data: rows } = await sb
          .from('budget_months')
          .select('id')
          .eq('user_id', user.id)
          .like('month', `${month}%`);
        if (rows?.length) await sb.from('budget_months').update({ salary: salaryAED }).eq('id', rows[0].id);
        else await sb.from('budget_months').insert({ user_id: user.id, month, salary: salaryAED });
      }

      toast.success('Everything updated across the Finance section');
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast.error('Could not save: ' + (e.message || 'unknown error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Record manual update</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Values as of</Label>
            <Input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="mt-1.5" />
            <p className="text-[11px] text-muted-foreground mt-1">
              Everything below is stored under this date, so charts and history stay in order.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="grid grid-cols-[1fr_115px_115px] gap-2 items-end">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Current balances ($)</p>
              <p className="text-[10px] text-muted-foreground text-right leading-tight">Balance now</p>
              <p className="text-[10px] text-muted-foreground text-right leading-tight">Added / taken out</p>
            </div>
            {allRows.map(r => (
              <div key={r.label} className="grid grid-cols-[1fr_115px_115px] gap-2 items-center">
                <div>
                  <div className="text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />{r.label}
                  </div>
                  {r.hint && <div className="text-[11px] text-muted-foreground">{r.hint}</div>}
                </div>
                <Input
                  type="number"
                  value={vals[r.label] ?? ''}
                  onChange={e => setVals({ ...vals, [r.label]: e.target.value })}
                  className="tabular-nums text-right"
                />
                <Input
                  type="number"
                  value={flows[r.label] ?? ''}
                  placeholder="0"
                  onChange={e => setFlows({ ...flows, [r.label]: e.target.value })}
                  className="tabular-nums text-right"
                />
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">
              Use the right column only for money you actually moved in since the last update — a minus number if you took money out. It shows up on the Flows chart.
            </p>
            {cc && (
              <div className="grid grid-cols-[1fr_115px_115px] gap-2 items-center pt-1 border-t border-border">
                <div>
                  <div className="text-sm">Credit card owed</div>
                  <div className="text-[11px] text-muted-foreground">Subtracted from net worth</div>
                </div>
                <Input type="number" value={ccBal} onChange={e => setCcBal(e.target.value)} className="tabular-nums text-right" />
                <div />
              </div>
            )}
            {car && (
              <div className="grid grid-cols-[1fr_115px_115px] gap-2 items-center">
                <div>
                  <div className="text-sm">Car loan left</div>
                  <div className="text-[11px] text-muted-foreground">Kept out of net worth, shown on Debt</div>
                </div>
                <Input type="number" value={carBal} onChange={e => setCarBal(e.target.value)} className="tabular-nums text-right" />
                <div />
              </div>
            )}
          </div>


          <div className="space-y-2.5 border-t border-border pt-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Money received since last update</p>
            <div className="grid grid-cols-[1fr_150px] gap-2 items-end">
              <div>
                <Label className="text-xs">Bonus / commission ($)</Label>
                <Input type="number" value={bonus} onChange={e => setBonus(e.target.value)} placeholder="0" className="mt-1.5 tabular-nums" />
              </div>
              <div>
                <Label className="text-xs">Date received</Label>
                <Input type="date" value={bonusDate} onChange={e => setBonusDate(e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_150px] gap-2 items-end">
              <div>
                <Label className="text-xs">Salary (AED)</Label>
                <Input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="0" className="mt-1.5 tabular-nums" />
              </div>
              <div>
                <Label className="text-xs">Date received</Label>
                <Input type="date" value={salaryDate} onChange={e => setSalaryDate(e.target.value)} className="mt-1.5" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Leave at 0 if nothing new. Salary replaces that month's figure; an identical bonus in the same month is never added twice.
            </p>
          </div>

          <div className="rounded-md bg-muted p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Total portfolio</span><span className="font-semibold tabular-nums">{fmtUSD(total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Net worth after saving</span><span className="font-semibold tabular-nums">{fmtUSD(netWorth)}</span></div>
            {incomeUSD > 0 && (
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Income logged</span><span className="tabular-nums">~{fmtUSD(incomeUSD)}</span></div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
            Save everywhere
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
