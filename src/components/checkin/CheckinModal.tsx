import React, { useState, useEffect, useMemo, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getDubaiDate, formatDateISO } from "@/utils/dateUtils";
import { CheckinType } from "@/hooks/useCheckinTrigger";
import {
  useGoalsSystem,
  calculateProgress,
  computeStatus,
  GoalRecord,
  GoalStatus,
} from "@/hooks/useGoalsSystem";
import { cn } from "@/lib/utils";

interface CheckinModalProps {
  type: CheckinType;
  periodKey: string;
  onClose: () => void;
}

// ─── Helpers ────────────────────────────────────────────────
function formatPeriodLabel(type: CheckinType, key: string): string {
  if (type === "weekly") {
    // key = '2025-W11'
    const [y, w] = key.replace("W", "").split("-");
    // Calculate the Monday of ISO week
    const jan4 = new Date(parseInt(y), 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - dayOfWeek + 1 + (parseInt(w) - 1) * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `Week ${w} · ${fmt(monday)} – ${fmt(sunday)}`;
  }
  if (type === "monthly") {
    const [y, m] = key.split("-");
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  // quarterly: '2025-Q1'
  return key.replace("-", " ");
}

const typeLabel: Record<CheckinType, string> = {
  weekly: "WEEKLY REVIEW",
  monthly: "MONTHLY REVIEW",
  quarterly: "QUARTERLY REVIEW",
};

// ─── Rating Circles ─────────────────────────────────────────
function RatingCircles({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cn(
            "w-9 h-9 rounded-full text-sm font-medium transition-all border",
            n === value
              ? "bg-primary text-primary-foreground border-primary scale-110"
              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// ─── Habit summary loader ───────────────────────────────────
function useHabitSummary(dates: string[], userId: string | undefined) {
  const [data, setData] = useState<Record<string, any>>({});
  useEffect(() => {
    if (!userId || !dates.length) return;
    supabase
      .from("habit_days")
      .select("date, habit_data")
      .eq("user_id", userId)
      .in("date", dates)
      .then(({ data: rows }) => {
        const map: Record<string, any> = {};
        rows?.forEach((r) => (map[r.date] = r.habit_data));
        setData(map);
      });
  }, [dates.join(","), userId]);
  return data;
}

function countHabit(
  habitDays: Record<string, any>,
  dates: string[],
  key: string
): number {
  let count = 0;
  for (const d of dates) {
    const day = habitDays[d] as any;
    if (!day) continue;
    if (key === "alcohol") {
      if (day.alcohol?.completed === false || !day.alcohol?.completed) count++;
    } else if (key === "gym") {
      const int = day.gym?.workoutIntensity;
      if (
        (Array.isArray(int) && int.length > 0) ||
        (typeof int === "string" && int) ||
        day.gym?.completed
      )
        count++;
    } else if (key === "meditation") {
      if (
        day.meditation?.completed ||
        day.meditation?.journaling ||
        day.meditation?.meditationDone
      )
        count++;
    } else {
      if (day[key]?.completed) count++;
    }
  }
  return count;
}

function getDatesForWeek(weekKey: string): string[] {
  const [y, w] = weekKey.replace("W", "").split("-").map(Number);
  const jan4 = new Date(y, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (w - 1) * 7);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDateISO(d));
  }
  return dates;
}

function getDatesForMonth(monthKey: string): string[] {
  const [y, m] = monthKey.split("-").map(Number);
  const dates: string[] = [];
  const d = new Date(y, m - 1, 1);
  while (d.getMonth() === m - 1) {
    dates.push(formatDateISO(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function getDatesForQuarter(qKey: string): string[] {
  const [yStr, qStr] = qKey.split("-Q");
  const y = parseInt(yStr);
  const q = parseInt(qStr);
  const startMonth = (q - 1) * 3;
  const dates: string[] = [];
  for (let m = startMonth; m < startMonth + 3; m++) {
    const d = new Date(y, m, 1);
    while (d.getMonth() === m) {
      dates.push(formatDateISO(d));
      d.setDate(d.getDate() + 1);
    }
  }
  return dates;
}

// ─── Main Component ─────────────────────────────────────────
export default function CheckinModal({
  type,
  periodKey,
  onClose,
}: CheckinModalProps) {
  const { user } = useAuth();
  const { getQuarterGoals, annualGoals, saveGoal } = useGoalsSystem();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing in-progress review
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("checkin_reviews")
      .select("answers, completed")
      .eq("user_id", user.id)
      .eq("checkin_type", type)
      .eq("period_key", periodKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data && !data.completed && data.answers) {
          const parsed =
            typeof data.answers === "string"
              ? JSON.parse(data.answers)
              : data.answers;
          setAnswers(parsed);
          // Find first unanswered step
          const totalSteps = getSteps().length;
          for (let i = 0; i < totalSteps; i++) {
            const stepKey = getStepKey(i);
            if (!stepKey || !parsed[stepKey]) {
              setStep(i);
              break;
            }
          }
        }
      });
  }, [user?.id, type, periodKey]);

  // Dates for habit data
  const dates = useMemo(() => {
    if (type === "weekly") return getDatesForWeek(periodKey);
    if (type === "monthly") return getDatesForMonth(periodKey);
    return getDatesForQuarter(periodKey);
  }, [type, periodKey]);

  const habitDays = useHabitSummary(dates, user?.id);

  // Goals for context
  const quarterGoals = useMemo(() => {
    if (type === "quarterly") return getQuarterGoals(periodKey);
    if (type === "monthly") {
      // Find the quarter that contains this month
      const [y, m] = periodKey.split("-").map(Number);
      const q = Math.floor((m - 1) / 3) + 1;
      return getQuarterGoals(`${y}-Q${q}`);
    }
    const today = getDubaiDate();
    const q = Math.floor(today.getMonth() / 3) + 1;
    return getQuarterGoals(`${today.getFullYear()}-Q${q}`);
  }, [type, periodKey, getQuarterGoals]);

  const behindGoals = useMemo(() => {
    const qKey = type === "quarterly" ? periodKey : (() => {
      const [y, m] = periodKey.split("-").map(Number);
      const q = Math.floor((m - 1) / 3) + 1;
      return `${y}-Q${q}`;
    })();
    return quarterGoals.filter((g) => {
      const s = computeStatus(g, qKey);
      return s === "behind" || s === "off_track";
    });
  }, [quarterGoals, type, periodKey]);

  const setAnswer = useCallback(
    (key: string, value: any) => {
      setAnswers((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ─── Step definitions per type ──────────────────────────
  const getSteps = useCallback((): {
    key: string;
    render: () => React.ReactNode;
  }[] => {
    if (type === "weekly") return weeklySteps();
    if (type === "monthly") return monthlySteps();
    return quarterlySteps();
  }, [type, periodKey, answers, habitDays, quarterGoals, behindGoals, dates, annualGoals]);

  function weeklySteps() {
    const sportCount = countHabit(habitDays, dates, "gym");
    const soberCount = countHabit(habitDays, dates, "alcohol");
    const sleepCount = countHabit(habitDays, dates, "sleep");
    const meditationCount = countHabit(habitDays, dates, "meditation");

    return [
      {
        key: "_context",
        render: () => (
          <div className="space-y-4">
            <h3 className="text-[15px] font-medium text-foreground">Last week at a glance</h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Sport</span>
                <span className="font-medium">{sportCount}/7 days</span>
                <span className="text-muted-foreground">Sober</span>
                <span className="font-medium">{soberCount}/7 days</span>
                <span className="text-muted-foreground">Sleep</span>
                <span className="font-medium">{sleepCount}/7 days</span>
                <span className="text-muted-foreground">Meditation</span>
                <span className="font-medium">{meditationCount}/7 days</span>
              </div>
            </div>
            {quarterGoals.filter((g) => {
              const up = g.actual_result as any;
              // Check for goals not updated in 7+ days — simplified
              return computeStatus(g, periodKey) === "off_track" || computeStatus(g, periodKey) === "behind";
            }).length > 0 && (
              <div className="space-y-1">
                {quarterGoals
                  .filter((g) => computeStatus(g, periodKey) === "off_track" || computeStatus(g, periodKey) === "behind")
                  .map((g) => (
                    <div key={g.id} className="text-sm text-warning bg-warning/10 rounded px-3 py-1.5">
                      {g.planned_goal} — needs attention
                    </div>
                  ))}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "week_win",
        render: () => (
          <div className="space-y-4">
            <h3 className="text-[15px] font-medium text-foreground">
              What was your biggest win this week?
            </h3>
            <Textarea
              value={answers.week_win || ""}
              onChange={(e) => setAnswer("week_win", e.target.value)}
              placeholder="Something you're proud of, however small"
              rows={3}
            />
            <h3 className="text-[15px] font-medium text-foreground mt-4">
              What will you do differently next week?
            </h3>
            <Textarea
              value={answers.week_differently || ""}
              onChange={(e) => setAnswer("week_differently", e.target.value)}
              placeholder="One specific thing"
              rows={2}
            />
          </div>
        ),
      },
      {
        key: "week_rating",
        render: () => (
          <div className="space-y-4">
            <h3 className="text-[15px] font-medium text-foreground">
              How was this week overall?
            </h3>
            <RatingCircles
              value={answers.week_rating || 0}
              onChange={(v) => setAnswer("week_rating", v)}
            />
          </div>
        ),
      },
    ];
  }

  function monthlySteps() {
    const sportCount = countHabit(habitDays, dates, "gym");
    const soberCount = countHabit(habitDays, dates, "alcohol");
    const sleepCount = countHabit(habitDays, dates, "sleep");
    const meditationCount = countHabit(habitDays, dates, "meditation");

    const steps: { key: string; render: () => React.ReactNode }[] = [
      {
        key: "_context",
        render: () => (
          <div className="space-y-4">
            <h3 className="text-[15px] font-medium text-foreground">
              {formatPeriodLabel("monthly", periodKey).split(" ")[0]} at a glance
            </h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Sport</span>
                <span className="font-medium">{sportCount} days</span>
                <span className="text-muted-foreground">Sober</span>
                <span className="font-medium">{soberCount} days</span>
                <span className="text-muted-foreground">Sleep</span>
                <span className="font-medium">{sleepCount} days</span>
                <span className="text-muted-foreground">Meditation</span>
                <span className="font-medium">{meditationCount} days</span>
              </div>
            </div>
            {behindGoals.length > 0 && (
              <div className="space-y-1 mt-2">
                <p className="text-xs text-muted-foreground uppercase">Goals needing attention</p>
                {behindGoals.map((g) => (
                  <div key={g.id} className="text-sm text-destructive bg-destructive/10 rounded px-3 py-1.5">
                    {g.planned_goal} — {calculateProgress(g.actual_result)}%
                  </div>
                ))}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "month_proud",
        render: () => (
          <div className="space-y-4">
            <h3 className="text-[15px] font-medium text-foreground">
              What are you most proud of this month?
            </h3>
            <Textarea
              value={answers.month_proud || ""}
              onChange={(e) => setAnswer("month_proud", e.target.value)}
              rows={3}
            />
          </div>
        ),
      },
      {
        key: "month_drained",
        render: () => (
          <div className="space-y-4">
            <h3 className="text-[15px] font-medium text-foreground">
              What drained your energy most?
            </h3>
            <Textarea
              value={answers.month_drained || ""}
              onChange={(e) => setAnswer("month_drained", e.target.value)}
              placeholder="A situation, habit, or pattern"
              rows={3}
            />
          </div>
        ),
      },
    ];

    // Conditional step for behind goals
    if (behindGoals.length > 0) {
      steps.push({
        key: "month_goal_blockers",
        render: () => (
          <div className="space-y-4">
            <h3 className="text-[15px] font-medium text-foreground">
              These goals fell behind — what got in the way?
            </h3>
            {behindGoals.map((g) => (
              <div key={g.id} className="space-y-1">
                <p className="text-sm font-medium">
                  {g.planned_goal}{" "}
                  <span className="text-destructive">
                    ended at {calculateProgress(g.actual_result)}%
                  </span>
                </p>
                <Textarea
                  value={
                    (answers.month_goal_blockers || []).find(
                      (b: any) => b.goal_id === g.id
                    )?.text || ""
                  }
                  onChange={(e) => {
                    const blockers = [
                      ...(answers.month_goal_blockers || []).filter(
                        (b: any) => b.goal_id !== g.id
                      ),
                      { goal_id: g.id, text: e.target.value },
                    ];
                    setAnswer("month_goal_blockers", blockers);
                  }}
                  rows={2}
                />
              </div>
            ))}
          </div>
        ),
      });
    }

    // Get next month name for commitment
    const [y, m] = periodKey.split("-").map(Number);
    const nextMonth = new Date(y, m, 1); // m is already 1-based, so this gives next month
    const nextMonthName = nextMonth.toLocaleDateString("en-US", { month: "long" });

    steps.push({
      key: "month_commitment",
      render: () => (
        <div className="space-y-4">
          <h3 className="text-[15px] font-medium text-foreground">
            What's your one non-negotiable commitment for {nextMonthName}?
          </h3>
          <Input
            value={answers.month_commitment || ""}
            onChange={(e) => setAnswer("month_commitment", e.target.value)}
            placeholder="Your one commitment..."
          />
          <h3 className="text-[15px] font-medium text-foreground mt-4">
            Rate {formatPeriodLabel("monthly", periodKey).split(" ")[0]} overall
          </h3>
          <RatingCircles
            value={answers.month_rating || 0}
            onChange={(v) => setAnswer("month_rating", v)}
          />
        </div>
      ),
    });

    return steps;
  }

  function quarterlySteps() {
    const sportCount = countHabit(habitDays, dates, "gym");
    const soberCount = countHabit(habitDays, dates, "alcohol");
    const sleepCount = countHabit(habitDays, dates, "sleep");
    const meditationCount = countHabit(habitDays, dates, "meditation");

    const qLabel = periodKey.replace("-", " ");

    const steps: { key: string; render: () => React.ReactNode }[] = [
      {
        key: "_context",
        render: () => (
          <div className="space-y-4">
            <h3 className="text-[15px] font-medium text-foreground">{qLabel} in numbers</h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Sport</span>
                <span className="font-medium">{sportCount} days</span>
                <span className="text-muted-foreground">Sober</span>
                <span className="font-medium">{soberCount} days</span>
                <span className="text-muted-foreground">Sleep</span>
                <span className="font-medium">{sleepCount} days</span>
                <span className="text-muted-foreground">Meditation</span>
                <span className="font-medium">{meditationCount} days</span>
              </div>
            </div>
            {quarterGoals.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase mb-2">Goals</p>
                {quarterGoals.map((g) => {
                  const pct = calculateProgress(g.actual_result);
                  const status = computeStatus(g, periodKey);
                  return (
                    <div key={g.id} className="flex items-center justify-between text-sm py-1">
                      <span className="truncate">{g.planned_goal}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        status === "on_track" && "bg-success/20 text-success",
                        status === "behind" && "bg-warning/20 text-warning",
                        status === "off_track" && "bg-destructive/20 text-destructive",
                        status === "completed" && "bg-success/20 text-success",
                      )}>
                        {pct === -1 ? `${g.actual_result?.self_rating || 0}/10` : `${pct}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "q_goal_outcomes",
        render: () => (
          <div className="space-y-4">
            <h3 className="text-[15px] font-medium text-foreground">
              For each goal — what was the result?
            </h3>
            {quarterGoals.length === 0 && (
              <p className="text-sm text-muted-foreground">No goals to review.</p>
            )}
            {quarterGoals.map((g) => {
              const pct = calculateProgress(g.actual_result);
              return (
                <div key={g.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{g.planned_goal}</span>
                    <span className="text-xs text-muted-foreground">
                      {pct === -1 ? `${g.actual_result?.self_rating || 0}/10` : `${pct}%`}
                    </span>
                  </div>
                  <Textarea
                    value={
                      (answers.q_goal_outcomes || []).find(
                        (o: any) => o.goal_id === g.id
                      )?.text || ""
                    }
                    onChange={(e) => {
                      const outcomes = [
                        ...(answers.q_goal_outcomes || []).filter(
                          (o: any) => o.goal_id !== g.id
                        ),
                        { goal_id: g.id, text: e.target.value },
                      ];
                      setAnswer("q_goal_outcomes", outcomes);
                    }}
                    placeholder="Did you hit it? What worked or didn't?"
                    rows={2}
                  />
                </div>
              );
            })}
          </div>
        ),
      },
      {
        key: "q_least_important",
        render: () => (
          <div className="space-y-4">
            <h3 className="text-[15px] font-medium text-foreground">
              Which goal mattered least this quarter?
            </h3>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={answers.q_least_important_goal || ""}
              onChange={(e) => setAnswer("q_least_important_goal", e.target.value)}
            >
              <option value="">Select a goal...</option>
              <option value="none">None of them — all mattered</option>
              {quarterGoals.map((g) => (
                <option key={g.id} value={g.id}>{g.planned_goal}</option>
              ))}
            </select>
            {answers.q_least_important_goal && answers.q_least_important_goal !== "none" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Keep it next quarter?</p>
                <div className="flex gap-2">
                  {(["yes", "no", "modify"] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswer("q_keep_goal", opt)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm border transition-colors",
                        answers.q_keep_goal === opt
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      {opt === "yes" ? "Yes" : opt === "no" ? "No" : "Modify it"}
                    </button>
                  ))}
                </div>
                {answers.q_keep_goal === "modify" && (
                  <Input
                    value={answers.q_modified_goal || ""}
                    onChange={(e) => setAnswer("q_modified_goal", e.target.value)}
                    placeholder="Revised goal..."
                  />
                )}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "q_hardest_habit",
        render: () => (
          <div className="space-y-4">
            <h3 className="text-[15px] font-medium text-foreground">
              Which habit was hardest to maintain — and why?
            </h3>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={answers.q_hardest_habit || ""}
              onChange={(e) => setAnswer("q_hardest_habit", e.target.value)}
            >
              <option value="">Select...</option>
              {["Sport", "No alcohol", "Sleep", "Meditation", "Other"].map((h) => (
                <option key={h} value={h.toLowerCase()}>{h}</option>
              ))}
            </select>
            <Textarea
              value={answers.q_hardest_habit_why || ""}
              onChange={(e) => setAnswer("q_hardest_habit_why", e.target.value)}
              placeholder="Why was it hard?"
              rows={2}
            />
          </div>
        ),
      },
      {
        key: "q_best_decision",
        render: () => (
          <div className="space-y-4">
            <h3 className="text-[15px] font-medium text-foreground">
              What was the single best decision you made this quarter?
            </h3>
            <Textarea
              value={answers.q_best_decision || ""}
              onChange={(e) => setAnswer("q_best_decision", e.target.value)}
              placeholder="A choice that paid off — big or small"
              rows={3}
            />
          </div>
        ),
      },
      {
        key: "q_different_next_q",
        render: () => (
          <div className="space-y-4">
            <h3 className="text-[15px] font-medium text-foreground">
              What do you want to be different next quarter?
            </h3>
            <Textarea
              value={answers.q_different_next_q || ""}
              onChange={(e) => setAnswer("q_different_next_q", e.target.value)}
              placeholder="A behaviour, focus shift, or commitment"
              rows={3}
            />
          </div>
        ),
      },
      {
        key: "q_goal_planning",
        render: () => {
          const kept = answers.q_kept_goals || quarterGoals.filter((g) => calculateProgress(g.actual_result) < 100).map((g) => g.id);
          const completed = quarterGoals.filter((g) => calculateProgress(g.actual_result) >= 100 || g.actual_result?.completed);
          const incomplete = quarterGoals.filter((g) => calculateProgress(g.actual_result) < 100 && !g.actual_result?.completed);

          return (
            <div className="space-y-4">
              <h3 className="text-[15px] font-medium text-foreground">
                Plan your goals for next quarter
              </h3>
              {incomplete.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase">Carry forward</p>
                  {incomplete.map((g) => {
                    const pct = calculateProgress(g.actual_result);
                    const isKept = (answers.q_kept_goals || incomplete.map((x) => x.id)).includes(g.id);
                    return (
                      <div key={g.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                        <div>
                          <span className="text-sm">{g.planned_goal}</span>
                          {pct < 50 && (
                            <span className="text-[10px] text-destructive ml-2">Consider dropping — only {pct}%</span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const current = answers.q_kept_goals || incomplete.map((x) => x.id);
                            setAnswer(
                              "q_kept_goals",
                              isKept ? current.filter((id: string) => id !== g.id) : [...current, g.id]
                            );
                          }}
                          className={cn(
                            "text-xs px-2 py-1 rounded border transition-colors",
                            isKept
                              ? "bg-primary/10 text-primary border-primary/30"
                              : "text-muted-foreground border-border"
                          )}
                        >
                          {isKept ? "Keep →" : "Drop"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {completed.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase">Completed</p>
                  {completed.map((g) => (
                    <div key={g.id} className="text-sm text-muted-foreground line-through px-3 py-1">
                      ✓ {g.planned_goal}
                    </div>
                  ))}
                </div>
              )}

              {/* New goals for next quarter */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase">Add new goals</p>
                {(answers.q_new_goals || []).map((goal: { name: string; subcategory: string }, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-2">
                    <div className="flex-1">
                      <span className="text-sm">{goal.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2 capitalize">{goal.subcategory}</span>
                    </div>
                    <button
                      onClick={() => {
                        const current = [...(answers.q_new_goals || [])];
                        current.splice(idx, 1);
                        setAnswer("q_new_goals", current);
                      }}
                      className="text-xs text-destructive hover:text-destructive/80"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="bg-muted/20 rounded-lg p-3 space-y-2 border border-dashed border-border">
                  <Input
                    placeholder="Goal name — e.g. Read 5 books"
                    value={answers._new_goal_name || ""}
                    onChange={(e) => setAnswer("_new_goal_name", e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <select
                      value={answers._new_goal_sub || "physical"}
                      onChange={(e) => setAnswer("_new_goal_sub", e.target.value)}
                      className="flex-1 text-sm rounded-md border border-border bg-background px-3 py-1.5"
                    >
                      <option value="physical">Physical</option>
                      <option value="financial">Financial</option>
                      <option value="skills">Skills</option>
                      <option value="personal">Personal</option>
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!answers._new_goal_name?.trim()}
                      onClick={() => {
                        const current = answers.q_new_goals || [];
                        setAnswer("q_new_goals", [
                          ...current,
                          {
                            name: answers._new_goal_name.trim(),
                            subcategory: answers._new_goal_sub || "physical",
                          },
                        ]);
                        setAnswer("_new_goal_name", "");
                        setAnswer("_new_goal_sub", "physical");
                      }}
                    >
                      + Add
                    </Button>
                  </div>
                </div>
              </div>

              {incomplete.length === 0 && completed.length === 0 && (answers.q_new_goals || []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No previous goals found. Add your first goals for next quarter above.
                </p>
              )}
            </div>
          );
        },
      },
      {
        key: "q_rating",
        render: () => (
          <div className="space-y-4">
            <h3 className="text-[15px] font-medium text-foreground">
              Your annual goals — still the right ones?
            </h3>
            {annualGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No annual goals set.</p>
            ) : (
              <div className="space-y-2">
                {annualGoals.map((g) => (
                  <div key={g.id} className="bg-muted/30 rounded-lg px-3 py-2">
                    <span className="text-sm">{g.planned_goal}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setAnswer("q_annual_goals_ok", true)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm border transition-colors",
                      answers.q_annual_goals_ok === true
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    Yes, continue
                  </button>
                  <button
                    onClick={() => setAnswer("q_annual_goals_ok", false)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm border transition-colors",
                      answers.q_annual_goals_ok === false
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    No, I want to edit them
                  </button>
                </div>
              </div>
            )}
            <h3 className="text-[15px] font-medium text-foreground mt-6">
              Rate {qLabel} overall
            </h3>
            <RatingCircles
              value={answers.q_rating || 0}
              onChange={(v) => setAnswer("q_rating", v)}
            />
          </div>
        ),
      },
    ];

    return steps;
  }

  function getStepKey(idx: number): string | null {
    const steps = getSteps();
    return steps[idx]?.key || null;
  }

  const steps = getSteps();
  const totalSteps = steps.length;
  const isLastStep = step === totalSteps - 1;

  // Save progress to Supabase
  const saveProgress = async (completed: boolean) => {
    if (!user?.id) return;
    const payload = {
      user_id: user.id,
      checkin_type: type,
      period_key: periodKey,
      answers: JSON.stringify(answers),
      completed,
      updated_at: new Date().toISOString(),
    };

    // Upsert
    const { data: existing } = await supabase
      .from("checkin_reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("checkin_type", type)
      .eq("period_key", periodKey)
      .maybeSingle();

    if (existing) {
      await supabase.from("checkin_reviews").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("checkin_reviews").insert(payload);
    }
  };

  const updateCheckinState = async () => {
    if (!user?.id) return;
    const today = formatDateISO(getDubaiDate());
    const field =
      type === "weekly"
        ? "weekly_last"
        : type === "monthly"
        ? "monthly_last"
        : "quarterly_last";

    const { data: existing } = await supabase
      .from("checkin_state")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("checkin_state")
        .update({ [field]: today, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("checkin_state").insert({
        user_id: user.id,
        [field]: today,
      });
    }
  };

  const handleCrossSystemWrites = async () => {
    if (!user?.id) return;

    if (type === "monthly" && answers.month_commitment) {
      // Write commitment to goals_data
      const [y, m] = periodKey.split("-").map(Number);
      const nextMonthKey = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}`;

      const { data: existing } = await supabase
        .from("goals_data")
        .select("id")
        .eq("user_id", user.id)
        .eq("category", "monthly_commitment")
        .eq("subcategory", "non_negotiable")
        .eq("period_type", "month")
        .eq("period_key", nextMonthKey)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("goals_data")
          .update({ planned_goal: answers.month_commitment, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("goals_data").insert({
          user_id: user.id,
          category: "monthly_commitment",
          subcategory: "non_negotiable",
          period_type: "month",
          period_key: nextMonthKey,
          planned_goal: answers.month_commitment,
        });
      }
    }

    if (type === "quarterly") {
      // Write best decision to milestones
      if (answers.q_best_decision) {
        const [yStr, qStr] = periodKey.split("-Q");
        const y = parseInt(yStr);
        const q = parseInt(qStr);
        const lastDay = new Date(y, q * 3, 0);

        await supabase.from("milestones").insert({
          user_id: user.id,
          title: answers.q_best_decision.slice(0, 60),
          description: answers.q_best_decision,
          date: formatDateISO(lastDay),
          category: "growth",
          emoji: "🏆",
        });
      }

      // Write quarterly rating
      if (answers.q_rating) {
        const { data: existing } = await supabase
          .from("goals_data")
          .select("id")
          .eq("user_id", user.id)
          .eq("category", "quarterly_rating")
          .eq("period_key", periodKey)
          .maybeSingle();

        const ratingPayload = {
          user_id: user.id,
          category: "quarterly_rating",
          subcategory: "overall",
          period_type: "quarter",
          period_key: periodKey,
          actual_result: JSON.stringify({ rating: answers.q_rating }),
        };

        if (existing) {
          await supabase.from("goals_data").update(ratingPayload).eq("id", existing.id);
        } else {
          await supabase.from("goals_data").insert(ratingPayload);
        }
      }

      // Write kept goals to next quarter
      if (answers.q_kept_goals?.length) {
        const [yStr, qStr] = periodKey.split("-Q");
        const y = parseInt(yStr);
        const q = parseInt(qStr);
        const nextQ = q === 4 ? 1 : q + 1;
        const nextY = q === 4 ? y + 1 : y;
        const nextPeriodKey = `${nextY}-Q${nextQ}`;

        for (const goalId of answers.q_kept_goals) {
          const srcGoal = quarterGoals.find((g) => g.id === goalId);
          if (!srcGoal) continue;

          // Check if already exists in next quarter
          const { data: exists } = await supabase
            .from("goals_data")
            .select("id")
            .eq("user_id", user.id)
            .eq("category", "quarterly_goal")
            .eq("period_key", nextPeriodKey)
            .eq("planned_goal", srcGoal.planned_goal)
            .maybeSingle();

          if (!exists) {
            await supabase.from("goals_data").insert({
              user_id: user.id,
              category: "quarterly_goal",
              subcategory: srcGoal.subcategory,
              period_type: "quarter",
              period_key: nextPeriodKey,
              planned_goal: srcGoal.planned_goal,
              actual_result: JSON.stringify({
                progress_type: srcGoal.actual_result?.progress_type || "percentage",
                current_value: 0,
                target_value: srcGoal.actual_result?.target_value || 100,
                milestones: [],
                self_rating: 0,
                prev_rating: srcGoal.actual_result?.self_rating || 0,
                quarterly_action: "",
                annual_goal_id: srcGoal.actual_result?.annual_goal_id || null,
                completed: false,
              }),
            });
          }
        }
      }

      // Write new goals from the inline form
      if (answers.q_new_goals?.length) {
        const [yStr, qStr] = periodKey.split("-Q");
        const y = parseInt(yStr);
        const q = parseInt(qStr);
        const nextQ = q === 4 ? 1 : q + 1;
        const nextY = q === 4 ? y + 1 : y;
        const nextPeriodKey = `${nextY}-Q${nextQ}`;

        for (const newGoal of answers.q_new_goals) {
          await supabase.from("goals_data").insert({
            user_id: user.id,
            category: "quarterly_goal",
            subcategory: newGoal.subcategory,
            period_type: "quarter",
            period_key: nextPeriodKey,
            planned_goal: newGoal.name,
            actual_result: JSON.stringify({
              progress_type: "percentage",
              current_value: 0,
              target_value: 100,
              milestones: [],
              self_rating: 0,
              prev_rating: 0,
              quarterly_action: "",
              annual_goal_id: null,
              completed: false,
            }),
          });
        }
      }
    }
  };

  const handleNext = async () => {
    if (isLastStep) {
      setSaving(true);
      await saveProgress(true);
      await updateCheckinState();
      await handleCrossSystemWrites();
      setSaving(false);
      onClose();
      return;
    }
    // Save progress incrementally
    await saveProgress(false);
    setStep((s) => s + 1);
  };

  const handleSkipQuestion = async () => {
    if (isLastStep) {
      setSaving(true);
      await saveProgress(true);
      await updateCheckinState();
      await handleCrossSystemWrites();
      setSaving(false);
      onClose();
      return;
    }
    await saveProgress(false);
    setStep((s) => s + 1);
  };

  const handleDismiss = () => {
    if (!showSkipConfirm) {
      setShowSkipConfirm(true);
      return;
    }
    // Save partial progress
    saveProgress(false);
    // Mark as shown but not completed — still update state so it won't show again this session
    updateCheckinState();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-card border border-border rounded-xl w-[90vw] max-w-[560px] max-h-[85vh] flex flex-col overflow-hidden shadow-lg">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {typeLabel[type]}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatPeriodLabel(type, periodKey)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              Step {step + 1} of {totalSteps}
            </span>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Skip confirmation */}
        {showSkipConfirm && (
          <div className="px-5 py-3 bg-destructive/10 border-b border-border flex items-center justify-between">
            <span className="text-sm text-destructive">Skip this review?</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowSkipConfirm(false)}>
                No
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  saveProgress(false);
                  updateCheckinState();
                  onClose();
                }}
              >
                Yes, skip
              </Button>
            </div>
          </div>
        )}

        {/* Progress dots */}
        <div className="px-5 pt-3 flex gap-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {steps[step]?.render()}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Back
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? "Saving..." : isLastStep ? "Save & close" : "Next →"}
            </Button>
          </div>
          {steps[step]?.key !== "_context" && (
            <button
              onClick={handleSkipQuestion}
              className="text-[11px] text-muted-foreground hover:text-foreground mt-2 w-full text-center transition-colors"
            >
              Skip this question
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
