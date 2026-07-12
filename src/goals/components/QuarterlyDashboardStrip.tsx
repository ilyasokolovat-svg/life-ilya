import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Flame, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useGoalsStore } from "../storage";
import {
  autoStatus,
  checkinStreak,
  currentIsoWeekKey,
  currentQuarterKey,
  currentWeekOfQuarter,
  quarterInfo,
  quarterlyProgress,
} from "../utils";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { colorHsl } from "../types";
import { WeeklyCheckinDialog } from "./WeeklyCheckinDialog";

export function QuarterlyDashboardStrip() {
  const { goals, categories, checkinLog, updateGoal } = useGoalsStore();
  const qKey = currentQuarterKey();
  const info = quarterInfo(qKey);
  const week = currentWeekOfQuarter(qKey);
  const active = goals.filter((g) => g.layer === "quarterly" && g.quarter === qKey);
  const [checkinOpen, setCheckinOpen] = useState(false);

  const streak = checkinStreak(checkinLog);
  const loggedThisWeek = (checkinLog || []).includes(currentIsoWeekKey());

  const overall = active.length
    ? Math.round(active.reduce((a, g) => a + quarterlyProgress(g), 0) / active.length)
    : 0;

  if (active.length === 0) {
    return (
      <>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {qKey} · Week {week} of {info.totalWeeks}
            </h3>
            {streak > 0 && (
              <span className="text-xs font-medium inline-flex items-center gap-1" style={{ color: "hsl(var(--goal-amber))" }}>
                <Flame className="w-3.5 h-3.5" /> {streak}-week check-in streak
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">No quarterly goals yet.</p>
          <Link to="/goals" className="text-xs text-primary hover:underline">Add your first goal →</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {qKey} · Week {week} of {info.totalWeeks}
              </h3>
              {streak > 0 && (
                <span
                  className="text-xs font-medium inline-flex items-center gap-1"
                  style={{ color: "hsl(var(--goal-amber))" }}
                  title="Consecutive weeks with a saved weekly check-in"
                >
                  <Flame className="w-3.5 h-3.5" /> {streak}-week check-in streak
                </span>
              )}
            </div>
            <Link to="/goals" className="text-[11px] text-primary hover:underline">Manage goals →</Link>
          </div>
          <Button size="sm" className="h-8 text-xs" onClick={() => setCheckinOpen(true)}>
            <CheckSquare className="w-3.5 h-3.5 mr-1" />
            {loggedThisWeek ? "Update check-in" : "Weekly check-in"}
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
              </div>
            );
          })}
        </div>
      </div>

      <WeeklyCheckinDialog open={checkinOpen} onOpenChange={setCheckinOpen} />
    </>
  );
}
