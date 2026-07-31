export type Cadence = "weekly" | "monthly";
export type HorizonTier = "five_year" | "three_year" | "one_year";
export type Direction = "up" | "down";

export interface GoalCategory {
  id: string;
  user_id: string;
  key: string;
  name: string;
  accent_color: string;
  emoji: string;
  cadence: Cadence;
  sort_order: number;
}

export interface GoalHorizon {
  id: string;
  user_id: string;
  category_id: string;
  tier: HorizonTier;
  label: string;
  target_date: string | null;
  body: string;
  sort_order: number;
}

export interface GoalQuarter {
  id: string;
  user_id: string;
  category_id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface GoalMetric {
  id: string;
  user_id: string;
  quarter_id: string;
  name: string;
  /** Short label for the cramped homepage row. Falls back to `name`. */
  short_name: string | null;
  current_value: number;
  target_value: number;
  start_value: number | null;
  unit: string;
  direction: Direction;
  headline_priority: number;
  sort_order: number;
  notes: string | null;
  auto_source: "gym_sessions" | "net_worth" | "debt" | null;
  /** When the value was last entered. */
  last_updated_at: string | null;
}

export interface GoalRoutine {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  target_per_week: number;
  travel_mode_target: number | null;
  is_binary: boolean;
  is_active: boolean;
  sort_order: number;
  notes: string | null;
  linked_metric_id: string | null;
}

export interface RoutineLog {
  id: string;
  user_id: string;
  routine_id: string;
  week_start_date: string;
  value: number;
}

export interface Checkin {
  id: string;
  user_id: string;
  week_start_date: string;
  note: string | null;
  created_at: string;
}

export interface GoalSettings {
  id: string;
  user_id: string;
  travel_mode_active: boolean;
  travel_mode_until: string | null;
  next_money_day: string | null;
  todoist_note: string | null;
}
