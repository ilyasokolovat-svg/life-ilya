import React, { useState } from "react";
import { MoreHorizontal, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  GoalRecord,
  GoalSubcategory,
  GoalStatus,
  calculateProgress,
  computeStatus,
  getCategoryColor,
  getStatusColor,
} from "@/hooks/useGoalsSystem";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  goal: GoalRecord;
  periodKey: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMarkComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const categoryLabels: Record<string, string> = {
  physical: "Physical",
  financial: "Financial",
  skills: "Skills",
  personal: "Personal",
};

const statusLabels: Record<GoalStatus, string> = {
  on_track: "On track",
  behind: "Behind",
  off_track: "Off track",
  completed: "Completed",
};

export function GoalCard({ goal, periodKey, isExpanded, onToggleExpand, onMarkComplete, onDelete }: GoalCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const status = computeStatus(goal, periodKey);
  const pct = calculateProgress(goal.actual_result);
  const catColor = getCategoryColor(goal.subcategory);
  const statusColor = getStatusColor(status);
  const isOffTrack = status === "off_track";
  const isCompleted = status === "completed";

  const progressDisplay = pct === -1
    ? `${goal.actual_result?.self_rating || 0}/10`
    : `${pct}%`;

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl transition-all cursor-pointer group",
        isOffTrack && "border-l-[3px]",
        isCompleted && "opacity-70"
      )}
      style={isOffTrack ? { borderLeftColor: "hsl(var(--destructive))" } : undefined}
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        onClick={onToggleExpand}
      >
        {/* Category dot */}
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: catColor }} />

        {/* Name + tag */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={cn("text-sm font-medium text-foreground truncate", isCompleted && "line-through")}>{goal.planned_goal}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0">
            {categoryLabels[goal.subcategory]}
          </span>
        </div>

        {/* Progress bar */}
        {pct !== -1 && (
          <div className="w-24 shrink-0">
            <div className="h-[5px] w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: catColor }} />
            </div>
            {goal.actual_result?.quarterly_action && (
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{goal.actual_result.quarterly_action}</p>
            )}
          </div>
        )}

        {/* Progress value */}
        <span className="text-xs font-medium text-foreground w-10 text-right shrink-0">{progressDisplay}</span>

        {/* Status badge */}
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium"
          style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
        >
          {statusLabels[status]}
        </span>

        {/* Three dot menu */}
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
              <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary" onClick={() => { onToggleExpand(); setMenuOpen(false); }}>Edit</button>
              <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary" onClick={() => { onMarkComplete(goal.id); setMenuOpen(false); }}>
                <Check className="w-3 h-3 inline mr-1" /> Mark complete
              </button>
              {!deleteConfirm ? (
                <button className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary text-destructive" onClick={() => setDeleteConfirm(true)}>Delete</button>
              ) : (
                <div className="px-3 py-1.5 space-y-1">
                  <p className="text-xs text-muted-foreground">Delete this goal?</p>
                  <div className="flex gap-1">
                    <button className="text-xs px-2 py-0.5 bg-destructive text-white rounded" onClick={() => { onDelete(goal.id); setMenuOpen(false); }}>Confirm</button>
                    <button className="text-xs px-2 py-0.5 bg-secondary rounded" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
