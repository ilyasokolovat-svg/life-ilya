import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getDubaiDate, formatDateISO } from "@/utils/dateUtils";
import { useStreakHabits } from "@/hooks/useStreakHabits";
import { Moon, Dumbbell, Wine } from "lucide-react";
import { cn } from "@/lib/utils";

const coreCategories = [
  { key: "sleep", label: "Sleep", Icon: Moon, color: "hsl(217, 91%, 55%)" },
  { key: "gym", label: "Gym", Icon: Dumbbell, color: "hsl(142, 70%, 45%)" },
  { key: "alcohol", label: "Sober", Icon: Wine, color: "hsl(280, 65%, 60%)" },
] as const;

function isDone(dayData: any, key: string): boolean {
  if (!dayData) return false;
  if (key === "alcohol") return dayData.alcohol?.completed === false || !dayData.alcohol?.completed;
  if (key === "gym") {
    const i = dayData.gym?.workoutIntensity;
    if (Array.isArray(i) && i.length) return true;
    if (typeof i === "string" && i) return true;
    return dayData.gym?.completed === true;
  }
  if (key === "meditation") {
    return (
      dayData.meditation?.completed === true ||
      dayData.meditation?.meditationDone === true ||
      dayData.meditation?.journaling === true
    );
  }
  if (key === "sleep") return (dayData.sleep?.sleepHours ?? 0) > 0;
  return false;
}

export function HeaderStreakStrip() {
  const { user } = useAuth();
  const { streakHabits } = useStreakHabits();
  const todayISO = formatDateISO(getDubaiDate());

  const last7 = useMemo(() => {
    const today = getDubaiDate();
    const arr: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      arr.push(formatDateISO(d));
    }
    return arr;
  }, []);

  const { data: habitDays = {} } = useQuery({
    queryKey: ["habit_days_strip", user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      const { data } = await supabase
        .from("habit_days")
        .select("date, habit_data")
        .eq("user_id", user.id);
      const out: Record<string, any> = {};
      data?.forEach((r) => { out[r.date] = r.habit_data; });
      return out;
    },
    enabled: !!user?.id,
  });

  const dayIndexFor = (h: { createdAt: string; goalDuration: number }) => {
    const created = new Date(h.createdAt);
    const diff = Math.floor((getDubaiDate().getTime() - created.getTime()) / 86400000);
    return Math.max(0, Math.min(diff, h.goalDuration - 1));
  };

  return (
    <div className="hidden md:flex items-center gap-1.5">
      {coreCategories.map(({ key, label, Icon, color }) => {
        const todayDone = isDone(habitDays[todayISO], key);
        return (
          <div
            key={key}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full border text-xs",
              todayDone ? "bg-secondary" : "bg-background"
            )}
            title={label}
          >
            <Icon className="w-3 h-3" style={{ color }} />
            <div className="flex gap-0.5">
              {last7.map((iso) => {
                const done = isDone(habitDays[iso], key);
                const isToday = iso === todayISO;
                return (
                  <span
                    key={iso}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      done ? "" : "bg-muted",
                      isToday && !done && "ring-1 ring-orange-400 animate-pulse"
                    )}
                    style={done ? { backgroundColor: color } : undefined}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
      {streakHabits.slice(0, 2).map((h) => {
        const idx = dayIndexFor(h);
        const todayDone = h.completedDays[idx] === "completed";
        return (
          <div
            key={h.id}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full border text-xs max-w-[140px]",
              todayDone ? "bg-secondary" : "bg-background"
            )}
            title={h.name}
          >
            <span className="truncate">{h.name}</span>
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                todayDone ? "bg-primary" : "bg-muted ring-1 ring-orange-400 animate-pulse"
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
