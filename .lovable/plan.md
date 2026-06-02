
# Finance: investment flows + B2Broker deals pipeline

Two independent additions. Both land in the Finance section.

---

## Part A — Investment flows (contributions & withdrawals)

### A1. Capture flows in Log (`LogTab.tsx`, step 2)
- Next to each bucket balance, add a small **Contribution this month** number input (defaults to `0`, accepts negatives = withdrawal).
- Help text: *"+ added, − withdrawn. Leave 0 if only market movement."*
- On save: write to `investment_snapshots.contribution` (column already exists — no migration).
- Summary row at the bottom of step 2:
  *"Bonus received: $5,000 · Net invested: $3,000 · Kept as cash: $2,000"*

### A2. New "Flows" sub-tab in Details (`DetailsTab.tsx`)
- **Bars by month** — green: bonus (`budget_extras` where `type='bonus'`); blue: net contributions; red (downward): withdrawals.
- **Line chart** — cumulative contributions vs total portfolio value; gap = market gains/losses.
- **Table** — month · bonus · per-bucket contribution · total flow · withdrawals.

### A3. Overlay flows on Net Worth chart (Overview)
- Small dots on months with non-zero contribution, sized by amount, green (in) / red (out).
- Tooltip: *"Net worth $X · contributed +$Y this month"*.

### A4. Backfill column in Archive
- Inline editable **Contribution** column on the Archive table so past months can be retro-filled without re-entering balances.

### Technical notes (Part A)
- No schema changes. `investment_snapshots.contribution` already exists.
- New helpers in `src/finance/calc.ts`: `monthlyContributions(d)`, `cumulativeContributions(d)`, `bonusVsInvestedSeries(d)`.
- Withdrawals = negative `contribution`.

---

## Part B — B2Broker deals pipeline

Small, lightweight section. Not a major UI block.

### Where it lives
- New compact card on the **Overview tab** titled **"B2Broker pipeline"** — collapsed by default, shows total expected bonus and deal count. Expanding reveals a small table with add/edit/remove.

### Fields per deal
- `company_name` (text)
- `product` (text)
- `arr_usd` (number)
- `expected_bonus_usd` (number)
- `status` (text, optional — e.g. "lead / in progress / closed-won / closed-lost", default `in_progress`)
- `notes` (text, optional)

### UI
- Inline add row + edit-in-place + delete button per row.
- Footer totals: total ARR · total expected bonus · count of active deals.
- When a deal is marked **closed-won**, a "Convert to bonus" button creates a `budget_extras` entry (`type: 'bonus'`) for the current month — this ties it back into the income/flows tracking from Part A.

### Schema (new table)
```
b2broker_deals
  id, user_id, company_name, product, arr_usd, expected_bonus_usd,
  status, notes, created_at, updated_at
```
With RLS (own_select / own_insert / own_update / own_delete) + GRANTs to `authenticated` and `service_role`. Migration submitted via `supabase--migration`.

### Files
- `supabase/migrations/<ts>_b2broker_deals.sql` — new table + RLS + GRANTs
- `src/finance/dialogs/B2BrokerPipeline.tsx` — new component (compact card + inline table)
- `src/finance/tabs/OverviewTab.tsx` — mount the card
- `src/finance/calc.ts` — small helper `totalExpectedBonus(deals)`

---

## Suggested build order
1. Part A1 + A2 (capture + Flows view) — highest value, no schema work.
2. Part B (deals pipeline) — independent, additive.
3. Part A3 (NW overlay) and A4 (Archive backfill) — polish after the data is flowing.

Want me to proceed with all of it, or trim/reorder?
