import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  useGoalsSystem,
  getCurrentQuarter,
  calculateProgress,
  computeStatus,
  getDaysRemaining,
  getCategoryColor,
  getStatusColor,
  GoalStatus,
} from "@/hooks/useGoalsSystem";
import { cn } from "@/lib/utils";

const statusLabels: Record<GoalStatus, string> = {
  on_track: "On track",
  behind: "Behind",
  off_track: "Off track",
  completed: "Done",
};

export function GoalsProgressSection() {
  const { getQuarterGoals, isLoading } = useGoalsSystem();
  const currentQ = getCurrentQuarter();
  const periodKey = currentQ.key;

  const goals = useMemo(() => {
    const all = getQuarterGoals(periodKey);
    // Sort: off track first
    const order: Record<string, number> = { off_track: 0, behind: 1, on_track: 2, completed: 3 };
    return [...all]
      .sort((a, b) => (order[computeStatus(a, periodKey)] ?? 2) - (order[computeStatus(b, periodKey)] ?? 2))
      .slice(0, 6);
  }, [getQuarterGoals, periodKey]);

  const allGoals = getQuarterGoals(periodKey);
  const overallPct = useMemo(() => {
    const valid = allGoals.map((g) => calculateProgress(g.actual_result)).filter((p) => p !== -1);
    if (!valid.length) return null;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  }, [allGoals]);

  const daysLeft = getDaysRemaining(periodKey);

  if (isLoading) {
    return <div className="bg-card rounded-xl border border-border p-4 animate-pulse h-32" />;
  }

  if (goals.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          {currentQ.label} Goals
        </h3>
        <p className="text-sm text-muted-foreground">No quarterly goals set yet.</p>
        <Link to="/goals-overview" className="text-xs text-primary hover:underline mt-1 inline-block">
          Set your goals →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-muted-foreground">{currentQ.label} · {allGoals.length} goals</span>
        <div className="flex-1 h-[5px] bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${overallPct || 0}%` }} />
        </div>
        <span className="text-xs font-medium text-primary">{overallPct !== null ? `${overallPct}%` : "—"}</span>
      </div>

      {/* Goal cards */}
      <div className="space-y-2">
        {goals.map((goal) => {
          const status = computeStatus(goal, periodKey);
          const pct = calculateProgress(goal.actual_result);
          const catColor = getCategoryColor(goal.subcategory);
          const statColor = getStatusColor(status);
          const isOff = status === "off_track";
          const progress = goal.actual_result;

          // Next action text
          let actionText = progress?.quarterly_action || "";
          if (progress?.progress_type === "milestone") {
            const next = progress.milestones?.find((m) => !m.done);
            if (next) actionText = next.text;
          }

          return (
            <div
              key={goal.id}
              className={cn(
                "rounded-lg border border-border px-3 py-2.5",
                isOff && "bg-destructive/5 border-l-[3px]"
              )}
              style={isOff ? { borderLeftColor: "hsl(var(--destructive))" } : { borderLeftColor: catColor, borderLeftWidth: 3 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-medium text-foreground truncate">{goal.planned_goal}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ml-2"
                  style={{ backgroundColor: `${statColor}20`, color: statColor }}
                >
                  {statusLabels[status]}
                </span>
              </div>

              {pct !== -1 && (
                <div className="h-[5px] bg-muted rounded-full overflow-hidden mb-1.5">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: catColor }} />
                </div>
              )}

              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{pct === -1 ? `${progress?.self_rating || 0}/10` : `${pct}%`}</span>
                <span>{daysLeft} days left in {currentQ.label}</span>
              </div>

              {actionText && (
                <p className="text-[11px] text-muted-foreground mt-1 truncate">→ {actionText}</p>
              )}
              {!actionText && (
                <p className="text-[11px] text-muted-foreground/60 mt-1">No action set — tap to add one.</p>
              )}
            </div>
          );
        })}
      </div>

      {allGoals.length > 6 && (
        <Link to="/goals-overview" className="text-xs text-primary hover:underline mt-2 inline-block">
          View all {allGoals.length} goals →
        </Link>
      )}
    </div>
  );
}
