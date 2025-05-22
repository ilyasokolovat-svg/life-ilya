
export type HabitType = 'gym' | 'alcohol' | 'sleep' | 'meditation';

export interface HabitData {
  planned: boolean;
  completed: boolean;
  sleepHours?: number; // Optional field for tracking sleep hours
}

export interface DayData {
  date: string; // ISO format date
  gym: HabitData;
  alcohol: HabitData;
  sleep: HabitData;
  meditation: HabitData;
}

export interface HabitGoal {
  frequency: number; // days per week
  notes: string;
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  completionRate: number; // percentage
  currentWeekCompleted: number; // number of days completed this week
}

export interface HabitsState {
  days: Record<string, DayData>;  // key is ISO date
  currentDate: string;  // ISO date
  goals: Record<HabitType, HabitGoal>; // goals for each habit type
}
