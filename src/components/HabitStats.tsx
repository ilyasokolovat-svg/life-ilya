import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HabitStats as HabitStatsType, HabitType, HabitGoal, WeeklyStats } from "@/types/habit";
import { Dumbbell, Wine, Moon, Brain, ChevronLeft, ChevronRight } from "lucide-react";
import { habitColors } from "@/utils/chartUtils";
import { Button } from "@/components/ui/button";
import WeeklyChart from "./WeeklyChart";
import { formatYearMonth, getMonthGoals } from "@/utils/habitUtils";

interface HabitStatsProps {
  habitType: HabitType;
  stats: HabitStatsType;
  goal?: HabitGoal;
  weeklyData: WeeklyStats[];
  viewMonth: number;
  viewYear: number;
  onMonthChange?: (month: number, year: number) => void;
}

const HabitStats: React.FC<HabitStatsProps> = ({ 
  habitType, 
  stats, 
  goal,
  weeklyData,
  viewMonth,
  viewYear,
  onMonthChange
}) => {
  // Track chart month/year locally if no callback is provided
  const [chartMonth, setChartMonth] = useState(viewMonth);
  const [chartYear, setChartYear] = useState(viewYear);
  
  const colors = habitColors[habitType];
  
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
  const monthlyProgress = goal?.frequency ? Math.min(100, Math.round((stats.totalCompleted / goal.frequency) * 100)) : 0;
  
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
    <Card className="stats-card h-full" style={{ borderColor: colors.primary }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {getHabitIcon()}
          {getHabitTitle()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-md" style={{ backgroundColor: colors.secondary }}>
            <p className="text-xs text-muted-foreground">Current Streak</p>
            <h3 className="text-xl font-bold">{stats.currentStreak} days</h3>
          </div>
          <div className="p-2 rounded-md" style={{ backgroundColor: colors.secondary }}>
            <p className="text-xs text-muted-foreground">Longest Streak</p>
            <h3 className="text-xl font-bold">{stats.longestStreak} days</h3>
          </div>
          <div className="p-2 rounded-md" style={{ backgroundColor: colors.secondary }}>
            <p className="text-xs text-muted-foreground">Total Completed</p>
            <h3 className="text-xl font-bold">{stats.totalCompleted}</h3>
          </div>
          <div className="p-2 rounded-md" style={{ backgroundColor: colors.secondary }}>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
            <h3 className="text-xl font-bold">{stats.completionRate}%</h3>
          </div>
        </div>
        
        {goal && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs">Monthly Goal Progress ({stats.totalCompleted}/{goal.frequency} days)</span>
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
        
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs">Overall Completion</span>
            <span className="text-xs font-semibold">{stats.completionRate}%</span>
          </div>
          <Progress 
            value={stats.completionRate} 
            className="h-2"
            style={{ 
              "--progress-background": colors.secondary,
              "--progress-foreground": colors.primary
            } as React.CSSProperties}
          />
        </div>
        
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
        
        {goal?.notes && (
          <div className="p-2 bg-gray-50 rounded-md">
            <p className="text-xs font-medium mb-1">Goal Notes:</p>
            <p className="text-sm">{goal.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HabitStats;
