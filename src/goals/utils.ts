import { Goal, Status, WeeklyTaskBlock } from "./types";
import { getDubaiDate } from "@/utils/dateUtils";

export interface QuarterInfo {
  key: string;
  label: string;
  start: Date;
  end: Date;
  totalWeeks: number;
}

export function quarterInfo(key: string): QuarterInfo {
  const m = key.match(/^Q([1-4])\s+(\d{4})$/);
  if (!m) {
    const now = getDubaiDate();
    return quarterInfo(`Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`);
  }
  const q = parseInt(m[1]);
  const y = parseInt(m[2]);
  const startMonth = (q - 1) * 3;
  const start = new Date(y, startMonth, 1);
  const end = new Date(y, startMonth + 3, 0);
  const totalWeeks = Math.min(13, Math.ceil(((end.getTime() - start.getTime()) / 86400000 + 1) / 7));
  return { key, label: key, start, end, totalWeeks };
}

export function currentQuarterKey(): string {
  const now = getDubaiDate();
  const y = now.getFullYear();
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `Q${q} ${y}`;
}

export function listQuarters(): string[] {
  const now = getDubaiDate();
  const items: string[] = [];
  const q = Math.floor(now.getMonth() / 3) + 1;
  const y = now.getFullYear();
  for (let i = -2; i <= 6; i++) {
    let qq = q + i;
    let yy = y;
    while (qq <= 0) { qq += 4; yy -= 1; }
    while (qq > 4) { qq -= 4; yy += 1; }
    items.push(`Q${qq} ${yy}`);
  }
  return Array.from(new Set(items));
}

export function listYears(): number[] {
  const now = getDubaiDate();
  const y = now.getFullYear();
  return [y - 1, y, y + 1, y + 2, y + 3];
}

export function currentWeekOfQuarter(qKey: string): number {
  const info = quarterInfo(qKey);
  const today = getDubaiDate();
  if (today < info.start) return 1;
  if (today > info.end) return info.totalWeeks;
  const days = Math.floor((today.getTime() - info.start.getTime()) / 86400000);
  return Math.min(info.totalWeeks, Math.floor(days / 7) + 1);
}

export function metricProgressPct(g: Goal): number {
  if (!g.metrics.length) return 0;
  const ratios = g.metrics.map((m) => {
    if (m.target <= 0) return 0;
    return Math.min(1, Math.max(0, m.current / m.target));
  });
  return Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100);
}

export function quarterlyProgress(g: Goal): number {
  const weighting = g.progressWeighting || "blend";
  const metricPct = metricProgressPct(g);
  const allTasks = g.weeklyTasks.flatMap((w) => w.tasks);
  const taskPct = allTasks.length
    ? Math.round((allTasks.filter((t) => t.done).length / allTasks.length) * 100)
    : 0;

  if (weighting === "metric-only") return metricPct;
  if (weighting === "task-only") return taskPct;
  // blend
  if (!allTasks.length) return metricPct;
  if (!g.metrics.length) return taskPct;
  return Math.round(metricPct * 0.7 + taskPct * 0.3);
}

export function yearlyRollupProgress(yearlyGoal: Goal, allGoals: Goal[]): number {
  const linked = allGoals.filter((g) => g.layer === "quarterly" && g.linkedYearlyGoalId === yearlyGoal.id);
  if (!linked.length) return 0;
  return Math.round(linked.reduce((a, g) => a + quarterlyProgress(g), 0) / linked.length);
}

