import { GoalMetric, GoalRoutine, GoalSettings, Checkin, Direction } from "./types";

export const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const parseISODate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** Monday of the ISO week containing `d` */
export function weekStart(d: Date = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // Mon = 0
  x.setDate(x.getDate() - dow);
  return x;
}

export const currentWeekStart = () => toISODate(weekStart());

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const daysUntil = (iso: string | null) => {
  if (!iso) return null;
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((parseISODate(iso).getTime() - t0) / 86400000);
};

export const lastDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

export function nextMoneyDayAfter(iso: string | null): string {
  const base = iso ? parseISODate(iso) : new Date();
  const next = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return toISODate(lastDayOfMonth(next));
}

export function formatDate(iso: string | null) {
  if (!iso) return "—";
  return parseISODate(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export const formatNumber = (n: number) =>
  Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 2 });

export const metricValueLabel = (m: GoalMetric) =>
  `${formatNumber(m.current_value)} / ${formatNumber(m.target_value)}${m.unit ? ` ${m.unit}` : ""}`;

export function isMetricComplete(m: { current_value: number; target_value: number; direction: Direction }) {
  return m.direction === "down" ? m.current_value <= m.target_value : m.current_value >= m.target_value;
}

/** 0..1 */
export function metricProgress(m: GoalMetric) {
  if (m.direction === "down") {
    const start = m.start_value ?? Math.max(m.current_value, m.target_value + 1);
    const span = start - m.target_value;
    if (span <= 0) return isMetricComplete(m) ? 1 : 0;
    return Math.max(0, Math.min(1, (start - m.current_value) / span));
  }
  if (m.target_value === 0) return isMetricComplete(m) ? 1 : 0;
  return Math.max(0, Math.min(1, m.current_value / m.target_value));
}

/** First not-yet-complete metric by headline_priority; else highest priority (completed). */
export function headlineMetric(metrics: GoalMetric[]): GoalMetric | null {
  if (!metrics.length) return null;
  const sorted = [...metrics].sort(
    (a, b) => a.headline_priority - b.headline_priority || a.sort_order - b.sort_order
  );
  return sorted.find((m) => !isMetricComplete(m)) ?? sorted[0];
}

export function travelModeOn(settings: GoalSettings | null) {
  if (!settings?.travel_mode_active) return false;
  if (!settings.travel_mode_until) return true;
  return toISODate(new Date()) <= settings.travel_mode_until;
}

export function effectiveTarget(routine: GoalRoutine, settings: GoalSettings | null) {
  if (travelModeOn(settings) && routine.travel_mode_target != null) return routine.travel_mode_target;
  return routine.target_per_week;
}

/** Consecutive ISO weeks with a check-in, counting back from this week or last week. */
export function checkinStreak(checkins: Checkin[]): number {
  const set = new Set(checkins.map((c) => c.week_start_date));
  const thisWeek = weekStart();
  let cursor = set.has(toISODate(thisWeek)) ? thisWeek : addDays(thisWeek, -7);
  if (!set.has(toISODate(cursor))) return 0;
  let streak = 0;
  while (set.has(toISODate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -7);
  }
  return streak;
}

export const uniqueKey = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "category";
