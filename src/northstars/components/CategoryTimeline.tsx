import React, { useState } from "react";
import { MoreHorizontal, Plus, Wallet } from "lucide-react";
import { InlineNumber, InlineText } from "./Inline";
import { RoutineControl } from "./RoutineControl";
import { NorthStarsApi } from "../useNorthStars";
import { GoalCategory, GoalMetric, GoalQuarter, HorizonTier } from "../types";
import { daysUntil, formatDate, metricProgress, metricValueLabel, formatNumber } from "../utils";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const TIERS: { tier: HorizonTier; fallback: string }[] = [
  { tier: "five_year", fallback: "Five year" },
  { tier: "three_year", fallback: "Three year" },
  { tier: "one_year", fallback: "One year" },
];

function Dot({ color, hollow }: { color: string; hollow?: boolean }) {
  return (
    <span
      className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 border-2"
      style={{ borderColor: color, backgroundColor: hollow ? "transparent" : color }}
    />
  );
}

function MetricDialog({
  metric,
  open,
  onOpenChange,
  onSave,
}: {
  metric: GoalMetric;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (patch: Partial<GoalMetric>) => void;
}) {
  const [form, setForm] = useState({
    name: metric.name,
    unit: metric.unit,
    direction: metric.direction,
    headline_priority: metric.headline_priority,
    start_value: metric.start_value ?? metric.current_value,
    notes: metric.notes || "",
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Metric details</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input className="h-8" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Unit</Label>
              <Input className="h-8" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Direction</Label>
              <select
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={form.direction}
                onChange={(e) => setForm({ ...form, direction: e.target.value as "up" | "down" })}
              >
                <option value="up">Higher is better</option>
                <option value="down">Lower is better</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Headline priority</Label>
              <Input
                type="number"
                className="h-8"
                value={form.headline_priority}
                onChange={(e) => setForm({ ...form, headline_priority: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label className="text-xs">Start value</Label>
              <Input
                type="number"
                className="h-8"
                value={form.start_value}
                onChange={(e) => setForm({ ...form, start_value: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button
            size="sm"
            onClick={() => {
              onSave({ ...form, notes: form.notes || null });
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

function MetricRow({ metric, accent, ns }: { metric: GoalMetric; accent: string; ns: NorthStarsApi }) {
  const [menu, setMenu] = useState(false);
  const [details, setDetails] = useState(false);
  const pct = Math.round(metricProgress(metric) * 100);

  return (
    <div className="group py-1.5">
      <div className="flex items-center gap-2">
        <InlineText
          value={metric.name}
          onSave={(v) => ns.updateMetric(metric.id, { name: v })}
          className="text-sm text-foreground flex-1 min-w-0"
        />
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          <InlineNumber value={metric.current_value} onSave={(v) => ns.updateMetric(metric.id, { current_value: v })} />
          {" / "}
          <InlineNumber value={metric.target_value} onSave={(v) => ns.updateMetric(metric.id, { target_value: v })} />
          {metric.unit ? ` ${metric.unit}` : ""}
        </span>
        <div className="relative shrink-0">
          <button
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary"
            onClick={() => setMenu((m) => !m)}
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {menu && (
            <div className="absolute right-0 top-7 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[140px]">
              <button
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary"
                onClick={() => {
                  setDetails(true);
                  setMenu(false);
                }}
              >
                Edit details
              </button>
              <button
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary text-destructive"
                onClick={() => {
                  setMenu(false);
                  ns.deleteMetric(metric.id);
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <div className="h-[5px] flex-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: accent }} />
        </div>
        {metric.direction === "down" && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {formatNumber(metric.start_value ?? metric.current_value)} → {formatNumber(metric.target_value)}
          </span>
        )}
      </div>
      {metric.notes && <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{metric.notes}</p>}
      {details && (
        <MetricDialog
          metric={metric}
          open={details}
          onOpenChange={setDetails}
          onSave={(patch) => ns.updateMetric(metric.id, patch)}
        />
      )}
    </div>
  );
}

function QuarterMenu({ quarter, ns }: { quarter: GoalQuarter; ns: NorthStarsApi }) {
  const [menu, setMenu] = useState(false);
  const [next, setNext] = useState(false);
  const [form, setForm] = useState({ label: "", start: quarter.end_date, end: quarter.end_date, copy: true });

  return (
    <div className="relative">
      <button className="p-1 rounded hover:bg-secondary" onClick={() => setMenu((m) => !m)}>
        <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
      {menu && (
        <div className="absolute right-0 top-7 z-20 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[170px]">
          <div className="px-3 py-1.5 space-y-1.5">
            <Label className="text-[10px] text-muted-foreground">Dates</Label>
            <Input
              type="date"
              className="h-7 text-xs"
              value={quarter.start_date}
              onChange={(e) => ns.updateQuarter(quarter.id, { start_date: e.target.value })}
            />
            <Input
              type="date"
              className="h-7 text-xs"
              value={quarter.end_date}
              onChange={(e) => ns.updateQuarter(quarter.id, { end_date: e.target.value })}
            />
          </div>
          <button
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary"
            onClick={() => {
              setMenu(false);
              setNext(true);
            }}
          >
            Start next quarter
          </button>
        </div>
      )}
      <Dialog open={next} onOpenChange={setNext}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Start next quarter</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Label</Label>
              <Input className="h-8" value={form.label} placeholder="Q4 2026" onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start</Label>
                <Input type="date" className="h-8" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">End</Label>
                <Input type="date" className="h-8" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={form.copy} onChange={(e) => setForm({ ...form, copy: e.target.checked })} />
              Copy metric names, reset values to 0
            </label>
          </div>
          <DialogFooter>
            <Button
              size="sm"
              onClick={() => {
                ns.startNextQuarter(quarter, form.label || "New quarter", form.start, form.end, form.copy);
                setNext(false);
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function CategoryTimeline({
  category,
  ns,
  onMoneyDay,
}: {
  category: GoalCategory;
  ns: NorthStarsApi;
  onMoneyDay: () => void;
}) {
  const accent = category.accent_color;
  const horizons = TIERS.map((t) => ns.horizons.find((h) => h.category_id === category.id && h.tier === t.tier));
  const quarter = ns.quarters.find((q) => q.category_id === category.id && q.is_active);
  const metrics = quarter
    ? ns.metrics.filter((m) => m.quarter_id === quarter.id).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const routines = ns.routines.filter((r) => r.category_id === category.id && r.is_active);
  const moneyIn = daysUntil(ns.settings?.next_money_day ?? null);

  return (
    <div className="space-y-0">
      {TIERS.map((t, i) => {
        const h = horizons[i];
        if (!h) return null;
        return (
          <div key={t.tier} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Dot color={accent} />
              <div className="w-px flex-1 bg-border" />
            </div>
            <div className="pb-5 flex-1 min-w-0">
              <InlineText
                value={h.label}
                onSave={(v) => ns.updateHorizon(h.id, { label: v })}
                placeholder={t.fallback}
                className="text-[11px] font-semibold uppercase tracking-wide"
              />
              <div className="mt-1">
                <InlineText
                  value={h.body}
                  onSave={(v) => ns.updateHorizon(h.id, { body: v })}
                  multiline
                  placeholder="Write the goal…"
                  className="text-sm text-foreground leading-relaxed block"
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Quarter */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <Dot color={accent} />
          <div className="w-px flex-1 bg-border" />
        </div>
        <div className="pb-5 flex-1 min-w-0">
          {quarter ? (
            <>
              <div className="flex items-center gap-2">
                <InlineText
                  value={quarter.label}
                  onSave={(v) => ns.updateQuarter(quarter.id, { label: v })}
                  className="text-[11px] font-semibold uppercase tracking-wide"
                />
                <span className="text-[10px] text-muted-foreground">
                  {formatDate(quarter.start_date)} – {formatDate(quarter.end_date)}
                </span>
                <div className="ml-auto">
                  <QuarterMenu quarter={quarter} ns={ns} />
                </div>
              </div>
              <div className="mt-1 divide-y divide-border/60">
                {metrics.map((m) => (
                  <MetricRow key={m.id} metric={m} accent={accent} ns={ns} />
                ))}
              </div>
              <button
                className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => ns.addMetric(quarter.id, {})}
              >
                <Plus className="w-3 h-3" /> Add metric
              </button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No active quarter.</p>
          )}
        </div>
      </div>

      {/* Routines or money day */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <Dot color={accent} hollow />
        </div>
        <div className="flex-1 min-w-0">
          {category.cadence === "weekly" ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Weekly routines
              </p>
              <div className="mt-2 space-y-1.5">
                {routines.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 group">
                    <RoutineControl
                      routine={r}
                      logs={ns.logs}
                      settings={ns.settings}
                      onSet={(v) => ns.setRoutineValue(r.id, v)}
                    />
                    <InlineNumber
                      value={r.target_per_week}
                      onSave={(v) => ns.updateRoutine(r.id, { target_per_week: v })}
                      className="text-[10px] text-muted-foreground"
                    />
                    <span className="text-[10px] text-muted-foreground">/wk</span>
                    <span className="text-[10px] text-muted-foreground">travel</span>
                    <InlineNumber
                      value={r.travel_mode_target ?? 0}
                      onSave={(v) => ns.updateRoutine(r.id, { travel_mode_target: v })}
                      className="text-[10px] text-muted-foreground"
                    />
                    <button
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-destructive"
                      onClick={() => ns.deleteRoutine(r.id)}
                    >
                      delete
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => ns.addRoutine(category.id, {})}
              >
                <Plus className="w-3 h-3" /> Add routine
              </button>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Monthly</p>
              <span className="text-xs text-muted-foreground">
                Next money day: {formatDate(ns.settings?.next_money_day ?? null)}
                {moneyIn !== null && `, in ${moneyIn} days`}
              </span>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onMoneyDay}>
                <Wallet className="w-3 h-3 mr-1" /> Log money day
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
