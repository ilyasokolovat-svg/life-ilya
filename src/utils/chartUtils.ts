
import { HabitType, HabitsState, WeeklyStats } from "@/types/habit";
import { formatDateISO, getStartOfWeek } from "./habitUtils";

// Get start dates for each week in a month
export const getWeeksInMonth = (year: number, month: number): Date[] => {
  const weeks: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Find the start of the first week
  let currentWeekStart = getStartOfWeek(firstDay);
  
  // Add all week starts until we're past the end of the month
  while (currentWeekStart <= lastDay) {
    weeks.push(new Date(currentWeekStart));
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }
  
  return weeks;
};

// Calculate weekly stats for a habit type
export const calculateWeeklyStats = (
  state: HabitsState,
  habitType: HabitType,
  weekStart: Date
): WeeklyStats => {
  // Get week end date (6 days after start)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  let plannedCount = 0;
  let completedCount = 0;
  
  // Iterate through the week
  const currentDay = new Date(weekStart);
  while (currentDay <= weekEnd) {
    const dateISO = formatDateISO(currentDay);
    const dayData = state.days[dateISO];
    
    if (dayData) {
      // For sleep, we check if sleepHours is >= 7
      if (habitType === 'sleep') {
        if (dayData.sleep.sleepHours && dayData.sleep.sleepHours >= 7) {
          completedCount++;
        }
      } else {
        // For other habits, check planned and completed
        if (dayData[habitType]?.planned) {
          plannedCount++;
          if (dayData[habitType]?.completed) {
            completedCount++;
          }
        }
      }
    }
    
    // Move to next day
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  return { planned: plannedCount, completed: completedCount, weekStart };
};

// Get week label for display (e.g., "May 12-18")
export const formatWeekLabel = (weekStart: Date): string => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const month = weekStart.toLocaleString('default', { month: 'short' });
  
  return `${month} ${startDay}-${endDay}`;
};

// Get all weekly stats for a given month
export const getMonthlyWeeklyStats = (
  state: HabitsState,
  habitType: HabitType,
  year: number,
  month: number
): WeeklyStats[] => {
  const weeks = getWeeksInMonth(year, month);
  return weeks.map(weekStart => calculateWeeklyStats(state, habitType, weekStart));
};

// Color configurations for each habit type
export const habitColors = {
  sleep: {
    primary: '#9b87f5', // Purple
    secondary: '#d3c6f9', // Light purple
  },
  gym: {
    primary: '#0ea5e9', // Blue
    secondary: '#d3e4fd', // Light blue
  },
  alcohol: {
    primary: '#ea384c', // Red
    secondary: '#ffdee2', // Light pink
  },
  meditation: {
    primary: '#22c55e', // Green
    secondary: '#f2fce2', // Light green
  }
};

