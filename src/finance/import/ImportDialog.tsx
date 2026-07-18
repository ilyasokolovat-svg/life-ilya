import React, { useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, ArrowRight, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { WealthData } from '@/wealth/types';
import { fmtUSD, fmtMonth } from '../utils';
import { AED_TO_USD } from '../constants';
import { parseExpenseFile, type ParseResult, type RawRow } from './parseXlsx';

const sb = supabase as any;
type Step = 'upload' | 'preview' | 'map' | 'confirm' | 'done';
const IGNORE = '__ignore__';
const CREATE = '__create__';

export const ImportDialog: React.FC<{
  d: WealthData;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: (summary: ImportSummary) => void;
}> = ({ d, open, onOpenChange, onImported }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [sign, setSign] = useState<'ignore-sign' | 'expenses-are-positive' | 'expenses-are-negative'>('ignore-sign');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [currency, setCurrency] = useState<'USD' | 'AED'>('USD');
  const fx = currency === 'AED' ? AED_TO_USD : 1;
  const [mapping, setMapping] = useState<Record<string, string>>({}); // sourceLabel -> categoryId | IGNORE
  const [newCatNames, setNewCatNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload'); setFile(null); setParsed(null); setMapping({}); setNewCatNames({});
  };
  const close = () => { onOpenChange(false); setTimeout(reset, 200); };

  const handleFile = async (f: File) => {
    setFile(f);
    setBusy(true);
    try {
      // First pass: no filter, so we can discover the type column values
      const p0 = await parseExpenseFile(f, { treatSign: sign });
      // Auto-preselect "Exp."-style values if the type column was detected
      let initialFilter: string[] = [];
      if (p0.detected.type && p0.typeValues.length) {
        const expLike = p0.typeValues.filter(v => /^exp/i.test(v));
        initialFilter = expLike.length ? expLike : [];
      }
      setTypeFilter(initialFilter);
      const p = initialFilter.length
        ? await parseExpenseFile(f, { treatSign: sign, typeFilter: initialFilter })
        : p0;
      setParsed(p);
      // Preload remembered mappings
      const { data: prev } = await sb.from('expense_category_mappings').select('source_label,target_category_id').eq('user_id', user!.id);
      const map: Record<string, string> = {};
      for (const src of p.sourceCategories) {
        const hit = prev?.find((x: any) => x.source_label.toLowerCase() === src.toLowerCase());
        if (hit && d.budgetCategories.some(c => c.id === hit.target_category_id)) map[src] = hit.target_category_id;
      }
      setMapping(map);
      setStep('preview');
    } catch (e: any) {
      toast.error('Could not parse file: ' + e.message);
    } finally { setBusy(false); }
  };

  const reparseWithSign = async (newSign: typeof sign) => {
    setSign(newSign);
    if (!file) return;
    setBusy(true);
    try {
      const p = await parseExpenseFile(file, { treatSign: newSign, typeFilter });
      setParsed(p);
    } finally { setBusy(false); }
  };

  const reparseWithTypeFilter = async (nextFilter: string[]) => {
    setTypeFilter(nextFilter);
    if (!file) return;
    setBusy(true);
    try {
      const p = await parseExpenseFile(file, { treatSign: sign, typeFilter: nextFilter });
      setParsed(p);
    } finally { setBusy(false); }
  };

  // Aggregate by month + target category (amounts converted to USD via fx)
  const aggregation = useMemo(() => {
    if (!parsed) return null;
    const byMonthCat = new Map<string, number>(); // key: month|catId
    for (const r of parsed.rows) {
      const target = mapping[r.category];
      if (!target || target === IGNORE) continue;
      const catId = target === CREATE ? `__new__${r.category}` : target;
      const k = `${r.month}|${catId}`;
      byMonthCat.set(k, (byMonthCat.get(k) || 0) + r.amount * fx);
    }
    const monthTotals = new Map<string, number>();
    byMonthCat.forEach((v, k) => {
      const m = k.split('|')[0];
      monthTotals.set(m, (monthTotals.get(m) || 0) + v);
    });
    return { byMonthCat, monthTotals };
  }, [parsed, mapping, fx]);

  const runImport = async () => {
    if (!user || !parsed || !aggregation) return;
    setBusy(true);
    try {
      // 1) Create any new categories
      const newCatMap = new Map<string, string>(); // source category label -> newly created ID
      const toCreate = Object.entries(mapping).filter(([, v]) => v === CREATE);
      for (const [src] of toCreate) {
        const label = (newCatNames[src] || src).trim();
        const nextSort = (d.budgetCategories.reduce((a, c) => Math.max(a, c.sort_order || 0), 0) || 0) + 1;
        const { data } = await sb.from('budget_categories').insert({
          user_id: user.id, label, budget: 0, color: '#94a3b8', sort_order: nextSort,
        }).select('id').single();
        if (data?.id) newCatMap.set(src, data.id);
      }

      // 2) Persist mappings for future imports
      const mappingRows = Object.entries(mapping)
        .filter(([, v]) => v && v !== IGNORE)
        .map(([source_label, v]) => ({
          user_id: user.id,
          source_label,
          target_category_id: v === CREATE ? newCatMap.get(source_label)! : v,
        }))
        .filter(r => r.target_category_id);
      if (mappingRows.length) {
        await sb.from('expense_category_mappings').upsert(mappingRows, { onConflict: 'user_id,source_label' });
      }

      // 3) Resolve aggregation keys to real cat IDs, then upsert budget_spending (skip locked)
      const summary: ImportSummary = {
        rowsWritten: 0, monthsTouched: [], skippedLocked: [], writtenBreakdown: [], transactions: [],
      };
      const monthsSet = new Set<string>();
      const months = Array.from(aggregation.monthTotals.keys());
      const { data: existingRows } = await sb
        .from('budget_spending').select('id,month,category_id,actual,locked')
        .eq('user_id', user.id);
      const existingInScope = (existingRows || []).filter((r: any) => months.includes(r.month.slice(0, 7)));

      for (const [key, sum] of aggregation.byMonthCat.entries()) {
        const [month, rawCatId] = key.split('|');
        const catId = rawCatId.startsWith('__new__') ? newCatMap.get(rawCatId.replace('__new__', '')) : rawCatId;
        if (!catId) continue;
        const existing = existingInScope.find((r: any) => r.category_id === catId && r.month.slice(0, 7) === month);
        if (existing?.locked) {
          summary.skippedLocked.push({ month, categoryId: catId, existingActual: Number(existing.actual) });
          continue;
        }
        if (existing) {
          await sb.from('budget_spending').update({ actual: sum, source: 'import' }).eq('id', existing.id);
        } else {
          await sb.from('budget_spending').insert({ user_id: user.id, month: `${month}-01`, category_id: catId, actual: sum, source: 'import' });
        }
        summary.rowsWritten++;
        monthsSet.add(month);
        summary.writtenBreakdown.push({ month, categoryId: catId, amount: sum });
      }
      summary.monthsTouched = Array.from(monthsSet).sort();
      summary.transactions = parsed.rows.slice(0, 500).map(r => ({ ...r, amount: r.amount * fx })); // cap for coach payload, convert to USD

      // 4) Log import
      await sb.from('expense_imports').insert({
        user_id: user.id, filename: file?.name || 'upload.xlsx',
        row_count: parsed.rows.length, months_touched: summary.monthsTouched,
      });

      setStep('done');
      onImported(summary);
      toast.success(`Imported ${summary.rowsWritten} category-months`);
    } catch (e: any) {
      toast.error('Import failed: ' + e.message);
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); else onOpenChange(true); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Import expenses from file</DialogTitle></DialogHeader>

        {step === 'upload' && (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="text-muted-foreground">Amounts in file are in:</span>
              <div className="inline-flex rounded-lg border border-border overflow-hidden">
                {(['USD', 'AED'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`px-3 py-1 text-xs font-medium transition ${currency === c ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              {currency === 'AED' && <span className="text-xs text-muted-foreground">→ converted at {AED_TO_USD.toFixed(4)} USD/AED</span>}
            </div>
            <div className="text-center">
              <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-10 hover:bg-accent transition"
              >
                <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <div className="text-sm font-medium">Drop or select .xlsx export</div>
                <div className="text-xs text-muted-foreground mt-1">From your iPhone expense tracker app</div>
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && parsed && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="w-4 h-4" />
              <span className="font-medium">{file?.name}</span>
              <span className="text-muted-foreground">— {parsed.rows.length} rows, {parsed.sourceCategories.length} categories</span>
            </div>
            <div className="rounded-lg border border-border p-3 text-xs space-y-2">
              <div className="font-medium">Detected columns</div>
              <div className="grid grid-cols-2 gap-2">
                {(['date', 'amount', 'category', 'merchant', 'note'] as const).map(k => (
                  <div key={k} className="flex items-center gap-1">
                    <span className="text-muted-foreground w-20">{k}:</span>
                    <select
                      value={parsed.detected[k] || ''}
                      onChange={async e => {
                        if (!file) return;
                        setBusy(true);
                        try {
                          const next = await parseExpenseFile(file, { treatSign: sign }, { ...parsed.detected, [k]: e.target.value || undefined });
                          setParsed(next);
                        } finally { setBusy(false); }
                      }}
                      className="flex-1 bg-transparent border border-border rounded px-1 py-0.5"
                    >
                      <option value="">(none)</option>
                      {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-border">
                <div className="text-muted-foreground mb-1">How are expenses signed in this file?</div>
                <div className="flex gap-3 flex-wrap">
                  {([
                    ['ignore-sign', 'All rows are expenses (ignore sign)'],
                    ['expenses-are-positive', 'Positive numbers = expenses (skip income)'],
                    ['expenses-are-negative', 'Negative numbers = expenses (skip income)'],
                  ] as const).map(([v, l]) => (
                    <label key={v} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input type="radio" checked={sign === v} onChange={() => reparseWithSign(v)} />
                      {l}
                    </label>
                  ))}
                </div>
                {parsed.skippedIncome > 0 && <div className="text-xs text-muted-foreground mt-1">Skipped {parsed.skippedIncome} income rows.</div>}
              </div>
              <div className="pt-2 border-t border-border flex items-center gap-2 flex-wrap">
                <span className="text-muted-foreground">Currency in file:</span>
                <div className="inline-flex rounded border border-border overflow-hidden">
                  {(['USD', 'AED'] as const).map(c => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`px-2 py-0.5 text-xs ${currency === c ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                    >{c}</button>
                  ))}
                </div>
                {currency === 'AED' && <span className="text-muted-foreground">converted to USD at {AED_TO_USD.toFixed(4)}</span>}
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto text-xs border border-border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0"><tr>
                  <th className="text-left px-2 py-1">Date</th><th className="text-left px-2 py-1">Merchant</th>
                  <th className="text-right px-2 py-1">Amount {currency === 'AED' ? '(→ USD)' : ''}</th><th className="text-left px-2 py-1">Category</th>
                </tr></thead>
                <tbody>{parsed.rows.slice(0, 20).map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-2 py-1 font-mono">{r.date}</td>
                    <td className="px-2 py-1 truncate max-w-[180px]">{r.merchant}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{fmtUSD(r.amount * fx)}</td>
                    <td className="px-2 py-1">{r.category}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={close}>Cancel</Button>
              <Button onClick={() => setStep('map')} disabled={!parsed.rows.length}>Next: Map categories <ArrowRight className="w-4 h-4 ml-1" /></Button>
            </DialogFooter>
          </div>
        )}

        {step === 'map' && parsed && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Choose which finance category each source label maps to. Set to "Ignore" to skip.</p>
            <div className="max-h-[50vh] overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {parsed.sourceCategories.map(src => {
                const count = parsed.rows.filter(r => r.category === src).length;
                const sum = parsed.rows.filter(r => r.category === src).reduce((a, r) => a + r.amount, 0);
                return (
                  <div key={src} className="p-3 flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{src}</div>
                      <div className="text-xs text-muted-foreground">{count} rows · {fmtUSD(sum * fx)}</div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <select
                      value={mapping[src] || ''}
                      onChange={e => setMapping({ ...mapping, [src]: e.target.value })}
                      className="text-xs bg-background border border-border rounded px-2 py-1 min-w-[180px]"
                    >
                      <option value="">— Choose —</option>
                      {d.budgetCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      <option value={CREATE}>+ Create new category</option>
                      <option value={IGNORE}>Ignore</option>
                    </select>
                    {mapping[src] === CREATE && (
                      <input
                        placeholder="New name"
                        value={newCatNames[src] ?? src}
                        onChange={e => setNewCatNames({ ...newCatNames, [src]: e.target.value })}
                        className="text-xs bg-background border border-border rounded px-2 py-1 w-32"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep('preview')}>Back</Button>
              <Button onClick={() => setStep('confirm')} disabled={!Object.values(mapping).some(v => v && v !== IGNORE)}>
                Next: Review
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'confirm' && aggregation && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Import will replace <strong>Actual</strong> for each (month, category) below.
              Cells you've locked (🔒) in the Spending grid will be skipped.
            </p>
            <div className="max-h-[50vh] overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0"><tr>
                  <th className="text-left px-2 py-1">Month</th>
                  <th className="text-right px-2 py-1">Total</th>
                  <th className="text-right px-2 py-1"># categories</th>
                </tr></thead>
                <tbody>{Array.from(aggregation.monthTotals.entries()).sort().map(([m, tot]) => {
                  const catCount = Array.from(aggregation.byMonthCat.keys()).filter(k => k.startsWith(m + '|')).length;
                  return (
                    <tr key={m} className="border-t border-border">
                      <td className="px-2 py-1 font-mono">{fmtMonth(m + '-01')}</td>
                      <td className="px-2 py-1 text-right tabular-nums font-medium">{fmtUSD(tot)}</td>
                      <td className="px-2 py-1 text-right">{catCount}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep('map')}>Back</Button>
              <Button onClick={runImport} disabled={busy}>
                {busy ? 'Importing…' : <>Import <Check className="w-4 h-4 ml-1" /></>}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'done' && (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-primary" />
            </div>
            <div className="text-sm">Import complete.</div>
            <Button onClick={close}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export type ImportSummary = {
  rowsWritten: number;
  monthsTouched: string[];
  skippedLocked: { month: string; categoryId: string; existingActual: number }[];
  writtenBreakdown: { month: string; categoryId: string; amount: number }[];
  transactions: RawRow[];
};
