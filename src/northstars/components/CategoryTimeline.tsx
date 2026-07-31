import React, { useState } from "react";
import { MoreHorizontal, Plus, Wallet } from "lucide-react";
import { InlineNumber, InlineText } from "./Inline";
import { RoutineControl } from "./RoutineControl";
import { NorthStarsApi } from "../useNorthStars";
import { GoalCategory, GoalMetric, GoalQuarter, HorizonTier } from "../types";
import { daysUntil, formatDate, metricProgress, metricValueLabel, formatNumber } from "../utils";
import { AUTO_SOURCE_LABEL, AutoSource } from "../autoSources";
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

const AUTO_OPTIONS: { value: "" | AutoSource; label: string }[] = [
  { value: "", label: "Manual entry" },
  { value: "gym_sessions", label: "Auto · training sessions (Healthy Life)" },
  { value: "net_worth", label: "Auto · net worth (Finance)" },
  { value: "debt", label: "Auto · total debt (Finance)" },
];

function MetricFormDialog({
  metric,
  title,
  open,
  onOpenChange,
  onSave,
}: {
  metric: Partial<GoalMetric>;
  title: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (patch: Partial<GoalMetric>) => void;
}) {
  const [form, setForm] = useState({
    name: metric.name ?? "",
    unit: metric.unit ?? "",
    direction: (metric.direction ?? "up") as "up" | "down",
    headline_priority: metric.headline_priority ?? 1,
    current_value: metric.current_value ?? 0,
    target_value: metric.target_value ?? 1,
    start_value: metric.start_value ?? metric.current_value ?? 0,
    notes: metric.notes || "",
    auto_source: (metric.auto_source ?? "") as "" | AutoSource,
  });
  const auto = form.auto_source !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input className="h-8" value={form.name} placeholder="e.g. Training sessions" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Data source</Label>
            <select
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={form.auto_source}
              onChange={(e) => setForm({ ...form, auto_source: e.target.value as "" | AutoSource })}
            >
              {AUTO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {auto && (
              <p className="text-[10px] text-muted-foreground mt-1">
                🔗 Linked to {AUTO_SOURCE_LABEL[form.auto_source as AutoSource]} — the current value updates itself.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Current</Label>
              <Input
                type="number"
                className="h-8"
                disabled={auto}
                value={form.current_value}
                onChange={(e) => setForm({ ...form, current_value: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label className="text-xs">Target</Label>
              <Input
                type="number"
                className="h-8"
                value={form.target_value}
                onChange={(e) => setForm({ ...form, target_value: Number(e.target.value) })}
              />
            </div>
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
            <Label className="text-xs">Sub-text (shown under the progress bar)</Label>
            <Textarea
              rows={3}
              placeholder="Context, definition of done, how you'll measure it…"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            size="sm"
            onClick={() => {
              onSave({
                ...form,
                notes: form.notes || null,
                auto_source: (form.auto_source || null) as AutoSource | null,
              });
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
  const auto = metric.auto_source;

  return (
    <div className="group py-1.5">
      <div className="flex items-center gap-2">
        <InlineText
          value={metric.name}
          onSave={(v) => ns.updateMetric(metric.id, { name: v })}
          className="text-sm text-foreground flex-1 min-w-0"
        />
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {auto ? (
            <span className="tabular-nums">{formatNumber(metric.current_value)}</span>
          ) : (
            <InlineNumber value={metric.current_value} onSave={(v) => ns.updateMetric(metric.id, { current_value: v })} />
          )}
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
      {auto && (
        <p className="text-[10px] text-muted-foreground mt-1">🔗 Linked to {AUTO_SOURCE_LABEL[auto]} — updates automatically</p>
      )}
      <InlineText
        value={metric.notes || ""}
        onSave={(v) => ns.updateMetric(metric.id, { notes: v || null })}
        multiline
        placeholder="Add sub-text…"
        className="text-[11px] text-muted-foreground mt-1 leading-snug block"
      />
      {details && (
        <MetricFormDialog
          metric={metric}
          title="Metric details"
          open={details}
          onOpenChange={setDetails}
          onSave={(patch) => ns.updateMetric(metric.id, patch)}
        />
      )}
    </div>
  );
}

/** Defaults for the quarter following `quarter`: starts the day after it ends, runs 3 months. */
function nextQuarterDefaults(quarter: GoalQuarter) {
  const start = new Date(quarter.end_date + "T00:00:00");
  start.setDate(start.getDate() + 1);
  const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
  const label = `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`;
  return { label, start: toISODate(start), end: toISODate(end), copy: true };
}

function NextQuarterDialog({
  quarter,
  ns,
  open,
  onOpenChange,
}: {
  quarter: GoalQuarter;
  ns: NorthStarsApi;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [form, setForm] = useState(() => nextQuarterDefaults(quarter));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Plan next quarter</DialogTitle>
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
          <p className="text-[10px] text-muted-foreground">
            If the start date is in the future it stays in draft and activates itself on that day.
          </p>
        </div>
        <DialogFooter>
          <Button
            size="sm"
            onClick={() => {
              ns.startNextQuarter(quarter, form.label || "New quarter", form.start, form.end, form.copy);
              onOpenChange(false);
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuarterMenu({ quarter, ns }: { quarter: GoalQuarter; ns: NorthStarsApi }) {
  const [menu, setMenu] = useState(false);
  const [next, setNext] = useState(false);

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
            Plan next quarter
          </button>
        </div>
      )}
      <NextQuarterDialog quarter={quarter} ns={ns} open={next} onOpenChange={setNext} />
    </div>
  );
}

function QuarterMetrics({ quarter, accent, ns }: { quarter: GoalQuarter; accent: string; ns: NorthStarsApi }) {
  const [adding, setAdding] = useState(false);
  const metrics = ns.metrics
    .filter((m) => m.quarter_id === quarter.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <div className="mt-1 divide-y divide-border/60">
        {metrics.map((m) => (
          <MetricRow key={m.id} metric={m} accent={accent} ns={ns} />
        ))}
      </div>
      <button
        className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setAdding(true)}
      >
        <Plus className="w-3 h-3" /> Add metric
      </button>
      {adding && (
        <MetricFormDialog
          metric={{}}
          title="New metric"
          open={adding}
          onOpenChange={setAdding}
          onSave={(patch) => ns.addMetric(quarter.id, patch)}
        />
      )}
    </>
  );
}

/** Shows the already-planned next quarter, or a prompt to plan it in the final weeks. */
function NextQuarterBlock({ quarter, accent, ns }: { quarter: GoalQuarter; accent: string; ns: NorthStarsApi }) {
  const [plan, setPlan] = useState(false);
  const today = toISODate(new Date());
  const upcoming = ns.quarters
    .filter((q) => q.category_id === quarter.category_id && !q.is_active && q.start_date > today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
  const endsIn = daysUntil(quarter.end_date);

  if (upcoming) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border p-3">
        <div className="flex items-center gap-2">
          <InlineText
            value={upcoming.label}
            onSave={(v) => ns.updateQuarter(upcoming.id, { label: v })}
            className="text-[11px] font-semibold uppercase tracking-wide"
          />
          <span className="text-[10px] text-muted-foreground">
            upcoming · starts {formatDate(upcoming.start_date)}
          </span>
        </div>
        <QuarterMetrics quarter={upcoming} accent={accent} ns={ns} />
        <p className="text-[10px] text-muted-foreground mt-2">
          Goes live automatically on {formatDate(upcoming.start_date)}.
        </p>
      </div>
    );
  }

  if (endsIn === null || endsIn > 45) return null;

  return (
    <div className="mt-4 rounded-lg border border-dashed border-border p-3 flex flex-wrap items-center gap-2">
      <p className="text-xs text-muted-foreground">
        {quarter.label} ends in {endsIn} days — time to plan the next one.
      </p>
      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPlan(true)}>
        <Plus className="w-3 h-3 mr-1" /> Plan next quarter
      </Button>
      <NextQuarterDialog quarter={quarter} ns={ns} open={plan} onOpenChange={setPlan} />
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
              <QuarterMetrics quarter={quarter} accent={accent} ns={ns} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No active quarter.</p>
          )}
          {quarter && <NextQuarterBlock quarter={quarter} accent={accent} ns={ns} />}
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
              <div className="mt-2 space-y-2">
                {routines.map((r) => (
                  <div key={r.id} className="group space-y-1">
                    <RoutineControl
                      routine={r}
                      logs={ns.logs}
                      settings={ns.settings}
                      accent={accent}
                      linked={!!r.linked_metric_id}
                      onSet={(v) => ns.setRoutineValue(r.id, v)}
                    />
                    <div className="flex flex-wrap items-center gap-1.5 pl-2 text-[10px] text-muted-foreground">
                      <span>🎯</span>
                      <InlineNumber
                        value={r.target_per_week}
                        onSave={(v) => ns.updateRoutine(r.id, { target_per_week: v })}
                        className="text-[10px] text-muted-foreground"
                      />
                      <span>/wk</span>
                      <span>✈️</span>
                      <InlineNumber
                        value={r.travel_mode_target ?? 0}
                        onSave={(v) => ns.updateRoutine(r.id, { travel_mode_target: v })}
                        className="text-[10px] text-muted-foreground"
                      />
                      <span className="ml-1">🔗</span>
                      <select
                        className="h-6 rounded-md border border-input bg-background px-1 text-[10px] max-w-[180px]"
                        value={r.linked_metric_id ?? ""}
                        onChange={(e) =>
                          ns.updateRoutine(r.id, { linked_metric_id: e.target.value || null })
                        }
                      >
                        <option value="">Not linked to a quarter goal</option>
                        {metrics.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <button
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-destructive ml-auto"
                        onClick={() => ns.deleteRoutine(r.id)}
                      >
                        delete
                      </button>
                    </div>
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
