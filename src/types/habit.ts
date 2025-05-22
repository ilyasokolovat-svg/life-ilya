
export type HabitType = 'gym' | 'alcohol' | 'sleep';

export interface HabitData {
  planned: boolean;
  completed: boolean;
}

export interface DayData {
  date: string; // ISO format date
  gym: HabitData;
  alcohol: HabitData;
  sleep: HabitData;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  completionRate: number; // percentage
}

export interface HabitsState {
  days: Record<string, DayData>;  // key is ISO date
  currentDate: string;  // ISO date
}
