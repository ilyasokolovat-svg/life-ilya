import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ChevronDown, ChevronUp, Flame, Plus } from "lucide-react";
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
        {ns.categories.map((c, idx) => {
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
                <span className="flex flex-col shrink-0">
                  <button
                    type="button"
                    aria-label={`Move ${c.name} up`}
                    disabled={idx === 0}
                    onClick={() => ns.moveCategory(c.id, -1)}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-25 leading-none"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${c.name} down`}
                    disabled={idx === ns.categories.length - 1}
                    onClick={() => ns.moveCategory(c.id, 1)}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-25 leading-none"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </span>
              </div>


              <SegmentBar parts={qp.parts} color={c.accent_color} height={5} />

              {c.cadence === "weekly" ? (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Weekly · {rp.done}/{rp.total} done
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditor({ categoryId: c.id })}
                      className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="w-3 h-3" /> routine
                    </button>
                  </div>
                  {routines.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">No routines yet.</p>
                  ) : (
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
                          onNote={(note) => ns.setRoutineNote(r.id, note)}
                          onEdit={() => setEditor({ categoryId: c.id, routine: r })}
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
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

      {editor && (
        <RoutineEditorDialog
          key={editor.routine?.id ?? "new"}
          open
          onOpenChange={(o) => !o && setEditor(null)}
          routine={editor.routine}
          metrics={ns.metrics.filter((m) => {
            const q = ns.quarters.find((x) => x.id === m.quarter_id);
            return q?.category_id === editor.categoryId && q.is_active;
          })}
          onSave={(draft) =>
            editor.routine
              ? ns.updateRoutine(editor.routine.id, draft)
              : ns.addRoutine(editor.categoryId, draft)
          }
          onDelete={editor.routine ? () => ns.deleteRoutine(editor.routine!.id) : undefined}
        />
      )}
    </div>
  );
}

