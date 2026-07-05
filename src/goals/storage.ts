import { useCallback, useEffect, useState } from "react";
import { Category, Goal, GoalsState } from "./types";
import { currentIsoWeekKey, quarterInfo, syncRecurringWeeks, uid } from "./utils";

const STORAGE_KEY = "goals_v2_data";

const CAT_PHYSICAL = "cat-physical";
const CAT_FINANCIAL = "cat-financial";
const CAT_SKILLS = "cat-skills";
const CAT_PERSONAL = "cat-personal";
const CAT_CAREER = "cat-career";

function seedCategories(): Category[] {
  return [
    { id: CAT_PHYSICAL, name: "Physical" },
    { id: CAT_FINANCIAL, name: "Financial" },
    { id: CAT_SKILLS, name: "Skills" },
    { id: CAT_PERSONAL, name: "Personal growth" },
    { id: CAT_CAREER, name: "Career" },
  ];
}

function buildGoal(g: Omit<Goal, "id" | "createdAt" | "weeklyTasks"> & { weeklyTasks?: Goal["weeklyTasks"] }): Goal {
  const goal: Goal = {
    id: uid(),
    createdAt: Date.now(),
    weeklyTasks: g.weeklyTasks || [],
    ...g,
  };
  if (goal.layer === "quarterly" && goal.quarter) {
    const tw = quarterInfo(goal.quarter).totalWeeks;
    goal.weeklyTasks = syncRecurringWeeks(goal, tw);
  }
  return goal;
}

function seedGoals(): Goal[] {
  const Q3 = "Q3 2026";
  const Q4 = "Q4 2026";

  const q3 = [
    buildGoal({
      title: "B2Broker commission engine",
      categoryId: CAT_CAREER,
      layer: "quarterly",
      color: "coral",
      quarter: Q3,
      progressWeighting: "blend",
      metrics: [
        { id: uid(), label: "Commissions", kind: "number", current: 0, target: 40, unit: "$K" },
        { id: uid(), label: "Pipeline added", kind: "number", current: 0, target: 150, unit: "$K" },
      ],
      recurringWeeklyTasks: [
        "Mon: review pipeline, pick 3 movable deals, book calls",
        "50+ outreaches this week",
        "3+ discovery calls or demos held",
        "Fri: log week (commissions, pipeline, activity)",
      ],
    }),
    buildGoal({
      title: "$1M plan execution",
      categoryId: CAT_FINANCIAL,
      layer: "quarterly",
      color: "purple",
      quarter: Q3,
      progressWeighting: "metric-only",
      metrics: [
        { id: uid(), label: "Portfolio value", kind: "number", current: 0, target: 75, unit: "$K" },
        { id: uid(), label: "Commission % invested", kind: "number", current: 0, target: 60, unit: "%" },
      ],
      recurringWeeklyTasks: [],
    }),
    buildGoal({
      title: "Location & career optionality",
      categoryId: CAT_CAREER,
      layer: "quarterly",
      color: "teal",
      quarter: Q3,
      progressWeighting: "blend",
      metrics: [
        { id: uid(), label: "Live conversations", kind: "number", current: 0, target: 2 },
        { id: uid(), label: "Cyprus/HK/Dubai comparison doc", kind: "checkbox", current: 0, target: 1 },
      ],
      recurringWeeklyTasks: [],
    }),
    buildGoal({
      title: "Alcohol protocol + training",
      categoryId: CAT_PHYSICAL,
      layer: "quarterly",
      color: "green",
      quarter: Q3,
      progressWeighting: "task-only",
      metrics: [
        { id: uid(), label: "Compliant weeks", kind: "number", current: 0, target: 9, unit: "weeks" },
        { id: uid(), label: "Training sessions", kind: "number", current: 0, target: 36, unit: "sessions" },
      ],
      recurringWeeklyTasks: [
        "No alcohol Sun–Thu",
        "Max 2 drinks Friday",
        "Max 2 drinks Saturday",
        "3 training sessions",
      ],
    }),
  ];

  const q4 = [
    buildGoal({
      title: "B2Broker commission engine",
      categoryId: CAT_CAREER,
      layer: "quarterly",
      color: "coral",
      quarter: Q4,
      progressWeighting: "blend",
      metrics: [
        { id: uid(), label: "Commissions", kind: "number", current: 0, target: 50, unit: "$K" },
        { id: uid(), label: "Pipeline added", kind: "number", current: 0, target: 180, unit: "$K" },
      ],
      recurringWeeklyTasks: [
        "Mon: review pipeline, pick 3 movable deals, book calls",
        "50+ outreaches this week",
        "3+ discovery calls or demos held",
        "Fri: log week (commissions, pipeline, activity)",
      ],
    }),
    buildGoal({
      title: "$1M plan execution",
      categoryId: CAT_FINANCIAL,
      layer: "quarterly",
      color: "purple",
      quarter: Q4,
      progressWeighting: "metric-only",
      metrics: [
        { id: uid(), label: "Portfolio value", kind: "number", current: 0, target: 95, unit: "$K" },
        { id: uid(), label: "Commission % invested", kind: "number", current: 0, target: 60, unit: "%" },
      ],
      recurringWeeklyTasks: [],
    }),
    buildGoal({
      title: "Location & career optionality",
      categoryId: CAT_CAREER,
      layer: "quarterly",
      color: "teal",
      quarter: Q4,
      progressWeighting: "blend",
      metrics: [
        { id: uid(), label: "Written location decision", kind: "checkbox", current: 0, target: 1 },
        { id: uid(), label: "Relocation/remote plan", kind: "checkbox", current: 0, target: 1 },
      ],
      recurringWeeklyTasks: [],
    }),
    buildGoal({
      title: "Alcohol protocol + training",
      categoryId: CAT_PHYSICAL,
      layer: "quarterly",
      color: "green",
      quarter: Q4,
      progressWeighting: "task-only",
      metrics: [
        { id: uid(), label: "Compliant weeks", kind: "number", current: 0, target: 13, unit: "weeks" },
        { id: uid(), label: "Training sessions", kind: "number", current: 0, target: 36, unit: "sessions" },
      ],
      recurringWeeklyTasks: [
        "No alcohol Sun–Thu",
        "Max 2 drinks Friday",
        "Max 2 drinks Saturday",
        "3 training sessions",
      ],
    }),
  ];

  const longterm: Goal = {
    id: uid(),
    title: "$1M net worth by Sep 2029",
    description:
      "Financial independence anchor. Fed by B2Broker commissions now, a higher-base/equity role or Cyprus tax efficiency from 2027.",
    categoryId: CAT_FINANCIAL,
    layer: "longterm",
    color: "purple",
    metrics: [],
    weeklyTasks: [],
    createdAt: Date.now(),
  };

  return [...q3, ...q4, longterm];
}

