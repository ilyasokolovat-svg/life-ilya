import React from "react";
import { Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useReflections } from "./storage";
import { reflectionStreak, triTrend, trendLabel, type Trend } from "./utils";

interface Props {
  compact?: boolean;
}

export function ReflectionsView({ compact = false }: Props) {
  const { entries } = useReflections();
  const recent = entries.slice(-12);
  const streak = reflectionStreak(entries);
  const notes = [...entries].reverse().filter((e) => e.note);

  const goalsTrend = triTrend(entries.slice(-4).map((e) => e.goalsProgress));
  const healthTrend = triTrend(entries.slice(-4).map((e) => e.health));
  const energyTrend = triTrend(entries.slice(-4).map((e) => e.energy));

  return (
    <div className="space-y-4">
      {/* Streak */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Reflection streak</div>
          <div className="text-2xl font-semibold text-foreground flex items-center gap-2 mt-0.5">
            <Flame className="w-5 h-5" style={{ color: "hsl(var(--goal-amber))" }} />
            {streak}
            <span className="text-xs font-normal text-muted-foreground">
              {streak === 1 ? "week" : "weeks"}
            </span>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground text-right max-w-[160px]">
          Consecutive ISO weeks with a saved reflection.
        </div>
      </div>

      {/* Sparkline */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-foreground">Overall — last {recent.length || 0} weeks</div>
          {recent.length > 0 && (
            <div className="text-[11px] text-muted-foreground">
              avg {(recent.reduce((a, e) => a + e.overall, 0) / recent.length).toFixed(1)} / 5
            </div>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No reflections yet.</p>
        ) : (
          <div className="flex items-end gap-1 h-16">
            {recent.map((e) => {
              const h = (e.overall / 5) * 100;
              return (
                <div
                  key={e.weekKey}
                  className="flex-1 rounded-sm bg-primary/70 hover:bg-primary transition-colors"
                  style={{ height: `${Math.max(6, h)}%` }}
                  title={`${e.weekLabel} · ${e.overall}/5`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Trend pills */}
      <div className="grid grid-cols-3 gap-2">
        <TrendPill label="Goals" trend={goalsTrend} />
        <TrendPill label="Health" trend={healthTrend} />
        <TrendPill label="Energy" trend={energyTrend} />
      </div>

      {/* Notes memory log */}
      {!compact && (
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-xs font-medium text-foreground mb-2">Things that mattered</div>
          {notes.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No notes yet — jot one line each week and this becomes your memory log.
            </p>
          ) : (
            <ul className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {notes.map((e) => (
                <li key={e.weekKey} className="border-l-2 pl-3 py-1" style={{ borderColor: "hsl(var(--primary))" }}>
                  <div className="text-[11px] text-muted-foreground">{e.weekLabel}</div>
                  <div className="text-sm text-foreground">{e.note}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function TrendPill({ label, trend }: { label: string; trend: Trend }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const colorVar =
    trend === "up" ? "--success" : trend === "down" ? "--destructive" : "--muted-foreground";
  return (
    <div
      className="rounded-lg border border-border bg-card px-3 py-2 flex items-center justify-between"
    >
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-xs font-medium text-foreground">{trendLabel(trend)}</div>
      </div>
      <Icon className="w-4 h-4" style={{ color: `hsl(var(${colorVar}))` }} />
    </div>
  );
}
