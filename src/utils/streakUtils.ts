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

  // Use current date properly
  const today = new Date();
  const todayISO = formatDateISO(today);
  console.log('Today date object:', today);
  console.log('Today ISO:', todayISO);
  
  let streak = 0;
  
  // Start from the Monday of this week and go backwards
  let currentWeekStart = getMondayOfWeek(today);
  console.log('Starting from week beginning:', formatDateISO(currentWeekStart));
  
  // Go back up to 2 years to find streaks (prevent infinite loop)
  let weeksChecked = 0;
  const maxWeeksToCheck = 104; // 2 years

  while (weeksChecked < maxWeeksToCheck) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);

    console.log(`\n--- Checking gym week ${weeksChecked + 1} ---`);
    console.log('Week start:', formatDateISO(currentWeekStart));
    console.log('Week end:', formatDateISO(weekEnd));

    let plannedDays = 0;
    let completedDays = 0;
    let hasAnyGymData = false;

    // Check each day of the week
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(currentWeekStart);
      checkDate.setDate(currentWeekStart.getDate() + i);
      
      // Don't check future days beyond today
      if (checkDate > today) {
        console.log(`Skipping future date: ${formatDateISO(checkDate)}`);
        continue;
      }

      const dateISO = formatDateISO(checkDate);
      const dayData = state.days[dateISO];
      
      console.log(`Day ${formatDateISO(checkDate)}:`, dayData?.gym || 'NO GYM DATA');

      if (dayData?.gym) {
        hasAnyGymData = true;
        if (dayData.gym.planned) {
          plannedDays++;
          if (dayData.gym.completed) {
            completedDays++;
          }
        }
      }
    }

    console.log(`Week summary: planned=${plannedDays}, completed=${completedDays}, hasAnyGymData=${hasAnyGymData}`);

    // If this is the current week and we're early in the week, check if we should count it
    const isCurrentWeek = currentWeekStart <= today && weekEnd >= today;
    
    if (isCurrentWeek) {
      console.log('This is the current week');
      // For current week, only count if we have some gym activity planned and it's not too early in the week
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      if (dayOfWeek >= 1 && plannedDays > 0) { // From Monday onwards
        // Check if we have any incomplete planned sessions
        let hasIncompleteThisWeek = false;
        for (let i = 0; i < 7; i++) {
          const checkDate = new Date(currentWeekStart);
          checkDate.setDate(currentWeekStart.getDate() + i);
          
          if (checkDate > today) continue;
          
          const dateISO = formatDateISO(checkDate);
          const dayData = state.days[dateISO];
          
          if (dayData?.gym?.planned && !dayData.gym.completed) {
            hasIncompleteThisWeek = true;
            break;
          }
        }
        
        if (hasIncompleteThisWeek) {
          console.log('Current week has incomplete gym sessions, not counting');
        } else if (plannedDays === completedDays && plannedDays > 0) {
          streak++;
          console.log(`Perfect current gym week! Streak now: ${streak}`);
        }
      }
    } else {
      // For past weeks
      if (!hasAnyGymData || plannedDays === 0) {
        console.log('No gym data for this past week, skipping without breaking streak');
      } else if (plannedDays === completedDays && plannedDays > 0) {
        streak++;
        console.log(`Perfect past gym week! Streak now: ${streak}`);
      } else {
        console.log('Past gym week was incomplete, breaking streak');
        break;
      }
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
    let hasAnyMeditationData = false;

    // Check each day of the week
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(currentWeekStart);
      checkDate.setDate(currentWeekStart.getDate() + i);
      
      // Don't check future days
      if (checkDate > today) continue;

      const dateISO = formatDateISO(checkDate);
      const dayData = state.days[dateISO];

      console.log(`Day ${formatDateISO(checkDate)}:`, dayData?.meditation || 'NO MEDITATION DATA');

      if (dayData?.meditation) {
        hasAnyMeditationData = true;
        if (dayData.meditation.planned) {
          plannedDays++;
          if (dayData.meditation.completed) {
            completedDays++;
          }
        }
      }
    }

    console.log(`Meditation week summary: planned=${plannedDays}, completed=${completedDays}, hasAnyMeditationData=${hasAnyMeditationData}`);

    // Similar logic to gym
    const isCurrentWeek = currentWeekStart <= today && weekEnd >= today;
    
    if (isCurrentWeek) {
      const dayOfWeek = today.getDay();
      
      if (dayOfWeek >= 1 && plannedDays > 0) {
        let hasIncompleteThisWeek = false;
        for (let i = 0; i < 7; i++) {
          const checkDate = new Date(currentWeekStart);
          checkDate.setDate(currentWeekStart.getDate() + i);
          
          if (checkDate > today) continue;
          
          const dateISO = formatDateISO(checkDate);
          const dayData = state.days[dateISO];
          
          if (dayData?.meditation?.planned && !dayData.meditation.completed) {
            hasIncompleteThisWeek = true;
            break;
          }
        }
        
        if (!hasIncompleteThisWeek && plannedDays === completedDays && plannedDays > 0) {
          streak++;
          console.log(`Perfect current meditation week! Streak now: ${streak}`);
        }
      }
    } else {
      if (!hasAnyMeditationData || plannedDays === 0) {
        console.log('No meditation data for this past week, skipping');
      } else if (plannedDays === completedDays && plannedDays > 0) {
        streak++;
        console.log(`Perfect past meditation week! Streak now: ${streak}`);
      } else {
        console.log('Past meditation week was incomplete, breaking streak');
        break;
      }
    }

    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    weeksChecked++;
  }

  console.log('=== FINAL MEDITATION STREAK:', streak, '===');
  return streak;
};

