import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Flame } from "lucide-react";
import { useNorthStars } from "../useNorthStars";
import { CheckinModal } from "./CheckinModal";
import { RoutineControl } from "./RoutineControl";
import { Button } from "@/components/ui/button";
import {
  checkinStreak,
  currentWeekStart,
  daysUntil,
  headlineMetric,
  metricProgress,
  metricValueLabel,
} from "../utils";

export function ThisWeekBlock() {
  const ns = useNorthStars();
  const [checkin, setCheckin] = useState(false);
  const streak = useMemo(() => checkinStreak(ns.checkins), [ns.checkins]);
  const week = currentWeekStart();
  const checkedIn = ns.checkins.some((c) => c.week_start_date === week);

  if (!ns.categories.length) return null;

  return (
    <div className="border border-border rounded-xl bg-card">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">This week</p>
        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600">
          <Flame className="w-3 h-3" /> {streak}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {!checkedIn && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setCheckin(true)}>
              Check in
            </Button>
          )}
          <Link to="/goals" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center">
            North Stars <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="divide-y divide-border">
        {ns.categories.map((c) => {
          const q = ns.quarters.find((x) => x.category_id === c.id && x.is_active);
          const hm = q ? headlineMetric(ns.metrics.filter((m) => m.quarter_id === q.id)) : null;
          const pct = hm ? Math.round(metricProgress(hm) * 100) : 0;
          const routines = ns.routines.filter((r) => r.category_id === c.id && r.is_active).slice(0, 4);
          const moneyIn = daysUntil(ns.settings?.next_money_day ?? null);

          return (
            <div key={c.id} className="px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 sm:w-[46%] min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.accent_color }} />
                <span className="text-xs font-medium text-foreground shrink-0">{c.name}</span>
                {hm ? (
                  <span className="text-xs text-muted-foreground truncate">
                    {hm.name} · {metricValueLabel(hm)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">No metric</span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="h-[5px] w-20 bg-muted rounded-full overflow-hidden shrink-0">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.accent_color }} />
                </div>
                {c.cadence === "weekly" ? (
                  <div className="flex flex-wrap gap-1.5">
                    {routines.map((r) => (
                      <RoutineControl
                        key={r.id}
                        routine={r}
                        logs={ns.logs}
                        settings={ns.settings}
                        onSet={(v) => ns.setRoutineValue(r.id, v)}
                        compact
                      />
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-muted-foreground">
                    Money day {moneyIn !== null ? `in ${moneyIn} days` : "—"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CheckinModal open={checkin} onOpenChange={setCheckin} ns={ns} />
    </div>
  );
}
