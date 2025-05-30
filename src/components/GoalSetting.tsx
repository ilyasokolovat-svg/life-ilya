
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { HabitType, HabitGoal, HabitStats } from "@/types/habit";
import { Dumbbell, Wine, Moon, Brain } from "lucide-react";
import { calculateSleepQualityStats } from "@/utils/habitUtils";

interface GoalSettingProps {
  goals: Record<HabitType, HabitGoal>;
  viewMonth: number;
  viewYear: number;
  onUpdateGoal: (type: HabitType, goal: HabitGoal) => void;
  habitStats: Record<HabitType, HabitStats>;
  habitsState?: any;
}

// Updated default goal with the new values
const createDefaultGoal = (habitType: HabitType): HabitGoal => {
  const defaultFrequencies = {
    gym: 12,
    alcohol: 25,
    sleep: 20,
    meditation: 25
  };
  
  return {
    frequency: defaultFrequencies[habitType],
    notes: ""
  };
};

const GoalSetting: React.FC<GoalSettingProps> = ({ 
  goals, 
  viewMonth, 
  viewYear, 
  onUpdateGoal, 
  habitStats,
  habitsState 
}) => {
  // Local state to manage form values independently
  const [localGoals, setLocalGoals] = useState<Record<HabitType, HabitGoal>>(() => {
    const habitTypes: HabitType[] = ['gym', 'alcohol', 'sleep', 'meditation'];
    const initialGoals: Record<HabitType, HabitGoal> = {} as Record<HabitType, HabitGoal>;
    
    habitTypes.forEach(type => {
      initialGoals[type] = goals[type] || createDefaultGoal(type);
    });
    
    return initialGoals;
  });
  
  // Update local state when props change
  useEffect(() => {
    const habitTypes: HabitType[] = ['gym', 'alcohol', 'sleep', 'meditation'];
    const updatedGoals: Record<HabitType, HabitGoal> = {} as Record<HabitType, HabitGoal>;
    
    habitTypes.forEach(type => {
      updatedGoals[type] = goals[type] || createDefaultGoal(type);
    });
    
    setLocalGoals(updatedGoals);
  }, [goals, viewMonth, viewYear]);

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

  const handleFrequencyChange = (type: HabitType, value: string) => {
    const frequency = parseInt(value) || 0;
    const currentGoal = localGoals[type] || createDefaultGoal(type);
    const newGoal = {
      ...currentGoal,
      frequency
    };
    
    // Update local state immediately for UI responsiveness
    setLocalGoals(prev => ({
      ...prev,
      [type]: newGoal
    }));
    
    // Update parent state
    onUpdateGoal(type, newGoal);
  };

  // Calculate progress for each habit
  const getProgressData = (habitType: HabitType) => {
    const goal = localGoals[habitType] || createDefaultGoal(habitType);
    const stats = habitStats[habitType];
    
    if (habitType === 'sleep' && habitsState) {
      const sleepQualityStats = calculateSleepQualityStats(habitsState, viewYear, viewMonth);
      const today = new Date();
      const currentDate = new Date(viewYear, viewMonth, Math.min(today.getDate(), new Date(viewYear, viewMonth + 1, 0).getDate()));
      const daysPassedInMonth = currentDate.getDate();
      const progress = daysPassedInMonth > 0 ? Math.min(100, Math.round((sleepQualityStats.goodSleep / daysPassedInMonth) * 100)) : 0;
      
      return {
        completed: sleepQualityStats.goodSleep,
        total: daysPassedInMonth,
        progress
      };
    }
    
    if (goal?.frequency && stats) {
      const progress = Math.min(100, Math.round((stats.totalCompleted / goal.frequency) * 100));
      return {
        completed: stats.totalCompleted,
        total: goal.frequency,
        progress
      };
    }
    
    return { completed: 0, total: goal?.frequency || 0, progress: 0 };
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
          const localGoal = localGoals[habitType] || createDefaultGoal(habitType);
          const progressData = getProgressData(habitType);
          
          return (
            <Card key={habitType} className="overflow-hidden">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getHabitIcon(habitType)}
                    <span className="text-sm font-medium">{getHabitTitle(habitType)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="0"
                      max="31"
                      value={localGoal.frequency}
                      className="w-12 h-7 text-xs p-1 text-center"
                      onChange={(e) => handleFrequencyChange(habitType, e.target.value)}
                    />
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
