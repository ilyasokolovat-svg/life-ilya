import React from "react";
import { Check } from "lucide-react";
import { GoalRoutine, GoalSettings, RoutineLog } from "../types";
import { currentWeekStart, effectiveTarget } from "../utils";
import { cn } from "@/lib/utils";

interface Props {
  routine: GoalRoutine;
  logs: RoutineLog[];
  settings: GoalSettings | null;
  onSet: (value: number) => void;
  week?: string;
  compact?: boolean;
}

export function RoutineControl({ routine, logs, settings, onSet, week, compact }: Props) {
  const wk = week || currentWeekStart();
  const value = logs.find((l) => l.routine_id === routine.id && l.week_start_date === wk)?.value ?? 0;
  const target = effectiveTarget(routine, settings);
  const done = value >= target;

  if (routine.is_binary) {
    return (
      <button
        type="button"
        onClick={() => onSet(value >= 1 ? 0 : 1)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors",
          value >= 1
            ? "border-primary/40 bg-primary/10 text-foreground"
            : "border-border text-muted-foreground hover:bg-secondary"
        )}
      >
        <span
          className={cn(
            "w-3.5 h-3.5 rounded-[4px] border flex items-center justify-center",
            value >= 1 ? "bg-primary border-primary" : "border-muted-foreground/40"
          )}
        >
          {value >= 1 && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
        </span>
        <span className={cn(compact && "max-w-[140px] truncate")}>{routine.name}</span>
      </button>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs",
        done ? "border-primary/40 bg-primary/10" : "border-border"
      )}
    >
      <span className={cn("text-muted-foreground", compact && "max-w-[140px] truncate")}>{routine.name}</span>
      <button
        type="button"
        onClick={() => onSet(Math.max(0, value - 1))}
        className="w-4 h-4 rounded hover:bg-secondary text-muted-foreground leading-none"
        aria-label={`Decrease ${routine.name}`}
      >
        −
      </button>
      <span className="tabular-nums font-medium text-foreground">
        {value}/{target}
      </span>
      <button
        type="button"
        onClick={() => onSet(value + 1)}
        className="w-4 h-4 rounded hover:bg-secondary text-muted-foreground leading-none"
        aria-label={`Increase ${routine.name}`}
      >
        +
      </button>
    </span>
  );
}