export function yearlyProgress(yearlyGoal: Goal, allGoals: Goal[]): number {
  const mode: "auto" | "manual" | "blend" = yearlyGoal.progressMode || "blend";
  const hasMetrics = yearlyGoal.metrics.length > 0;
  const linked = allGoals.filter((g) => g.layer === "quarterly" && g.linkedYearlyGoalId === yearlyGoal.id);
  const hasLinked = linked.length > 0;
  const rollup = hasLinked ? yearlyRollupProgress(yearlyGoal, allGoals) : 0;
  const metric = hasMetrics ? metricProgressPct(yearlyGoal) : 0;

  if (mode === "manual") return hasMetrics ? metric : rollup;
  if (mode === "auto") return hasLinked ? rollup : metric;
  if (hasMetrics && hasLinked) return Math.round(metric * 0.6 + rollup * 0.4);
  return hasMetrics ? metric : rollup;
}

export function currentMonthKey(): string {
  const d = getDubaiDate();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthsForYear(year: number): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: "short", year: "numeric" });
}

export function autoStatus(g: Goal, qKey?: string): Status {
  if (g.status) return g.status;
  const pct = quarterlyProgress(g);
  if (pct >= 100) return "complete";
  if (g.layer !== "quarterly") {
    if (pct >= 75) return "on-track";
    if (pct >= 40) return "at-risk";
    return "behind";
  }
  const info = quarterInfo(qKey || g.quarter || currentQuarterKey());
  const week = currentWeekOfQuarter(info.key);
  const expected = (week / info.totalWeeks) * 100;
  if (pct >= expected * 0.85) return "on-track";
  if (pct >= expected * 0.55) return "at-risk";
  return "behind";
}

export const STATUS_COLOR: Record<Status, string> = {
  "on-track": "hsl(var(--success))",
  "at-risk": "hsl(var(--goal-amber))",
  "behind": "hsl(var(--destructive))",
  "complete": "hsl(var(--goal-purple))",
};

export const STATUS_LABEL: Record<Status, string> = {
  "on-track": "On track",
  "at-risk": "At risk",
  "behind": "Behind",
  "complete": "Complete",
};

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// -------------------- Recurring weekly-task sync --------------------
// The first N tasks of each week block are treated as the recurring slots
// (in order), matching goal.recurringWeeklyTasks. Any additional tasks are
// one-off tasks preserved as-is. Regenerates blocks to match totalWeeks,
// preserving `done` state of recurring slots by position.
export function syncRecurringWeeks(goal: Goal, totalWeeks: number): WeeklyTaskBlock[] {
  const recurring = goal.recurringWeeklyTasks || [];
  const existing = new Map<number, WeeklyTaskBlock>(
    (goal.weeklyTasks || []).map((w) => [w.weekNumber, w])
  );
  const out: WeeklyTaskBlock[] = [];
  for (let w = 1; w <= totalWeeks; w++) {
    const prev = existing.get(w);
    const prevRecurringCount = Math.min(recurring.length, prev?.tasks.length ?? 0);
    const recurringSlots = recurring.map((text, i) => {
      const prevTask = i < prevRecurringCount ? prev!.tasks[i] : undefined;
      return {
        id: prevTask?.id || uid(),
        text,
        done: prevTask?.done ?? false,
      };
    });
    const extras = prev ? prev.tasks.slice(recurring.length) : [];
    out.push({ weekNumber: w, tasks: [...recurringSlots, ...extras] });
  }
  return out;
}

// -------------------- ISO week helpers + check-in streak --------------------
export function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function currentIsoWeekKey(): string {
  return isoWeekKey(getDubaiDate());
}

/**
 * Consecutive check-in streak up to and including the most recent qualifying week.
 * If the current week is logged, streak counts backward from current week.
 * Otherwise, counts backward from last week (if logged), else 0.
 */
export function checkinStreak(log: string[] | undefined): number {
  if (!log || !log.length) return 0;
  const set = new Set(log);
  const now = getDubaiDate();
  const currentKey = isoWeekKey(now);

  let anchor = new Date(now);
  if (!set.has(currentKey)) {
    anchor.setDate(anchor.getDate() - 7);
    if (!set.has(isoWeekKey(anchor))) return 0;
  }

  let count = 0;
  const cursor = new Date(anchor);
  while (set.has(isoWeekKey(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return count;
}
