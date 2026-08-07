import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GoalMetric, GoalRoutine } from "../types";

export interface RoutineDraft {
  name: string;
  target_per_week: number;
  travel_mode_target: number | null;
  is_binary: boolean;
  linked_metric_id: string | null;
  notes: string | null;
  auto_source: "gym_sessions" | null;
}

/** Add / edit a weekly routine. Used from both the dashboard and the goals page. */
export function RoutineEditorDialog({
  open,
  onOpenChange,
  routine,
  metrics,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  routine?: GoalRoutine;
  metrics: GoalMetric[];
  onSave: (draft: RoutineDraft) => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState<RoutineDraft>({
    name: routine?.name ?? "",
    target_per_week: routine?.target_per_week ?? 1,
    travel_mode_target: routine?.travel_mode_target ?? null,
    is_binary: routine?.is_binary ?? false,
    linked_metric_id: routine?.linked_metric_id ?? null,
    notes: routine?.notes ?? null,
    auto_source: routine?.auto_source ?? null,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{routine ? "Edit routine" : "New weekly routine"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input
              className="h-8"
              autoFocus
              value={form.name}
              placeholder="e.g. Gym sessions"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Auto-count from</Label>
            <select
              className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
              value={form.auto_source ?? ""}
              onChange={(e) =>
                setForm({ ...form, auto_source: (e.target.value || null) as "gym_sessions" | null })
              }
            >
              <option value="">Log it manually</option>
              <option value="gym_sessions">Training sessions (Healthy Life tracker)</option>
            </select>
            {form.auto_source && (
              <p className="text-[10px] text-muted-foreground mt-1">
                🔄 Counted automatically each week from your Healthy Life gym log.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Target per week</Label>
              <Input
                type="number"
                className="h-8"
                value={form.target_per_week}
                onChange={(e) => setForm({ ...form, target_per_week: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label className="text-xs">✈️ Travel target</Label>
              <Input
                type="number"
                className="h-8"
                placeholder="optional"
                value={form.travel_mode_target ?? ""}
                onChange={(e) =>
                  setForm({ ...form, travel_mode_target: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={form.is_binary ? "binary" : "count"}
              onChange={(e) => setForm({ ...form, is_binary: e.target.value === "binary" })}
            >
              <option value="count">Counter (e.g. 3 of 5 sessions)</option>
              <option value="binary">Done / not done</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">🔗 Feeds a quarter goal</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={form.linked_metric_id ?? ""}
              onChange={(e) => setForm({ ...form, linked_metric_id: e.target.value || null })}
            >
              <option value="">Not linked</option>
              {metrics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea
              rows={2}
              placeholder="Definition of done, context…"
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value || null })}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {onDelete ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            onClick={() => {
              onSave({ ...form, name: form.name.trim() || "New routine" });
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
