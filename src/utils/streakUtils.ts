
import { HabitsState, HabitType } from "@/types/habit";
import { formatDateISO, getDaysInMonth } from "./habitUtils";

// Helper function to get Monday of any given date
const getMondayOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

// Calculate gym streak (perfect weeks)
export const calculateGymStreakWeeks = (state: HabitsState): number => {
  if (!state || !state.days) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  
  // Start from the Monday of this week and go backwards
  let currentWeekStart = getMondayOfWeek(today);
  
  // If today is Monday or we're early in the week and haven't completed it yet, 
  // we might want to start from the current week or previous week
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  
  // If we're in the middle of the current week, check if it's complete first
  // Only skip current week if it's incomplete and we're past Wednesday
  const dayOfWeek = today.getDay();
  const isCurrentWeekIncomplete = currentWeekEnd >= today && dayOfWeek >= 3; // Wednesday or later
  
  if (isCurrentWeekIncomplete) {
    // Check if current week has any incomplete planned sessions
    let hasIncompleteCurrentWeek = false;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(currentWeekStart);
      checkDate.setDate(currentWeekStart.getDate() + i);
      
      if (checkDate > today) continue; // Skip future days
      
      const dateISO = formatDateISO(checkDate);
      const dayData = state.days[dateISO];
      
      if (dayData?.gym?.planned && !dayData.gym.completed) {
        hasIncompleteCurrentWeek = true;
        break;
      }
    }
    
    // Only skip current week if it has incomplete planned sessions
    if (hasIncompleteCurrentWeek) {
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    }
  }

  console.log('Calculating gym streak, starting from week:', formatDateISO(currentWeekStart));

  // Go back up to 2 years to find streaks (prevent infinite loop)
  let weeksChecked = 0;
  const maxWeeksToCheck = 104; // 2 years

  while (weeksChecked < maxWeeksToCheck) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    console.log('Checking gym week:', formatDateISO(currentWeekStart), 'to', formatDateISO(weekEnd));

    let plannedDays = 0;
    let completedDays = 0;

    // Check each day of the week
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(currentWeekStart);
      checkDate.setDate(currentWeekStart.getDate() + i);
      
      // Don't check future days
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

    console.log(`Gym week ${formatDateISO(currentWeekStart)}: planned=${plannedDays}, completed=${completedDays}`);

    // If no gym was planned this week, skip it (don't break streak)
    if (plannedDays === 0) {
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      weeksChecked++;
      continue;
    }

    // If all planned gym sessions were completed, continue streak
    if (plannedDays === completedDays && plannedDays > 0) {
      streak++;
      console.log('Perfect gym week! Streak now:', streak);
    } else {
      // Streak broken
      console.log('Gym streak broken - not all planned sessions completed');
      break;
    }

    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    weeksChecked++;
  }

  console.log('Final gym streak:', streak);
  return streak;
};

// Calculate meditation streak (perfect weeks)
export const calculateMeditationStreakWeeks = (state: HabitsState): number => {
  if (!state || !state.days) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  
  // Start from the Monday of this week and go backwards
  let currentWeekStart = getMondayOfWeek(today);
  
  // If we're in the middle of the current week, check if it's complete first
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  
  const dayOfWeek = today.getDay();
  const isCurrentWeekIncomplete = currentWeekEnd >= today && dayOfWeek >= 3; // Wednesday or later
  
  if (isCurrentWeekIncomplete) {
    // Check if current week has any incomplete planned sessions
    let hasIncompleteCurrentWeek = false;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(currentWeekStart);
      checkDate.setDate(currentWeekStart.getDate() + i);
      
      if (checkDate > today) continue;
      
      const dateISO = formatDateISO(checkDate);
      const dayData = state.days[dateISO];
      
      if (dayData?.meditation?.planned && !dayData.meditation.completed) {
        hasIncompleteCurrentWeek = true;
        break;
      }
    }
    
    if (hasIncompleteCurrentWeek) {
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    }
  }

  console.log('Calculating meditation streak, starting from week:', formatDateISO(currentWeekStart));

  let weeksChecked = 0;
  const maxWeeksToCheck = 104; // 2 years

  while (weeksChecked < maxWeeksToCheck) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    let plannedDays = 0;
    let completedDays = 0;

    // Check each day of the week
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(currentWeekStart);
      checkDate.setDate(currentWeekStart.getDate() + i);
      
      // Don't check future days
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

    console.log(`Meditation week ${formatDateISO(currentWeekStart)}: planned=${plannedDays}, completed=${completedDays}`);

    // If no meditation was planned this week, skip it
    if (plannedDays === 0) {
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      weeksChecked++;
      continue;
    }

    // If all planned meditation sessions were completed, continue streak
    if (plannedDays === completedDays && plannedDays > 0) {
      streak++;
    } else {
      // Streak broken
      break;
    }

    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    weeksChecked++;
  }

  console.log('Final meditation streak:', streak);
  return streak;
};

// Calculate alcohol streak (days in a row without alcohol)
export const calculateAlcoholStreakDays = (state: HabitsState): number => {
  if (!state || !state.days) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let currentDate = new Date(today);

  console.log('Calculating alcohol streak, starting from:', formatDateISO(currentDate));

  // Go backwards day by day, but limit to prevent infinite loops
  let daysChecked = 0;
  const maxDaysToCheck = 365; // 1 year

  while (daysChecked < maxDaysToCheck) {
    const dateISO = formatDateISO(currentDate);
    const dayData = state.days[dateISO];

    console.log(`Checking alcohol for ${dateISO}:`, dayData?.alcohol);

    // For alcohol: planned=true and completed=true means NO alcohol was consumed (goal achieved)
    if (dayData?.alcohol?.planned) {
      if (dayData.alcohol.completed) {
        // No alcohol consumed - continue streak
        streak++;
        console.log('No alcohol day found, streak now:', streak);
      } else {
        // Alcohol was consumed - break streak
        console.log('Alcohol consumed, breaking streak');
        break;
      }
    } else {
      // If no alcohol plan for this day, we need to decide how to handle it
      // For now, let's not count it in the streak but also not break it
      // This allows for days where alcohol wasn't planned to not interfere
      console.log('No alcohol plan for this day, continuing to check previous days');
    }

    currentDate.setDate(currentDate.getDate() - 1);
    daysChecked++;
  }

  console.log('Final alcohol streak:', streak);
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
