
import { DayData, HabitStats, HabitType, HabitsState } from "@/types/habit";

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

// Calculate habit statistics
export const calculateHabitStats = (state: HabitsState, habitType: HabitType): HabitStats => {
  const days = Object.values(state.days).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let totalPlanned = 0;
  let totalCompleted = 0;
  
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
    completionRate: totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0
  };
};

// Create an empty day data structure
export const createEmptyDayData = (date: Date): DayData => {
  return {
    date: formatDateISO(date),
    gym: { planned: false, completed: false },
    alcohol: { planned: false, completed: false },
    sleep: { planned: false, completed: false }
  };
};
