import { getDubaiDate } from "@/utils/dateUtils";
import type { Tri, WeeklyReflection } from "./types";

/** ISO week key like "2026-W28" (Mon–Sun weeks). */
export function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Monday of the ISO week containing d (local, Dubai time). */
export function isoWeekMonday(d: Date): Date {
  const day = d.getDay() || 7; // 1..7 (Mon..Sun)
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - (day - 1));
  return monday;
}

export function isoWeekLabel(d: Date): string {
  const mon = isoWeekMonday(d);
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  const fmt = (x: Date) => x.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

export function currentIsoWeekKey(): string {
  return isoWeekKey(getDubaiDate());
}

export function currentIsoWeekLabel(): string {
  return isoWeekLabel(getDubaiDate());
}

/** True on Sunday (last day of ISO week) or later within the current ISO week. */
export function isReflectionWindowOpen(): boolean {
  const d = getDubaiDate();
  return d.getDay() === 0; // Sunday
}

/** Consecutive ISO weeks (up to and including current or previous) with an entry. */
export function reflectionStreak(entries: WeeklyReflection[]): number {
  if (!entries.length) return 0;
  const set = new Set(entries.map((e) => e.weekKey));
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

export type Trend = "up" | "steady" | "down";

/** Trend from the average of the last N Tri values against a small threshold. */
export function triTrend(values: Tri[], window = 4): Trend {
  const arr = values.slice(-window);
  if (!arr.length) return "steady";
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  if (avg > 0.25) return "up";
  if (avg < -0.25) return "down";
  return "steady";
}

export function trendLabel(t: Trend): string {
  return t === "up" ? "trending up" : t === "down" ? "dipping" : "steady";
}
