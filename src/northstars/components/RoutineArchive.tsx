import React, { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NorthStarsApi } from "../useNorthStars";
import { GoalCategory, GoalRoutine, RoutineLog } from "../types";
import {
  addDays,
  categoryEmoji,
  currentWeekStart,
  effectiveTarget,
  formatDate,
  metricProgress,
  parseISODate,
  toISODate,
  weekStart,
} from "../utils";

const WEEKS_BACK = 12;

/** Newest-first list of the last N week-start dates (ISO). */
function recentWeeks(n = WEEKS_BACK) {
  const base = weekStart();
  return Array.from({ length: n }, (_, i) => toISODate(addDays(base, -7 * i)));
}

interface RoutineStat {
  routine: GoalRoutine;
  weeks: { week: string; value: number; target: number; pct: number; note?: string | null; logged: boolean }[];
  hitRate: number; // share of logged weeks where target met
  avgPct: number; // average attainment over logged weeks
  logged: number;
}

function statsFor(routine: GoalRoutine, logs: RoutineLog[], api: NorthStarsApi, weeks: string[]): RoutineStat {
  const rows = weeks.map((week) => {
    const log = logs.find((l) => l.routine_id === routine.id && l.week_start_date === week);
    const target = Math.max(1, log?.target_snapshot ?? effectiveTarget(routine, api.settings));
    const value = log?.value ?? 0;
    return { week, value, target, pct: Math.min(1, value / target), note: log?.note, logged: !!log };
  });
  const loggedRows = rows.filter((r) => r.logged);
  const hits = loggedRows.filter((r) => r.pct >= 1).length;
  return {
    routine,
    weeks: rows,
    logged: loggedRows.length,
    hitRate: loggedRows.length ? hits / loggedRows.length : 0,
    avgPct: loggedRows.length ? loggedRows.reduce((a, r) => a + r.pct, 0) / loggedRows.length : 0,
  };
}

function Bars({ stat, accent }: { stat: RoutineStat; accent: string }) {
  // oldest → newest for a natural left-to-right read
  const rows = [...stat.weeks].reverse();
  return (
    <div className="flex items-end gap-[3px] h-10">
      {rows.map((w) => (
        <div
          key={w.week}
          title={`${formatDate(w.week)} · ${w.logged ? `${w.value}/${w.target}` : "not logged"}${w.note ? ` — ${w.note}` : ""}`}
          className="flex-1 min-w-[6px] h-full flex items-end"
        >
          <div
            className={cn("w-full rounded-sm transition-all", !w.logged && "bg-muted")}
            style={
              w.logged
                ? {
                    height: `${Math.max(8, w.pct * 100)}%`,
                    backgroundColor: accent,
                    opacity: w.pct >= 1 ? 1 : 0.45,
                  }
                : { height: "8%" }
            }
          />
        </div>
      ))}
    </div>
  );
}

