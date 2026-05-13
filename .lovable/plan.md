## Multi-Layer Goals System Rewrite

A complete rewrite of the goals section into a 3-layer system (Long-term → Yearly → Quarterly) with weekly task tracking, persisted in localStorage.

### New files

**Types & storage**
- `src/goals/types.ts` — `Goal`, `Metric`, `WeeklyTaskBlock`, `Layer`, `Status`, `Category` types and color preset list
- `src/goals/storage.ts` — `useGoalsStore` hook (localStorage-backed, key `goals_v2_data`), with CRUD for goals + categories, plus a one-time seeder that inserts the 5 specified Q2 2026 goals on first load
- `src/goals/utils.ts` — quarter helpers (current quarter, week-of-quarter for May 13–Jun 27 = 6-week Q2 2026, list of selectable quarters), progress calculator (avg of metric ratios with checkbox = 0/100), rollup for yearly goals (avg of linked quarterly progress), status auto-derivation when not manually overridden

**Components**
- `src/goals/components/ProgressBar.tsx` — 5px rounded, takes color + pct
- `src/goals/components/StatusBadge.tsx` — green/amber/red/purple pill
- `src/goals/components/MetricEditor.tsx` — slider for number metrics, checkbox for boolean
- `src/goals/components/WeeklyTasksPanel.tsx` — expandable per-week task list, current week highlighted, checkbox per task
- `src/goals/components/GoalCard.tsx` — card for quarterly goal (full editing controls)
- `src/goals/components/YearlyGoalCard.tsx` — read-only rollup card with linked-quarterly chips
- `src/goals/components/LongtermGoalCard.tsx` — vision card with linked-yearly chips
- `src/goals/components/GoalFormDialog.tsx` — create/edit modal handling all 3 layers, color picker, category dropdown w/ "create new", metric builder, weekly task builder, link selectors
- `src/goals/components/CategoryManager.tsx` — inline add/rename/delete categories
- `src/goals/components/QuarterlyDashboardStrip.tsx` — horizontal strip for the dashboard with week-of-quarter header, per-goal mini cards (title, color bar, pct, status, this week's task checklist), overall ring/bar, "Review week" button

**Pages**
- `src/pages/GoalsV2.tsx` — new page with 3 tabs (This Quarter / This Year / Long-term), quarter & year selectors, grouped-by-category lists, empty states, "Add goal" / "Add category" buttons

### Wiring

- `src/App.tsx` — replace existing `/goals-overview` route (or add `/goals` alias) to point at `GoalsV2`. Keep old `Goals.tsx` and `GoalsOverview.tsx` files in place but unused (no deletion to avoid breaking other imports).
- `src/pages/Dashboard.tsx` — replace the existing `GoalsProgressSection` import/usage with `QuarterlyDashboardStrip`.

### Data model

```ts
type Layer = "longterm" | "yearly" | "quarterly";
type Status = "on-track" | "at-risk" | "behind" | "complete";
type MetricKind = "number" | "checkbox";
type ColorKey = "coral" | "purple" | "teal" | "green" | "amber" | "pink";

interface Metric { id; label; kind: MetricKind; current: number; target: number; unit?: string }
interface WeeklyTaskBlock { weekNumber: number; tasks: { id; text; done }[] }

interface Goal {
  id; title; description?; categoryId; layer; color: ColorKey;
  quarter?: string;            // "Q2 2026"
  year?: number;               // 2026
  linkedYearlyGoalId?; linkedLongtermGoalId?;
  metrics: Metric[];           // empty for longterm
  weeklyTasks: WeeklyTaskBlock[]; // only quarterly
  status?: Status;             // optional manual override; else auto from progress
}

interface Category { id; name; }
```

### Color tokens

Add 6 HSL color tokens to `src/index.css` (`--goal-coral`, `--goal-purple`, `--goal-teal`, `--goal-green`, `--goal-amber`, `--goal-pink`) and reference them via inline style `hsl(var(--goal-coral))` so progress bars/badges match the existing design system without hardcoded hex.

### Quarter math

Q2 2026 explicitly defined as 6 weeks starting Mon May 13 2026 → Sat Jun 27 2026. Other quarters default to standard calendar quarters with `Math.ceil(daysElapsed/7)` weeks (cap 13). Current week derived from Dubai date util already in project.

### Seeding

On first mount, if `goals_v2_data` is absent in localStorage, insert the 5 quarterly goals exactly as specified (titles, categories, colors, metrics, weekly tasks for weeks 1–6). Categories seeded: Physical, Financial, Skills, Personal growth, Career.

### Out of scope

- No Supabase migration — pure localStorage as requested ("All data persists in localStorage").
- No deletion of legacy goals files; they simply stop being routed/imported from the dashboard.
- No tests.