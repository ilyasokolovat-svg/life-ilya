import React from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Goal, Category, colorHsl } from "../types";
import { ProgressBar } from "./ProgressBar";
import { quarterlyProgress, yearlyRollupProgress, autoStatus } from "../utils";
import { StatusBadge } from "./StatusBadge";

export function YearlyGoalCard({
  goal,
  category,
  allGoals,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  category?: Category;
  allGoals: Goal[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const linked = allGoals.filter((g) => g.layer === "quarterly" && g.linkedYearlyGoalId === goal.id);
  const pct = yearlyRollupProgress(goal, allGoals);
  const status = autoStatus({ ...goal, metrics: goal.metrics, weeklyTasks: [{ weekNumber: 1, tasks: [{ id: "x", text: "", done: pct >= 100 }] }] });

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 shadow-sm"
      style={{ borderLeftWidth: 3, borderLeftColor: colorHsl(goal.color) }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{goal.title}</span>
            {category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: colorHsl(goal.color, 0.15), color: colorHsl(goal.color) }}>
                {category.name}
              </span>
            )}
            <StatusBadge status={status} />
          </div>
          {goal.description && <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>}
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1 rounded hover:bg-secondary"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-secondary"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <ProgressBar pct={pct} color={goal.color} />
        <span className="text-xs font-semibold text-foreground w-10 text-right">{pct}%</span>
      </div>
      {linked.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {linked.map((q) => {
            const qp = quarterlyProgress(q);
            return (
              <span
                key={q.id}
                className="text-[11px] px-2 py-0.5 rounded-full border"
                style={{ borderColor: colorHsl(q.color, 0.4), color: colorHsl(q.color), backgroundColor: colorHsl(q.color, 0.08) }}
              >
                {q.quarter} · {q.title} · {qp}%
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground italic">No quarterly goals linked yet</p>
      )}
    </div>
  );
}
