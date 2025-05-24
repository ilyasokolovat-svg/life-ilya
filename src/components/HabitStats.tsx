import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HabitStats as HabitStatsType, HabitType, HabitGoal, WeeklyStats, DayData } from "@/types/habit";
import { Dumbbell, Wine, Moon, Brain, ChevronLeft, ChevronRight } from "lucide-react";
import { habitColors } from "@/utils/chartUtils";
import { Button } from "@/components/ui/button";
import WeeklyChart from "./WeeklyChart";
import { calculateSleepQualityStats } from "@/utils/habitUtils";

interface HabitStatsProps {
  habitType: HabitType;
  stats: HabitStatsType;
  goal?: HabitGoal;
  weeklyData: WeeklyStats[];
  viewMonth: number;
  viewYear: number;
  onMonthChange?: (month: number, year: number) => void;
  habitsState?: any; // Add this to pass the full habits state for sleep calculations
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
  // Track chart month/year locally if no callback is provided
  const [chartMonth, setChartMonth] = useState(viewMonth);
  const [chartYear, setChartYear] = useState(viewYear);
  
  const colors = habitColors[habitType];
  
  // Calculate sleep quality stats if this is sleep habit
  const sleepQualityStats = habitType === 'sleep' && habitsState 
    ? calculateSleepQualityStats(habitsState, viewYear, viewMonth)
    : null;

  // Calculate money saved for alcohol category
  const calculateMoneySaved = () => {
    if (habitType !== 'alcohol' || !habitsState) return 0;
    
    let moneySaved = 0;
    const monthStart = new Date(viewYear, viewMonth, 1);
    const monthEnd = new Date(viewYear, viewMonth + 1, 0);
    
    // Filter days for the specific month
    const days = Object.values(habitsState.days).filter((day: any) => {
      const dayDate = new Date(day.date);
      return dayDate >= monthStart && dayDate <= monthEnd;
    });
    
    // Count days where alcohol was planned but not consumed
    for (const day of days) {
      const dayData = day as DayData;
      const alcoholData = dayData.alcohol;
      if (alcoholData && alcoholData.planned && !alcoholData.completed) {
        moneySaved += 35;
      }
    }
    
    return moneySaved;
  };

  const moneySaved = calculateMoneySaved();
  
  const getHabitIcon = () => {
    switch (habitType) {
      case "gym":
        return <Dumbbell className="h-5 w-5" />;
      case "alcohol":
        return <Wine className="h-5 w-5" />;
      case "sleep":
        return <Moon className="h-5 w-5" />;
      case "meditation":
        return <Brain className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getHabitTitle = () => {
    switch (habitType) {
      case "gym":
        return "Gym Workouts";
      case "alcohol":
        return "No Alcohol Days";
      case "sleep":
        return "Good Sleep";
      case "meditation":
        return "Meditation";
      default:
        return "";
    }
  };

  // Calculate progress toward monthly goal
  let monthlyProgress = 0;
  let progressLabel = "";
  
  if (habitType === 'sleep' && sleepQualityStats) {
    // For sleep, calculate percentage of good sleep days vs days passed in month
    const today = new Date();
    const currentDate = new Date(viewYear, viewMonth, Math.min(today.getDate(), new Date(viewYear, viewMonth + 1, 0).getDate()));
    const daysPassedInMonth = currentDate.getDate();
    monthlyProgress = daysPassedInMonth > 0 ? Math.min(100, Math.round((sleepQualityStats.goodSleep / daysPassedInMonth) * 100)) : 0;
    progressLabel = `Monthly Goal Progress (${sleepQualityStats.goodSleep}/${daysPassedInMonth} days)`;
  } else if (goal?.frequency) {
    // For other habits, use existing calculation
    monthlyProgress = Math.min(100, Math.round((stats.totalCompleted / goal.frequency) * 100));
    progressLabel = `Monthly Goal Progress (${stats.totalCompleted}/${goal.frequency} days)`;
  }
  
  // Previous month function
  const prevMonth = () => {
    const newMonth = chartMonth === 0 ? 11 : chartMonth - 1;
    const newYear = chartMonth === 0 ? chartYear - 1 : chartYear;
    
    // Update local state
    setChartMonth(newMonth);
    setChartYear(newYear);
    
    // Call parent handler if provided
    if (onMonthChange) {
      onMonthChange(newMonth, newYear);
    }
  };

  // Next month function
  const nextMonth = () => {
    const newMonth = chartMonth === 11 ? 0 : chartMonth + 1;
    const newYear = chartMonth === 11 ? chartYear + 1 : chartYear;
    
    // Update local state
    setChartMonth(newMonth);
    setChartYear(newYear);
    
    // Call parent handler if provided
    if (onMonthChange) {
      onMonthChange(newMonth, newYear);
    }
  };

  // Get month name
  const getMonthName = (month: number) => {
    return new Date(2000, month, 1).toLocaleDateString('default', { month: 'short' });
  };

  return (
    <Card className="stats-card h-full flex flex-col" style={{ borderColor: colors.primary }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {getHabitIcon()}
          {getHabitTitle()}
        </CardTitle>
        
        {/* Monthly goal progress - moved here under the title */}
        {goal && progressLabel && (
          <div className="mt-2">
            <div className="flex justify-between mb-1">
              <span className="text-xs">{progressLabel}</span>
              <span className="text-xs font-semibold">{monthlyProgress}%</span>
            </div>
            <Progress 
              value={monthlyProgress} 
              className="h-2" 
              style={{ 
                "--progress-background": colors.secondary,
                "--progress-foreground": colors.primary
              } as React.CSSProperties}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {habitType === 'sleep' && sleepQualityStats ? (
          // Special layout for sleep with quality stats
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
        ) : habitType === 'alcohol' ? (
          // Special layout for alcohol with money saved
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-md" style={{ backgroundColor: colors.secondary }}>
              <p className="text-xs text-muted-foreground">Total Completed</p>
              <h3 className="text-xl font-bold">{stats.totalCompleted}</h3>
            </div>
            <div className="p-2 rounded-md" style={{ backgroundColor: colors.secondary }}>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
              <h3 className="text-xl font-bold">{stats.completionRate}%</h3>
            </div>
            <div className="p-2 rounded-md bg-green-100 col-span-2">
              <p className="text-xs text-muted-foreground">Money Saved 💰</p>
              <h3 className="text-xl font-bold">${moneySaved}</h3>
            </div>
          </div>
        ) : (
          // Layout for other habits (gym, meditation) - removed streaks
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-md" style={{ backgroundColor: colors.secondary }}>
              <p className="text-xs text-muted-foreground">Total Completed</p>
              <h3 className="text-xl font-bold">{stats.totalCompleted}</h3>
            </div>
            <div className="p-2 rounded-md" style={{ backgroundColor: colors.secondary }}>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
              <h3 className="text-xl font-bold">{stats.completionRate}%</h3>
            </div>
          </div>
        )}
        
        {/* Chart section - positioned at the bottom with flex-1 to push it down */}
        <div className="flex-1 flex flex-col justify-end">
          {/* Chart navigation */}
          <div className="flex items-center justify-between text-xs font-medium mb-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={prevMonth}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span>{getMonthName(chartMonth)} {chartYear}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={nextMonth}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Embedded Weekly Chart */}
          <div className="mt-1">
            <WeeklyChart 
              habitType={habitType} 
              data={weeklyData}
              title={`${getHabitTitle()} Trend`}
              compact={true}
              viewMonth={chartMonth}
              viewYear={chartYear}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HabitStats;
