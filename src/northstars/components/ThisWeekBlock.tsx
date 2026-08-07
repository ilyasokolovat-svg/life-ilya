import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Flame, Plus } from "lucide-react";
import { useNorthStars } from "../useNorthStars";
import { CheckinModal } from "./CheckinModal";
import { RoutineControl } from "./RoutineControl";
import { RoutineEditorDialog } from "./RoutineEditorDialog";
import { GoalRoutine } from "../types";
import { SegmentBar } from "./SegmentBar";
import { Button } from "@/components/ui/button";
import {
  categoryEmoji,
  checkinStreak,
  currentWeekStart,
  daysUntil,
  quarterProgress,
  routineProgress,
} from "../utils";

export function ThisWeekBlock() {
  const ns = useNorthStars();
  const [checkin, setCheckin] = useState(false);
  const [editor, setEditor] = useState<{ categoryId: string; routine?: GoalRoutine } | null>(null);
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
          const metrics = q ? ns.metrics.filter((m) => m.quarter_id === q.id) : [];
          const qp = quarterProgress(metrics);
          const routines = ns.routines.filter((r) => r.category_id === c.id && r.is_active);
          const rp = routineProgress(routines, ns.logs, ns.settings);
          const moneyIn = daysUntil(ns.settings?.next_money_day ?? null);

          return (
            <div key={c.id} className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{categoryEmoji(c)}</span>
                <span className="text-xs font-semibold text-foreground">{c.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {qp.total ? `${qp.done}/${qp.total} goals hit` : "No metrics"}
                </span>
                <span
                  className="ml-auto text-xs font-semibold tabular-nums"
                  style={{ color: c.accent_color }}
                >
                  {Math.round(qp.pct * 100)}%
                </span>
              </div>

              <SegmentBar parts={qp.parts} color={c.accent_color} height={5} />

              {c.cadence === "weekly" ? (
                routines.length > 0 && (
                  <div className="space-y-1.5 pt-0.5">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Weekly · {rp.done}/{rp.total} done
                    </p>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {routines.slice(0, 6).map((r) => (
                        <RoutineControl
                          key={r.id}
                          routine={r}
                          logs={ns.logs}
                          settings={ns.settings}
                          accent={c.accent_color}
                          linked={!!r.linked_metric_id}
                          onSet={(v) => ns.setRoutineValue(r.id, v)}
                          compact
                        />
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  💰 Money day {moneyIn !== null ? `in ${moneyIn} days` : "—"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <CheckinModal open={checkin} onOpenChange={setCheckin} ns={ns} />
    </div>
  );
}
