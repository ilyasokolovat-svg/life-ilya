import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getDubaiDate, formatDateISO } from "@/utils/dateUtils";
import { cn } from "@/lib/utils";

// One mellow, low-contrast palette (indigo → teal → plum) shared by all three rows
const categories = [
  {
    key: "sleep",
    label: "Sleep",
    fill: "hsl(226, 48%, 62%)",
    soft: "hsl(226, 48%, 62%, 0.16)",
    text: "hsl(226, 40%, 32%)",
  },
  {
    key: "gym",
    label: "Gym",
    fill: "hsl(172, 38%, 52%)",
    soft: "hsl(172, 38%, 52%, 0.16)",
    text: "hsl(172, 40%, 26%)",
  },
  {
    key: "alcohol",
    label: "No Alcohol",
    fill: "hsl(290, 32%, 62%)",
    soft: "hsl(290, 32%, 62%, 0.16)",
    text: "hsl(290, 34%, 32%)",
  },
] as const;

const workoutLabels: Record<string, string> = {
  full: "Full",
  hiit: "HIIT",
  walk: "Walk",
  stretch: "Stretch",
};

function gymLabel(dayData: any): string | null {
  const g = dayData?.gym;
  if (!g) return null;
  if (g.workoutType && String(g.workoutType).trim()) {
    return String(g.workoutType).trim().slice(0, 8);
  }
  const i = g.workoutIntensity;
  const list = Array.isArray(i) ? i : i ? [i] : [];
  if (list.length) return list.map((x: string) => workoutLabels[x] ?? x).join("/").slice(0, 9);
  return g.completed ? "Gym" : null;
}

export function HabitStreakSummary() {
  const { user } = useAuth();

  // Get last 7 days based on Dubai timezone
  const last7Days = useMemo(() => {
    const today = getDubaiDate();
    const days: { date: string; dayLabel: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push({
        date: formatDateISO(d),
        dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
      });
    }
    return days;
  }, []);

  const { data: habitDays = {} } = useQuery({
    queryKey: ["habit_days", user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      const { data, error } = await supabase
        .from("habit_days")
        .select("date, habit_data")
        .eq("user_id", user.id);
      if (error) return {};
      const result: Record<string, any> = {};
      data?.forEach((r) => {
        result[r.date] = r.habit_data;
      });
      return result;
    },
    enabled: !!user?.id,
  });

  const isCompleted = (date: string, habitKey: string): boolean => {
    const dayData = habitDays[date] as any;
    if (!dayData) return false;

    if (habitKey === "alcohol") {
      // "No Alcohol" is completed when the user marked the day as Sober
      return dayData.alcohol?.completed === true;
    }
    if (habitKey === "gym") {
      const intensities = dayData.gym?.workoutIntensity;
      if (Array.isArray(intensities) && intensities.length > 0) return true;
      if (typeof intensities === "string" && intensities) return true;
      return dayData.gym?.completed === true;
    }
    if (habitKey === "sleep") {
      return (dayData.sleep?.sleepHours ?? 0) > 0;
    }
    return dayData[habitKey]?.completed === true;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Last 7 Days</h3>
      <div className="space-y-2">
        {categories.map((cat, catIdx) => (
          <div key={cat.key} className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground w-20 truncate">{cat.label}</span>
            <div className="flex gap-1 flex-1">
              {last7Days.map((day) => {
                const dayData = habitDays[day.date] as any;
                const logged = isCompleted(day.date, cat.key);

                // Row-specific content + fill rules
                let content: React.ReactNode = null;
                let filled = logged;

                if (cat.key === "sleep") {
                  const hours = dayData?.sleep?.sleepHours ?? 0;
                  filled = hours >= 7;
                  content = hours > 0 ? <span className="tabular-nums">{Number(hours).toFixed(1).replace(/\.0$/, "")}h</span> : null;
                } else if (cat.key === "gym") {
                  content = gymLabel(dayData);
                } else if (cat.key === "alcohol") {
                  const type = dayData?.alcohol?.drinkingEventType;
                  if (type === "anchor") {
                    filled = false;
                    content = <span>🍷🍷</span>;
                  } else if (type === "side") {
                    filled = false;
                    content = <span>🍷</span>;
                  } else if (logged) {
                    content = <span>✓</span>;
                  }
                }

                return (
                  <div key={day.date} className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
                    {catIdx === 0 && (
                      <span className="text-[9px] text-muted-foreground font-medium">{day.dayLabel}</span>
                    )}
                    <div
                      className={cn(
                        "w-full h-6 rounded-md transition-colors flex items-center justify-center overflow-hidden",
                        "text-[9px] font-medium leading-none",
                        !filled && "bg-muted/40 text-muted-foreground"
                      )}
                      style={
                        filled
                          ? { backgroundColor: cat.fill, color: "hsl(0, 0%, 100%)" }
                          : content
                          ? { backgroundColor: cat.soft, color: cat.text }
                          : undefined
                      }
                      title={content ? undefined : cat.label}
                    >
                      <span className="truncate px-0.5">{content}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