function initialState(): GoalsState {
  return {
    goals: seedGoals(),
    categories: seedCategories(),
    currentWeekIndex: {},
    checkinLog: [],
  };
}

function migrate(parsed: any): GoalsState {
  const state: GoalsState = {
    goals: Array.isArray(parsed?.goals) ? parsed.goals : [],
    categories: Array.isArray(parsed?.categories) ? parsed.categories : seedCategories(),
    currentWeekIndex: parsed?.currentWeekIndex || {},
    checkinLog: Array.isArray(parsed?.checkinLog) ? parsed.checkinLog : [],
  };

  // Ensure defaults + sync recurring weeks for quarterly goals
  state.goals = state.goals.map((g) => {
    const gg: Goal = {
      ...g,
      progressWeighting: g.progressWeighting || "blend",
      recurringWeeklyTasks: g.recurringWeeklyTasks || [],
      weeklyTasks: g.weeklyTasks || [],
      metrics: g.metrics || [],
    };
    if (gg.layer === "quarterly" && gg.quarter && (gg.recurringWeeklyTasks?.length || gg.weeklyTasks.length)) {
      const tw = quarterInfo(gg.quarter).totalWeeks;
      if (gg.recurringWeeklyTasks && gg.recurringWeeklyTasks.length) {
        gg.weeklyTasks = syncRecurringWeeks(gg, tw);
      }
    }
    return gg;
  });

  // Append new Q3/Q4 2026 seed + longterm if not already present.
  const hasQ3 = state.goals.some((g) => g.quarter === "Q3 2026");
  const hasQ4 = state.goals.some((g) => g.quarter === "Q4 2026");
  const hasLongterm1M = state.goals.some(
    (g) => g.layer === "longterm" && /\$1M net worth/i.test(g.title)
  );
  if (!hasQ3 || !hasQ4 || !hasLongterm1M) {
    const fresh = seedGoals();
    if (!hasQ3) state.goals.push(...fresh.filter((g) => g.quarter === "Q3 2026"));
    if (!hasQ4) state.goals.push(...fresh.filter((g) => g.quarter === "Q4 2026"));
    if (!hasLongterm1M) state.goals.push(...fresh.filter((g) => g.layer === "longterm"));
  }

  return state;
}

