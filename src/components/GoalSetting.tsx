import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { HabitType, HabitGoal, HabitStats } from "@/types/habit";
import { Dumbbell, Wine, Moon, Brain } from "lucide-react";
import { getDaysInMonth, formatDateISO } from "@/utils/habitUtils";

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

  // Calculate planned days for a habit type in the entire month
  const getPlannedDaysCount = (habitType: HabitType) => {
    if (habitType === 'sleep') {
      // For sleep, planned days = total days in month (we should sleep every day)
      const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);
      console.log(`GoalSetting: Sleep planned days = total days in month: ${daysInCurrentMonth.length}`);
      return daysInCurrentMonth.length;
    }
    
    if (!habitsState?.days) return 0;
    
    const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);
    let plannedCount = 0;
    
    // Count ALL planned days in the month, not just up to today
    daysInCurrentMonth.forEach(date => {
      const dateISO = formatDateISO(date);
      const dayData = habitsState.days[dateISO];
      
      if (dayData && dayData[habitType] && dayData[habitType].planned) {
        plannedCount++;
      }
    });
    
    console.log(`GoalSetting: Total planned days for ${habitType} in ${viewMonth}/${viewYear}:`, plannedCount);
    return plannedCount;
  };

  // Calculate completed days for a habit type in the current month (only up to today)
  const getCompletedDaysCount = (habitType: HabitType) => {
    if (!habitsState?.days) return 0;
    
    const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);
    const today = new Date();
    let completedCount = 0;
    
    daysInCurrentMonth.forEach(date => {
      // Only count days up to today for completed
      if (date <= today) {
        const dateISO = formatDateISO(date);
        const dayData = habitsState.days[dateISO];
        
        if (habitType === 'sleep') {
          // For sleep, count days with 7+ hours as completed
          if (dayData && dayData.sleep && dayData.sleep.sleepHours >= 7) {
            completedCount++;
          }
        } else {
          // For other habits, count planned and completed
          if (dayData && dayData[habitType] && dayData[habitType].planned && dayData[habitType].completed) {
            completedCount++;
          }
        }
      }
    });
    
    console.log(`GoalSetting: Total completed days for ${habitType} in ${viewMonth}/${viewYear}:`, completedCount);
    return completedCount;
  };

  // Calculate progress for each habit
  const getProgressData = (habitType: HabitType) => {
    const totalDays = getPlannedDaysCount(habitType);
    const completed = getCompletedDaysCount(habitType);
    
    const progress = totalDays > 0 ? Math.min(100, Math.round((completed / totalDays) * 100)) : 0;
    
    console.log(`GoalSetting: Progress data for ${habitType}:`, { completed, totalDays, progress });
    
    return {
      completed,
      total: totalDays,
      progress
    };
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
