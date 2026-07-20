import React, { useMemo } from "react";
import { Moon, Dumbbell, Wine, Flame, Check } from "lucide-react";
import useHabits from "@/hooks/useHabits";
import { useStreakHabits } from "@/hooks/useStreakHabits";
import { useDailyCheckinLog } from "@/daily-checkin/storage";
import { checkinStreak } from "@/daily-checkin/utils";
import { getDubaiDate, getTodayISO } from "@/utils/dateUtils";
import { HabitStreakSummary } from "./HabitStreakSummary";
import { HabitData } from "@/types/habit";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  onOpenCheckin?: () => void;
}

type IntensityKey = 'full' | 'hiit' | 'walk' | 'stretch';

const intensityCfg: Record<IntensityKey, { emoji: string; label: string; color: string }> = {
  full: { emoji: '🏋️', label: 'Full', color: 'bg-green-500' },
  hiit: { emoji: '🔥', label: 'HIIT', color: 'bg-orange-500' },
  walk: { emoji: '🚶', label: 'Walk', color: 'bg-blue-400' },
  stretch: { emoji: '🧘', label: 'Stretch', color: 'bg-purple-400' },
};

const getIntensityArray = (wi: HabitData['workoutIntensity']): IntensityKey[] => {
  if (!wi) return [];
  return Array.isArray(wi) ? wi : [wi];
};

export function TodayStreaksCard({ onOpenCheckin: _ }: Props) {
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

  // ---- Sleep ----
  const sleep = dayData?.sleep ?? { planned: false, completed: false };
  const sleepDone = (sleep.sleepHours ?? 0) > 0;
  const updateSleep = (patch: Partial<HabitData>) =>
    updateDay(today, 'sleep', { ...sleep, ...patch });

  // ---- Gym ----
  const gym = dayData?.gym ?? { planned: false, completed: false };
  const gymIntensity = getIntensityArray(gym.workoutIntensity);
  const gymDone = gym.completed && gymIntensity.length > 0;
  const toggleIntensity = (k: IntensityKey) => {
    const next = gymIntensity.includes(k)
      ? gymIntensity.filter(i => i !== k)
      : [...gymIntensity, k];
    if (next.length === 0) {
      updateDay(today, 'gym', { ...gym, completed: false, workoutIntensity: undefined });
    } else {
      updateDay(today, 'gym', { ...gym, completed: true, planned: true, workoutIntensity: next });
    }
  };

  // ---- Alcohol ----
  const alcohol = dayData?.alcohol ?? { planned: false, completed: false };
  // completed=true → sober day; drinkingEventType set → drank (anchor|side)
  const alcoholMode: 'sober' | 'anchor' | 'side' | 'none' =
    alcohol.drinkingEventType === 'anchor' ? 'anchor'
    : alcohol.drinkingEventType === 'side' ? 'side'
    : alcohol.completed ? 'sober'
    : 'none';
  const setAlcohol = (mode: 'sober' | 'anchor' | 'side') => {
    if (mode === 'sober') {
      updateDay(today, 'alcohol', { ...alcohol, completed: true, drinkingEventType: null });
    } else {
      updateDay(today, 'alcohol', { ...alcohol, completed: false, drinkingEventType: mode });
    }
  };

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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Sleep */}
        <div className={cn("p-3 rounded-lg border transition-all",
          sleepDone ? "bg-blue-50 border-blue-200" : "bg-background border-border")}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold">Sleep</span>
            </div>
            {sleepDone && <Check className="w-3.5 h-3.5 text-blue-600" />}
          </div>
          <Input
            type="number" min="0" max="24" step="0.5"
            value={sleep.sleepHours?.toString() ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              const hrs = parseFloat(v);
              if (v === "") updateSleep({ sleepHours: undefined, completed: false });
              else if (!isNaN(hrs)) updateSleep({ sleepHours: hrs, planned: true, completed: hrs >= 7 });
            }}
            placeholder="hrs slept"
            className="h-8 text-sm mb-2"
          />
          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={!!sleep.wellRested}
              onChange={(e) => updateSleep({ wellRested: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-blue-300"
            />
            <span className="text-muted-foreground">😴 Well rested</span>
          </label>
        </div>

        {/* Gym */}
        <div className={cn("p-3 rounded-lg border transition-all",
          gymDone ? "bg-green-50 border-green-200" : "bg-background border-border")}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold">Gym</span>
            </div>
            {gymDone && <Check className="w-3.5 h-3.5 text-green-600" />}
          </div>
          <div className="grid grid-cols-4 gap-1 mb-2">
            {(Object.entries(intensityCfg) as [IntensityKey, typeof intensityCfg[IntensityKey]][]).map(([k, c]) => {
              const sel = gymIntensity.includes(k);
              return (
                <button
                  key={k}
                  onClick={() => toggleIntensity(k)}
                  title={c.label}
                  className={cn("h-7 rounded text-sm border transition-all",
                    sel ? `${c.color} text-white border-transparent` : "border-border bg-background hover:border-green-300")}
                >
                  {c.emoji}
                </button>
              );
            })}
          </div>
          <Input
            value={gym.workoutType ?? ""}
            onChange={(e) => updateDay(today, 'gym', { ...gym, workoutType: e.target.value })}
            placeholder="Type (e.g. Legs)"
            className="h-7 text-xs mb-1"
          />
          <div className="grid grid-cols-2 gap-1">
            <Input
              value={gym.location ?? ""}
              onChange={(e) => updateDay(today, 'gym', { ...gym, location: e.target.value })}
              placeholder="Location"
              className="h-7 text-xs"
            />
            <Input
              value={gym.calories ?? ""}
              onChange={(e) => updateDay(today, 'gym', { ...gym, calories: e.target.value })}
              placeholder="kcal"
              className="h-7 text-xs"
            />
          </div>
        </div>

        {/* Alcohol */}
        <div className={cn("p-3 rounded-lg border transition-all",
          alcoholMode === 'sober' ? "bg-emerald-50 border-emerald-200" :
          alcoholMode === 'anchor' ? "bg-purple-50 border-purple-200" :
          alcoholMode === 'side' ? "bg-blue-50 border-blue-200" :
          "bg-background border-border")}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Wine className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold">Drinks</span>
            </div>
            {alcoholMode !== 'none' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {([
              { key: 'sober', label: 'Sober', emoji: '🚫' },
              { key: 'side', label: 'Side', emoji: '🍷' },
              { key: 'anchor', label: 'Anchor', emoji: '🍷🍷' },
            ] as const).map(o => (
              <button
                key={o.key}
                onClick={() => setAlcohol(o.key)}
                className={cn("h-10 rounded border text-xs font-medium transition-all flex flex-col items-center justify-center",
                  alcoholMode === o.key
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "border-border bg-background hover:border-primary/40")}
              >
                <span className="text-sm leading-none">{o.emoji}</span>
                <span className="text-[10px] mt-0.5">{o.label}</span>
              </button>
            ))}
          </div>
        </div>
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
                  <span className={cn("w-2 h-2 rounded-full", done ? "bg-primary" : "bg-muted-foreground/30")} />
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