function RoutineArchiveRow({ stat, accent, ns }: { stat: RoutineStat; accent: string; ns: NorthStarsApi }) {
  const [open, setOpen] = useState(false);
  const thisWeek = currentWeekStart();

  return (
    <div className="rounded-lg border border-border bg-background">
      <button className="w-full text-left px-3 py-2.5 flex items-center gap-3" onClick={() => setOpen((o) => !o)}>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{stat.routine.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {stat.logged ? `${Math.round(stat.hitRate * 100)}% weeks hit · avg ${Math.round(stat.avgPct * 100)}%` : "No weeks logged yet"}
          </p>
        </div>
        <div className="w-32 shrink-0">
          <Bars stat={stat} accent={accent} />
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-3 pb-3 border-t border-border/60">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-normal py-1.5">Week</th>
                <th className="text-left font-normal py-1.5 w-20">Actual / goal</th>
                <th className="text-left font-normal py-1.5">Note</th>
              </tr>
            </thead>
            <tbody>
              {stat.weeks.map((w) => (
                <tr key={w.week} className="border-t border-border/40 align-top">
                  <td className="py-1.5 text-muted-foreground whitespace-nowrap">
                    {formatDate(w.week)}
                    {w.week === thisWeek && <span className="ml-1 text-[9px] text-primary">now</span>}
                  </td>
                  <td className="py-1.5 tabular-nums">
                    {w.logged ? (
                      <span className={w.pct >= 1 ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {w.value}/{w.target}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="py-1.5 text-muted-foreground">
                    <input
                      defaultValue={w.note || ""}
                      placeholder="Add note…"
                      onBlur={(e) => {
                        if ((w.note || "") !== e.target.value) ns.setRoutineNote(stat.routine.id, e.target.value, w.week);
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

/** Per-category archive: routine week-by-week history + quarter metric attainment. */
export function RoutineArchive({ category, ns }: { category: GoalCategory; ns: NorthStarsApi }) {
  const weeks = useMemo(() => recentWeeks(), []);
  const routines = ns.routines.filter((r) => r.category_id === category.id);
  const stats = useMemo(
    () =>
      routines
        .map((r) => statsFor(r, ns.logs, ns, weeks))
        .sort((a, b) => b.avgPct - a.avgPct),
    [routines, ns.logs, ns.settings, weeks]
  );
  const quarter = ns.quarters.find((q) => q.category_id === category.id && q.is_active);
  const metrics = quarter ? ns.metrics.filter((m) => m.quarter_id === quarter.id) : [];

  if (!routines.length && !metrics.length) {
    return <p className="text-xs text-muted-foreground">Nothing logged yet.</p>;
  }

  return (
    <div className="space-y-3">
      {stats.length > 0 && (
        <>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Weekly routines · last {WEEKS_BACK} weeks, best first
          </p>
          <div className="space-y-1.5">
            {stats.map((s) => (
              <RoutineArchiveRow key={s.routine.id} stat={s} accent={category.accent_color} ns={ns} />
            ))}
          </div>
        </>
      )}

      {metrics.length > 0 && (
        <>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground pt-1">
            {quarter?.label} goals · attainment
          </p>
          <div className="space-y-1.5">
            {metrics.map((m) => {
              const pct = Math.round(metricProgress(m) * 100);
              return (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="text-[11px] text-foreground flex-1 min-w-0 truncate">{m.name}</span>
                  <div className="h-[5px] w-28 bg-muted rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: category.accent_color }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground w-9 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/** Cross-category leaderboard: which areas am I actually delivering on? */
export function ArchiveOverview({ ns }: { ns: NorthStarsApi }) {
  const weeks = useMemo(() => recentWeeks(), []);
  const [open, setOpen] = useState(true);

  const rows = ns.categories.map((c) => {
    const routines = ns.routines.filter((r) => r.category_id === c.id && r.is_active);
    const stats = routines.map((r) => statsFor(r, ns.logs, ns, weeks)).filter((s) => s.logged > 0);
    const weekly = stats.length ? stats.reduce((a, s) => a + s.avgPct, 0) / stats.length : null;
    const quarter = ns.quarters.find((q) => q.category_id === c.id && q.is_active);
    const metrics = quarter ? ns.metrics.filter((m) => m.quarter_id === quarter.id) : [];
    const quarterly = metrics.length ? metrics.reduce((a, m) => a + metricProgress(m), 0) / metrics.length : null;
    const score = [weekly, quarterly].filter((x): x is number => x !== null);
    return {
      category: c,
      weekly,
      quarterly,
      overall: score.length ? score.reduce((a, b) => a + b, 0) / score.length : 0,
    };
  });
  const ranked = [...rows].sort((a, b) => b.overall - a.overall);

  return (
    <section className="border border-border rounded-xl bg-card overflow-hidden">
      <button className="w-full px-4 py-3 flex items-center gap-2 text-left" onClick={() => setOpen((o) => !o)}>
        <p className="text-sm font-semibold text-foreground">Archive & progress</p>
        <span className="text-[11px] text-muted-foreground">last {WEEKS_BACK} weeks</span>
        <ChevronDown className={cn("ml-auto w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
          <div className="space-y-2">
            {ranked.map((r, i) => (
              <div key={r.category.id} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                <span className="text-base leading-none">{categoryEmoji(r.category)}</span>
                <span className="text-xs text-foreground w-24 truncate">{r.category.name}</span>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase text-muted-foreground w-12">weekly</span>
                    <div className="h-[5px] flex-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((r.weekly ?? 0) * 100)}%`,
                          backgroundColor: r.category.accent_color,
                        }}
                      />
                    </div>
                    <span className="text-[10px] tabular-nums text-muted-foreground w-9 text-right">
                      {r.weekly === null ? "—" : `${Math.round(r.weekly * 100)}%`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase text-muted-foreground w-12">quarter</span>
                    <div className="h-[5px] flex-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full opacity-60"
                        style={{
                          width: `${Math.round((r.quarterly ?? 0) * 100)}%`,
                          backgroundColor: r.category.accent_color,
                        }}
                      />
                    </div>
                    <span className="text-[10px] tabular-nums text-muted-foreground w-9 text-right">
                      {r.quarterly === null ? "—" : `${Math.round(r.quarterly * 100)}%`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {ns.categories.map((c) => (
              <div key={c.id}>
                <p className="text-xs font-semibold text-foreground mb-1.5">
                  {categoryEmoji(c)} {c.name}
                </p>
                <RoutineArchive category={c} ns={ns} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
