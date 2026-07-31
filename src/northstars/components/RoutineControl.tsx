import React from "react";
import { Check, Link2 } from "lucide-react";
import { GoalRoutine, GoalSettings, RoutineLog } from "../types";
import { currentWeekStart, effectiveTarget } from "../utils";
import { cn } from "@/lib/utils";
import { InlineText } from "./Inline";

interface Props {
  routine: GoalRoutine;
  logs: RoutineLog[];
  settings: GoalSettings | null;
  onSet: (value: number) => void;
  week?: string;
  compact?: boolean;
  accent?: string;
  linked?: boolean;
  onRename?: (name: string) => void;
}

export function RoutineControl({ routine, logs, settings, onSet, week, compact, accent, linked, onRename }: Props) {
  const wk = week || currentWeekStart();
  const value = logs.find((l) => l.routine_id === routine.id && l.week_start_date === wk)?.value ?? 0;
  const target = Math.max(1, effectiveTarget(routine, settings));
  const pct = Math.min(100, Math.round((value / target) * 100));
  const done = value >= target;
  const color = accent || "hsl(var(--primary))";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors",
        done ? "border-primary/30 bg-primary/[0.06]" : "border-border bg-background",
        compact ? "w-full" : "w-full"
      )}
    >
      {routine.is_binary ? (
        <button
          type="button"
          onClick={() => onSet(value >= 1 ? 0 : 1)}
          aria-label={routine.name}
          className={cn(
            "w-4 h-4 rounded-[5px] border flex items-center justify-center shrink-0",
            value >= 1 ? "border-transparent" : "border-muted-foreground/40"
          )}
          style={value >= 1 ? { backgroundColor: color } : undefined}
        >
          {value >= 1 && <Check className="w-3 h-3 text-white" />}
        </button>
      ) : (
        <span
          className="w-4 h-4 rounded-full shrink-0 border-2"
          style={{ borderColor: color, backgroundColor: done ? color : "transparent" }}
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {onRename ? (
            <InlineText
              value={routine.name}
              onSave={onRename}
              placeholder="Routine name…"
              className={cn("text-xs text-foreground", done && "text-muted-foreground line-through")}
              inputClassName="text-xs py-0.5"
            />
          ) : (
            <span className={cn("text-xs text-foreground truncate", done && "text-muted-foreground line-through")}>
              {routine.name}
            </span>
          )}
          {linked && <Link2 className="w-3 h-3 text-muted-foreground shrink-0" aria-label="Feeds a quarterly metric" />}
        </div>
        {!routine.is_binary && (
          <div className="h-[4px] w-full bg-muted rounded-full overflow-hidden mt-1">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
        )}
      </div>

      {routine.is_binary ? (
        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{value >= 1 ? "done" : "—"}</span>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onSet(Math.max(0, value - 1))}
            className="w-5 h-5 rounded hover:bg-secondary text-muted-foreground leading-none"
            aria-label={`Decrease ${routine.name}`}
          >
            −
          </button>
          <span className="text-xs tabular-nums font-medium text-foreground w-9 text-center">
            {value}/{target}
          </span>
          <button
            type="button"
            onClick={() => onSet(value + 1)}
            className="w-5 h-5 rounded hover:bg-secondary text-muted-foreground leading-none"
            aria-label={`Increase ${routine.name}`}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
