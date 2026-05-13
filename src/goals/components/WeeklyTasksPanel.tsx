import React from "react";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Goal, WeeklyTaskBlock, ColorKey, colorHsl } from "../types";
import { uid } from "../utils";
import { cn } from "@/lib/utils";

interface Props {
  goal: Goal;
  currentWeek: number;
  onChange: (weeklyTasks: WeeklyTaskBlock[]) => void;
  expanded?: boolean;
  onToggle?: () => void;
}

export function WeeklyTasksPanel({ goal, currentWeek, onChange, expanded, onToggle }: Props) {
  const blocks = goal.weeklyTasks;

  const updateBlock = (weekNumber: number, fn: (b: WeeklyTaskBlock) => WeeklyTaskBlock) => {
    onChange(blocks.map((b) => (b.weekNumber === weekNumber ? fn(b) : b)));
  };

  return (
    <div className="border-t border-border pt-2 mt-2">
      <button
        type="button"
        className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={onToggle}
      >
        <span>Weekly tasks</span>
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {blocks.map((b) => {
            const isCurrent = b.weekNumber === currentWeek;
            return (
              <div
                key={b.weekNumber}
                className={cn(
                  "rounded-lg border border-border p-2",
                  isCurrent && "bg-secondary/40"
                )}
                style={isCurrent ? { borderColor: colorHsl(goal.color) } : undefined}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-foreground">
                    Week {b.weekNumber}{isCurrent && " · current"}
                  </span>
                  <button
                    type="button"
                    className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
                    onClick={() =>
                      updateBlock(b.weekNumber, (bb) => ({
                        ...bb,
                        tasks: [...bb.tasks, { id: uid(), text: "", done: false }],
                      }))
                    }
                  >
                    <Plus className="w-3 h-3" /> Task
                  </button>
                </div>
                {b.tasks.length === 0 && (
                  <p className="text-[11px] text-muted-foreground/70 italic">No tasks</p>
                )}
                {b.tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 py-0.5">
                    <Checkbox
                      checked={t.done}
                      onCheckedChange={(v) =>
                        updateBlock(b.weekNumber, (bb) => ({
                          ...bb,
                          tasks: bb.tasks.map((x) => (x.id === t.id ? { ...x, done: !!v } : x)),
                        }))
                      }
                    />
                    <Input
                      value={t.text}
                      onChange={(e) =>
                        updateBlock(b.weekNumber, (bb) => ({
                          ...bb,
                          tasks: bb.tasks.map((x) => (x.id === t.id ? { ...x, text: e.target.value } : x)),
                        }))
                      }
                      placeholder="Task..."
                      className={cn("h-6 text-xs px-2 py-0 border-0 bg-transparent focus-visible:ring-1 flex-1", t.done && "line-through text-muted-foreground")}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateBlock(b.weekNumber, (bb) => ({
                          ...bb,
                          tasks: bb.tasks.filter((x) => x.id !== t.id),
                        }))
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
