import React from "react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useGoalsStore } from "../storage";
import { autoStatus, currentQuarterKey, currentWeekOfQuarter, quarterInfo, quarterlyProgress } from "../utils";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { colorHsl } from "../types";

export function QuarterlyDashboardStrip() {
  const { goals, categories, updateGoal, completeCurrentWeek } = useGoalsStore();
  const qKey = currentQuarterKey();
  const info = quarterInfo(qKey);
  const week = currentWeekOfQuarter(qKey);
  const active = goals.filter((g) => g.layer === "quarterly" && g.quarter === qKey);

  const overall = active.length
    ? Math.round(active.reduce((a, g) => a + quarterlyProgress(g), 0) / active.length)
    : 0;

  if (active.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {qKey} · Week {week} of {info.totalWeeks}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">No quarterly goals yet.</p>
        <Link to="/goals" className="text-xs text-primary hover:underline">Add your first goal →</Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {qKey} · Week {week} of {info.totalWeeks}
          </h3>
          <Link to="/goals" className="text-[11px] text-primary hover:underline">Manage goals →</Link>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => active.forEach((g) => completeCurrentWeek(qKey, week))}
        >
          Review week ✓
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground w-16">Overall</span>
        <ProgressBar pct={overall} color="purple" />
        <span className="text-xs font-semibold text-foreground w-10 text-right">{overall}%</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {active.map((g) => {
          const pct = quarterlyProgress(g);
          const status = autoStatus(g, qKey);
          const cat = categories.find((c) => c.id === g.categoryId);
          const wb = g.weeklyTasks.find((w) => w.weekNumber === week);
          return (
            <div
              key={g.id}
              className="min-w-[260px] max-w-[260px] bg-background border border-border rounded-lg p-3 shadow-sm"
              style={{ borderTop: `3px solid ${colorHsl(g.color)}` }}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-foreground truncate">{g.title}</span>
                <StatusBadge status={status} />
              </div>
              {cat && (
                <span className="text-[10px] text-muted-foreground">{cat.name}</span>
              )}
              <div className="flex items-center gap-2 my-2">
                <ProgressBar pct={pct} color={g.color} />
                <span className="text-[11px] font-semibold w-9 text-right">{pct}%</span>
              </div>
              <div className="text-[11px] font-medium text-muted-foreground mb-1">This week</div>
              {wb?.tasks.length ? (
                <div className="space-y-1">
                  {wb.tasks.slice(0, 4).map((t) => (
                    <label key={t.id} className="flex items-start gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={t.done}
                        onCheckedChange={(v) => updateGoal(g.id, {
                          weeklyTasks: g.weeklyTasks.map((wbb) => wbb.weekNumber === week ? { ...wbb, tasks: wbb.tasks.map((x) => x.id === t.id ? { ...x, done: !!v } : x) } : wbb),
                        })}
                        className="mt-0.5"
                      />
                      <span className={`text-[11px] ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.text}</span>
                    </label>
                  ))}
                  {wb.tasks.length > 4 && (
                    <div className="text-[10px] text-muted-foreground">+{wb.tasks.length - 4} more</div>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">No tasks set for this week</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
