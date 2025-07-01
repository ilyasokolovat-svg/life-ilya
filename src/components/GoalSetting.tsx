import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { HabitType, HabitGoal, HabitStats } from "@/types/habit";
import { Dumbbell, Wine, Moon, Brain } from "lucide-react";
import { calculateSleepQualityStats, getDaysInMonth, formatDateISO } from "@/utils/habitUtils";

interface GoalSettingProps {
  goals: Record<HabitType, HabitGoal>;
  viewMonth: number;
  viewYear: number;
  onUpdateGoal: (type: HabitType, goal: HabitGoal) => void;
  habitStats: Record<HabitType, HabitStats>;
  habitsState?: any;
}

const GoalSetting: React.FC<GoalSettingProps> = ({ 
  goals, 
  viewMonth, 
  viewYear, 
  onUpdateGoal, 
  habitStats,
  habitsState 
}) => {
  const getHabitIcon = (habitType: HabitType) => {
    switch (habitType) {
      case "gym":
        return <Dumbbell className="h-4 w-4" />;
      case "alcohol":
        return <Wine className="h-4 w-4" />;
      case "sleep":
        return <Moon className="h-4 w-4" />;
      case "meditation":
        return <Brain className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getHabitTitle = (habitType: HabitType) => {
    switch (habitType) {
      case "gym":
        return "Gym";
      case "alcohol":
        return "No Alcohol";
      case "sleep":
        return "Good Sleep";
      case "meditation":
        return "Meditation";
      default:
        return "";
    }
  };
  
  // Get month name for display
  const getMonthName = (month: number) => {
    return new Date(2000, month, 1).toLocaleString('default', { month: 'long' });
  };

  // Calculate planned days for a habit type in the current month
  const getPlannedDaysCount = (habitType: HabitType) => {
    if (habitType === 'sleep') {
      // For sleep, return total days in the month up to today
      const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);
      const today = new Date();
      const monthStart = new Date(viewYear, viewMonth, 1);
      const monthEnd = new Date(viewYear, viewMonth + 1, 0);
      
      // Only count days up to today or end of month, whichever is earlier
      const endDate = today < monthEnd ? today : monthEnd;
      
      if (endDate < monthStart) return 0;
      
      return Math.floor((endDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    
    if (!habitsState?.days) return 0;
    
    const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);
    const today = new Date();
    let plannedCount = 0;
    
    daysInCurrentMonth.forEach(date => {
      // Only count days up to today
      if (date <= today) {
        const dateISO = formatDateISO(date);
        const dayData = habitsState.days[dateISO];
        
        console.log(`GoalSetting: Checking ${habitType} for ${dateISO}:`, dayData?.[habitType]);
        
        if (dayData && dayData[habitType] && dayData[habitType].planned) {
          plannedCount++;
        }
      }
    });
    
    console.log(`GoalSetting: Total planned days for ${habitType} in ${viewMonth}/${viewYear}:`, plannedCount);
    return plannedCount;
  };

  // Calculate progress for each habit - use the corrected stats
  const getProgressData = (habitType: HabitType) => {
    const plannedDays = getPlannedDaysCount(habitType);
    const stats = habitStats[habitType];
    
    console.log(`GoalSetting: Progress data for ${habitType}:`, { plannedDays, stats });
    
    if (habitType === 'sleep' && habitsState) {
      const sleepQualityStats = calculateSleepQualityStats(habitsState, viewYear, viewMonth);
      const progress = plannedDays > 0 ? Math.min(100, Math.round((sleepQualityStats.goodSleep / plannedDays) * 100)) : 0;
      
      return {
        completed: sleepQualityStats.goodSleep,
        total: plannedDays,
        progress
      };
    }
    
    // For other habits, use the totalCompleted from stats
    if (stats && plannedDays > 0) {
      const progress = Math.min(100, Math.round((stats.totalCompleted / plannedDays) * 100));
      return {
        completed: stats.totalCompleted,
        total: plannedDays,
        progress
      };
    }
    
    return { completed: 0, total: plannedDays, progress: 0 };
  };

  // Define habit types to ensure consistent ordering
  const habitTypes: HabitType[] = ['gym', 'alcohol', 'sleep', 'meditation'];

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">
        Goals for {getMonthName(viewMonth)} {viewYear}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {habitTypes.map((habitType) => {
          const progressData = getProgressData(habitType);
          
          console.log(`GoalSetting: Final progress data for ${habitType}:`, progressData);
          
          return (
            <Card key={habitType} className="overflow-hidden">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getHabitIcon(habitType)}
                    <span className="text-sm font-medium">{getHabitTitle(habitType)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{progressData.total}</span>
                    <span className="text-xs text-muted-foreground">days</span>
                  </div>
                </div>
                
                {/* Progress Section */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-600">Progress</span>
                    <span className="text-gray-600">
                      {progressData.completed}/{progressData.total} days ({progressData.progress}%)
                    </span>
                  </div>
                  <Progress value={progressData.progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default GoalSetting;
