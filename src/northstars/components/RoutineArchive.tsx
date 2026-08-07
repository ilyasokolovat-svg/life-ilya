import React, { useMemo, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { NorthStarsApi } from "../useNorthStars";
import { GoalCategory, GoalRoutine, RoutineLog } from "../types";
import {
  addDays,
  categoryEmoji,
  currentWeekStart,
  effectiveTarget,
  metricProgress,
  toISODate,
  weekStart,
} from "../utils";

const WEEKS_BACK = 12;

/** Oldest → newest list of the last N week-start dates (ISO), current week last. */
function recentWeeks(n = WEEKS_BACK) {
  const base = weekStart();
  return Array.from({ length: n }, (_, i) => toISODate(addDays(base, -7 * (n - 1 - i))));
}

const shortWeek = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

interface WeekCell {
  week: string;
  value: number;
  target: number;
  pct: number;
  note?: string | null;
  logged: boolean;
  current: boolean;
}

interface RoutineStat {
  routine: GoalRoutine;
  weeks: WeekCell[];
  /** share of *completed* logged weeks where the target was met */
  hitRate: number | null;
  loggedPast: number;
}

function statsFor(routine: GoalRoutine, logs: RoutineLog[], api: NorthStarsApi, weeks: string[]): RoutineStat {
  const thisWeek = currentWeekStart();
  const cells: WeekCell[] = weeks.map((week) => {
    const log = logs.find((l) => l.routine_id === routine.id && l.week_start_date === week);
    const target = Math.max(1, log?.target_snapshot ?? effectiveTarget(routine, api.settings));
    const value = log?.value ?? 0;
    return {
      week,
      value,
      target,
      pct: Math.min(1, value / target),
      note: log?.note,
      logged: !!log,
      current: week === thisWeek,
    };
  });
  const past = cells.filter((c) => !c.current && c.logged);
  return {
    routine,
    weeks: cells,
    loggedPast: past.length,
    hitRate: past.length ? past.filter((c) => c.pct >= 1).length / past.length : null,
  };
}

function Heat({ stat, accent, onOpen }: { stat: RoutineStat; accent: string; onOpen: () => void }) {
  return (
    <div className="flex items-center gap-[2px]">
      {stat.weeks.map((w) => (
        <button
          key={w.week}
          type="button"
          onClick={onOpen}
          title={`${shortWeek(w.week)} · ${w.logged ? `${w.value}/${w.target}` : "not logged"}${
            w.note ? ` — ${w.note}` : ""
          }`}
          className={cn(
            "h-4 w-4 rounded-[3px] shrink-0",
            !w.logged && "bg-muted",
            w.current && "ring-1 ring-foreground/25"
          )}
          style={
            w.logged
              ? { backgroundColor: accent, opacity: 0.18 + Math.min(1, w.pct) * 0.82 }
              : undefined
          }
        />
      ))}
    </div>
  );
}

function RoutineRow({ stat, accent, ns }: { stat: RoutineStat; accent: string; ns: NorthStarsApi }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-3 py-1">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 min-w-0 text-left text-[11px] text-foreground truncate hover:text-primary"
        >
          {stat.routine.name}
        </button>
        <Heat stat={stat} accent={accent} onOpen={() => setOpen((o) => !o)} />
        <span className="text-[10px] tabular-nums text-muted-foreground w-14 text-right shrink-0">
          {stat.hitRate === null ? "no data" : `${Math.round(stat.hitRate * 100)}% hit`}
        </span>
      </div>

      {open && (
        <div className="mb-2 rounded-md border border-border/60 bg-background/60">
          <table className="w-full text-[11px]">
            <tbody>
              {[...stat.weeks].reverse().map((w) => (
                <tr key={w.week} className="border-b border-border/40 last:border-0 align-middle">
                  <td className="py-1 pl-2 pr-2 text-muted-foreground whitespace-nowrap w-20">
                    {shortWeek(w.week)}
                    {w.current && <span className="ml-1 text-[9px] text-primary">now</span>}
                  </td>
                  <td className="py-1 pr-2 tabular-nums w-16">
                    <input
                      type="number"
                      min={0}
                      defaultValue={w.logged ? w.value : ""}
                      placeholder="—"
                      onBlur={(e) => {
                        const n = Number(e.target.value);
                        if (e.target.value !== "" && !Number.isNaN(n) && n !== w.value)
                          ns.setRoutineValue(stat.routine.id, n, w.week);
                      }}
                      className="w-9 bg-transparent border-b border-border/60 focus:border-primary outline-none text-[11px] tabular-nums text-center"
                    />
                    <span className="text-muted-foreground">/{w.target}</span>
                  </td>
                  <td className="py-1 pr-2 text-muted-foreground">
                    <input
                      defaultValue={w.note || ""}
                      placeholder="Note…"
                      onBlur={(e) => {
                        if ((w.note || "") !== e.target.value)
                          ns.setRoutineNote(stat.routine.id, e.target.value, w.week);
                      }}
                      className="w-full bg-transparent border-b border-transparent hover:border-border focus:border-primary/50 outline-none text-[11px] py-0.5"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Per-category archive: routine week-by-week heatmap + quarter metric attainment. */
export function RoutineArchive({ category, ns }: { category: GoalCategory; ns: NorthStarsApi }) {
  const weeks = useMemo(() => recentWeeks(), []);
  const routines = ns.routines.filter((r) => r.category_id === category.id);
  const stats = useMemo(
    () => routines.map((r) => statsFor(r, ns.logs, ns, weeks)).sort((a, b) => (b.hitRate ?? -1) - (a.hitRate ?? -1)),
    [routines, ns.logs, ns.settings, weeks]
  );

  if (!routines.length) return <p className="text-[11px] text-muted-foreground">No routines.</p>;

  return (
    <div>
      {stats.map((s) => (
        <RoutineRow key={s.routine.id} stat={s} accent={category.accent_color} ns={ns} />
      ))}
    </div>
  );
}

/** Cross-category comparison + weekly routine archive. */
export function ArchiveOverview({ ns }: { ns: NorthStarsApi }) {
  const weeks = useMemo(() => recentWeeks(), []);
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);

  const rows = ns.categories.map((c) => {
    const routines = ns.routines.filter((r) => r.category_id === c.id && r.is_active);
    const stats = routines.map((r) => statsFor(r, ns.logs, ns, weeks));
    const rated = stats.filter((s) => s.hitRate !== null);
    const weekly = rated.length ? rated.reduce((a, s) => a + (s.hitRate as number), 0) / rated.length : null;
    const loggedWeeks = new Set(
      stats.flatMap((s) => s.weeks.filter((w) => w.logged && !w.current).map((w) => w.week))
    ).size;
    const quarter = ns.quarters.find((q) => q.category_id === c.id && q.is_active);
    const metrics = quarter ? ns.metrics.filter((m) => m.quarter_id === quarter.id) : [];
    const quarterly = metrics.length ? metrics.reduce((a, m) => a + metricProgress(m), 0) / metrics.length : null;
    return { category: c, weekly, quarterly, loggedWeeks, stats };
  });
  const ranked = [...rows].sort((a, b) => (b.quarterly ?? -1) - (a.quarterly ?? -1));

  return (
    <section className="border border-border rounded-xl bg-card overflow-hidden">
      <button className="w-full px-4 py-3 flex items-center gap-2 text-left" onClick={() => setOpen((o) => !o)}>
        <p className="text-sm font-semibold text-foreground">Progress & archive</p>
        <span className="text-[11px] text-muted-foreground">last {WEEKS_BACK} weeks</span>
        <ChevronDown className={cn("ml-auto w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-5">
          {/* comparison */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 pb-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Where I'm progressing best</p>
              <button
                type="button"
                onClick={() => setHelp((h) => !h)}
                className="text-muted-foreground/70 hover:text-foreground"
                aria-label="How this is measured"
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
            {help && (
              <p className="text-[10px] text-muted-foreground leading-snug pb-1">
                <b>Quarter</b> = average completion of that category's quarter goals. <b>Weekly</b> = share of
                <i> logged, finished </i> weeks where the routine target was met (the current week and unlogged weeks
                are excluded, so it reads “no data” until you log something).
              </p>
            )}

            {ranked.map((r) => (
              <div key={r.category.id} className="flex items-center gap-2 py-1">
                <span className="text-sm leading-none w-5">{categoryEmoji(r.category)}</span>
                <span className="text-xs text-foreground w-24 truncate shrink-0">{r.category.name}</span>
                <div className="flex-1 min-w-0 h-[6px] bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((r.quarterly ?? 0) * 100)}%`,
                      backgroundColor: r.category.accent_color,
                    }}
                  />
                </div>
                <span className="text-[11px] tabular-nums font-medium text-foreground w-9 text-right shrink-0">
                  {r.quarterly === null ? "—" : `${Math.round(r.quarterly * 100)}%`}
                </span>
                <span
                  className="text-[10px] tabular-nums text-muted-foreground w-20 text-right shrink-0"
                  title={`Weekly routines hit in ${r.loggedWeeks} logged week(s)`}
                >
                  {r.weekly === null ? "no data" : `${Math.round(r.weekly * 100)}% wkly`}
                </span>
              </div>
            ))}
          </div>

          {/* archive */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Weekly routine archive</p>
              <span className="ml-auto flex items-center gap-1 text-[9px] text-muted-foreground">
                older
                <span className="flex gap-[2px]">
                  {[0.2, 0.45, 0.7, 1].map((o) => (
                    <span
                      key={o}
                      className="h-2.5 w-2.5 rounded-[2px] bg-foreground"
                      style={{ opacity: o * 0.6 }}
                    />
                  ))}
                </span>
                newer · darker = closer to target
              </span>
            </div>

            {rows.map((r) => (
              <div key={r.category.id}>
                <p className="text-[11px] font-semibold text-foreground mb-0.5">
                  {categoryEmoji(r.category)} {r.category.name}
                </p>
                <RoutineArchive category={r.category} ns={ns} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
