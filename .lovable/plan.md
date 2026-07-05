# Goal Setting & Tracking — System Writeup

Portable spec of the "Goals V2" module in this app. All logic lives under `src/goals/` and is surfaced at route `/goals` (page `GoalsV2.tsx`), plus a compact dashboard strip (`QuarterlyDashboardStrip`).

---

## 1. Conceptual Model

Three stacked **layers** (time horizons) with optional linking upward:

- **Long-term** — vision-level goals (no time bound, no metrics, no weekly tasks). Purely qualitative anchors.
- **Yearly** — one calendar year. Has metrics and optional monthly reviews. Can be *linked to* a long-term goal.
- **Quarterly** — one quarter (`"Q2 2026"` etc.). Has metrics **and** weekly task blocks. Can be *linked to* a yearly goal.

Linkage flows upward: quarterly → yearly → long-term. This allows a **yearly rollup progress** to be computed from its child quarterly goals.

Everything is grouped by a user-defined **Category** (e.g. Physical, Financial, Skills, Personal growth, Career — seeded but fully editable).

Each goal has a **Color** (one of: coral, purple, teal, green, amber, pink) driven by CSS variables `--goal-*`. Used for left-border accent, category chip, progress bar, and swatches.

---

## 2. Data Types (TypeScript, `src/goals/types.ts`)

```ts
Layer       = "longterm" | "yearly" | "quarterly"
Status      = "on-track" | "at-risk" | "behind" | "complete"
MetricKind  = "number" | "checkbox"
ColorKey    = "coral" | "purple" | "teal" | "green" | "amber" | "pink"
ProgressMode = "auto" | "manual" | "blend"   // yearly-only, default "blend"

Metric {
  id, label, kind: MetricKind,
  current: number,   // checkbox: 0 or 1
  target:  number,   // checkbox: always 1
  unit?:   string    // e.g. "$K", "sessions"
}

WeeklyTask       { id, text, done: boolean }
WeeklyTaskBlock  { weekNumber: number, tasks: WeeklyTask[] }

MonthlyReview {
  month: "YYYY-MM",
  status: "on-track" | "at-risk" | "behind" | "complete",
  note?: string,
  reviewedAt: number
}

Goal {
  id, title, description?,
  categoryId, layer, color,
  quarter?: "Q2 2026",   // quarterly only
  year?:    number,      // yearly only
  linkedYearlyGoalId?,   // quarterly → yearly
  linkedLongtermGoalId?, // yearly → longterm
  metrics: Metric[],                // empty for longterm
  weeklyTasks: WeeklyTaskBlock[],   // quarterly only
  monthlyReviews?: MonthlyReview[], // yearly
  progressMode?: ProgressMode,      // yearly only
  status?: Status,                  // optional manual override
  createdAt
}

Category { id, name }

GoalsState {
  goals: Goal[],
  categories: Category[],
  currentWeekIndex: Record<string, number>  // per-quarter override
}
```

---

## 3. Storage

- Client-only, **`localStorage` key `goals_v2_data`**. No Supabase table for this system.
- Simple in-memory store in `src/goals/storage.ts` with a subscription set (`useGoalsStore` hook).
- On first load, seeds 5 quarterly goals for `Q2 2026` (B2Broker sales sprint, Train 3x/week, Alcohol reduction, FI plan, SG/HK job search) plus 5 categories.
- Public store API:
  - `upsertGoal(goal)`, `deleteGoal(id)`, `updateGoal(id, patch)`
  - `addCategory(name)`, `renameCategory(id, name)`, `deleteCategory(id)` (deleting a category also deletes its goals)
  - `advanceWeek(qKey)`, `completeCurrentWeek(qKey, weekNumber)` — mass-tick every task in the current week for all quarterly goals in that quarter.

---

## 4. Time Model (`src/goals/utils.ts`)

