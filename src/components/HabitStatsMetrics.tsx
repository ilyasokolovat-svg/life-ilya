
import React from "react";
import { HabitType, HabitStats, HabitsState } from "@/types/habit";
import { habitColors } from "@/utils/chartUtils";
import { 
  calculateGymStreakWeeks, 
  calculateAlcoholStreakDays,
  getWeekStreakStyling,
  getAlcoholDayStreakStyling
} from "@/utils/streakUtils";
import { calculatePresenceStats } from "@/utils/presenceUtils";
import { getDubaiDate } from "@/utils/dateUtils";

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

const HabitStatsMetrics: React.FC<HabitStatsMetricsProps> = ({
  habitType,
  stats,
  sleepQualityStats,
  habitsState
}) => {
  const colors = habitColors[habitType];

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

  // For presence/meditation, show activity breakdown
  if (habitType === 'meditation' && habitsState) {
    const dubaiDate = getDubaiDate();
    const presenceStats = calculatePresenceStats(habitsState, dubaiDate.getFullYear(), dubaiDate.getMonth());
    
    return (
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-md bg-purple-100">
          <p className="text-xs text-muted-foreground">📝 Journal</p>
          <h3 className="text-xl font-bold">{presenceStats.journaling}</h3>
        </div>
        <div className="p-2 rounded-md bg-indigo-100">
          <p className="text-xs text-muted-foreground">🧘 Meditate</p>
          <h3 className="text-xl font-bold">{presenceStats.meditation}</h3>
        </div>
        <div className="p-2 rounded-md bg-blue-100">
          <p className="text-xs text-muted-foreground">📱 Mindful</p>
          <h3 className="text-xl font-bold">{presenceStats.mindfulPhone}</h3>
        </div>
      </div>
    );
  }

  // For alcohol, show streak in days
  if (habitType === 'alcohol') {
    let streakValue = 0;
    let streakLabel = "Current streak (Days in a row)";
    let styling = { backgroundColor: '#F8F9FA', color: '#6C757D', stars: 0, label: '0 days' };

    if (habitsState) {
      streakValue = calculateAlcoholStreakDays(habitsState);
      styling = getAlcoholDayStreakStyling(streakValue);
    }

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
  }

  // Calculate streaks for gym only
  let streakValue = 0;
  let streakLabel = "";
  let styling = { backgroundColor: '#F8F9FA', color: '#6C757D', stars: 0, label: '0' };

  if (habitsState && habitType === 'gym') {
    streakValue = calculateGymStreakWeeks(habitsState);
    streakLabel = "Current streak (perfect weeks)";
    styling = getWeekStreakStyling(streakValue);
  }

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
