import React from "react";

/** One thin segment per metric — shows the whole quarter at a glance. */
export function SegmentBar({
  parts,
  color,
  height = 6,
}: {
  parts: { id: string; name: string; pct: number }[];
  color: string;
  height?: number;
}) {
  if (!parts.length) {
    return <div className="w-full bg-muted rounded-full" style={{ height }} />;
  }
  return (
    <div className="flex gap-1 w-full">
      {parts.map((p) => (
        <div
          key={p.id}
          title={`${p.name} · ${Math.round(p.pct * 100)}%`}
          className="flex-1 bg-muted rounded-full overflow-hidden"
          style={{ height }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.round(p.pct * 100)}%`, backgroundColor: color }}
          />
        </div>
      ))}
    </div>
  );
}
