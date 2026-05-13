import React, { useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Goal, Category, ColorKey, colorHsl } from "../types";
import { autoStatus, currentWeekOfQuarter, quarterlyProgress, quarterInfo, uid } from "../utils";
import { useGoalsStore } from "../storage";
import { ProgressBar } from "./ProgressBar";
import { StatusBadge } from "./StatusBadge";
import { MetricEditor } from "./MetricEditor";
import { WeeklyTasksPanel } from "./WeeklyTasksPanel";

interface Props {
  goal: Goal;
  category?: Category;
  onUpdate: (g: Goal) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function GoalCard({ goal, category, onUpdate, onEdit, onDelete }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [menu, setMenu] = useState(false);
  const { goals } = useGoalsStore();
  const week = currentWeekOfQuarter(goal.quarter || "");
  const pct = quarterlyProgress(goal);
  const status = autoStatus(goal);
  const linkedYearly = goal.linkedYearlyGoalId
    ? goals.find((g) => g.id === goal.linkedYearlyGoalId)
    : undefined;

  const generateWeekBlocks = () => {
    const tw = quarterInfo(goal.quarter || "").totalWeeks;
    const blocks = Array.from({ length: tw }, (_, i) => ({ weekNumber: i + 1, tasks: [] }));
    onUpdate({ ...goal, weeklyTasks: blocks });
  };

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 shadow-sm"
      style={{ borderLeftWidth: 3, borderLeftColor: colorHsl(goal.color) }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{goal.title}</span>
            {category && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: colorHsl(goal.color, 0.15), color: colorHsl(goal.color) }}
              >
                {category.name}
              </span>
            )}
            <StatusBadge status={status} />
          </div>
          {linkedYearly ? (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
              <Link2 className="w-3 h-3" />
              <span>Yearly: <span className="text-foreground font-medium">{linkedYearly.title}</span></span>
            </div>
          ) : (
            <button
              onClick={onEdit}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground mt-0.5"
            >
              <Link2 className="w-3 h-3" /> Link to yearly goal…
            </button>
          )}
          {goal.description && (
            <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setMenu((m) => !m)} className="p-1 rounded hover:bg-secondary">
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
          {menu && (
            <div className="absolute right-0 top-7 bg-card border border-border rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
              <button onClick={() => { setMenu(false); onEdit(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary flex items-center gap-2">
                <Pencil className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => { setMenu(false); onDelete(); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary text-destructive flex items-center gap-2">
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <ProgressBar pct={pct} color={goal.color} />
        <span className="text-xs font-semibold text-foreground w-10 text-right">{pct}%</span>
      </div>

      {goal.metrics.length > 0 && (
        <div className="space-y-1">
          {goal.metrics.map((m) => (
            <MetricEditor
              key={m.id}
              metric={m}
              color={goal.color}
              onChange={(nm) => onUpdate({ ...goal, metrics: goal.metrics.map((x) => (x.id === nm.id ? nm : x)) })}
            />
          ))}
        </div>
      )}

      {goal.weeklyTasks.length === 0 ? (
        <div className="border-t border-border pt-3 mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">No weekly tasks yet</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={generateWeekBlocks}>
            <Plus className="w-3 h-3 mr-1" /> Generate week blocks
          </Button>
        </div>
      ) : (
        <WeeklyTasksPanel
          goal={goal}
          currentWeek={week}
          expanded={expanded}
          onToggle={() => setExpanded((e) => !e)}
          onChange={(wt) => onUpdate({ ...goal, weeklyTasks: wt })}
        />
      )}
    </div>
  );
}
