import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Goal, Category, colorHsl } from "../types";

export function LongtermGoalCard({
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
  const linkedYearly = allGoals.filter((g) => g.layer === "yearly" && g.linkedLongtermGoalId === goal.id);
  return (
    <div
      className="bg-card border border-border rounded-xl p-4 shadow-sm"
      style={{ borderLeftWidth: 3, borderLeftColor: colorHsl(goal.color) }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{goal.title}</span>
            {category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: colorHsl(goal.color, 0.15), color: colorHsl(goal.color) }}>
                {category.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1 rounded hover:bg-secondary"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <button onClick={onDelete} className="p-1 rounded hover:bg-secondary"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
        </div>
      </div>
      {goal.description && <p className="text-xs text-muted-foreground mb-2 mt-1 leading-relaxed">{goal.description}</p>}
      {linkedYearly.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {linkedYearly.map((y) => (
            <span
              key={y.id}
              className="text-[11px] px-2 py-0.5 rounded-full border"
              style={{ borderColor: colorHsl(y.color, 0.4), color: colorHsl(y.color), backgroundColor: colorHsl(y.color, 0.08) }}
            >
              {y.year} · {y.title}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground italic">No yearly goals linked yet</p>
      )}
    </div>
  );
}
