
import React from "react";
import { HabitType, HabitStats, HabitsState } from "@/types/habit";
import { habitColors } from "@/utils/chartUtils";
import { 
  calculateGymStreakWeeks, 
  calculateMeditationStreakWeeks, 
  getWeekStreakStyling,
  getDayStreakStyling 
} from "@/utils/streakUtils";
import { formatDateISO, getDaysInMonth } from "@/utils/habitUtils";

interface SleepQualityStats {
  goodSleep: number;
  averageSleep: number;
  badSleep: number;
}

interface HabitStatsMetricsProps {
  habitType: HabitType;
  stats: HabitStats;
  sleepQualityStats?: SleepQualityStats;
  habitsState?: HabitsState;
}

// Helper function to get Monday of any given date (copied from streakUtils)
const getMondayOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

// Calculate alcohol streak (perfect weeks) - EXACT COPY of gym logic but for alcohol
const calculateAlcoholStreakWeeks = (state: HabitsState): number => {
  console.log('=== CALCULATING ALCOHOL STREAK (COPIED FROM GYM) ===');
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

    console.log(`\n--- Checking alcohol week ${weeksChecked + 1} ---`);
    console.log('Week start:', formatDateISO(currentWeekStart));
    console.log('Week end:', formatDateISO(weekEnd));

    let plannedDays = 0;
    let completedDays = 0;
    let hasAnyAlcoholData = false;

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
      
      console.log(`Day ${formatDateISO(checkDate)}:`, dayData?.alcohol || 'NO ALCOHOL DATA');

      if (dayData?.alcohol) {
        hasAnyAlcoholData = true;
        if (dayData.alcohol.planned) {
          plannedDays++;
          if (dayData.alcohol.completed) {
            completedDays++;
          }
        }
      }
    }

    console.log(`Week summary: planned=${plannedDays}, completed=${completedDays}, hasAnyAlcoholData=${hasAnyAlcoholData}`);

    // If this is the current week and we're early in the week, check if we should count it
    const isCurrentWeek = currentWeekStart <= today && weekEnd >= today;
    
    if (isCurrentWeek) {
      console.log('This is the current week');
      // For current week, only count if we have some alcohol activity planned and it's not too early in the week
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
          
          if (dayData?.alcohol?.planned && !dayData.alcohol.completed) {
            hasIncompleteThisWeek = true;
            break;
          }
        }
        
        if (hasIncompleteThisWeek) {
          console.log('Current week has incomplete alcohol sessions, not counting');
        } else if (plannedDays === completedDays && plannedDays > 0) {
          streak++;
          console.log(`Perfect current alcohol week! Streak now: ${streak}`);
        }
      }
    } else {
      // For past weeks
      if (!hasAnyAlcoholData || plannedDays === 0) {
        console.log('No alcohol data for this past week, skipping without breaking streak');
      } else if (plannedDays === completedDays && plannedDays > 0) {
        streak++;
        console.log(`Perfect past alcohol week! Streak now: ${streak}`);
      } else {
        console.log('Past alcohol week was incomplete, breaking streak');
        break;
      }
    }

    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    weeksChecked++;
  }

  console.log('=== FINAL ALCOHOL STREAK:', streak, '===');
  return streak;
};

const HabitStatsMetrics: React.FC<HabitStatsMetricsProps> = ({
  habitType,
  stats,
  sleepQualityStats,
  habitsState
}) => {
  const colors = habitColors[habitType];

  // Add debugging
  console.log(`=== HabitStatsMetrics Debug for ${habitType} ===`);
  console.log('habitsState received:', habitsState);
  console.log('habitsState.days keys:', habitsState ? Object.keys(habitsState.days) : 'NO HABITS STATE');

  if (habitType === 'sleep' && sleepQualityStats) {
    return (
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-md bg-green-100">
          <p className="text-xs text-muted-foreground">Good Sleep 😊</p>
          <h3 className="text-xl font-bold">{sleepQualityStats.goodSleep}</h3>
        </div>
        <div className="p-2 rounded-md bg-yellow-100">
          <p className="text-xs text-muted-foreground">Average Sleep 😐</p>
          <h3 className="text-xl font-bold">{sleepQualityStats.averageSleep}</h3>
        </div>
        <div className="p-2 rounded-md bg-red-100">
          <p className="text-xs text-muted-foreground">Bad Sleep 😔</p>
          <h3 className="text-xl font-bold">{sleepQualityStats.badSleep}</h3>
        </div>
      </div>
    );
  }

  // Calculate streaks for other habit types
  let streakValue = 0;
  let streakLabel = "";
  let styling = { backgroundColor: '#F8F9FA', color: '#6C757D', stars: 0, label: '0' };

  console.log(`Calculating streak for ${habitType}, habitsState exists:`, !!habitsState);

  if (habitsState) {
    if (habitType === 'gym') {
      console.log('Calling calculateGymStreakWeeks...');
      streakValue = calculateGymStreakWeeks(habitsState);
      console.log('Gym streak result:', streakValue);
      streakLabel = "Current streak (perfect weeks)";
      styling = getWeekStreakStyling(streakValue);
    } else if (habitType === 'meditation') {
      console.log('Calling calculateMeditationStreakWeeks...');
      streakValue = calculateMeditationStreakWeeks(habitsState);
      console.log('Meditation streak result:', streakValue);
      streakLabel = "Current streak (perfect weeks)";
      styling = getWeekStreakStyling(streakValue);
    } else if (habitType === 'alcohol') {
      console.log('Calling calculateAlcoholStreakWeeks (copied from gym)...');
      streakValue = calculateAlcoholStreakWeeks(habitsState);
      console.log('Alcohol streak result:', streakValue);
      streakLabel = "Current streak (perfect weeks)";
      styling = getWeekStreakStyling(streakValue);
    }
  } else {
    console.log(`No habitsState provided for ${habitType}`);
  }

  console.log(`Final styling for ${habitType}:`, styling);

  // Render stars if applicable
  const renderStars = () => {
    if (styling.stars === 0) return null;
    
    return (
      <div className="flex gap-1 mt-1">
        {Array.from({ length: styling.stars }, (_, i) => (
          <span key={i} className="text-yellow-300 text-sm">⭐</span>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-2">
      <div 
        className="p-2 rounded-md transition-all duration-300" 
        style={{ 
          backgroundColor: styling.backgroundColor,
          color: styling.color 
        }}
      >
        <p className="text-xs opacity-80">{streakLabel}</p>
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold">{styling.label}</h3>
          {renderStars()}
        </div>
      </div>
    </div>
  );
};

export default HabitStatsMetrics;
