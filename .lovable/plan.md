# Expense Import Engine (Finance → Spending)

Adds an `.xlsx` upload flow that ingests your iPhone expense tracker exports, maps rows to the Finance module's budget categories, and pushes them into `budget_spending`. Includes an AI coach for variance analysis.

## User flow

1. **Finance → Details → Spending** gets a new **"Import from file"** button.
2. Drop/select an `.xlsx`. Client parses it with `xlsx` (SheetJS, already common) and shows a preview table (Date, Merchant, Amount, Source Category).
3. **Mapping screen** (asked every import, per your choice): each unique source category → dropdown of your existing Finance categories, plus "Create new" and "Ignore". Previous mappings pre-filled as suggestions (stored) but always confirmable.
4. **Month grouping**: rows grouped by `YYYY-MM` (Dubai time). Preview shows per-month, per-category totals about to be written.
5. **Import**: replaces `budget_spending.actual` for each (month, category) — **unless** that cell is locked. Locked cells are skipped and shown in the summary.
6. **Coach panel** appears with variance + AI narrative.

## Data model changes

New table `expense_imports` (audit log, allows re-run/undo):
- `id`, `user_id`, `filename`, `imported_at`, `row_count`, `months_touched (text[])`

New table `expense_category_mappings` (learned suggestions):
- `id`, `user_id`, `source_label`, `target_category_id`, `updated_at`, unique(user_id, source_label)

Add column to `budget_spending`:
- `locked boolean default false` — the manual-override protection. UI shows a 🔒 toggle per cell in the existing Spending grid.
- `source text default 'manual'` — `'manual' | 'import'` (informational, so import knows what it's overwriting).

Raw transactions are **not** stored (keeps scope small; your iPhone app is source of truth). Only aggregated monthly totals land in `budget_spending`.

## Import logic

For each (month, target_category):
- Sum row amounts.
- If `budget_spending` row exists AND `locked = true` → skip, log to summary.
- Else upsert `{actual: sum, source: 'import'}`.

## AI coach ("Full AI coach")

Edge function `finance-coach`:
- Input: current month's plan vs actual per category, last 3 months trend, and (optionally) the raw transactions from the just-imported file for the current month.
- Model: `google/gemini-3-flash-preview` via Lovable AI Gateway.
- Prompt asks for: (a) projected month-end overspend, (b) top 3 categories driving the variance, (c) recurring/subscription patterns detected in transactions, (d) 3 concrete cut suggestions with $ impact.
- Output: structured JSON (categories flagged, suggestions with amount + rationale) rendered in a "Coach" card below the Spending grid.

Raw transactions are sent to the model in-memory during the import session only — not persisted.

## Files to add/change

- Migration: `expense_imports`, `expense_category_mappings`, `budget_spending.locked`, `budget_spending.source` (+ GRANTs + RLS).
- `src/finance/import/parseXlsx.ts` — SheetJS parsing + column auto-detect (Date/Amount/Category/Merchant/Notes).
- `src/finance/import/ImportDialog.tsx` — upload → preview → mapping → confirm → summary.
- `src/finance/import/CoachCard.tsx` — renders AI insights.
- `supabase/functions/finance-coach/index.ts` — edge function calling Lovable AI.
- `src/finance/tabs/DetailsTab.tsx` — add Import button, add 🔒 lock toggle to spending cells, respect `locked` on inline edits (locking a cell just sets the flag; editing still works manually).

## Column auto-detect

Header matching (case-insensitive): Date (`date|when`), Amount (`amount|value|cost|price`), Category (`category|type|group`), Merchant (`merchant|payee|name|description|note`). If detection fails, user picks columns in the preview step.

## Out of scope (for now)

- PDF/CSV parsing (xlsx only).
- Multi-currency conversion (assumes file is in your display currency; can add AED↔USD later).
- Storing raw transactions (add later if you want a searchable ledger).

## Open question

Your iPhone app likely exports amounts as positive numbers for expenses; some also include income rows. Should the importer:
- (a) treat everything as expense (ignore sign), or
- (b) filter out positive/negative rows as income and skip them?

I'll default to **(b)** with a toggle in the preview.
