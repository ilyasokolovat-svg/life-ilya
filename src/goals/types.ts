export type Layer = "longterm" | "yearly" | "quarterly";
export type Status = "on-track" | "at-risk" | "behind" | "complete";
export type MetricKind = "number" | "checkbox";
export type ColorKey = "coral" | "purple" | "teal" | "green" | "amber" | "pink";
export type ProgressWeighting = "metric-only" | "task-only" | "blend";

export const COLOR_KEYS: ColorKey[] = ["coral", "purple", "teal", "green", "amber", "pink"];

export const COLOR_VAR: Record<ColorKey, string> = {
  coral: "var(--goal-coral)",
  purple: "var(--goal-purple)",
  teal: "var(--goal-teal)",
  green: "var(--goal-green)",
  amber: "var(--goal-amber)",
  pink: "var(--goal-pink)",
};

export const colorHsl = (c: ColorKey, alpha?: number) =>
  alpha === undefined ? `hsl(${COLOR_VAR[c]})` : `hsl(${COLOR_VAR[c]} / ${alpha})`;

export interface Metric {
  id: string;
  label: string;
  kind: MetricKind;
  current: number;
  target: number;
  unit?: string;
}

export interface WeeklyTask {
  id: string;
  text: string;
  done: boolean;
}

export interface WeeklyTaskBlock {
  weekNumber: number;
  tasks: WeeklyTask[];
}

export type MonthlyReviewStatus = "on-track" | "at-risk" | "behind" | "complete";

export interface MonthlyReview {
  month: string;
  status: MonthlyReviewStatus;
  note?: string;
  reviewedAt: number;
}

export type ProgressMode = "auto" | "manual" | "blend";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  layer: Layer;
  color: ColorKey;
  quarter?: string;
  year?: number;
  linkedYearlyGoalId?: string;
  linkedLongtermGoalId?: string;
  metrics: Metric[];
  weeklyTasks: WeeklyTaskBlock[];
  recurringWeeklyTasks?: string[];
  progressWeighting?: ProgressWeighting;
  monthlyReviews?: MonthlyReview[];
  progressMode?: ProgressMode;
  status?: Status;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface GoalsState {
  goals: Goal[];
  categories: Category[];
  currentWeekIndex: Record<string, number>;
  checkinLog: string[]; // ISO week keys like "2026-W28"
}
