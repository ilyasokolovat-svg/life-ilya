import React from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Metric, ColorKey, colorHsl } from "../types";

interface Props {
  metric: Metric;
  color: ColorKey;
  onChange: (m: Metric) => void;
  compact?: boolean;
}

export function MetricEditor({ metric, color, onChange, compact }: Props) {
  if (metric.kind === "checkbox") {
    return (
      <label className="flex items-center gap-2 cursor-pointer py-1">
        <Checkbox
          checked={metric.current >= 1}
          onCheckedChange={(v) => onChange({ ...metric, current: v ? 1 : 0 })}
        />
        <span className="text-sm text-foreground">{metric.label}</span>
      </label>
    );
  }
  const pct = metric.target > 0 ? Math.min(100, (metric.current / metric.target) * 100) : 0;
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-foreground">{metric.label}</span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Input
            type="number"
            value={metric.current}
            onChange={(e) => onChange({ ...metric, current: Math.max(0, Number(e.target.value) || 0) })}
            className="h-6 w-16 text-xs px-2 py-0"
          />
          <span>/ {metric.target}{metric.unit ? ` ${metric.unit}` : ""}</span>
        </div>
      </div>
      {!compact && (
        <Slider
          value={[Math.min(metric.target, metric.current)]}
          max={metric.target}
          step={Math.max(1, Math.round(metric.target / 100))}
          onValueChange={(v) => onChange({ ...metric, current: v[0] })}
          className="[&_[role=slider]]:border-0"
          style={{ ['--primary' as any]: colorHsl(color) }}
        />
      )}
      <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: colorHsl(color) }}
        />
      </div>
    </div>
  );
}
