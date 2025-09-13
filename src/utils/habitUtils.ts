
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { HabitType, HabitData, DayData, HabitStats, HabitsState, HabitGoal, MonthlyGoals } from "@/types/habit";
import { getDubaiDate, formatDateISO, getTodayISO, parseISODate, getDaysInMonth, formatYearMonth } from "./dateUtils";

// Export the universal date functions
export { getDubaiDate, formatDateISO, getTodayISO, parseISODate, getDaysInMonth, formatYearMonth };

// Get current month key using Dubai timezone
export const getCurrentMonthKey = (): string => {
  const date = getDubaiDate();
  return formatYearMonth(date.getFullYear(), date.getMonth());
};

// Get goals for a specific month
export const getMonthGoals = (state: HabitsState, year: number, month: number): Record<HabitType, HabitGoal> => {
  const monthKey = formatYearMonth(year, month);
  
  // If goals for this month don't exist, use default goals
  if (!state.goals || !state.goals[monthKey]) {
    return createDefaultGoals();
  }
  
  // Ensure all habit types have goals with the updated defaults
  const monthGoals = state.goals[monthKey];
  const defaultGoals = createDefaultGoals();
  const completeGoals: Record<HabitType, HabitGoal> = { ...defaultGoals };
  
  // Override with existing goals if they exist
  Object.keys(monthGoals).forEach(habitType => {
    if (monthGoals[habitType as HabitType]) {
      completeGoals[habitType as HabitType] = monthGoals[habitType as HabitType];
    }
  });
  
  return completeGoals;
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

// Calculate habit statistics for a specific month using Dubai timezone
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
  
  let relevantDays: DayData[] = [];
  
  // Filter by month if specified - STRICT month filtering
  if (year !== undefined && month !== undefined) {
    const today = getDubaiDate(); // Use Dubai timezone
    
    console.log(`calculateHabitStats: Calculating for ${habitType} in ${year}-${month + 1} (Dubai timezone)`);
    
    // Only include days that belong to the specified month AND year
    Object.keys(state.days).forEach(dateISO => {
      const dayDate = parseISODate(dateISO);
      const dayData = state.days[dateISO];
      
      // STRICT filtering: day must be in the exact month and year, and not in the future
      if (dayDate.getFullYear() === year && 
          dayDate.getMonth() === month && 
          dayDate <= today && 
          dayData) {
        relevantDays.push(dayData);
        console.log(`calculateHabitStats: Including day ${dateISO} in ${year}-${month + 1} calculation`);
      }
    });
  } else {
    relevantDays = Object.values(state.days);
  }
  
  // Sort days by date
  relevantDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let totalPlanned = 0;
  let totalCompleted = 0;
  let currentWeekCompleted = 0;
  
  const today = getDubaiDate(); // Use Dubai timezone
  const weekStart = getStartOfWeek(today);
  
  console.log(`calculateHabitStats: Processing ${habitType} for ${relevantDays.length} days using Dubai timezone`);
  
  // For sleep, calculate based on sleep hours instead of planned/completed
  if (habitType === 'sleep') {
    let goodSleepDays = 0;
    let totalDaysWithData = 0;
    
    // Process days for sleep-specific calculations
    for (const day of relevantDays) {
      const dayDate = parseISODate(day.date);
      const sleepHours = day.sleep?.sleepHours || 0;
      
      console.log(`calculateHabitStats: Sleep for ${day.date}: ${sleepHours} hours`);
      
      if (sleepHours > 0) {
        totalDaysWithData++;
        if (sleepHours >= 7) {
          goodSleepDays++;
          tempStreak++;
        } else {
          tempStreak = 0;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }
    }
    
    // Calculate current streak (from most recent days)
    for (let i = relevantDays.length - 1; i >= 0; i--) {
      const day = relevantDays[i];
      const sleepHours = day.sleep?.sleepHours || 0;
      if (sleepHours >= 7) {
        currentStreak++;
      } else if (sleepHours > 0) {
        break;
      }
    }
    
    const totalDaysInPeriod = year !== undefined && month !== undefined 
      ? Math.min(relevantDays.length, new Date().getDate()) 
      : totalDaysWithData;
    
    console.log(`calculateHabitStats: Sleep summary - goodSleep: ${goodSleepDays}, totalDays: ${totalDaysInPeriod}`);
    
    return {
      currentStreak,
      longestStreak,
      totalCompleted: goodSleepDays,
      completionRate: totalDaysInPeriod > 0 ? Math.round((goodSleepDays / totalDaysInPeriod) * 100) : 0,
      currentWeekCompleted: 0 // Not used for sleep
    };
  }
  
  // Process days in reverse (newest first) for current streak
  for (let i = relevantDays.length - 1; i >= 0; i--) {
    const day = relevantDays[i];
    const habitData = day[habitType];
    
    console.log(`calculateHabitStats: Checking ${habitType} for ${day.date}:`, habitData);
    
    if (!habitData?.planned) continue;
    
    if (habitData?.completed) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Process days in order for longest streak and completion stats
  for (const day of relevantDays) {
    const habitData = day[habitType];
    
    if (habitData?.planned) {
      totalPlanned++;
      
      if (habitData?.completed) {
        totalCompleted++;
        tempStreak++;
        
        // Check if this is in the current week
        const dayDate = parseISODate(day.date);
        if (dayDate >= weekStart && dayDate <= today) {
          currentWeekCompleted++;
        }
      } else {
        tempStreak = 0;
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);
    }
  }
  
  console.log(`calculateHabitStats: ${habitType} summary - planned: ${totalPlanned}, completed: ${totalCompleted}, streak: ${currentStreak}`);
  
  return {
    currentStreak,
    longestStreak,
    totalCompleted,
    completionRate: totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0,
    currentWeekCompleted
  };
};

// Calculate sleep quality stats for a specific month using Dubai timezone
export const calculateSleepQualityStats = (state: HabitsState, year: number, month: number) => {
  if (!state || !state.days) {
    return { goodSleep: 0, averageSleep: 0, badSleep: 0 };
  }
  
  const today = getDubaiDate(); // Use Dubai timezone
  
  let goodSleep = 0;
  let averageSleep = 0;
  let badSleep = 0;
  
  console.log(`calculateSleepQualityStats: Calculating for ${year}-${month + 1} (Dubai timezone)`);
  
  // Filter days for the specific month - STRICT filtering
  Object.keys(state.days).forEach(dateISO => {
    const dayDate = parseISODate(dateISO);
    const dayData = state.days[dateISO];
    
    // STRICT filtering: day must be in the exact month and year, and not in the future
    if (dayDate.getFullYear() === year && 
        dayDate.getMonth() === month && 
        dayDate <= today && 
        dayData) {
      
      const sleepHours = dayData.sleep?.sleepHours || 0;
      
      console.log(`calculateSleepQualityStats: Processing ${dateISO}: ${sleepHours} hours`);
      
      if (sleepHours >= 7) {
        goodSleep++;
      } else if (sleepHours >= 5) {
        averageSleep++;
      } else if (sleepHours > 0) {
        badSleep++;
      }
    }
  });
  
  console.log(`calculateSleepQualityStats: Results - good: ${goodSleep}, average: ${averageSleep}, bad: ${badSleep}`);
  
  return { goodSleep, averageSleep, badSleep };
};

// Create an empty day data structure
export const createEmptyDayData = (date: Date): DayData => {
  return {
    date: formatDateISO(date),
    gym: { planned: false, completed: false },
    alcohol: { planned: false, completed: false },
    sleep: { planned: false, completed: false, sleepHours: undefined },
    meditation: { planned: false, completed: false },
    social: { planned: false, completed: false }
  };
};

// Create default goals with updated values
export const createDefaultGoals = () => {
  return {
    gym: { frequency: 12, notes: "" },
    alcohol: { frequency: 25, notes: "" },
    sleep: { frequency: 20, notes: "" },
    meditation: { frequency: 25, notes: "" },
    social: { frequency: 15, notes: "" }
  };
};

// Create default monthly goals with the updated values
export const createDefaultMonthlyGoals = (): MonthlyGoals => {
  const defaultGoals: Record<HabitType, HabitGoal> = {
    gym: { frequency: 12, notes: "" },
    alcohol: { frequency: 25, notes: "" },
    sleep: { frequency: 20, notes: "" },
    meditation: { frequency: 25, notes: "" },
    social: { frequency: 15, notes: "" }
  };
  
  return {
    // Start with current month using Dubai timezone
    [formatYearMonth(getDubaiDate().getFullYear(), getDubaiDate().getMonth())]: defaultGoals
  };
};
