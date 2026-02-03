export type HabitType = 'gym' | 'alcohol' | 'sleep' | 'meditation' | 'social';

// Event type for drinking budget tracking
export type DrinkingEventType = 'anchor' | 'side' | 'sober_social' | null;

export interface HabitData {
  planned: boolean;
  completed: boolean;
  sleepHours?: number; // Optional field for tracking sleep hours
  wellRested?: boolean; // Optional field for tracking if user felt well rested
  workoutType?: string; // Optional field for gym workout type
  location?: string; // Optional field for gym location
  calories?: string; // Optional field for gym calories burned
  socialEvent?: string; // Optional field for social event type
  socialPerson?: string; // Optional field for person met
  highlights?: string; // Optional field for social event highlights
  // Presence/Meditation tracking fields
  journaling?: boolean;
  meditationDone?: boolean;
  mindfulPhone?: boolean;
  // Drinking budget tracking - used on social events
  drinkingEventType?: DrinkingEventType;
  // Weight/body composition tracking (stored with sleep habit for daily check-in)
  weight?: number; // Weight in kg
  bodyFat?: number; // Body fat percentage
}

export interface DayData {
  date: string; // ISO format date
  location?: string; // Optional location for the day
  gym: HabitData;
  alcohol: HabitData;
  sleep: HabitData;
  meditation: HabitData;
  social: HabitData;
}

export interface HabitGoal {
  frequency: number; // days per month
  notes: string;
}

// New type for monthly goals
export interface MonthlyGoals {
  [key: string]: Record<HabitType, HabitGoal>; // key is YYYY-MM format
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  completionRate: number; // percentage
  currentWeekCompleted: number; // number of days completed this week
}

export interface WeeklyStats {
  weekStart: Date;
  planned: number;
  completed: number;
}

export interface HabitsState {
  days: Record<string, DayData>;  // key is ISO date
  currentDate: string;  // ISO date
  goals: MonthlyGoals; // goals for each month and each habit type
}
