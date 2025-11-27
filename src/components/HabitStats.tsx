
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HabitStats as HabitStatsType, HabitType, HabitGoal, WeeklyStats } from "@/types/habit";
import { habitColors } from "@/utils/chartUtils";
import { calculateSleepQualityStats } from "@/utils/habitUtils";
import HabitStatsHeader from "./HabitStatsHeader";
import HabitStatsMetrics from "./HabitStatsMetrics";
import HabitStatsChart from "./HabitStatsChart";

interface HabitStatsProps {
  habitType: HabitType;
  stats: HabitStatsType;
  goal?: HabitGoal;
  weeklyData: WeeklyStats[];
  viewMonth: number;
  viewYear: number;
  onMonthChange?: (month: number, year: number) => void;
  habitsState?: any;
}

const HabitStats: React.FC<HabitStatsProps> = ({ 
  habitType, 
  stats, 
  goal,
  weeklyData,
  viewMonth,
  viewYear,
  onMonthChange,
  habitsState
}) => {
  const [chartMonth, setChartMonth] = useState(viewMonth);
  const [chartYear, setChartYear] = useState(viewYear);
  
  const colors = habitColors[habitType];
  
  // Add debugging to see what's being passed
  console.log(`=== HabitStats Debug for ${habitType} ===`);
  console.log('habitsState prop:', habitsState);
  console.log('habitsState type:', typeof habitsState);
  console.log('habitsState keys:', habitsState ? Object.keys(habitsState) : 'null/undefined');
  
  // Calculate sleep quality stats if this is sleep habit
  const sleepQualityStats = habitType === 'sleep' && habitsState 
    ? calculateSleepQualityStats(habitsState, viewYear, viewMonth)
    : null;
  
  const prevMonth = () => {
    const newMonth = chartMonth === 0 ? 11 : chartMonth - 1;
    const newYear = chartMonth === 0 ? chartYear - 1 : chartYear;
    
    setChartMonth(newMonth);
    setChartYear(newYear);
    
    if (onMonthChange) {
      onMonthChange(newMonth, newYear);
    }
  };

  const nextMonth = () => {
    const newMonth = chartMonth === 11 ? 0 : chartMonth + 1;
    const newYear = chartMonth === 11 ? chartYear + 1 : chartYear;
    
    setChartMonth(newMonth);
    setChartYear(newYear);
    
    if (onMonthChange) {
      onMonthChange(newMonth, newYear);
    }
  };

  return (
    <Card className="stats-card overflow-hidden" style={{ borderColor: colors.primary }}>
      <div className="flex flex-col md:flex-row md:items-center gap-4 p-4">
        {/* Left side: Header and Metrics */}
        <div className="md:w-1/3 space-y-3 flex-shrink-0">
          <HabitStatsHeader
            habitType={habitType}
          />
          
          <HabitStatsMetrics
            habitType={habitType}
            stats={stats}
            sleepQualityStats={sleepQualityStats}
            habitsState={habitsState}
          />
        </div>
        
        {/* Right side: Chart */}
        <div className="md:w-2/3 flex-1 min-w-0">
          <HabitStatsChart
            habitType={habitType}
            weeklyData={weeklyData}
            chartMonth={chartMonth}
            chartYear={chartYear}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
          />
        </div>
      </div>
    </Card>
  );
};

export default HabitStats;