// COMPLETELY REBUILT: Calculate alcohol streak (consecutive days with completed alcohol avoidance)
export const calculateAlcoholStreakDays = (state: HabitsState): number => {
  console.log('=== CALCULATING ALCOHOL STREAK (FINAL REBUILD) ===');
  
  if (!state || !state.days) {
    console.log('No state or days data available');
    return 0;
  }

  console.log('Available days in state:', Object.keys(state.days));
  
  // Get all dates with data, sorted from newest to oldest
  const allDates = Object.keys(state.days)
    .filter(dateISO => {
      const dayData = state.days[dateISO];
      return dayData && dayData.alcohol; // Only dates with alcohol data
    })
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Newest first
  
  console.log('Dates with alcohol data (newest first):', allDates);
  
  let streak = 0;
  
  // Go through dates from newest to oldest
  for (const dateISO of allDates) {
    const dayData = state.days[dateISO];
    const alcoholData = dayData.alcohol;
    
    console.log(`\n=== Checking ${dateISO} ===`);
    console.log('Full day data:', dayData);
    console.log('Alcohol data:', alcoholData);
    console.log('Planned:', alcoholData?.planned);
    console.log('Completed:', alcoholData?.completed);
    
    if (alcoholData?.planned && alcoholData?.completed) {
      // Successfully avoided alcohol (planned and completed)
      streak++;
      console.log(`✅ Successfully avoided alcohol on ${dateISO}! Streak now: ${streak}`);
    } else if (alcoholData?.planned && !alcoholData?.completed) {
      // Planned to avoid alcohol but failed - break streak
      console.log(`❌ Failed to avoid alcohol on ${dateISO}, breaking streak`);
      break;
    } else if (!alcoholData?.planned) {
      // Not planned for this day - continue checking previous days
      console.log(`⚪ Alcohol avoidance not planned for ${dateISO}, continuing to check older days`);
      continue;
    }
  }
  
  console.log('=== FINAL ALCOHOL STREAK:', streak, 'DAYS ===');
  return streak;
};

// Get styling for gym/meditation week streaks
export const getWeekStreakStyling = (weeks: number) => {
  const stars = Math.floor(weeks / 5);
  
  if (weeks >= 5) {
    return {
      backgroundColor: '#FEF3C7', // Light golden yellow
      color: '#92400E', // Dark amber
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
      backgroundColor: '#FEF3C7', // Light golden yellow
      color: '#92400E', // Dark amber
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
