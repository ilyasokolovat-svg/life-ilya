
import { HabitsState, HabitType } from "@/types/habit";
import { formatDateISO, getDaysInMonth } from "./habitUtils";

// Helper function to get Monday of any given date
const getMondayOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  return result;
};

// Generate week key based on Monday
const generateWeekKey = (monday: Date): string => {
  return `${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`;
};

// Calculate gym streak (perfect weeks)
export const calculateGymStreakWeeks = (state: HabitsState): number => {
  if (!state || !state.days) return 0;

  const today = new Date();
  let streak = 0;
  let currentWeekStart = getMondayOfWeek(today);

  // Go backwards week by week
  while (true) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);

    // Don't count future weeks or current incomplete week
    if (currentWeekStart > today) {
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      continue;
    }

    let plannedDays = 0;
    let completedDays = 0;

    // Check each day of the week
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(currentWeekStart);
      checkDate.setDate(currentWeekStart.getDate() + i);
      
      // Don't count future days
      if (checkDate > today) continue;

      const dateISO = formatDateISO(checkDate);
      const dayData = state.days[dateISO];

      if (dayData?.gym?.planned) {
        plannedDays++;
        if (dayData.gym.completed) {
          completedDays++;
        }
      }
    }

    // If no gym was planned this week, skip it
    if (plannedDays === 0) {
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      continue;
    }

    // If all planned gym sessions were completed, continue streak
    if (plannedDays === completedDays) {
      streak++;
    } else {
      // Streak broken
      break;
    }

    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  }

  return streak;
};

// Calculate meditation streak (perfect weeks)
export const calculateMeditationStreakWeeks = (state: HabitsState): number => {
  if (!state || !state.days) return 0;

  const today = new Date();
  let streak = 0;
  let currentWeekStart = getMondayOfWeek(today);

  // Go backwards week by week
  while (true) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);

    // Don't count future weeks or current incomplete week
    if (currentWeekStart > today) {
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      continue;
    }

    let plannedDays = 0;
    let completedDays = 0;

    // Check each day of the week
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(currentWeekStart);
      checkDate.setDate(currentWeekStart.getDate() + i);
      
      // Don't count future days
      if (checkDate > today) continue;

      const dateISO = formatDateISO(checkDate);
      const dayData = state.days[dateISO];

      if (dayData?.meditation?.planned) {
        plannedDays++;
        if (dayData.meditation.completed) {
          completedDays++;
        }
      }
    }

    // If no meditation was planned this week, skip it
    if (plannedDays === 0) {
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      continue;
    }

    // If all planned meditation sessions were completed, continue streak
    if (plannedDays === completedDays) {
      streak++;
    } else {
      // Streak broken
      break;
    }

    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  }

  return streak;
};

// Calculate alcohol streak (days in a row without alcohol)
export const calculateAlcoholStreakDays = (state: HabitsState): number => {
  if (!state || !state.days) return 0;

  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);

  // Go backwards day by day
  while (true) {
    const dateISO = formatDateISO(currentDate);
    const dayData = state.days[dateISO];

    // If alcohol was completed (meaning no alcohol), continue streak
    if (dayData?.alcohol?.completed) {
      streak++;
    } else if (dayData?.alcohol?.planned) {
      // If alcohol was planned but not completed (meaning they drank), break streak
      break;
    }
    // If no alcohol data for this day, continue checking previous days

    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
};

// Get styling for gym/meditation week streaks
export const getWeekStreakStyling = (weeks: number) => {
  const stars = Math.floor(weeks / 5);
  
  if (weeks >= 5) {
    return {
      backgroundColor: '#FFD700', // Gold
      color: '#B8860B',
      stars: stars,
      label: `${weeks} weeks`
    };
  } else if (weeks >= 3) {
    return {
      backgroundColor: '#0F5132', // Dark green
      color: 'white',
      stars: 0,
      label: `${weeks} weeks`
    };
  } else if (weeks >= 1) {
    return {
      backgroundColor: '#D1E7DD', // Light green
      color: '#0F5132',
      stars: 0,
      label: `${weeks} weeks`
    };
  } else {
    return {
      backgroundColor: '#F8F9FA', // Light gray
      color: '#6C757D',
      stars: 0,
      label: '0 weeks'
    };
  }
};

// Get styling for alcohol day streaks
export const getDayStreakStyling = (days: number) => {
  if (days >= 30) {
    return {
      backgroundColor: '#FFD700', // Gold
      color: '#B8860B',
      stars: 1,
      label: `${days} days`
    };
  } else if (days >= 20) {
    return {
      backgroundColor: '#0F5132', // Dark green
      color: 'white',
      stars: 0,
      label: `${days} days`
    };
  } else if (days >= 13) {
    return {
      backgroundColor: '#198754', // Medium green
      color: 'white',
      stars: 0,
      label: `${days} days`
    };
  } else if (days >= 6) {
    return {
      backgroundColor: '#D1E7DD', // Light green
      color: '#0F5132',
      stars: 0,
      label: `${days} days`
    };
  } else {
    return {
      backgroundColor: '#F8F9FA', // Light gray
      color: '#6C757D',
      stars: 0,
      label: `${days} days`
    };
  }
};
