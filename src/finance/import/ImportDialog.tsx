import React, { useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, ArrowRight, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { WealthData } from '@/wealth/types';
import { fmtUSD, fmtMonth } from '../utils';
import { AED_TO_USD, AED_PER_USD } from '../constants';
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
  const [importIncome, setImportIncome] = useState(true);
  const fx = currency === 'AED' ? AED_TO_USD : 1;
  const [mapping, setMapping] = useState<Record<string, string>>({}); // sourceLabel -> categoryId | IGNORE
  const [remembered, setRemembered] = useState<Record<string, boolean>>({}); // sourceLabel -> came from saved mappings
  const [showAllMappings, setShowAllMappings] = useState(false);
  const [newCatNames, setNewCatNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload'); setFile(null); setParsed(null); setMapping({}); setNewCatNames({});
    setRemembered({}); setShowAllMappings(false);
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
      // Preload remembered mappings (including remembered "Ignore" choices)
      const { data: prev } = await sb.from('expense_category_mappings').select('source_label,target_category_id').eq('user_id', user!.id);
      const map: Record<string, string> = {};
      const known: Record<string, boolean> = {};
      for (const src of p.sourceCategories) {
        const hit = prev?.find((x: any) => x.source_label.toLowerCase() === src.toLowerCase());
        if (!hit) continue;
        if (hit.target_category_id == null) { map[src] = IGNORE; known[src] = true; }
        else if (d.budgetCategories.some(c => c.id === hit.target_category_id)) { map[src] = hit.target_category_id; known[src] = true; }
      }
      setMapping(map);
      setRemembered(known);

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

  // Aggregate income rows by month + kind (in file currency)
  const incomeAggregation = useMemo(() => {
    if (!parsed) return null;
    const byMonth = new Map<string, { salary: number; bonus: number; salaryCount: number; bonusCount: number }>();
    for (const r of parsed.incomeRows) {
      const cur = byMonth.get(r.month) || { salary: 0, bonus: 0, salaryCount: 0, bonusCount: 0 };
      if (r.kind === 'salary') { cur.salary += r.amount; cur.salaryCount++; }
      else { cur.bonus += r.amount; cur.bonusCount++; }
      byMonth.set(r.month, cur);
    }
    return byMonth;
  }, [parsed]);

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

      // 2) Persist mappings for future imports (Ignore choices are remembered as NULL target)
      const mappingRows = Object.entries(mapping)
        .filter(([, v]) => !!v)
        .map(([source_label, v]) => ({
          user_id: user.id,
          source_label,
          target_category_id: v === IGNORE ? null : (v === CREATE ? newCatMap.get(source_label) ?? null : v),
        }))
        .filter(r => r.target_category_id !== undefined);
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

      // 3b) Income rows: salary → budget_months.salary (AED), bonus → budget_extras (USD)
      let incomeMonths = 0, bonusRows = 0;
      if (importIncome && incomeAggregation && incomeAggregation.size) {
        // Load existing budget_months + this-year bonus extras once
        const monthKeys = Array.from(incomeAggregation.keys()).map(m => `${m}-01`);
        const { data: existingMonths } = await sb
          .from('budget_months').select('id,month,salary').eq('user_id', user.id).in('month', monthKeys);
        const { data: existingExtras } = await sb
          .from('budget_extras').select('id,month,amount,description,type')
          .eq('user_id', user.id).in('month', monthKeys).eq('type', 'bonus');

        for (const [month, agg] of incomeAggregation.entries()) {
          const monthISO = `${month}-01`;
          // Salary — store in AED. File currency AED → keep; USD → convert × AED_PER_USD.
          if (agg.salary > 0) {
            const salaryAED = currency === 'AED' ? agg.salary : agg.salary * AED_PER_USD;
            const existing = existingMonths?.find((x: any) => x.month === monthISO);
            if (existing) {
              await sb.from('budget_months').update({ salary: Math.round(salaryAED) }).eq('id', existing.id);
            } else {
              await sb.from('budget_months').insert({ user_id: user.id, month: monthISO, salary: Math.round(salaryAED) });
            }
            incomeMonths++;
          }
          // Bonus / commission — store in USD.
          if (agg.bonus > 0) {
            const bonusUSD = currency === 'AED' ? agg.bonus * AED_TO_USD : agg.bonus;
            // Replace any prior import-tagged bonus for this month, then insert one aggregated row
            const priorImport = (existingExtras || []).find((x: any) => x.month === monthISO && x.description === 'Imported bonus');
            if (priorImport) {
              await sb.from('budget_extras').update({ amount: Math.round(bonusUSD) }).eq('id', priorImport.id);
            } else {
              await sb.from('budget_extras').insert({
                user_id: user.id, month: monthISO, description: 'Imported bonus',
                amount: Math.round(bonusUSD), type: 'bonus',
              });
            }
            bonusRows++;
          }
        }
      }

      // 4) Log import
      await sb.from('expense_imports').insert({
        user_id: user.id, filename: file?.name || 'upload.xlsx',
        row_count: parsed.rows.length, months_touched: summary.monthsTouched,
      });

      setStep('done');
      onImported(summary);
      const incomeMsg = importIncome && (incomeMonths || bonusRows) ? ` · income: ${incomeMonths} salary / ${bonusRows} bonus` : '';
      toast.success(`Imported ${summary.rowsWritten} category-months${incomeMsg}`);
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
                {(['date', 'amount', 'category', 'merchant', 'note', 'type'] as const).map(k => (
                  <div key={k} className="flex items-center gap-1">
                    <span className="text-muted-foreground w-20">{k === 'type' ? 'in/exp col' : k}:</span>
                    <select
                      value={parsed.detected[k] || ''}
                      onChange={async e => {
                        if (!file) return;
                        setBusy(true);
                        try {
                          const next = await parseExpenseFile(file, { treatSign: sign, typeFilter }, { ...parsed.detected, [k]: e.target.value || undefined });
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
                {parsed.skippedIncome > 0 && <div className="text-xs text-muted-foreground mt-1">Skipped {parsed.skippedIncome} non-matching rows.</div>}
              </div>
              {parsed.detected.type && parsed.typeValues.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <div className="text-muted-foreground mb-1">
                    Keep rows where <span className="font-mono">{parsed.detected.type}</span> is:
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {parsed.typeValues.map(v => {
                      const active = typeFilter.includes(v);
                      return (
                        <label key={v} className="flex items-center gap-1 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => {
                              const next = active ? typeFilter.filter(x => x !== v) : [...typeFilter, v];
                              reparseWithTypeFilter(next);
                            }}
                          />
                          {v}
                        </label>
                      );
                    })}
                    {typeFilter.length > 0 && (
                      <button
                        onClick={() => reparseWithTypeFilter([])}
                        className="text-xs underline text-muted-foreground"
                      >clear filter</button>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Tip: for expense-tracker exports, keep only <span className="font-mono">Exp.</span> to exclude income and transfers.
                  </div>
                </div>
              )}
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
              {parsed.incomeRows.length > 0 && (
                <div className="pt-2 border-t border-border space-y-1">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input type="checkbox" checked={importIncome} onChange={e => setImportIncome(e.target.checked)} />
                    <span className="font-medium">Also update Income tab</span>
                    <span className="text-muted-foreground">— {parsed.incomeRows.length} income rows detected</span>
                  </label>
                  {importIncome && incomeAggregation && (
                    <div className="text-[11px] text-muted-foreground pl-5">
                      Salary rows → Salary (AED) · Bonus rows → Commission (USD) across {incomeAggregation.size} month(s).
                      Salary category matched by label containing "salary".
                    </div>
                  )}
                </div>
              )}
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
            {(() => {
              const unmapped = parsed.sourceCategories.filter(s => !mapping[s]);
              const knownCount = parsed.sourceCategories.length - unmapped.length;
              return (
                <div className="rounded-lg border border-border p-3 text-xs space-y-1">
                  <div className="font-medium">Category mapping</div>
                  <div className="text-muted-foreground">
                    {knownCount} of {parsed.sourceCategories.length} source categories already mapped from previous imports.
                  </div>
                  {unmapped.length > 0
                    ? <div className="text-amber-600 dark:text-amber-400">{unmapped.length} new categor{unmapped.length === 1 ? 'y' : 'ies'} need mapping: {unmapped.join(', ')}</div>
                    : <div className="text-emerald-600 dark:text-emerald-400">Nothing new — you can go straight to review.</div>}
                </div>
              );
            })()}
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={close}>Cancel</Button>
              <Button variant="outline" onClick={() => { setShowAllMappings(true); setStep('map'); }}>Edit mappings</Button>
              {(() => {
                const unmapped = parsed.sourceCategories.filter(s => !mapping[s]);
                return unmapped.length > 0
                  ? <Button onClick={() => { setShowAllMappings(false); setStep('map'); }} disabled={!parsed.rows.length}>Map {unmapped.length} new <ArrowRight className="w-4 h-4 ml-1" /></Button>
                  : <Button onClick={() => setStep('confirm')} disabled={!parsed.rows.length}>Next: Review <ArrowRight className="w-4 h-4 ml-1" /></Button>;
              })()}
            </DialogFooter>
          </div>
        )}

        {step === 'map' && parsed && (() => {
          const unmapped = parsed.sourceCategories.filter(s => !mapping[s]);
          const visible = showAllMappings ? parsed.sourceCategories : (unmapped.length ? unmapped : parsed.sourceCategories);
          const hiddenCount = parsed.sourceCategories.length - visible.length;
          return (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Choose which finance category each source label maps to. Set to "Ignore" to skip — your choices are remembered for future uploads.
            </p>
            <div className="max-h-[50vh] overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {visible.map(src => {
                const count = parsed.rows.filter(r => r.category === src).length;
                const sum = parsed.rows.filter(r => r.category === src).reduce((a, r) => a + r.amount, 0);
                return (
                  <div key={src} className="p-3 flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate flex items-center gap-2">
                        {src}
                        {remembered[src]
                          ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">saved</span>
                          : <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">new</span>}
                      </div>
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
            {hiddenCount > 0 && (
              <button onClick={() => setShowAllMappings(true)} className="text-xs underline text-muted-foreground">
                Show {hiddenCount} already-mapped categor{hiddenCount === 1 ? 'y' : 'ies'}
              </button>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep('preview')}>Back</Button>
              <Button onClick={() => setStep('confirm')} disabled={!Object.values(mapping).some(v => v && v !== IGNORE)}>
                Next: Review
              </Button>
            </DialogFooter>
          </div>
          );
        })()}


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
