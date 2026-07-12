import React, { useMemo } from "react";
import { Moon, Dumbbell, Wine, Flame, Check } from "lucide-react";
import useHabits from "@/hooks/useHabits";
import { useStreakHabits } from "@/hooks/useStreakHabits";
import { useDailyCheckinLog } from "@/daily-checkin/storage";
import { checkinStreak } from "@/daily-checkin/utils";
import { getDubaiDate, getTodayISO } from "@/utils/dateUtils";
import { HabitStreakSummary } from "./HabitStreakSummary";
import { cn } from "@/lib/utils";

interface Props {
  onOpenCheckin: () => void;
}

export function TodayStreaksCard({ onOpenCheckin }: Props) {
  const { habitsState, updateDay } = useHabits();
  const { streakHabits, toggleDay } = useStreakHabits();
  const { log } = useDailyCheckinLog();

  const today = getDubaiDate();
  const todayISO = getTodayISO();
  const dayData = habitsState.days[todayISO];
  const streak = useMemo(() => checkinStreak(log as any, todayISO), [log, todayISO]);

  const dayIndexFor = (h: { createdAt: string; goalDuration: number }) => {
    const created = new Date(h.createdAt);
    const diff = Math.floor((today.getTime() - created.getTime()) / 86400000);
    return Math.max(0, Math.min(diff, h.goalDuration - 1));
  };

  const coreTiles = [
    {
      key: "sleep", label: "Sleep", Icon: Moon,
      done: (dayData?.sleep?.sleepHours ?? 0) > 0,
      sub: dayData?.sleep?.sleepHours ? `${dayData.sleep.sleepHours}h` : "Log hours",
      onToggle: () => {
        const hrs = dayData?.sleep?.sleepHours;
        updateDay(today, "sleep", {
          ...(dayData?.sleep ?? { planned: false, completed: false }),
          sleepHours: hrs ? undefined : 7.5,
          completed: !hrs,
          planned: !hrs,
        });
      },
    },
    {
      key: "gym", label: "Gym", Icon: Dumbbell,
      done: !!dayData?.gym?.completed,
      sub: dayData?.gym?.completed ? "Done" : "Tap to log",
      onToggle: () => updateDay(today, "gym", {
        ...(dayData?.gym ?? { planned: false, completed: false }),
        completed: !dayData?.gym?.completed,
        planned: true,
        workoutIntensity: !dayData?.gym?.completed ? "full" : undefined,
      }),
    },
    {
      key: "alcohol", label: "Sober", Icon: Wine,
      done: dayData?.alcohol?.completed !== true,
      sub: dayData?.alcohol?.completed === true ? "Drank" : "Sober",
      onToggle: () => updateDay(today, "alcohol", {
        ...(dayData?.alcohol ?? { planned: false, completed: false }),
        completed: !(dayData?.alcohol?.completed === true),
      }),
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Today · {today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </h3>
          {streak > 0 && (
            <div className="flex items-center gap-1 text-xs text-orange-600 font-medium mt-0.5">
              <Flame className="w-3.5 h-3.5" /> {streak}-day check-in streak
            </div>
          )}
        </div>
        <button
          onClick={onOpenCheckin}
          className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium hover:opacity-90"
        >
          Daily check-in
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {coreTiles.map(({ key, label, Icon, done, sub, onToggle }) => (
          <button
            key={key}
            onClick={onToggle}
            className={cn(
              "flex flex-col items-start p-3 rounded-lg border transition-all text-left",
              done
                ? "bg-primary/5 border-primary/30"
                : "bg-background border-border hover:border-primary/30"
            )}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <Icon className={cn("w-4 h-4", done ? "text-primary" : "text-muted-foreground")} />
              {done && <Check className="w-3.5 h-3.5 text-primary" />}
            </div>
            <div className="text-xs font-medium text-foreground">{label}</div>
            <div className="text-[10px] text-muted-foreground">{sub}</div>
          </button>
        ))}
      </div>

      {streakHabits.length > 0 && (
        <div className="border-t border-border pt-3 mb-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
            Priority streaks
          </div>
          <div className="flex flex-wrap gap-2">
            {streakHabits.map((h) => {
              const idx = dayIndexFor(h);
              const done = h.completedDays[idx] === "completed";
              const completedCount = h.completedDays.filter((d) => d === "completed").length;
              return (
                <button
                  key={h.id}
                  onClick={() => toggleDay(h.id, idx)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all",
                    done
                      ? "bg-primary/10 border-primary/40 text-foreground"
                      : "bg-background border-border hover:border-primary/30"
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      done ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                  <span className="font-medium">{h.name}</span>
                  <span className="text-muted-foreground">
                    {completedCount}/{h.goalDuration}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <HabitStreakSummary />
    </div>
  );
}