- Uses **Dubai time** (`getDubaiDate()`) for "now" everywhere (matches the app-wide GMT+4 convention).
- Quarter key format: `"Q1 2026"`, `"Q2 2026"`, …
- **Special-cased quarter**: `Q2 2026` is hard-coded to start 13 May 2026 and run 6 weeks (ends 27 Jun 2026). All other quarters compute start = first day of quarter, end = last day, `totalWeeks = min(13, ceil(days/7))`.
- `currentQuarterKey()` → today's quarter.
- `listQuarters()` → sliding window `[currentQ-2 … currentQ+6]`.
- `listYears()` → `[currentY-1 … currentY+3]`.
- `currentWeekOfQuarter(qKey)` → 1-based week number, clamped to `[1, totalWeeks]`.
- Month helpers: `currentMonthKey()` → `"YYYY-MM"`, `monthLabel("2026-05")` → localized "May 2026", `monthsForYear(y)` → 12 keys.

---

## 5. Progress Calculation

All returned as **integer percentages 0–100**.

**Metric-only progress** (`metricProgressPct`):
```
avg over metrics of  clamp01(current / target)   × 100
```
Checkbox metric = 0 or 1 out of 1.

**Quarterly progress** (`quarterlyProgress`) — blend of metrics + weekly tasks:
```
if no tasks:      return metricPct
if no metrics:    return taskPct                       // completed / total
otherwise:        round( metricPct*0.7 + taskPct*0.3 )
```

**Yearly rollup** (`yearlyRollupProgress`) — average of `quarterlyProgress` for all quarterly goals linked to this yearly goal.

**Yearly progress** (`yearlyProgress`) — depends on `progressMode`:
- `"manual"` — prefers own metrics; falls back to rollup if no metrics.
- `"auto"` — prefers linked-quarterly rollup; falls back to metrics.
- `"blend"` (default) — if both metrics and linked quarterlies exist: `round(metric*0.6 + rollup*0.4)`; else whichever exists.

**Long-term** — no computed progress (visualized qualitatively).

---

## 6. Status (Automatic, with Manual Override)

`autoStatus(goal, qKey?)`:
- If `goal.status` is set, use it.
- If `pct >= 100` → `complete`.
- **Non-quarterly** cutoffs (absolute):
  - `pct >= 75` → on-track
  - `pct >= 40` → at-risk
  - else → behind
- **Quarterly** cutoffs (relative to expected week pace `expected = week / totalWeeks * 100`):
  - `pct >= expected * 0.85` → on-track
  - `pct >= expected * 0.55` → at-risk
  - else → behind

Status colors: on-track = `hsl(var(--success))`, at-risk = amber, behind = destructive, complete = purple.

---

## 7. Categories

Managed inline via `CategoryManager` on the Goals page. Add / rename / delete. Deleting a category also cascades and removes its goals.

---

## 8. Quarterly Goal — Weekly Tasks

- Each quarterly goal owns an array of `WeeklyTaskBlock`s, one per week of its quarter.
- When quarter changes (or goal is first created), the form syncs the count of week blocks to `quarterInfo(quarter).totalWeeks`, preserving any existing tasks by week number.
- On the goal card: current week's tasks are shown; each task has a checkbox that flips `done`.
- The dashboard "Review week ✓" button mass-completes every task in the current week for every active quarterly goal.
- If a quarterly card has no `weeklyTasks` yet, it exposes a "Generate week blocks" button that creates empty blocks for all `totalWeeks`.

---

## 9. Yearly Goal — Monthly Reviews

- Yearly goals accumulate a `monthlyReviews[]` array keyed by month `"YYYY-MM"`.
- The Goals page shows a banner at the top of the Yearly tab when there are yearly goals for the selected year without a review for the current month: *"{Month YYYY} review: N yearly goals to check in."*
- Each monthly review carries a status snapshot and optional note. The `progressMode` decides whether progress reflects own metrics, child quarterly rollup, or a blend.

---

## 10. Page & UI Composition

**Route:** `/goals` → `src/pages/GoalsV2.tsx`. Header contains back-link, "Goals" title, and **Add goal**.

**Tabs:** `This Quarter | This Year | Long-term` (bound to `Layer`).
- Quarter tab has a Quarter selector (defaults to `currentQuarterKey`).
- Yearly tab has a Year selector.
- Long-term has no selector.