function load(): GoalsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = initialState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw);
    const migrated = migrate(parsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return initialState();
  }
}

let memState: GoalsState | null = null;
const listeners = new Set<() => void>();

function getState(): GoalsState {
  if (!memState) memState = load();
  return memState;
}

function setState(updater: (s: GoalsState) => GoalsState) {
  memState = updater(getState());
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(memState)); } catch {}
  listeners.forEach((l) => l());
}

function normalizeGoal(g: Goal): Goal {
  const gg: Goal = {
    ...g,
    progressWeighting: g.progressWeighting || "blend",
    recurringWeeklyTasks: g.recurringWeeklyTasks || [],
    weeklyTasks: g.weeklyTasks || [],
  };
  if (gg.layer === "quarterly" && gg.quarter) {
    const tw = quarterInfo(gg.quarter).totalWeeks;
    if (gg.recurringWeeklyTasks && gg.recurringWeeklyTasks.length) {
      gg.weeklyTasks = syncRecurringWeeks(gg, tw);
    }
  }
  return gg;
}

export function useGoalsStore() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  const state = getState();

  const upsertGoal = useCallback((g: Goal) => {
    const norm = normalizeGoal(g);
    setState((s) => {
      const exists = s.goals.some((x) => x.id === norm.id);
      return { ...s, goals: exists ? s.goals.map((x) => (x.id === norm.id ? norm : x)) : [...s.goals, norm] };
    });
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
  }, []);

  const updateGoal = useCallback((id: string, patch: Partial<Goal>) => {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }));
  }, []);

  const addCategory = useCallback((name: string) => {
    const c: Category = { id: "cat-" + uid(), name };
    setState((s) => ({ ...s, categories: [...s.categories, c] }));
    return c;
  }, []);

  const renameCategory = useCallback((id: string, name: string) => {
    setState((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, name } : c)) }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      categories: s.categories.filter((c) => c.id !== id),
      goals: s.goals.filter((g) => g.categoryId !== id),
    }));
  }, []);

  const advanceWeek = useCallback((qKey: string) => {
    setState((s) => {
      const cur = s.currentWeekIndex[qKey] || 0;
      return { ...s, currentWeekIndex: { ...s.currentWeekIndex, [qKey]: cur + 1 } };
    });
  }, []);

  const completeCurrentWeek = useCallback((qKey: string, weekNumber: number) => {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) => {
        if (g.layer !== "quarterly" || g.quarter !== qKey) return g;
        return {
          ...g,
          weeklyTasks: g.weeklyTasks.map((wb) =>
            wb.weekNumber === weekNumber ? { ...wb, tasks: wb.tasks.map((t) => ({ ...t, done: true })) } : wb
          ),
        };
      }),
    }));
  }, []);

  // Save a batch of goal updates AND record a check-in for the current ISO week.
  const saveCheckin = useCallback((updatedGoals: Goal[]) => {
    setState((s) => {
      const key = currentIsoWeekKey();
      const goals = s.goals.map((g) => {
        const upd = updatedGoals.find((u) => u.id === g.id);
        return upd ? normalizeGoal({ ...g, ...upd }) : g;
      });
      const checkinLog = s.checkinLog.includes(key) ? s.checkinLog : [...s.checkinLog, key];
      return { ...s, goals, checkinLog };
    });
  }, []);

  return {
    goals: state.goals,
    categories: state.categories,
    checkinLog: state.checkinLog,
    upsertGoal,
    deleteGoal,
    updateGoal,
    addCategory,
    renameCategory,
    deleteCategory,
    advanceWeek,
    completeCurrentWeek,
    saveCheckin,
  };
}
