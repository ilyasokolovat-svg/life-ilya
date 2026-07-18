import * as XLSX from 'xlsx';

export type RawRow = {
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  amount: number; // absolute expense amount (positive)
  rawAmount: number; // original signed
  category: string; // source category label (raw)
  merchant: string;
  note: string;
};

export type ParseResult = {
  rows: RawRow[];
  skippedIncome: number;
  sourceCategories: string[]; // unique source labels
  detected: { date?: string; amount?: string; category?: string; merchant?: string; note?: string };
  headers: string[];
};

const norm = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');

const HINTS: Record<keyof ParseResult['detected'], string[]> = {
  date: ['date', 'when', 'transactiondate', 'day'],
  amount: ['amount', 'value', 'cost', 'price', 'sum', 'total'],
  category: ['category', 'type', 'group', 'tag'],
  merchant: ['merchant', 'payee', 'name', 'description', 'title', 'place'],
  note: ['note', 'notes', 'comment', 'memo'],
};

function detectColumns(headers: string[]): ParseResult['detected'] {
  const out: ParseResult['detected'] = {};
  const normed = headers.map(h => ({ h, n: norm(h) }));
  for (const key of Object.keys(HINTS) as (keyof typeof HINTS)[]) {
    for (const hint of HINTS[key]) {
      const match = normed.find(x => x.n === hint || x.n.includes(hint));
      if (match) { out[key] = match.h; break; }
    }
  }
  return out;
}

function toISODate(v: any): string | null {
  if (v == null || v === '') return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const s = String(v).trim();
  // Try native
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  // DD/MM/YYYY or DD-MM-YYYY
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (m) {
    let [, dd, mm, yy] = m;
    if (yy.length === 2) yy = '20' + yy;
    return `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return null;
}

export async function parseExpenseFile(
  file: File,
  opts: { treatSign: 'expenses-are-positive' | 'expenses-are-negative' | 'ignore-sign' } = { treatSign: 'ignore-sign' },
  overrideCols?: ParseResult['detected'],
): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const headers = json.length ? Object.keys(json[0]) : [];
  const detected = { ...detectColumns(headers), ...(overrideCols || {}) };

  const rows: RawRow[] = [];
  let skippedIncome = 0;
  for (const r of json) {
    const iso = detected.date ? toISODate(r[detected.date]) : null;
    if (!iso) continue;
    const rawAmt = detected.amount ? Number(String(r[detected.amount]).replace(/[^0-9.\-]/g, '')) : NaN;
    if (!isFinite(rawAmt) || rawAmt === 0) continue;

    let isExpense = true;
    if (opts.treatSign === 'expenses-are-positive') isExpense = rawAmt > 0;
    else if (opts.treatSign === 'expenses-are-negative') isExpense = rawAmt < 0;
    if (!isExpense) { skippedIncome++; continue; }

    rows.push({
      date: iso,
      month: iso.slice(0, 7),
      amount: Math.abs(rawAmt),
      rawAmount: rawAmt,
      category: detected.category ? String(r[detected.category] || 'Uncategorized').trim() || 'Uncategorized' : 'Uncategorized',
      merchant: detected.merchant ? String(r[detected.merchant] || '').trim() : '',
      note: detected.note ? String(r[detected.note] || '').trim() : '',
    });
  }

  const sourceCategories = Array.from(new Set(rows.map(r => r.category))).sort();
  return { rows, skippedIncome, sourceCategories, detected, headers };
}
