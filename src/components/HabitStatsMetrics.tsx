
import React from "react";
import { HabitType, HabitStats, HabitsState } from "@/types/habit";
import { habitColors } from "@/utils/chartUtils";
import { 
  calculateGymStreakWeeks, 
  calculateMeditationStreakWeeks, 
  getWeekStreakStyling,
  getDayStreakStyling 
} from "@/utils/streakUtils";
import { getDubaiDate, getTodayISO, formatDateISO } from "@/utils/dateUtils";

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

// Calculate alcohol streak (consecutive days) - COPIED FROM GYM LOGIC BUT FOR DAYS
const calculateAlcoholStreakDays = (state: HabitsState): number => {
  console.log('=== CALCULATING ALCOHOL STREAK (CONSECUTIVE DAYS - COPIED FROM GYM LOGIC) ===');
  console.log('Full habits state:', state);
  console.log('Available days in state:', Object.keys(state?.days || {}));
  
  if (!state || !state.days) {
    console.log('No state or days data available');
    return 0;
  }

  // Use Dubai timezone consistently
  const today = getDubaiDate();
  const todayISO = getTodayISO();
  console.log('Today in Dubai timezone:', todayISO);
  console.log('Today date object:', today);

  let streak = 0;
  
  // Start from today and go backwards day by day (like gym logic but for days instead of weeks)
  let currentDate = new Date(today);
  console.log('Starting from date:', formatDateISO(currentDate));
  
  // Go back up to 60 days to find streaks (prevent infinite loop)
  let daysChecked = 0;
  const maxDaysToCheck = 60;

  while (daysChecked < maxDaysToCheck) {
    const dateISO = formatDateISO(currentDate);
    console.log(`\n--- Checking alcohol day ${daysChecked + 1}: ${dateISO} ---`);

    const dayData = state.days[dateISO];
    console.log(`Day data for ${dateISO}:`, dayData);
    
    if (dayData?.alcohol) {
      const alcoholData = dayData.alcohol;
      console.log(`Alcohol data details: planned=${alcoholData.planned}, completed=${alcoholData.completed}`);
      
      if (alcoholData.planned) {
        if (alcoholData.completed) {
          streak++;
          console.log(`✅ Completed alcohol avoidance on ${dateISO}! Streak now: ${streak}`);
        } else {
          console.log(`❌ Failed alcohol avoidance on ${dateISO}, breaking streak`);
          break; // Break the streak like in gym logic
        }
      } else {
        // No alcohol planned for this day - skip but don't break streak (like gym logic)
        console.log(`⚪ Alcohol avoidance not planned for ${dateISO}, skipping without breaking streak`);
      }
    } else {
      // No alcohol data for this day - skip but don't break streak (like gym logic)
      console.log(`⚫ No alcohol data for ${dateISO}, skipping without breaking streak`);
    }

    // Move to previous day
    currentDate.setDate(currentDate.getDate() - 1);
    daysChecked++;
  }

  console.log('=== FINAL ALCOHOL STREAK:', streak, 'DAYS ===');
  return streak;
};

const HabitStatsMetrics: React.FC<HabitStatsMetricsProps> = ({
  habitType,
  stats,
  sleepQualityStats,
  habitsState
}) => {
  const colors = habitColors[habitType];

  // Add debugging with Dubai timezone
  console.log(`=== HabitStatsMetrics Debug for ${habitType} (Dubai timezone) ===`);
  console.log('habitsState received:', habitsState);
  console.log('habitsState.days keys:', habitsState ? Object.keys(habitsState.days) : 'NO HABITS STATE');
  console.log('Current Dubai time:', getTodayISO());

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
      console.log('Calling calculateAlcoholStreakDays (consecutive days - copied from gym logic)...');
      streakValue = calculateAlcoholStreakDays(habitsState);
      console.log('Alcohol streak result:', streakValue);
      streakLabel = "Current streak (consecutive days)";
      styling = getDayStreakStyling(streakValue);
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
