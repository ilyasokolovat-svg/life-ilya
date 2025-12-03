
import React from "react";
import { Card } from "@/components/ui/card";
import { HabitStats as HabitStatsType, HabitType } from "@/types/habit";
import { habitColors } from "@/utils/chartUtils";
import { calculateSleepQualityStats } from "@/utils/habitUtils";
import HabitStatsHeader from "./HabitStatsHeader";
import HabitStatsMetrics from "./HabitStatsMetrics";

interface HabitStatsProps {
  habitType: HabitType;
  stats: HabitStatsType;
  habitsState?: any;
  viewMonth: number;
  viewYear: number;
}

const HabitStats: React.FC<HabitStatsProps> = ({ 
  habitType, 
  stats, 
  habitsState,
  viewMonth,
  viewYear
}) => {
  const colors = habitColors[habitType];
  
  // Calculate sleep quality stats if this is sleep habit
  const sleepQualityStats = habitType === 'sleep' && habitsState 
    ? calculateSleepQualityStats(habitsState, viewYear, viewMonth)
    : null;

  return (
    <Card className="stats-card overflow-hidden p-3" style={{ borderColor: colors.primary }}>
      <div className="space-y-2">
        <HabitStatsHeader
          habitType={habitType}
        />
        
        <HabitStatsMetrics
          habitType={habitType}
          stats={stats}
          sleepQualityStats={sleepQualityStats}
          habitsState={habitsState}
          viewMonth={viewMonth}
          viewYear={viewYear}
        />
      </div>
    </Card>
  );
};

export default HabitStats;
