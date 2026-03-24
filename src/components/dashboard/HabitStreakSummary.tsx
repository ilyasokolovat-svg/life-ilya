import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getDubaiDate, formatDateISO } from "@/utils/dateUtils";
import { cn } from "@/lib/utils";

const categories = [
  { key: "sleep", label: "Sleep", color: "hsl(217, 91%, 60%)", darkColor: "hsl(217, 91%, 35%)" },
  { key: "gym", label: "Gym", color: "hsl(142, 70%, 50%)", darkColor: "hsl(142, 70%, 30%)" },
  { key: "alcohol", label: "No Alcohol", color: "hsl(280, 75%, 70%)", darkColor: "hsl(280, 75%, 40%)" },
  { key: "meditation", label: "Mindfulness", color: "hsl(48, 96%, 53%)", darkColor: "hsl(48, 96%, 35%)" },
];

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
    queryKey: ["habit_days_streak", user?.id],
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
      // No alcohol = completed means they did NOT drink
      return dayData.alcohol?.completed === false || !dayData.alcohol?.completed;
    }
    if (habitKey === "gym") {
      // Check for workout intensity (multi-select) or completed
      const intensities = dayData.gym?.workoutIntensity;
      if (Array.isArray(intensities) && intensities.length > 0) return true;
      if (typeof intensities === "string" && intensities) return true;
      return dayData.gym?.completed === true;
    }
    if (habitKey === "meditation") {
      return dayData.meditation?.completed === true ||
        dayData.meditation?.journaling === true ||
        dayData.meditation?.meditationDone === true;
    }
    return dayData[habitKey]?.completed === true;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Last 7 Days</h3>
      <div className="space-y-1.5">
        {categories.map((cat, catIdx) => (
          <div key={cat.key} className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground w-20 truncate">{cat.label}</span>
            <div className="flex gap-1 flex-1">
              {last7Days.map((day, dayIdx) => {
                const completed = isCompleted(day.date, cat.key);
                return (
                  <div key={day.date} className="flex flex-col items-center gap-0.5 flex-1">
                    {catIdx === 0 && (
                      <span className="text-[9px] text-muted-foreground font-medium">{day.dayLabel}</span>
                    )}
                    <div
                      className={cn(
                        "w-full h-5 rounded-sm transition-colors",
                        completed ? "" : "bg-muted/40"
                      )}
                      style={completed ? { backgroundColor: cat.darkColor } : undefined}
                    />
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
