import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getDubaiDate } from "@/utils/dateUtils";
import { toast } from "sonner";
import { useMemo } from "react";

export type ProgressType = "numeric" | "percentage" | "milestone" | "self_rating";
export type GoalSubcategory = "physical" | "financial" | "skills" | "personal";
export type GoalStatus = "on_track" | "behind" | "off_track" | "completed";

export interface MilestoneItem {
  id: string;
  text: string;
  done: boolean;
}

export interface GoalProgress {
  progress_type: ProgressType;
  current_value: number;
  target_value: number;
  milestones: MilestoneItem[];
  self_rating: number;
  prev_rating: number;
  quarterly_action?: string;
  annual_goal_id?: string | null;
  completed?: boolean;
  notes?: string;
}

export interface GoalRecord {
  id: string;
  category: string;
  subcategory: GoalSubcategory;
  period_type: string;
  period_key: string;
  planned_goal: string;
  actual_result: GoalProgress | null;
}

const CATEGORY_COLORS: Record<GoalSubcategory, string> = {
  physical: "hsl(var(--physical-dark))",
  financial: "hsl(var(--financial-dark))",
  skills: "hsl(var(--skills-dark))",
  personal: "hsl(var(--mental-dark))",
};

const STATUS_COLORS = {
  on_track: "hsl(var(--success))",
  behind: "hsl(var(--warning))",
  off_track: "hsl(var(--destructive))",
  completed: "hsl(var(--success))",
};

export function getCategoryColor(sub: GoalSubcategory) {
  return CATEGORY_COLORS[sub] || "hsl(var(--primary))";
}

export function getStatusColor(status: GoalStatus) {
  return STATUS_COLORS[status];
}

export function getCurrentQuarter(): { key: string; label: string; index: number } {
  const d = getDubaiDate();
  const q = Math.floor(d.getMonth() / 3) + 1;
  const y = d.getFullYear();
  return { key: `${y}-Q${q}`, label: `Q${q}`, index: q };
}

export function getQuarterDates(periodKey: string): { start: Date; end: Date; daysTotal: number } {
  const [yearStr, qStr] = periodKey.split("-Q");
  const year = parseInt(yearStr);
  const q = parseInt(qStr);
  const startMonth = (q - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0); // last day of quarter
  const daysTotal = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return { start, end, daysTotal };
}

export function calculateProgress(progress: GoalProgress | null): number {
  if (!progress) return 0;
  switch (progress.progress_type) {
    case "numeric":
      if (!progress.target_value) return 0;
      return Math.min(100, Math.round((progress.current_value / progress.target_value) * 100));
    case "percentage":
      return Math.round(progress.current_value || 0);
    case "milestone": {
      if (!progress.milestones?.length) return 0;
      const done = progress.milestones.filter((m) => m.done).length;
      return Math.round((done / progress.milestones.length) * 100);
    }
    case "self_rating":
      return -1; // special: no percentage
    default:
      return 0;
  }
}

export function computeStatus(goal: GoalRecord, periodKey: string): GoalStatus {
  const progress = goal.actual_result;
  if (progress?.completed) return "completed";

  const pct = calculateProgress(progress);
  if (pct === -1) return "on_track"; // self-rating goals are always "on track"

  const { start, daysTotal } = getQuarterDates(periodKey);
  const today = getDubaiDate();
  const daysElapsed = Math.max(1, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const expectedProgress = (daysElapsed / daysTotal) * 100;

  if (pct >= expectedProgress * 0.85) return "on_track";
  if (pct >= expectedProgress * 0.5) return "behind";
  return "off_track";
}

export function getDaysRemaining(periodKey: string): number {
  const { end } = getQuarterDates(periodKey);
  const today = getDubaiDate();
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}

function parseGoalRecord(row: any): GoalRecord {
  let parsed: GoalProgress | null = null;
  if (row.actual_result) {
    try {
      parsed = typeof row.actual_result === "string"
        ? JSON.parse(row.actual_result)
        : row.actual_result;
    } catch { parsed = null; }
  }
  return {
    id: row.id,
    category: row.category,
    subcategory: row.subcategory as GoalSubcategory,
    period_type: row.period_type,
    period_key: row.period_key,
    planned_goal: row.planned_goal || "",
    actual_result: parsed,
  };
}

export function useGoalsSystem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: allGoals = [], isLoading } = useQuery({
    queryKey: ["goals_system", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("goals_data")
        .select("*")
        .eq("user_id", user.id)
        .in("category", ["quarterly_goal", "annual_goal"]);
      if (error) throw error;
      return (data || []).map(parseGoalRecord);
    },
    enabled: !!user?.id,
  });

  const quarterlyGoals = useMemo(
    () => allGoals.filter((g) => g.category === "quarterly_goal"),
    [allGoals]
  );

  const annualGoals = useMemo(
    () => allGoals.filter((g) => g.category === "annual_goal"),
    [allGoals]
  );

  const getQuarterGoals = (periodKey: string) =>
    quarterlyGoals.filter((g) => g.period_key === periodKey);

  const getYearGoals = (year: string) =>
    annualGoals.filter((g) => g.period_key === year);

  const saveGoalMutation = useMutation({
    mutationFn: async (goal: {
      id?: string;
      category: string;
      subcategory: string;
      period_type: string;
      period_key: string;
      planned_goal: string;
      actual_result: GoalProgress;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const payload = {
        user_id: user.id,
        category: goal.category,
        subcategory: goal.subcategory,
        period_type: goal.period_type,
        period_key: goal.period_key,
        planned_goal: goal.planned_goal,
        actual_result: JSON.stringify(goal.actual_result),
        updated_at: new Date().toISOString(),
      };

      if (goal.id) {
        const { error } = await supabase
          .from("goals_data")
          .update(payload)
          .eq("id", goal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("goals_data")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals_system", user?.id] });
    },
    onError: (err) => {
      console.error("Save goal error:", err);
      toast.error("Failed to save goal");
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.from("goals_data").delete().eq("id", goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals_system", user?.id] });
    },
    onError: () => toast.error("Failed to delete goal"),
  });

  return {
    allGoals,
    quarterlyGoals,
    annualGoals,
    getQuarterGoals,
    getYearGoals,
    saveGoal: saveGoalMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,
    isLoading,
    isSaving: saveGoalMutation.isPending,
  };
}
