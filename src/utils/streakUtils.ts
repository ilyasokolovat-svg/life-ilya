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
  console.log('=== CALCULATING GYM STREAK ===');
  console.log('Full habits state:', state);
  console.log('Available days in state:', Object.keys(state?.days || {}));
  
  if (!state || !state.days) {
    console.log('No state or days data available');
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log('Today date object:', today);
  console.log('Today ISO:', formatDateISO(today));
  
  let streak = 0;
  
  // Start from the Monday of this week and go backwards
  let currentWeekStart = getMondayOfWeek(today);
  console.log('Starting from week beginning:', formatDateISO(currentWeekStart));
  
  // If we're in the middle of the current week, check if it's complete first
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  
  const dayOfWeek = today.getDay();
  const isCurrentWeekIncomplete = currentWeekEnd >= today && dayOfWeek >= 3; // Wednesday or later
  
  console.log('Current week end:', formatDateISO(currentWeekEnd));
  console.log('Day of week:', dayOfWeek);
  console.log('Is current week incomplete?', isCurrentWeekIncomplete);
  
  if (isCurrentWeekIncomplete) {
    // Check if current week has any incomplete planned sessions
    let hasIncompleteCurrentWeek = false;
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(currentWeekStart);
      checkDate.setDate(currentWeekStart.getDate() + i);
      
      if (checkDate > today) continue;
      
      const dateISO = formatDateISO(checkDate);
      const dayData = state.days[dateISO];
      
      console.log(`Checking current week day ${dateISO}:`, dayData?.gym);
      
      if (dayData?.gym?.planned && !dayData.gym.completed) {
        hasIncompleteCurrentWeek = true;
        break;
      }
    }
    
    console.log('Has incomplete current week?', hasIncompleteCurrentWeek);
    
    if (hasIncompleteCurrentWeek) {
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      console.log('Skipping current week, starting from:', formatDateISO(currentWeekStart));
    }
  }

  // Go back up to 2 years to find streaks (prevent infinite loop)
  let weeksChecked = 0;
  const maxWeeksToCheck = 104; // 2 years

  while (weeksChecked < maxWeeksToCheck) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    console.log(`\n--- Checking gym week ${weeksChecked + 1} ---`);
    console.log('Week start:', formatDateISO(currentWeekStart));
    console.log('Week end:', formatDateISO(weekEnd));

    let plannedDays = 0;
    let completedDays = 0;

    // Check each day of the week
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(currentWeekStart);
      checkDate.setDate(currentWeekStart.getDate() + i);
      
      // Don't check future days
      if (checkDate > today) {
        console.log(`Skipping future date: ${formatDateISO(checkDate)}`);
        continue;
      }

      const dateISO = formatDateISO(checkDate);
      const dayData = state.days[dateISO];
      
      console.log(`Day ${formatDateISO(checkDate)}:`, dayData?.gym || 'NO GYM DATA');

      if (dayData?.gym?.planned) {
        plannedDays++;
        if (dayData.gym.completed) {
          completedDays++;
        }
      }
    }

    console.log(`Week summary: planned=${plannedDays}, completed=${completedDays}`);

    // If no gym was planned this week, skip it (don't break streak)
    if (plannedDays === 0) {
      console.log('No gym planned this week, skipping without breaking streak');
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      weeksChecked++;
      continue;
    }

    // If all planned gym sessions were completed, continue streak
    if (plannedDays === completedDays && plannedDays > 0) {
      streak++;
      console.log(`Perfect gym week! Streak now: ${streak}`);
    } else {
      console.log('Gym streak broken - not all planned sessions completed');
      break;
    }

    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    weeksChecked++;
  }

  console.log('=== FINAL GYM STREAK:', streak, '===');
  return streak;
};

// Calculate meditation streak (perfect weeks)
export const calculateMeditationStreakWeeks = (state: HabitsState): number => {
  console.log('=== CALCULATING MEDITATION STREAK ===');
  
  if (!state || !state.days) {
    console.log('No state or days data available');
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  
  // Start from the Monday of this week and go backwards
  let currentWeekStart = getMondayOfWeek(today);
  
  console.log('Starting meditation streak calculation from:', formatDateISO(currentWeekStart));

  let weeksChecked = 0;
  const maxWeeksToCheck = 104; // 2 years

  while (weeksChecked < maxWeeksToCheck) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);

    console.log(`\n--- Checking meditation week ${weeksChecked + 1} ---`);
    console.log('Week start:', formatDateISO(currentWeekStart));

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

      console.log(`Day ${formatDateISO(checkDate)}:`, dayData?.meditation || 'NO MEDITATION DATA');

      if (dayData?.meditation?.planned) {
        plannedDays++;
        if (dayData.meditation.completed) {
          completedDays++;
        }
      }
    }

    console.log(`Meditation week summary: planned=${plannedDays}, completed=${completedDays}`);

    // If no meditation was planned this week, skip it
    if (plannedDays === 0) {
      console.log('No meditation planned this week, skipping');
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      weeksChecked++;
      continue;
    }

    // If all planned meditation sessions were completed, continue streak
    if (plannedDays === completedDays && plannedDays > 0) {
      streak++;
      console.log(`Perfect meditation week! Streak now: ${streak}`);
    } else {
      console.log('Meditation streak broken');
      break;
    }

    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    weeksChecked++;
  }

  console.log('=== FINAL MEDITATION STREAK:', streak, '===');
  return streak;
};

// Calculate alcohol streak (days in a row without alcohol)
export const calculateAlcoholStreakDays = (state: HabitsState): number => {
  console.log('=== CALCULATING ALCOHOL STREAK ===');
  console.log('Full habits state:', state);
  console.log('Available days in state:', Object.keys(state?.days || {}));
  
  if (!state || !state.days) {
    console.log('No state or days data available');
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let currentDate = new Date(today);

  console.log('Starting alcohol streak calculation from today:', formatDateISO(currentDate));

  // Go backwards day by day, but limit to prevent infinite loops
  let daysChecked = 0;
  const maxDaysToCheck = 365; // 1 year

  while (daysChecked < maxDaysToCheck) {
    const dateISO = formatDateISO(currentDate);
    const dayData = state.days[dateISO];

    console.log(`\nDay ${daysChecked + 1}: ${dateISO}`);
    console.log('Day data:', dayData);
    console.log('Alcohol data:', dayData?.alcohol);

    // For alcohol: planned=true and completed=true means NO alcohol was consumed (goal achieved)
    if (dayData?.alcohol?.planned) {
      if (dayData.alcohol.completed) {
        // No alcohol consumed - continue streak
        streak++;
        console.log(`No alcohol day found! Streak now: ${streak}`);
      } else {
        // Alcohol was consumed - break streak
        console.log('Alcohol consumed, breaking streak');
        break;
      }
    } else {
      // If no alcohol plan for this day, we should probably break the streak
      // as it indicates we weren't tracking alcohol that day
      console.log('No alcohol plan for this day - should we count it?');
      // For now, let's break the streak if there's no plan
      if (daysChecked > 0) { // Don't break on the first day if no plan
        console.log('No alcohol tracking for this day, breaking streak');
        break;
      }
    }

    currentDate.setDate(currentDate.getDate() - 1);
    daysChecked++;
  }

  console.log('=== FINAL ALCOHOL STREAK:', streak, '===');
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
