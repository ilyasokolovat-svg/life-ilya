import React, { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { NorthStarsApi } from "../useNorthStars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InlineText } from "./Inline";
import { cn } from "@/lib/utils";

export function NorthStarsSettings({ ns }: { ns: NorthStarsApi }) {
  const [open, setOpen] = useState(false);
  const s = ns.settings;

  return (
    <div className="border border-border rounded-xl bg-card">
      <button className="w-full flex items-center justify-between px-4 py-2.5" onClick={() => setOpen((o) => !o)}>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Settings</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-xs">Travel mode</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="h-7 w-36 text-xs"
                value={s?.travel_mode_until || ""}
                onChange={(e) => ns.updateSettings({ travel_mode_until: e.target.value || null })}
              />
              <Switch
                checked={!!s?.travel_mode_active}
                onCheckedChange={(v) => ns.updateSettings({ travel_mode_active: v })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label className="text-xs">Next money day</Label>
            <Input
              type="date"
              className="h-7 w-36 text-xs"
              value={s?.next_money_day || ""}
              onChange={(e) => ns.updateSettings({ next_money_day: e.target.value || null })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Categories</Label>
            {ns.categories.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <input
                  type="color"
                  value={c.accent_color}
                  onChange={(e) => ns.updateCategory(c.id, { accent_color: e.target.value })}
                  className="w-6 h-6 rounded border border-border bg-transparent"
                />
                <InlineText value={c.name} onSave={(v) => ns.updateCategory(c.id, { name: v })} className="text-xs flex-1" />
                <select
                  className="h-7 rounded-md border border-input bg-background px-1.5 text-[11px]"
                  value={c.cadence}
                  onChange={(e) => ns.updateCategory(c.id, { cadence: e.target.value as "weekly" | "monthly" })}
                >
                  <option value="weekly">weekly</option>
                  <option value="monthly">monthly</option>
                </select>
                <input
                  type="number"
                  className="h-7 w-12 rounded-md border border-input bg-background px-1.5 text-[11px]"
                  value={c.sort_order}
                  onChange={(e) => ns.updateCategory(c.id, { sort_order: Number(e.target.value) })}
                />
                <button
                  className="text-[11px] text-destructive"
                  onClick={() => {
                    if (confirm(`Delete ${c.name} and everything under it?`)) ns.deleteCategory(c.id);
                  }}
                >
                  delete
                </button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => ns.addCategory("New category", "#6366f1", "weekly")}
            >
              <Plus className="w-3 h-3 mr-1" /> Add category
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
