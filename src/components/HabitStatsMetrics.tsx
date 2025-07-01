
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

// Fixed alcohol streak calculation - completely rebuilt to match gym logic
const calculateAlcoholStreakAllTime = (state: HabitsState): number => {
  console.log('=== CALCULATING ALCOHOL STREAK ALL TIME (REBUILT) ===');
  
  if (!state || !state.days) {
    console.log('No state or days data available');
    return 0;
  }

  console.log('Available days in state:', Object.keys(state.days));
  
  // Get all dates with data, sorted from newest to oldest
  const allDates = Object.keys(state.days)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Newest first
  
  console.log('All dates (newest first):', allDates);
  
  const today = new Date();
  let streak = 0;
  
  // Go through dates from newest to oldest, but only count up to today
  for (const dateISO of allDates) {
    const checkDate = new Date(dateISO);
    
    // Only check days up to today
    if (checkDate > today) {
      console.log(`Skipping future date: ${dateISO}`);
      continue;
    }
    
    const dayData = state.days[dateISO];
    
    console.log(`\n=== Checking ${dateISO} ===`);
    console.log('Full day data:', dayData);
    console.log('Alcohol data:', dayData?.alcohol);
    
    if (dayData?.alcohol) {
      const alcoholData = dayData.alcohol;
      console.log('Alcohol completed:', alcoholData.completed);
      
      if (alcoholData.completed) {
        // Successfully avoided alcohol
        streak++;
        console.log(`✅ Successfully avoided alcohol on ${dateISO}! Streak now: ${streak}`);
      } else {
        // Has alcohol data but not completed - this breaks the streak
        console.log(`❌ Alcohol not avoided on ${dateISO}, breaking streak`);
        break;
      }
    } else {
      // No alcohol data for this day - continue checking without breaking streak
      console.log(`⚪ No alcohol data for ${dateISO}, continuing`);
      continue;
    }
  }
  
  console.log('=== FINAL ALCOHOL STREAK ALL TIME:', streak, 'DAYS ===');
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
      console.log('Calling calculateAlcoholStreakAllTime...');
      streakValue = calculateAlcoholStreakAllTime(habitsState);
      console.log('Alcohol streak result:', streakValue);
      streakLabel = "Current streak this month";
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
