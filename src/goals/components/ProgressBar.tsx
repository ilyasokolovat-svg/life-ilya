import React from "react";
import { ColorKey, colorHsl } from "../types";

export function ProgressBar({ pct, color, height = 6 }: { pct: number; color: ColorKey; height?: number }) {
  return (
    <div
      className="w-full bg-muted rounded-full overflow-hidden"
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: colorHsl(color) }}
      />
    </div>
  );
}
