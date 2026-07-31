import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flame } from "lucide-react";
import { NorthStarsApi } from "../useNorthStars";
import { RoutineControl } from "./RoutineControl";
import { checkinStreak, currentWeekStart, lastValueLabel, nextMoneyDayAfter } from "../utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ns: NorthStarsApi;
  /** limit to a single category (money day flow) */
  onlyCategoryId?: string | null;
  moneyDay?: boolean;
}

export function CheckinModal({ open, onOpenChange, ns, onlyCategoryId, moneyDay }: Props) {
  const week = currentWeekStart();
  const [note, setNote] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedStreak, setSavedStreak] = useState<number | null>(null);

  const categories = useMemo(
    () => ns.categories.filter((c) => !onlyCategoryId || c.id === onlyCategoryId),
    [ns.categories, onlyCategoryId]
  );

  const activeMetricsFor = (categoryId: string) => {
    const q = ns.quarters.find((x) => x.category_id === categoryId && x.is_active);
    if (!q) return [];
    return ns.metrics
      .filter((m) => m.quarter_id === q.id)
      .sort((a, b) => a.headline_priority - b.headline_priority);
  };

  useEffect(() => {
    if (!open) return;
    const init: Record<string, string> = {};
    ns.metrics.forEach((m) => (init[m.id] = String(m.current_value)));
    setValues(init);
    setNote(ns.checkins.find((c) => c.week_start_date === week)?.note || "");
    setSavedStreak(null);
  }, [open, ns.metrics, ns.checkins, week]);

  const save = async () => {
    setSaving(true);
    try {
      for (const c of categories) {
        for (const m of activeMetricsFor(c.id)) {
          if (m.auto_source) continue; // linked metrics are computed, never written from here
          const v = Number(values[m.id]);
          if (!Number.isNaN(v) && v !== m.current_value) {
            await ns.updateMetric(m.id, { current_value: v });
          }
        }
      }

      if (!moneyDay) {
        await ns.saveCheckin(note, week);
      }
      if (moneyDay) {
        await ns.updateSettings({ next_money_day: nextMoneyDayAfter(ns.settings?.next_money_day ?? null) });
      }
      const streak = checkinStreak(
        moneyDay
          ? ns.checkins
          : [...ns.checkins.filter((c) => c.week_start_date !== week), { week_start_date: week } as never]
      );
      setSavedStreak(streak);
      setTimeout(() => onOpenChange(false), 1200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{moneyDay ? "Money day" : "Weekly check-in"}</DialogTitle>
        </DialogHeader>

        {savedStreak !== null ? (
          <div className="py-8 text-center space-y-2">
            <Flame className="w-8 h-8 mx-auto text-amber-500" />
            <p className="text-sm text-foreground">Saved.{!moneyDay && ` ${savedStreak} week streak.`}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((c) => {
              const routines = ns.routines.filter((r) => r.category_id === c.id && r.is_active);
              const metrics = activeMetricsFor(c.id);
              return (
                <div key={c.id} className="space-y-2 border-b border-border pb-3 last:border-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: c.accent_color }}>
                    {c.name}
                  </p>
                  {c.cadence === "weekly" && routines.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">1 · This week</p>
                      <div className="flex flex-wrap gap-1.5">
                        {routines.map((r) => (
                          <RoutineControl
                            key={r.id}
                            routine={r}
                            logs={ns.logs}
                            settings={ns.settings}
                            onSet={(v) => ns.setRoutineValue(r.id, v)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {metrics.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">2 · Quarter numbers</p>
                      {metrics.map((m) => (
                        <div key={m.id} className="space-y-0.5 py-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground flex-1 truncate" title={m.name}>
                              {m.auto_source && "🔗 "}
                              {m.name}
                            </span>
                            {m.auto_source ? (
                              <span className="h-7 w-24 text-xs flex items-center justify-end tabular-nums text-foreground">
                                {m.current_value.toLocaleString()}
                              </span>
                            ) : (
                              <Input
                                type="number"
                                value={values[m.id] ?? ""}
                                onChange={(e) => setValues((v) => ({ ...v, [m.id]: e.target.value }))}
                                className="h-7 w-24 text-xs"
                              />
                            )}
                            <span className="text-[11px] text-muted-foreground w-20">
                              / {m.target_value.toLocaleString()} {m.unit}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground tabular-nums">{lastValueLabel(m)}</p>
                          {m.notes && (
                            <p className="text-[10px] leading-snug text-muted-foreground">{m.notes}</p>
                          )}
                        </div>
                      ))}
                      {metrics.some((m) => m.auto_source) && (
                        <p className="text-[10px] text-muted-foreground">🔗 = auto-synced, nothing to type.</p>
                      )}
                    </div>
                  )}

                </div>
              );
            })}

            {!moneyDay && (
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="One thing that mattered this week"
                className="h-9 text-sm"
              />
            )}
          </div>
        )}

        {savedStreak === null && (
          <DialogFooter>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
