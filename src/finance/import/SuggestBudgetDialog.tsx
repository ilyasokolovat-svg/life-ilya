import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, RefreshCw, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { WealthData } from '@/wealth/types';
import { fmtUSD, fmtMonth } from '../utils';
import { toast } from 'sonner';
import { AED_TO_USD } from '../constants';

const sb = supabase as any;

type Suggestion = {
  category: string;
  currentBudget: number;
  recentAvg: number;
  suggested: number;
  priority?: string;
  why?: string;
};
type Plan = {
  summary?: string;
  incomeAssumed?: number;
  totalSuggested?: number;
  totalCut?: number;
  suggestions?: Suggestion[];
};

const monthKey = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-01`;

export const SuggestBudgetDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  d: WealthData;
  onApplied: () => void;
}> = ({ open, onOpenChange, d, onApplied }) => {
  const { user } = useAuth();
  const cats = d.budgetCategories;
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [applying, setApplying] = useState(false);

  const now = new Date();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonth = monthKey(nextMonthDate);

  // Recent 3 months (excluding current partial month) — income + per-category spend.
  const { recentMonths, incomeMonthly } = useMemo(() => {
    const months: string[] = [];
    for (let i = 3; i >= 1; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthKey(dt));
    }
    const catById = new Map(cats.map(c => [c.id, c.label]));
    const recentMonths = months.map(m => {
      const byCategory: Record<string, number> = {};
      d.budgetSpending
        .filter(s => s.month.slice(0, 7) === m.slice(0, 7))
        .forEach(s => {
          const label = catById.get(s.category_id) ?? 'Unknown';
          byCategory[label] = (byCategory[label] || 0) + Number(s.actual || 0);
        });
      return { month: m, byCategory };
    });

    // Income: avg salary + extras over the last 3 completed months.
    // Income: salary is stored in AED, extras (commission/bonus) in USD. Convert salary to USD.
    const incs = months.map(m => {
      const bm = d.budgetMonths.find(x => x.month.slice(0, 7) === m.slice(0, 7));
      const salaryUsd = bm ? Number(bm.salary || 0) * AED_TO_USD : 0;
      const extrasUsd = d.budgetExtras
        .filter(e => e.month.slice(0, 7) === m.slice(0, 7))
        .reduce((a, e) => a + Number(e.amount || 0), 0);
      return salaryUsd + extrasUsd;
    }).filter(v => v > 0);
    const incomeMonthly = incs.length ? incs.reduce((a, b) => a + b, 0) / incs.length : 0;

    return { recentMonths, incomeMonthly };
  }, [d, cats]);

  const run = async () => {
    setLoading(true); setErr(null); setPlan(null); setEdits({});
    try {
      const payload = {
        nextMonth,
        incomeMonthly: Math.round(incomeMonthly),
        categories: cats.map(c => ({ label: c.label, currentBudget: Number(c.budget || 0) })),
        recentMonths,
      };
      const { data, error } = await supabase.functions.invoke('finance-suggest-budget', { body: payload });
      if (error) throw error;
      setPlan(data?.plan ?? {});
    } catch (e: any) {
      setErr(e.message || 'Failed to generate suggestions');
    } finally { setLoading(false); }
  };

  const finalAmount = (s: Suggestion): number => {
    const key = s.category;
    return edits[key] ?? s.suggested;
  };

  const totalSuggested = useMemo(() => {
    if (!plan?.suggestions) return 0;
    return plan.suggestions.reduce((a, s) => a + finalAmount(s), 0);
  }, [plan, edits]);

  const apply = async () => {
    if (!user || !plan?.suggestions?.length) return;
    setApplying(true);
    try {
      // Write suggestions as source='plan' for nextMonth. Skip locked cells.
      const existingForMonth = d.budgetSpending.filter(s => s.month.slice(0, 7) === nextMonth.slice(0, 7));
      const catByLabel = new Map(cats.map(c => [c.label.toLowerCase(), c]));
      let written = 0, skipped = 0;

      for (const s of plan.suggestions) {
        const cat = catByLabel.get(s.category.toLowerCase());
        if (!cat) { skipped++; continue; }
        const existing = existingForMonth.find(x => x.category_id === cat.id);
        if (existing?.locked) { skipped++; continue; }
        const amount = Math.round(finalAmount(s));
        if (existing) {
          if (amount === 0) await sb.from('budget_spending').delete().eq('id', existing.id);
          else await sb.from('budget_spending').update({ actual: amount, source: 'plan' }).eq('id', existing.id);
        } else if (amount > 0) {
          await sb.from('budget_spending').insert({ user_id: user.id, month: nextMonth, category_id: cat.id, actual: amount, source: 'plan' });
        }
        written++;
      }
      toast.success(`Applied ${written} suggestions to ${fmtMonth(nextMonth)}${skipped ? ` · skipped ${skipped}` : ''}`);
      onApplied();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to apply');
    } finally { setApplying(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI-suggested budget for {fmtMonth(nextMonth)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border border-border p-3 bg-muted/30 text-xs space-y-1">
            <div>Avg monthly income (last 3 mo): <span className="font-medium text-foreground tabular-nums">{fmtUSD(incomeMonthly)}</span></div>
            <div>Categories: {cats.length} · Reference months: {recentMonths.length}</div>
            <div className="text-muted-foreground">AI prioritizes non-negotiables (rent, groceries, transport, debt) and trims discretionary categories that trended over plan.</div>
          </div>

          {!plan && !loading && (
            <div className="text-center py-4">
              <Button onClick={run} disabled={!cats.length || incomeMonthly <= 0}>
                <Sparkles className="w-4 h-4 mr-2" /> Generate suggestions
              </Button>
              {incomeMonthly <= 0 && <p className="text-xs text-destructive mt-2">Log salary in recent months first (Details → Income).</p>}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-xs gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing your last 3 months…
            </div>
          )}

          {err && <p className="text-xs text-destructive">{err}</p>}

          {plan && (
            <>
              {plan.summary && <p className="text-sm font-medium">{plan.summary}</p>}

              <div className="overflow-x-auto border border-border rounded-md">
                <table className="w-full text-xs">
                  <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="text-left px-3 py-2">Category</th>
                      <th className="text-right px-3 py-2">Recent avg</th>
                      <th className="text-right px-3 py-2">Current budget</th>
                      <th className="text-right px-3 py-2">Suggested</th>
                      <th className="text-left px-3 py-2">Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.suggestions?.map((s, i) => {
                      const val = finalAmount(s);
                      const delta = val - s.currentBudget;
                      return (
                        <tr key={i} className="border-b border-border/40 last:border-0">
                          <td className="px-3 py-2 font-medium">
                            {s.category}
                            {s.priority && <div className="text-[10px] text-muted-foreground font-normal uppercase tracking-wider">{s.priority}</div>}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{fmtUSD(s.recentAvg)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{fmtUSD(s.currentBudget)}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Input
                                type="number"
                                value={val}
                                onChange={e => setEdits(prev => ({ ...prev, [s.category]: Number(e.target.value) || 0 }))}
                                className="h-7 w-20 text-right text-xs tabular-nums"
                              />
                              <span className={`text-[10px] tabular-nums w-10 text-right ${delta > 0 ? 'text-destructive' : delta < 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                {delta > 0 ? '+' : ''}{delta === 0 ? '—' : fmtUSD(delta)}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground max-w-[260px]">{s.why}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t border-border bg-muted/30">
                    <tr className="text-xs font-medium">
                      <td className="px-3 py-2">Total</td>
                      <td colSpan={2}></td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtUSD(totalSuggested)}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {incomeMonthly > 0 && (
                          <span>{Math.round((totalSuggested / incomeMonthly) * 100)}% of income · saves {fmtUSD(Math.max(0, incomeMonthly - totalSuggested))}</span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Applying writes these amounts to {fmtMonth(nextMonth)} in the Spending grid as <span className="italic">planned</span> entries. Locked cells (🔒) are skipped. You can edit or override any value in the grid later.
              </p>
            </>
          )}
        </div>

        <DialogFooter>
          {plan && <Button variant="ghost" onClick={run} disabled={loading}><RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Regenerate</Button>}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {plan?.suggestions?.length ? (
            <Button onClick={apply} disabled={applying}>
              <Check className="w-3.5 h-3.5 mr-1.5" /> Apply to {fmtMonth(nextMonth)}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
