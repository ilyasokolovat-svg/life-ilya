import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { HabitType, HabitData, DayData, HabitStats, HabitsState, HabitGoal, MonthlyGoals } from "@/types/habit";

// Get all days in a month
export const getDaysInMonth = (year: number, month: number): Date[] => {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  
  return days;
};

// Format date as ISO string (YYYY-MM-DD)
export const formatDateISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Format month as YYYY-MM
export const formatYearMonth = (year: number, month: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
};

// Get current month key
export const getCurrentMonthKey = (): string => {
  const date = new Date();
  return formatYearMonth(date.getFullYear(), date.getMonth());
};

// Get goals for a specific month
export const getMonthGoals = (state: HabitsState, year: number, month: number): Record<HabitType, HabitGoal> => {
  const monthKey = formatYearMonth(year, month);
  
  // If goals for this month don't exist, use default goals
  if (!state.goals || !state.goals[monthKey]) {
    return createDefaultGoals();
  }
  
  return state.goals[monthKey];
};

// Get day percentage completion
export const getDayCompletionPercentage = (day: DayData): number => {
  if (!day) return 0;
  
  const habitTypes: HabitType[] = ['gym', 'alcohol', 'sleep'];
  const plannedCount = habitTypes.filter(type => day[type]?.planned).length;
  
  if (plannedCount === 0) return 0;
  
  const completedCount = habitTypes.filter(type => 
    day[type]?.planned && day[type]?.completed
  ).length;
  
  return Math.round((completedCount / plannedCount) * 100);
};

// Get the start date of the current week (Monday instead of Sunday)
export const getStartOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  // Adjust for Monday start (1 is Monday, 0 is Sunday in JS)
  const daysToSubtract = day === 0 ? 6 : day - 1;
  result.setDate(result.getDate() - daysToSubtract); // Go to start of week (Monday)
  result.setHours(0, 0, 0, 0);
  return result;
};

// Calculate habit statistics for a specific month
export const calculateHabitStats = (state: HabitsState, habitType: HabitType, year?: number, month?: number): HabitStats => {
  // Ensure state and days exist
  if (!state || !state.days) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompleted: 0,
      completionRate: 0,
      currentWeekCompleted: 0
    };
  }
  
  let days = Object.values(state.days);
  
  // Filter by month if specified
  if (year !== undefined && month !== undefined) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0); // Last day of month
    
    days = days.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= monthStart && dayDate <= monthEnd;
    });
  }
  
  // Sort days by date
  days.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let totalPlanned = 0;
  let totalCompleted = 0;
  let currentWeekCompleted = 0;
  
  const today = new Date();
  const weekStart = getStartOfWeek(today);
  
  // For sleep, calculate based on sleep hours instead of planned/completed
  if (habitType === 'sleep') {
    // Calculate total days passed in the month so far
    const currentDate = new Date();
    let totalDaysInMonth;
    
    if (year !== undefined && month !== undefined) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      const endDate = currentDate > monthEnd ? monthEnd : currentDate;
      
      // Only count days up to today or end of month
      totalDaysInMonth = Math.floor((endDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    } else {
      totalDaysInMonth = days.length;
    }
    
    let goodSleepDays = 0;
    
    // Process days for sleep-specific calculations
    for (const day of days) {
      const dayDate = new Date(day.date);
      
      // Only count days up to today
      if (dayDate <= today) {
        const sleepHours = day.sleep?.sleepHours || 0;
        
        if (sleepHours >= 7) {
          goodSleepDays++;
          tempStreak++;
        } else if (sleepHours > 0) {
          tempStreak = 0;
        }
        
        longestStreak = Math.max(longestStreak, tempStreak);
      }
    }
    
    // Calculate current streak (from most recent days)
    for (let i = days.length - 1; i >= 0; i--) {
      const day = days[i];
      const dayDate = new Date(day.date);
      
      if (dayDate <= today) {
        const sleepHours = day.sleep?.sleepHours || 0;
        if (sleepHours >= 7) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    return {
      currentStreak,
      longestStreak,
      totalCompleted: goodSleepDays,
      completionRate: totalDaysInMonth > 0 ? Math.round((goodSleepDays / totalDaysInMonth) * 100) : 0,
      currentWeekCompleted: 0 // Not used for sleep
    };
  }
  
  // Original logic for other habits
  // Process days in reverse (newest first) for current streak
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i];
    if (!day[habitType]?.planned) continue;
    
    if (day[habitType]?.completed) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Process days in order for longest streak and completion stats
  for (const day of days) {
    if (day[habitType]?.planned) {
      totalPlanned++;
      
      if (day[habitType]?.completed) {
        totalCompleted++;
        tempStreak++;
        
        // Check if this is in the current week
        const dayDate = new Date(day.date);
        if (dayDate >= weekStart && dayDate <= today) {
          currentWeekCompleted++;
        }
      } else {
        tempStreak = 0;
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);
    }
  }
  
  return {
    currentStreak,
    longestStreak,
    totalCompleted,
    completionRate: totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0,
    currentWeekCompleted
  };
};

// New function to calculate sleep quality stats for a specific month
export const calculateSleepQualityStats = (state: HabitsState, year: number, month: number) => {
  if (!state || !state.days) {
    return { goodSleep: 0, averageSleep: 0, badSleep: 0 };
  }
  
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const today = new Date();
  
  let goodSleep = 0;
  let averageSleep = 0;
  let badSleep = 0;
  
  // Filter days for the specific month
  const days = Object.values(state.days).filter(day => {
    const dayDate = new Date(day.date);
    return dayDate >= monthStart && dayDate <= monthEnd && dayDate <= today;
  });
  
  for (const day of days) {
    const sleepHours = day.sleep?.sleepHours || 0;
    
    if (sleepHours >= 7) {
      goodSleep++;
    } else if (sleepHours >= 5) {
      averageSleep++;
    } else if (sleepHours > 0) {
      badSleep++;
    }
  }
  
  return { goodSleep, averageSleep, badSleep };
};

// Create an empty day data structure
export const createEmptyDayData = (date: Date): DayData => {
  return {
    date: formatDateISO(date),
    gym: { planned: false, completed: false },
    alcohol: { planned: false, completed: false },
    sleep: { planned: false, completed: false, sleepHours: undefined },
    meditation: { planned: false, completed: false }
  };
};

// Create default goals
export const createDefaultGoals = () => {
  return {
    gym: { frequency: 3, notes: "" },
    alcohol: { frequency: 4, notes: "" },
    sleep: { frequency: 7, notes: "7+ hours of sleep per day" },
    meditation: { frequency: 5, notes: "" }
  };
};

// Create default monthly goals with the specified values
export const createDefaultMonthlyGoals = (): MonthlyGoals => {
  const defaultGoals: Record<HabitType, HabitGoal> = {
    gym: { frequency: 12, notes: "" },
    alcohol: { frequency: 25, notes: "" },
    sleep: { frequency: 20, notes: "" },
    meditation: { frequency: 25, notes: "" }
  };
  
  return {
    // Start with current month
    [formatYearMonth(new Date().getFullYear(), new Date().getMonth())]: defaultGoals
  };
};
