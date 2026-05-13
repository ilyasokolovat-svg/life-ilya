import { Goal, Status } from "./types";
import { getDubaiDate } from "@/utils/dateUtils";

// Q2 2026 explicit window
const Q2_2026_START = new Date(2026, 4, 13); // May 13 2026
const Q2_2026_WEEKS = 6;

export interface QuarterInfo {
  key: string;        // "Q2 2026"
  label: string;      // "Q2 2026"
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
  if (q === 2 && y === 2026) {
    const start = Q2_2026_START;
    const end = new Date(2026, 5, 27);
    return { key, label: key, start, end, totalWeeks: Q2_2026_WEEKS };
  }
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
  // Show prev quarter, current, +4 future
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
  // Blend metric progress with weekly task completion (weighted: metrics 70%, tasks 30%)
  const metricPct = metricProgressPct(g);
  const allTasks = g.weeklyTasks.flatMap((w) => w.tasks);
  if (!allTasks.length) return metricPct;
  const taskPct = Math.round((allTasks.filter((t) => t.done).length / allTasks.length) * 100);
  if (!g.metrics.length) return taskPct;
  return Math.round(metricPct * 0.7 + taskPct * 0.3);
}

export function yearlyRollupProgress(yearlyGoal: Goal, allGoals: Goal[]): number {
  const linked = allGoals.filter((g) => g.layer === "quarterly" && g.linkedYearlyGoalId === yearlyGoal.id);
  if (!linked.length) return 0;
  return Math.round(linked.reduce((a, g) => a + quarterlyProgress(g), 0) / linked.length);
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
