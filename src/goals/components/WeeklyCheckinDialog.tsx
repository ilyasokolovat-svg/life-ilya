import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useGoalsStore } from "../storage";
import { Goal, colorHsl } from "../types";
import { currentQuarterKey, currentWeekOfQuarter, quarterInfo } from "../utils";
import { MetricEditor } from "./MetricEditor";
import { ProgressBar } from "./ProgressBar";
import { quarterlyProgress } from "../utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function WeeklyCheckinDialog({ open, onOpenChange }: Props) {
  const { goals, categories, saveCheckin } = useGoalsStore();
  const qKey = currentQuarterKey();
  const info = quarterInfo(qKey);
  const week = currentWeekOfQuarter(qKey);

  const activeGoals = useMemo(
    () => goals.filter((g) => g.layer === "quarterly" && g.quarter === qKey),
    [goals, qKey]
  );

  const [draft, setDraft] = useState<Record<string, Goal>>({});
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    const map: Record<string, Goal> = {};
    activeGoals.forEach((g) => { map[g.id] = JSON.parse(JSON.stringify(g)); });
    setDraft(map);
    setStep(0);
  }, [open, activeGoals]);

  if (!open) return null;

  const total = activeGoals.length;
  const isReview = step >= total;
  const current = !isReview ? activeGoals[step] : null;
  const currentDraft = current ? draft[current.id] : null;

  const updateDraft = (id: string, updater: (g: Goal) => Goal) => {
    setDraft((d) => ({ ...d, [id]: updater(d[id]) }));
  };

  const save = () => {
    saveCheckin(Object.values(draft));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>Weekly Check-in</span>
            <span className="text-xs font-normal text-muted-foreground">
              {qKey} · Week {week} of {info.totalWeeks}
            </span>
          </DialogTitle>
        </DialogHeader>

        {total === 0 ? (
          <div className="py-6 text-sm text-muted-foreground text-center">
            No active quarterly goals for {qKey}.
          </div>
        ) : isReview ? (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Ready to save your check-in for this week.</p>
            <div className="space-y-2">
              {activeGoals.map((g) => {
                const d = draft[g.id];
                const pct = d ? quarterlyProgress(d) : 0;
                return (
                  <div
                    key={g.id}
                    className="border border-border rounded-lg p-3"
                    style={{ borderLeftWidth: 3, borderLeftColor: colorHsl(g.color) }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{g.title}</span>
                      <span className="text-xs font-semibold">{pct}%</span>
                    </div>
                    <ProgressBar pct={pct} color={g.color} />
                  </div>
                );
              })}
            </div>
          </div>
        ) : current && currentDraft ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Goal {step + 1} of {total}
              </div>
              <div className="text-xs text-muted-foreground">
                {categories.find((c) => c.id === current.categoryId)?.name}
              </div>
            </div>

            <div
              className="border border-border rounded-xl p-4"
              style={{ borderLeftWidth: 3, borderLeftColor: colorHsl(current.color) }}
            >
              <h3 className="text-base font-semibold mb-3">{current.title}</h3>

              {/* This week's tasks */}
              {(() => {
                const wb = currentDraft.weeklyTasks.find((w) => w.weekNumber === week);
                return (
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      This week's tasks
                    </div>
                    {!wb || wb.tasks.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No tasks set for this week.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {wb.tasks.map((t) => (
                          <label key={t.id} className="flex items-start gap-2 cursor-pointer">
                            <Checkbox
                              checked={t.done}
                              onCheckedChange={(v) =>
                                updateDraft(current.id, (g) => ({
                                  ...g,
                                  weeklyTasks: g.weeklyTasks.map((wbb) =>
                                    wbb.weekNumber === week
                                      ? { ...wbb, tasks: wbb.tasks.map((x) => x.id === t.id ? { ...x, done: !!v } : x) }
                                      : wbb
                                  ),
                                }))
                              }
                              className="mt-0.5"
                            />
                            <span className={`text-sm ${t.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {t.text || <span className="italic text-muted-foreground">Untitled task</span>}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Metrics */}
              {currentDraft.metrics.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Metrics
                  </div>
                  <div className="space-y-1">
                    {currentDraft.metrics.map((m) => (
                      <MetricEditor
                        key={m.id}
                        metric={m}
                        color={current.color}
                        onChange={(nm) =>
                          updateDraft(current.id, (g) => ({
                            ...g,
                            metrics: g.metrics.map((x) => (x.id === nm.id ? nm : x)),
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <div>
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            {!isReview ? (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                {step === total - 1 ? "Review" : "Next"} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={save}>
                <CheckCircle2 className="w-4 h-4 mr-1" /> Save check-in
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
