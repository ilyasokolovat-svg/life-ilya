import React, { useState } from "react";
import { Pencil, Trash2, Link2, ChevronDown, ChevronRight } from "lucide-react";
import { Goal, Category, colorHsl, MonthlyReview, MonthlyReviewStatus, ProgressMode } from "../types";
import { ProgressBar } from "./ProgressBar";
import { MetricEditor } from "./MetricEditor";
import { StatusBadge } from "./StatusBadge";
import {
  quarterlyProgress,
  yearlyProgress,
  yearlyRollupProgress,
  metricProgressPct,
  monthsForYear,
  monthLabel,
  currentMonthKey,
} from "../utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: MonthlyReviewStatus; label: string; cls: string }[] = [
  { value: "on-track", label: "On track", cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  { value: "at-risk", label: "At risk", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  { value: "behind", label: "Behind", cls: "bg-red-500/15 text-red-600 border-red-500/30" },
  { value: "complete", label: "Complete", cls: "bg-purple-500/15 text-purple-600 border-purple-500/30" },
];

export function YearlyGoalCard({
  goal,
  category,
  allGoals,
  onUpdate,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  category?: Category;
  allGoals: Goal[];
  onUpdate: (g: Goal) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const linked = allGoals.filter((g) => g.layer === "quarterly" && g.linkedYearlyGoalId === goal.id);
  const linkedLongterm = goal.linkedLongtermGoalId
    ? allGoals.find((g) => g.id === goal.linkedLongtermGoalId)
    : undefined;

  const mode: ProgressMode = goal.progressMode || "blend";
  const pct = yearlyProgress(goal, allGoals);
  const rollup = yearlyRollupProgress(goal, allGoals);
  const metricPct = metricProgressPct(goal);

  const [reviewsOpen, setReviewsOpen] = useState(true);
  const months = goal.year ? monthsForYear(goal.year) : [];
  const reviews = goal.monthlyReviews || [];
  const reviewByMonth = new Map(reviews.map((r) => [r.month, r]));
  const thisMonth = currentMonthKey();

  const setReview = (month: string, patch: Partial<MonthlyReview>) => {
    const existing = reviewByMonth.get(month);
    const next: MonthlyReview = {
      month,
      status: existing?.status || "on-track",
      note: existing?.note,
      reviewedAt: Date.now(),
      ...patch,
    };
    const others = reviews.filter((r) => r.month !== month);
    onUpdate({ ...goal, monthlyReviews: [...others, next].sort((a, b) => a.month.localeCompare(b.month)) });
  };

  const setMode = (m: ProgressMode) => onUpdate({ ...goal, progressMode: m });

  return (
    <div
      className="bg-card border border-border rounded-xl p-4 shadow-sm"
      style={{ borderLeftWidth: 3, borderLeftColor: colorHsl(goal.color) }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{goal.title}</span>
            {category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: colorHsl(goal.color, 0.15), color: colorHsl(goal.color) }}>
                {category.name}
              </span>
            )}
          </div>
          {linkedLongterm ? (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
              <Link2 className="w-3 h-3" />
              <span>Long-term: <span className="text-foreground font-medium">{linkedLongterm.title}</span></span>
            </div>
          ) : (
            <button onClick={onEdit} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground mt-0.5">
              <Link2 className="w-3 h-3" /> Link to long-term goal…
            </button>
          )}
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

      {/* Progress mode toggle */}
      <div className="flex items-center gap-2 mb-3 text-[11px]">
        <span className="text-muted-foreground">Progress:</span>
        {(["auto", "manual", "blend"] as ProgressMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "px-2 py-0.5 rounded-full border transition-colors",
              mode === m ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {m === "auto" ? `Auto (${rollup}%)` : m === "manual" ? `Manual (${metricPct}%)` : "Blend"}
          </button>
        ))}
      </div>

      {/* Metrics — manual sliders */}
      {goal.metrics.length > 0 && (
        <div className="space-y-1 mb-3">
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

      {/* Linked quarterly chips */}
      <div className="mb-3">
        <p className="text-[11px] font-medium text-muted-foreground mb-1">Linked quarterly goals</p>
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
          <p className="text-[11px] text-muted-foreground italic">None yet</p>
        )}
      </div>

      {/* Monthly check-ins */}
      <div className="border-t border-border pt-2">
        <button
          type="button"
          onClick={() => setReviewsOpen((o) => !o)}
          className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <span>Monthly check-ins</span>
          {reviewsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {reviewsOpen && (
          <div className="mt-2 space-y-1.5">
            {months.map((mk) => {
              const r = reviewByMonth.get(mk);
              const isCurrent = mk === thisMonth;
              return (
                <div
                  key={mk}
                  className={cn(
                    "rounded-lg border border-border p-2",
                    isCurrent && "bg-secondary/40"
                  )}
                  style={isCurrent ? { borderColor: colorHsl(goal.color) } : undefined}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold w-20">{monthLabel(mk)}{isCurrent && " ·"}</span>
                    <div className="flex gap-1 flex-wrap">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setReview(mk, { status: opt.value })}
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full border transition-colors",
                            r?.status === opt.value ? opt.cls : "border-border text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {r && (
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(r.reviewedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <Input
                    value={r?.note || ""}
                    onChange={(e) => setReview(mk, { note: e.target.value })}
                    placeholder="Note for the month..."
                    className="h-6 text-xs mt-1 px-2"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
