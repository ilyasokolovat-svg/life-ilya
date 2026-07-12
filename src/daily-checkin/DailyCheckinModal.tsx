import React, { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Moon, Dumbbell, Wine, Flame, Check } from "lucide-react";
import useHabits from "@/hooks/useHabits";
import { useStreakHabits } from "@/hooks/useStreakHabits";
import { getDubaiDate, getTodayISO } from "@/utils/dateUtils";
import { useDailyCheckinLog, dismissForToday } from "./storage";
import { checkinStreak } from "./utils";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DailyCheckinModal({ open, onOpenChange }: Props) {
  const { habitsState, updateDay } = useHabits();
  const { streakHabits, toggleDay } = useStreakHabits();
  const { log, markToday } = useDailyCheckinLog();

  const today = getDubaiDate();
  const todayISO = getTodayISO();
  const dayData = habitsState.days[todayISO];

  const [sleepHours, setSleepHours] = useState<string>("");
  const [wellRested, setWellRested] = useState(false);
  const [gymDone, setGymDone] = useState(false);
  const [sober, setSober] = useState(true);
  const [mindful, setMindful] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSleepHours(dayData?.sleep?.sleepHours?.toString() ?? "");
    setWellRested(!!dayData?.sleep?.wellRested);
    const gi = dayData?.gym?.workoutIntensity;
    setGymDone(!!dayData?.gym?.completed || (Array.isArray(gi) ? gi.length > 0 : !!gi));
    // "sober" = alcohol NOT consumed. Default true unless explicitly completed=true.
    setSober(dayData?.alcohol?.completed !== true);
    setMindful(
      dayData?.meditation?.completed === true ||
      dayData?.meditation?.meditationDone === true ||
      dayData?.meditation?.journaling === true
    );
  }, [open, todayISO, dayData]);

  const streak = useMemo(() => checkinStreak(log as any, todayISO), [log, todayISO]);

  const dayIndexFor = (habit: { createdAt: string; goalDuration: number }) => {
    const created = new Date(habit.createdAt);
    const diff = Math.floor((today.getTime() - created.getTime()) / 86400000);
    return Math.max(0, Math.min(diff, habit.goalDuration - 1));
  };

  const [streakToggles, setStreakToggles] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!open) return;
    const initial: Record<string, boolean> = {};
    streakHabits.forEach((h) => {
      initial[h.id] = h.completedDays[dayIndexFor(h)] === "completed";
    });
    setStreakToggles(initial);
  }, [open, streakHabits.length]);

  const handleSave = () => {
    const hours = parseFloat(sleepHours);
    updateDay(today, "sleep", {
      ...(dayData?.sleep ?? { planned: false, completed: false }),
      sleepHours: isNaN(hours) ? undefined : hours,
      wellRested,
      planned: !isNaN(hours) ? true : dayData?.sleep?.planned ?? false,
      completed: !isNaN(hours) ? hours >= 7 : dayData?.sleep?.completed ?? false,
    });
    updateDay(today, "gym", {
      ...(dayData?.gym ?? { planned: false, completed: false }),
      completed: gymDone,
      planned: gymDone || (dayData?.gym?.planned ?? false),
      workoutIntensity: gymDone ? (dayData?.gym?.workoutIntensity ?? "full") : undefined,
    });
    updateDay(today, "alcohol", {
      ...(dayData?.alcohol ?? { planned: false, completed: false }),
      completed: !sober,
    });
    updateDay(today, "meditation", {
      ...(dayData?.meditation ?? { planned: false, completed: false }),
      completed: mindful,
      meditationDone: mindful,
    });

    // Streak habits — apply toggles that differ
    streakHabits.forEach((h) => {
      const idx = dayIndexFor(h);
      const desired = streakToggles[h.id];
      const current = h.completedDays[idx] === "completed";
      if (desired !== current) toggleDay(h.id, idx);
    });

    markToday();
    const newStreak = streak + (log[todayISO] ? 0 : 1);
    toast.success(`🔥 ${newStreak}-day check-in streak — nice!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Daily check-in
            <span className="text-xs font-normal text-muted-foreground ml-auto">
              {today.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sleep */}
          <div className="flex items-center gap-3">
            <Moon className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-sm w-20">Sleep</span>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              placeholder="hrs"
              className="w-20 h-8 text-center"
            />
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <Checkbox checked={wellRested} onCheckedChange={(c) => setWellRested(!!c)} />
              <span>😊 rested</span>
            </label>
          </div>

          {/* Gym */}
          <div className="flex items-center gap-3">
            <Dumbbell className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-sm w-20">Gym</span>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <Checkbox checked={gymDone} onCheckedChange={(c) => setGymDone(!!c)} />
              <span>Done today</span>
            </label>
          </div>

          {/* Alcohol */}
          <div className="flex items-center gap-3">
            <Wine className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="text-sm w-20">Alcohol</span>
            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <Checkbox checked={sober} onCheckedChange={(c) => setSober(!!c)} />
              <span>🚫 Sober today</span>
            </label>
          </div>


          {streakHabits.length > 0 && (
            <>
              <div className="border-t pt-3">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Priority streaks
                </div>
                <div className="space-y-2">
                  {streakHabits.map((h) => (
                    <label key={h.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={!!streakToggles[h.id]}
                        onCheckedChange={(c) =>
                          setStreakToggles((s) => ({ ...s, [h.id]: !!c }))
                        }
                      />
                      <span className="flex-1">{h.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {h.completedDays.filter((d) => d === "completed").length}/{h.goalDuration}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {streak > 0 && (
            <div className="text-sm text-center text-orange-600 font-medium bg-orange-50 rounded-lg py-2">
              🔥 {streak}-day check-in streak — don't break it!
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={() => { dismissForToday(); onOpenChange(false); }}
          >
            Later
          </Button>
          <Button onClick={handleSave}>
            <Check className="w-4 h-4 mr-1" /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
