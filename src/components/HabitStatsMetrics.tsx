
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

// New function to calculate alcohol streak for current month only
const calculateAlcoholStreakThisMonth = (state: HabitsState, viewMonth: number, viewYear: number): number => {
  console.log('=== CALCULATING ALCOHOL STREAK THIS MONTH ===');
  
  if (!state || !state.days) {
    console.log('No state or days data available');
    return 0;
  }

  // Get all days in the current month up to today
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const today = new Date();
  
  let streak = 0;
  
  // Go through days from today backwards to find consecutive completed days
  for (let i = daysInMonth.length - 1; i >= 0; i--) {
    const date = daysInMonth[i];
    
    // Only check days up to today
    if (date > today) continue;
    
    const dateISO = formatDateISO(date);
    const dayData = state.days[dateISO];
    
    console.log(`Checking ${dateISO}:`, dayData?.alcohol);
    
    if (dayData?.alcohol?.completed) {
      streak++;
      console.log(`✅ Alcohol avoided on ${dateISO}! Streak now: ${streak}`);
    } else {
      console.log(`❌ Alcohol not avoided (or no data) on ${dateISO}, stopping streak calculation`);
      break;
    }
  }
  
  console.log('=== FINAL ALCOHOL STREAK THIS MONTH:', streak, 'DAYS ===');
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
      console.log('Calling calculateAlcoholStreakThisMonth...');
      // Get current month and year - we need to pass these from parent component
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      streakValue = calculateAlcoholStreakThisMonth(habitsState, currentMonth, currentYear);
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