**Grouping:** Inside each tab, goals are grouped by category and rendered as a 1- or 2-column grid of cards. Empty state per tab shows a CTA to add a first goal.

**Cards** (`src/goals/components/`):
- `GoalCard` (quarterly): color left-border, title, category chip, status badge, upward link chip if linked-yearly, description, progress bar, per-metric editors, expandable weekly tasks panel, three-dot menu (Edit/Delete).
- `YearlyGoalCard` (yearly): progress via `yearlyProgress`, exposes `progressMode` control, hosts monthly review inputs, links to long-term.
- `LongtermGoalCard`: qualitative card, lists linked yearly goals.

**Add/Edit dialog** (`GoalFormDialog`):
- Fields: title, description, layer, category (+inline "add new category"), color swatch, layer-specific selectors (quarter or year), upward link picker, metrics editor (kind, target, unit), and weekly-tasks editor (quarterly only).
- Metrics editor supports `number` (with target + unit) and `checkbox` (fixed target 1).
- Weekly tasks editor lists each week block, each editable with add/remove task rows; extra weeks can be appended.

**Metric editors** (`MetricEditor`): inline +/- controls for `current` (numbers) or a checkbox toggle. Live-writes back via `onUpdate`.

**Dashboard integration** (`QuarterlyDashboardStrip`, used on `/` Dashboard):
- Header: `"{Q} · Week W of TotalW"` + "Manage goals →" link + **Review week ✓** button (mass-tick current week across all active quarterly goals).
- Overall bar = average of `quarterlyProgress` across active quarterly goals in current quarter.
- Horizontal scroll of per-goal mini cards: title, category, status badge, progress bar, current week's tasks (first 4 with checkboxes; overflow shown as "+N more").

---

## 11. Design System Hooks

- Color tokens: `--goal-coral | -purple | -teal | -green | -amber | -pink` defined in `src/index.css`.
- Helper: `colorHsl(colorKey, alpha?)` returns `hsl(var(--goal-x))` or `hsl(var(--goal-x) / alpha)`.
- Status colors use semantic tokens (`--success`, `--destructive`, plus `--goal-amber`, `--goal-purple`).
- No hardcoded hex/utility colors in components — everything is theme-driven so dark mode + brand changes cascade.

---

## 12. Persistence & Sync Considerations

- Single-user, single-device. No cross-device sync — stored under one browser's `localStorage`.
- No auth guard; if the user clears site data, the seed runs again.
- No migration/versioning field on `GoalsState`. Any schema change should introduce a version key and a migration in `load()`.

---

## 13. Extension Points (already suggested by the code)

- `Goal.status` supports manual override on top of `autoStatus`.
- `progressMode` on yearly goals allows switching between metric-driven, rollup-driven, or blended.
- `currentWeekIndex` per quarter exists in state (to override "current week" globally) but is only bumped by `advanceWeek` — not yet consumed by `currentWeekOfQuarter`. Wire it in when you want manual week advancing.
- Long-term goals have no metrics/tasks by design; if you want progress on them, aggregate `yearlyProgress` over linked yearly goals.

---

## 14. File Map (for the receiving AI)

- `src/goals/types.ts` — type & color tokens.
- `src/goals/utils.ts` — time, progress, status math, `uid`.
- `src/goals/storage.ts` — localStorage store + seed + hook.
- `src/goals/components/GoalCard.tsx` — quarterly card.
- `src/goals/components/YearlyGoalCard.tsx` — yearly card + monthly review UI.
- `src/goals/components/LongtermGoalCard.tsx` — long-term card.
- `src/goals/components/GoalFormDialog.tsx` — add/edit modal.
- `src/goals/components/CategoryManager.tsx` — categories CRUD.
- `src/goals/components/MetricEditor.tsx`, `ProgressBar.tsx`, `StatusBadge.tsx`, `WeeklyTasksPanel.tsx` — leaf UI.
- `src/goals/components/QuarterlyDashboardStrip.tsx` — dashboard summary.
- `src/pages/GoalsV2.tsx` — route/page.

---

This is a read-only spec; nothing is being modified. Approve to switch to build mode if you want any changes based on it.
