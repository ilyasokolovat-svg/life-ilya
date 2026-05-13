import { useCallback, useEffect, useState } from "react";
import { Category, Goal, GoalsState, WeeklyTaskBlock } from "./types";
import { uid } from "./utils";

const STORAGE_KEY = "goals_v2_data";

function emptyWeeks(n: number): WeeklyTaskBlock[] {
  return Array.from({ length: n }, (_, i) => ({ weekNumber: i + 1, tasks: [] }));
}

function tasksFromText(lines: string[]): WeeklyTaskBlock["tasks"] {
  return lines.map((t) => ({ id: uid(), text: t, done: false }));
}

function buildWeeks(perWeek: Record<number, string[]>, totalWeeks: number): WeeklyTaskBlock[] {
  return Array.from({ length: totalWeeks }, (_, i) => {
    const w = i + 1;
    return { weekNumber: w, tasks: tasksFromText(perWeek[w] || []) };
  });
}

function seed(): GoalsState {
  const cats: Category[] = [
    { id: "cat-physical", name: "Physical" },
    { id: "cat-financial", name: "Financial" },
    { id: "cat-skills", name: "Skills" },
    { id: "cat-personal", name: "Personal growth" },
    { id: "cat-career", name: "Career" },
  ];

  const Q = "Q2 2026";
  const goals: Goal[] = [
    {
      id: uid(),
      title: "B2Broker sales sprint",
      categoryId: "cat-financial",
      layer: "quarterly",
      color: "coral",
      quarter: Q,
      metrics: [
        { id: uid(), label: "Outreaches sent", kind: "number", current: 0, target: 600 },
        { id: uid(), label: "Calls booked", kind: "number", current: 0, target: 20 },
        { id: uid(), label: "Demos run", kind: "number", current: 0, target: 8 },
        { id: uid(), label: "Pipeline added", kind: "number", current: 0, target: 400, unit: "$K" },
      ],
      weeklyTasks: buildWeeks(
        {
          1: [
            "Build prospect list of 150 targets on LinkedIn Sales Navigator",
            "Write 3 outreach templates (FX broker, crypto exchange, new broker)",
            "Send first 100 outreaches",
          ],
          2: [
            "Send 100+ outreaches",
            "Follow up on week 1 non-responses",
            "Target 5 discovery calls booked",
          ],
          3: [
            "Run discovery calls",
            "Push every warm lead to a demo booking",
            "10 calls booked total",
          ],
          4: [
            "Run demos",
            "Qualify hard; move deals to proposal stage",
            "Follow up on all open threads",
          ],
          5: [
            "Push proposals to close",
            "Negotiate",
            "Re-engage stalled deals with a new angle",
          ],
          6: [
            "Close focus only — deals that can't close this quarter get handed off",
            "Document wins",
          ],
        },
        6
      ),
      createdAt: Date.now(),
    },
    {
      id: uid(),
      title: "Train 3x per week",
      categoryId: "cat-physical",
      layer: "quarterly",
      color: "green",
      quarter: Q,
      metrics: [
        { id: uid(), label: "Sessions completed", kind: "number", current: 0, target: 18 },
        { id: uid(), label: "Full-streak weeks", kind: "number", current: 0, target: 6 },
      ],
      weeklyTasks: buildWeeks(
        {
          1: [
            "Block 3 fixed training slots in calendar",
            "Choose format (gym / run / swim)",
            "Complete first 3 sessions",
          ],
          2: ["Complete 3 sessions", "Log each one", "Protect the streak"],
          3: ["Complete 3 sessions", "Log each one", "Protect the streak"],
          4: ["Complete 3 sessions", "Log each one", "Protect the streak"],
          5: ["Complete 3 sessions", "Log each one", "Protect the streak"],
          6: ["Complete 3 sessions", "Log each one", "Protect the streak"],
        },
        6
      ),
      createdAt: Date.now(),
    },
    {
      id: uid(),
      title: "Alcohol reduction",
      categoryId: "cat-physical",
      layer: "quarterly",
      color: "teal",
      quarter: Q,
      metrics: [
        { id: uid(), label: "Compliant weeks", kind: "number", current: 0, target: 6 },
        { id: uid(), label: "Weeks logged", kind: "number", current: 0, target: 6 },
      ],
      weeklyTasks: buildWeeks(
        Object.fromEntries(
          Array.from({ length: 6 }, (_, i) => [
            i + 1,
            [
              "Log every drink consumed",
              "Stay at or under 2 drinks",
              "Decide your number before social events, not during",
            ],
          ])
        ),
        6
      ),
      createdAt: Date.now(),
    },
    {
      id: uid(),
      title: "Financial independence plan",
      categoryId: "cat-financial",
      layer: "quarterly",
      color: "purple",
      quarter: Q,
      metrics: [
        { id: uid(), label: "Monthly spend calculated", kind: "checkbox", current: 0, target: 1 },
        { id: uid(), label: "FI number set using 25x rule", kind: "checkbox", current: 0, target: 1 },
        { id: uid(), label: "Monthly savings rate calculated", kind: "checkbox", current: 0, target: 1 },
      ],
      weeklyTasks: buildWeeks(
        {
          1: ["List all fixed and variable monthly expenses honestly including dating costs"],
          2: ["Apply the 25x rule — annual expenses × 25 = FI target number"],
          3: [
            "Calculate the monthly savings and investment rate needed to hit the target by age 35",
            "Write up the one-page plan document",
          ],
        },
        6
      ),
      createdAt: Date.now(),
    },
    {
      id: uid(),
      title: "Singapore / HK job search",
      categoryId: "cat-career",
      layer: "quarterly",
      color: "pink",
      quarter: Q,
      metrics: [
        { id: uid(), label: "Applications sent", kind: "number", current: 0, target: 20 },
        { id: uid(), label: "Recruiter conversations", kind: "number", current: 0, target: 5 },
        { id: uid(), label: "First-round interviews", kind: "number", current: 0, target: 2 },
      ],
      weeklyTasks: buildWeeks(
        {
          1: [
            "Update CV with fintech framing",
            "Email 5 specialist recruiters (Michael Page, Robert Walters, Selby Jennings, Links International, +1)",
            "Connect with 10 fintech sales people in SG/HK on LinkedIn",
          ],
          2: [
            "Send 5 tailored applications",
            "Follow up with recruiters",
            "Connect with 10 more on LinkedIn",
          ],
          3: ["Send 3–5 applications", "Run any recruiter or hiring manager calls", "Prep for interviews"],
          4: ["Send 3–5 applications", "Run any recruiter or hiring manager calls", "Prep for interviews"],
          5: ["Send 3–5 applications", "Run any recruiter or hiring manager calls", "Prep for interviews"],
          6: ["Send 3–5 applications", "Run any recruiter or hiring manager calls", "Prep for interviews"],
        },
        6
      ),
      createdAt: Date.now(),
    },
  ];

  return { goals, categories: cats, currentWeekIndex: {} };
}

function load(): GoalsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw);
    return {
      goals: parsed.goals || [],
      categories: parsed.categories || [],
      currentWeekIndex: parsed.currentWeekIndex || {},
    };
  } catch {
    return seed();
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

export function useGoalsStore() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  const state = getState();

  const upsertGoal = useCallback((g: Goal) => {
    setState((s) => {
      const exists = s.goals.some((x) => x.id === g.id);
      return { ...s, goals: exists ? s.goals.map((x) => (x.id === g.id ? g : x)) : [...s.goals, g] };
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
      // Mark all tasks in current week (computed externally) — caller passes via updateGoal.
      // Here we just bump the override index.
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

  return {
    goals: state.goals,
    categories: state.categories,
    upsertGoal,
    deleteGoal,
    updateGoal,
    addCategory,
    renameCategory,
    deleteCategory,
    advanceWeek,
    completeCurrentWeek,
  };
}
