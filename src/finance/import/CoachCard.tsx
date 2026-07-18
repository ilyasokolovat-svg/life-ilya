import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingDown, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { WealthData } from '@/wealth/types';
import type { ImportSummary } from './ImportDialog';
import { fmtUSD } from '../utils';

type Insights = {
  headline?: string;
  vsPlan?: { category: string; actual: number; budget: number; deltaPct: number; status: string }[];
  wasteFlags?: { pattern: string; impact: number; note: string }[];
  topCuts?: { where: string; savePerMonth: number; why: string }[];
  positive?: string;
};

export const CoachCard: React.FC<{ d: WealthData; summary: ImportSummary | null }> = ({ d, summary }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (!summary) return;
    setLoading(true); setErr(null);
    try {
      const catById = new Map(d.budgetCategories.map(c => [c.id, c] as const));
      const categoryBudgets: Record<string, number> = {};
      d.budgetCategories.forEach(c => { categoryBudgets[c.label] = Number(c.budget) || 0; });

      const monthTotals: Record<string, Record<string, number>> = {};
      for (const w of summary.writtenBreakdown) {
        const label = catById.get(w.categoryId)?.label || 'Unknown';
        monthTotals[w.month] ??= {};
        monthTotals[w.month][label] = (monthTotals[w.month][label] || 0) + w.amount;
      }
      const salaries = d.budgetMonths.map(m => Number(m.salary) || 0).filter(x => x > 0);
      const incomeMonthly = salaries.length ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0;

      const { data, error } = await supabase.functions.invoke('finance-coach', {
        body: {
          transactions: summary.transactions,
          monthTotals, categoryBudgets, incomeMonthly,
          monthsTouched: summary.monthsTouched,
        },
      });
      if (error) throw error;
      setInsights(data?.insights ?? {});
    } catch (e: any) {
      setErr(e.message || 'Coach failed');
    } finally { setLoading(false); }
  };

  if (!summary) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> AI Coach — Last import
        </CardTitle>
        <Button size="sm" variant={insights ? 'ghost' : 'default'} onClick={run} disabled={loading}>
          {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : insights ? 'Re-analyze' : 'Analyze'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {!insights && !err && (
          <p className="text-xs text-muted-foreground">
            Imported {summary.rowsWritten} category-months across {summary.monthsTouched.length} month(s).
            Click Analyze to see where you're overspending and specific cuts.
          </p>
        )}
        {err && <p className="text-xs text-destructive">{err}</p>}
        {insights && (
          <>
            {insights.headline && <p className="text-sm font-medium">{insights.headline}</p>}

            {insights.vsPlan?.length ? (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">vs Plan</div>
                <div className="space-y-1.5">
                  {insights.vsPlan.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs gap-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {p.status === 'over' ? <TrendingUp className="w-3 h-3 text-destructive shrink-0" /> :
                          p.status === 'under' ? <TrendingDown className="w-3 h-3 text-primary shrink-0" /> : <span className="w-3 h-3 shrink-0" />}
                        <span className="truncate">{p.category}</span>
                      </div>
                      <div className="flex items-center gap-2 tabular-nums shrink-0">
                        <span>{fmtUSD(p.actual)} / {fmtUSD(p.budget)}</span>
                        <span className={p.deltaPct > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                          {p.deltaPct > 0 ? '+' : ''}{p.deltaPct}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {insights.wasteFlags?.length ? (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Flagged</div>
                <div className="space-y-1.5">
                  {insights.wasteFlags.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                      <div className="flex-1"><span className="font-medium">{w.pattern}</span> — {w.note}</div>
                      <span className="tabular-nums text-muted-foreground">{fmtUSD(w.impact)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {insights.topCuts?.length ? (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Top cuts</div>
                <ul className="space-y-1">
                  {insights.topCuts.map((c, i) => (
                    <li key={i} className="text-xs flex items-center justify-between gap-3">
                      <div className="min-w-0"><span className="font-medium">{c.where}</span> · <span className="text-muted-foreground">{c.why}</span></div>
                      <span className="tabular-nums text-primary shrink-0">−{fmtUSD(c.savePerMonth)}/mo</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {insights.positive && <p className="text-xs text-muted-foreground italic">💡 {insights.positive}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
};
