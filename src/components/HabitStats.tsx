
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
  
  // Calculate sleep quality stats if this is sleep habit
  const sleepQualityStats = habitType === 'sleep' && habitsState 
    ? calculateSleepQualityStats(habitsState, viewYear, viewMonth)
    : null;
  
  // Calculate progress toward monthly goal
  let monthlyProgress = 0;
  let progressLabel = "";
  
  if (habitType === 'sleep' && sleepQualityStats) {
    const today = new Date();
    const currentDate = new Date(viewYear, viewMonth, Math.min(today.getDate(), new Date(viewYear, viewMonth + 1, 0).getDate()));
    const daysPassedInMonth = currentDate.getDate();
    monthlyProgress = daysPassedInMonth > 0 ? Math.min(100, Math.round((sleepQualityStats.goodSleep / daysPassedInMonth) * 100)) : 0;
    progressLabel = `Monthly Goal Progress (${sleepQualityStats.goodSleep}/${daysPassedInMonth} days)`;
  } else if (goal?.frequency) {
    monthlyProgress = Math.min(100, Math.round((stats.totalCompleted / goal.frequency) * 100));
    progressLabel = `Monthly Goal Progress (${stats.totalCompleted}/${goal.frequency} days)`;
  }
  
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
    <Card className="stats-card h-full flex flex-col" style={{ borderColor: colors.primary }}>
      <HabitStatsHeader
        habitType={habitType}
        goal={goal}
        monthlyProgress={monthlyProgress}
        progressLabel={progressLabel}
      />
      
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <HabitStatsMetrics
          habitType={habitType}
          stats={stats}
          sleepQualityStats={sleepQualityStats}
        />
        
        <HabitStatsChart
          habitType={habitType}
          weeklyData={weeklyData}
          chartMonth={chartMonth}
          chartYear={chartYear}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />
      </CardContent>
    </Card>
  );
};

export default HabitStats;
